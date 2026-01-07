from flask import Flask, request, jsonify
from flask_cors import CORS  # 导入 Flask-CORS
import pandas as pd
import pickle
from tensorflow.keras.models import load_model
import io

app = Flask(__name__)
CORS(app)  # 为整个应用启用 CORS

# 加载训练好的模型
try:
    loaded_model = load_model('landslide_ann_model.h5')
except FileNotFoundError:
    print("错误：找不到 landslide_ann_model.h5 文件。请确保文件在同一目录下。")
    loaded_model = None

# 加载保存的 StandardScaler
try:
    with open('scaler.pkl', 'rb') as f:
        scaler = pickle.load(f)
except FileNotFoundError:
    print("错误：找不到 scaler.pkl 文件。请确保在训练脚本中保存了 scaler，并且文件在同一目录下。")
    scaler = None

@app.route('/api/predict_landslide', methods=['POST'])
def predict_landslide_api():
    if loaded_model is None or scaler is None:
        return jsonify({'error': '模型或标准化器加载失败。'}), 500

    try:
        csv_data = request.get_data(as_text=True)
        if not csv_data:
            return jsonify({'error': 'No data received'}), 400

        try:
            all_data = pd.read_csv(io.StringIO(csv_data))
        except Exception as e:
            return jsonify({'error': f'Failed to read CSV data: {str(e)}'}), 400

        if 'FID' not in all_data.columns:
            return jsonify({'error': "Input data must contain 'FID' column"}), 400

        # 提取特征列，排除 'FID' 和 'label' (如果存在)
        feature_columns = [col for col in all_data.columns if col != 'FID' and col != 'label']
        if not feature_columns:
            return jsonify({'error': "No feature columns found in the input data (excluding FID and label)."}), 400

        X_all = all_data[feature_columns].copy()
        fid_all = all_data['FID'].copy()

        # 使用加载的 scaler 进行 transform
        X_all_scaled = scaler.transform(X_all)

        all_predictions = loaded_model.predict(X_all_scaled)
        all_probabilities = all_predictions.flatten().tolist()

        results = []
        for fid, prob in zip(fid_all, all_probabilities):
            results.append({'FID': fid, 'predictions': prob})

        return jsonify(results)

    except Exception as e:
        return jsonify({'error': f'Prediction process failed: {str(e)}'}), 500

if __name__ == '__main__':
    import io
    app.run(debug=True, port=5000)