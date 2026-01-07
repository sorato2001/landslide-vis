import os
import io
import logging
import traceback
import numpy as np
import pandas as pd
import geopandas as gpd
import rasterio
from rasterio import features
from rasterio import mask
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from shapely.geometry import mapping
import json
import zipfile
import tempfile  # 用于创建临时目录

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
TEMP_UPLOAD_DIR = '/tmp/rescue_analysis_upload'
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

def find_related_file(file_list, filename_base, extension):
    for file in file_list:
        if file.filename == f"{filename_base}{extension}":
            return file
    return None

def process_shapefile(upload_file):
    """处理上传的 Shapefile 文件，如果为 zip 则解压并返回 .shp 文件路径"""
    filename = secure_filename(upload_file.filename)
    filepath = os.path.join(TEMP_UPLOAD_DIR, filename)
    upload_file.save(filepath)

    if filename.endswith('.zip'):
        temp_dir = tempfile.mkdtemp(dir=TEMP_UPLOAD_DIR)
        try:
            with zipfile.ZipFile(filepath, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            # 查找解压后的 .shp 文件
            shp_files = [f for f in os.listdir(temp_dir) if f.endswith('.shp')]
            if not shp_files:
                raise ValueError("ZIP 文件中未找到 .shp 文件")
            elif len(shp_files) > 1:
                logging.warning(f"ZIP 文件中找到多个 .shp 文件: {shp_files}. 将使用第一个找到的文件。")
            shp_path = os.path.join(temp_dir, shp_files[0])
            # 检查 .shx 文件是否存在 (警告但不强制)
            shx_files = [f for f in os.listdir(temp_dir) if f.endswith('.shx') and f.startswith(shp_files[0][:-4])]
            if not shx_files:
                logging.warning(f"在解压后的目录 {temp_dir} 中找不到对应的 .shx 文件。可能影响性能。")
            return shp_path
        except zipfile.BadZipFile:
            raise ValueError("上传的文件不是有效的 ZIP 文件")
        except Exception as e:
            raise Exception(f"解压 ZIP 文件失败: {e}")
        finally:
            os.remove(filepath) # 删除上传的 zip 文件
    elif filename.endswith('.shp'):
        return filepath
    else:
        raise ValueError("上传的文件不是 .shp 或 .zip 文件")

def analyze_rescue_priority(csv_file_path, shp_files, population_file_path, luding_buildings_shp_path):
    try:
        # 1. 读取滑坡预测 CSV 数据
        predictions_df = pd.read_csv(csv_file_path)
        fid_col = next((col for col in predictions_df.columns if col.lower() == 'fid'), None)
        prob_col = next((col for col in predictions_df.columns if col.lower() == 'probability'), None)
        if not fid_col or not prob_col:
            return None, {'error': 'CSV 文件必须包含 \"FID\" 和 \"probability\" 列（不区分大小写）'}
        predictions_dict = pd.Series(predictions_df[prob_col].astype(float).values, index=predictions_df[fid_col].astype(int)).to_dict()
        all_probabilities = predictions_df[prob_col].astype(float).tolist()
        prob_thresholds = np.quantile(all_probabilities, [0.2, 0.4, 0.6, 0.8])

        def get_probability_level(probability, thresholds):
            if probability <= thresholds[0]:
                return 0  # 极低
            elif probability <= thresholds[1]:
                return 1  # 低
            elif probability <= thresholds[2]:
                return 2  # 中
            elif probability <= thresholds[3]:
                return 3  # 高
            else:
                return 4  # 极高

        # 2. 读取滑坡影响区域 Shapefile 数据
        all_gdf = gpd.GeoDataFrame()
        for shp_upload in shp_files:
            if shp_upload.filename.endswith('.shp'):
                shp_filename_base = shp_upload.filename[:-4]
                shx_file = find_related_file(shp_files, shp_filename_base, '.shx')
                dbf_file = find_related_file(shp_files, shp_filename_base, '.dbf')
                prj_file = find_related_file(shp_files, shp_filename_base, '.prj')

                if shx_file and dbf_file:
                    shp_path = os.path.join(TEMP_UPLOAD_DIR, secure_filename(shp_upload.filename))
                    shx_path = os.path.join(TEMP_UPLOAD_DIR, secure_filename(shx_file.filename))
                    dbf_path = os.path.join(TEMP_UPLOAD_DIR, secure_filename(dbf_file.filename))
                    prj_path = os.path.join(TEMP_UPLOAD_DIR, secure_filename(prj_file.filename)) if prj_file else None

                    try:
                        shp_upload.save(shp_path)
                        shx_file.save(shx_path)
                        dbf_file.save(dbf_path)
                        if prj_path:
                            prj_file.save(prj_path)

                        gdf = gpd.read_file(shp_path)
                        shp_fid_col = next((col for col in gdf.columns if col.lower() == 'id'), None)
                        if not shp_fid_col:
                            logging.warning(f"Shapefile {shp_upload.filename} 缺少 'ID' 列（不区分大小写），跳过")
                            continue
                        gdf['FID'] = gdf[shp_fid_col].astype(int)
                        gdf['probability'] = gdf['FID'].map(predictions_dict)
                        gdf = gdf[~gdf['probability'].isna()]
                        all_gdf = pd.concat([all_gdf, gdf], ignore_index=True)

                    except Exception as e:
                        logging.error(f"加载 Shapefile {shp_upload.filename} 出错: {e}")
                        traceback.print_exc()
                        continue
                else:
                    logging.warning(f"Shapefile {shp_upload.filename} 缺少 .shx 或 .dbf 文件，跳过")

        if all_gdf.empty:
            return None, {'error': '未找到包含有效数据的滑坡影响区域 Shapefile 或 Shapefile 中的 FID 与预测数据不匹配'}

        # 3. 读取人口栅格数据
        with rasterio.open(population_file_path) as pop_src:
            pop_crs = pop_src.crs
            if all_gdf.crs != pop_crs:
                all_gdf = all_gdf.to_crs(pop_crs)

            results_with_pop = []
            for index, row in all_gdf.iterrows():
                geometry = row['geometry']
                probability = row['probability']
                fid = row['FID']

                try:
                    out_image, out_transform = mask.mask(pop_src, [geometry], crop=True, all_touched=True)
                    masked_population = out_image[out_image > 0]
                    total_population = np.sum(masked_population) if masked_population.size > 0 else 0
                    results_with_pop.append({
                        'geometry': mapping(geometry),
                        'properties': {'FID': fid, 'probability': probability, 'population': int(total_population)}
                    })
                except Exception as e:
                    logging.error(f"处理 FID {fid} 的滑坡影响区域时出错 (人口统计): {e}")
                    traceback.print_exc()
                    continue

        # 4. 读取泸定地区建筑物 Shapefile
        try:
            luding_buildings = gpd.read_file(luding_buildings_shp_path)
            if luding_buildings.crs != all_gdf.crs:
                luding_buildings = luding_buildings.to_crs(all_gdf.crs)
        except Exception as e:
            logging.error(f"加载泸定地区建筑物 Shapefile 出错: {e}")
            traceback.print_exc()
            return None, {'error': f'加载泸定地区建筑物 Shapefile 出错: {str(e)}'}

        # 5. 空间连接滑坡影响区域和建筑物，并统计建筑物数量
        buildings_with_risk = gpd.sjoin(luding_buildings, all_gdf, how='inner', predicate='intersects')
        building_counts = buildings_with_risk.groupby('FID').size().to_dict()

        final_features = []
        all_impact_scores = []
        for feature in results_with_pop:
            fid = feature['properties']['FID']
            probability = feature['properties']['probability']
            population = feature['properties']['population']
            building_count = building_counts.get(fid, 0)

            impact_score = population + building_count
            
            all_impact_scores.append(impact_score)

        impact_thresholds = np.quantile(all_impact_scores, [0.2, 0.4, 0.6, 0.8]) if all_impact_scores else [0, 0, 0, 0]

        def get_impact_level(impact_score, thresholds):
            if impact_score <= thresholds[0]:
                return 0
            elif impact_score <= thresholds[1]:
                return 1
            elif impact_score <= thresholds[2]:
                return 2
            elif impact_score <= thresholds[3]:
                return 3
            else:
                return 4

        # 风险矩阵定义 (概率 x 影响 -> 优先级)
        risk_matrix = [
            [1, 1, 2, 3, 4],  # 极低概率
            [1, 2, 3, 4, 5],  # 低概率
            [2, 3, 4, 5, 5],  # 中概率
            [3, 4, 5, 5, 5],  # 高概率
            [4, 5, 5, 5, 5]   # 极高概率
        ]

        for feature in results_with_pop:
            fid = feature['properties']['FID']
            probability = feature['properties']['probability']
            population = feature['properties']['population']
            building_count = building_counts.get(fid, 0)

            prob_level = get_probability_level(probability, prob_thresholds)
            impact_level = get_impact_level(population + building_count, impact_thresholds)
            priority = risk_matrix[prob_level][impact_level]

            final_features.append({
                'type': 'Feature',
                'geometry': feature['geometry'],
                'properties': {'FID': fid, 'probability': probability, 'population': population, 'building_count': building_count, 'priority': int(priority)}
            })

        priority_levels = [{'level': i + 1, 'label': label} for i, label in enumerate(['极低', '低', '中', '高', '极高'])]

        return {'type': 'FeatureCollection', 'features': final_features}, {'priority_levels': priority_levels}

    except Exception as e:
        logging.error(f"分析过程中出错：{e}")
        traceback.print_exc()
        return None, {'error': str(e)}

@app.route('/analyze_rescue_priority', methods=['POST'])
def analyze_rescue_priority_endpoint():
    try:
        if 'csvFile' not in request.files:
            return jsonify({'error': '缺少滑坡预测 CSV 文件'}), 400
        if 'shpFiles' not in request.files:
            return jsonify({'error': '缺少滑坡影响区域 SHP 文件'}), 400
        if 'populationFile' not in request.files:
            return jsonify({'error': '缺少人口数据文件'}), 400
        if 'ludingBuildingsShp' not in request.files:
            return jsonify({'error': '缺少泸定地区建筑物 SHP 文件'}), 400

        csv_file = request.files['csvFile']
        shp_files = request.files.getlist('shpFiles')
        population_file = request.files['populationFile']
        luding_buildings_shps = request.files.getlist('ludingBuildingsShp') # 获取建筑物文件的列表

        csv_path = os.path.join(TEMP_UPLOAD_DIR, secure_filename(csv_file.filename))
        population_file_path = os.path.join(TEMP_UPLOAD_DIR, secure_filename(population_file.filename))

        csv_file.save(csv_path)
        population_file.save(population_file_path)

        luding_buildings_shp_path = None
        temp_building_dir = tempfile.mkdtemp(dir=TEMP_UPLOAD_DIR)
        logging.info(f"创建建筑物临时目录: {temp_building_dir}")

        for building_file in luding_buildings_shps:
            filename = secure_filename(building_file.filename)
            filepath = os.path.join(temp_building_dir, filename) # 使用 os.path.join
            building_file.save(filepath)
            logging.info(f"保存建筑物文件: {filename} 到 {filepath}")
            if filename.endswith('.shp'):
                luding_buildings_shp_path = filepath

        if not luding_buildings_shp_path:
            return jsonify({'error': '未找到泸定地区建筑物 .shp 文件'}), 400

        logging.info(f"尝试加载建筑物 Shapefile，路径: {luding_buildings_shp_path}")
        try:
            analysis_results, legend_data = analyze_rescue_priority(csv_path, shp_files, population_file_path, luding_buildings_shp_path)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logging.error(f"加载建筑物 Shapefile 出错: {e}")
            traceback.print_exc()
            return jsonify({'error': f'加载建筑物 Shapefile 出错: {str(e)}'} + str(e)), 500 # Include error details for debugging
        finally:
            # 清理临时目录 (可选)
            pass

        if analysis_results:
            return jsonify({'rescue_data': analysis_results, 'priority_levels': legend_data['priority_levels']})
        else:
            return jsonify(legend_data), 500

    except Exception as e:
        logging.error(f"处理请求时出现未捕获异常: {e}")
        traceback.print_exc()
        return jsonify({'error': f'服务器处理错误: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)