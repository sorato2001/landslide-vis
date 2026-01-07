import os
import io
import logging
import traceback
import numpy as np
import pandas as pd
import geopandas as gpd
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from tensorflow.keras.models import load_model
from sklearn.preprocessing import StandardScaler
import json
from pyproj import CRS
from flask import send_file  # 导入 send_file

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
TEMP_UPLOAD_DIR = '/tmp/shapefile_upload'
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)

model = load_model('landslide_cnn_model.h5') #加载你的模型
scaler = StandardScaler()
all_data = pd.read_csv('chongfenlei(we).csv') #加载你的csv数据
scaler.fit(all_data.drop(columns=['FID', 'label']))

def convert_shapefile_to_geojson(shp_path, shx_path, dbf_path, prj_path):
    try:
        # 检查所有必需的文件是否存在
        if not all(os.path.exists(path) for path in [shp_path, shx_path, dbf_path, prj_path]):
            raise FileNotFoundError("缺少 Shapefile 必需的文件")

        gdf = gpd.read_file(shp_path)
        if gdf.crs:
            gdf = gdf.to_crs(CRS.from_epsg(4326))
        return json.loads(gdf.to_json())
    except Exception as e:
        logging.error(f"Shapefile 转换错误: {e}")
        traceback.print_exc()
        return None

def preprocess_features(row_data):
    X_predict_scaled = scaler.transform(row_data)
    n_features = X_predict_scaled.shape[1]
    padding_size = 25 - n_features
    X_predict_padded = np.pad(X_predict_scaled, ((0, 0), (0, padding_size)), mode='constant', constant_values=0)
    X_predict_reshaped = X_predict_padded.reshape(-1, 5, 5, 1)
    return X_predict_reshaped

@app.route('/process_and_visualize', methods=['POST'])
def process_and_visualize():
    try:
        csv_file = request.files.get('csvFile')
        shp_file = request.files.get('shpFile')
        shx_file = request.files.get('shxFile')
        dbf_file = request.files.get('dbfFile')
        prj_file = request.files.get('prjFile')

        if not csv_file or not shp_file or not shx_file or not dbf_file or not prj_file:
            return jsonify({'error': '请同时上传 CSV 和 SHP, SHX, DBF, PRJ 文件'}), 400

        shp_filename = secure_filename(shp_file.filename)
        shp_path = os.path.join(TEMP_UPLOAD_DIR, shp_filename)
        shp_file.save(shp_path)

        shx_filename = secure_filename(shx_file.filename)
        shx_path = os.path.join(TEMP_UPLOAD_DIR, shx_filename)
        shx_file.save(shx_path)

        dbf_filename = secure_filename(dbf_file.filename)
        dbf_path = os.path.join(TEMP_UPLOAD_DIR, dbf_filename)
        dbf_file.save(dbf_path)

        prj_filename = secure_filename(prj_file.filename)
        prj_path = os.path.join(TEMP_UPLOAD_DIR, prj_filename)
        prj_file.save(prj_path)

        geojson_data = convert_shapefile_to_geojson(shp_path, shx_path, dbf_path, prj_path)
        if not geojson_data:
            return jsonify({'error': 'Shapefile 转换失败'}), 500

        csv_df = pd.read_csv(io.StringIO(csv_file.read().decode('utf-8')))
        predictions = []

        for index, row in csv_df.iterrows():
            row_data = row.drop('FID').to_frame().T
            X_predict_reshaped = preprocess_features(row_data)
            prediction = float(model.predict(X_predict_reshaped)[0][0])
            predictions.append({"FID": int(row["FID"]), "probability": prediction})

        # 生成包含 FID 和 probability 的 Pandas DataFrame
        predictions_df = pd.DataFrame(predictions)

        # 将 DataFrame 转换为内存中的 CSV 文件
        csv_output = io.StringIO()
        predictions_df.to_csv(csv_output, index=False, encoding='utf-8')
        csv_output.seek(0)
        csv_data = csv_output.getvalue()

        return jsonify({'geojson': geojson_data, 'predictions': predictions, 'prediction_csv': csv_data})

    except Exception as e:
        logging.error(f"处理数据时出错：{e}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)