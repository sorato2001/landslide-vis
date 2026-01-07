<template>
  <div class="model-panel">
    <div class="panel-header">
      <h3>🤖 模型集成</h3>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div>

    <div class="model-section">
      <div class="section-title">
        <span class="icon">📊</span>
        <span>数据预处理</span>
      </div>
      <button 
        class="model-btn primary"
        @click="runReclass"
        :disabled="running"
      >
        <span class="btn-icon">📝</span>
        <span class="btn-text">重分类</span>
        <span v-if="running" class="loading-spinner"></span>
      </button>
    </div>

    <div class="model-section">
      <div class="section-title">
        <span class="icon">🧠</span>
        <span>机器学习模型</span>
      </div>
      
      <input
        ref="cnnInput"
        type="file"
        multiple
        accept=".csv,.shp,.shx,.dbf,.prj"
        hidden
        @change="onCNNFilesSelected"
      />

      <button 
        class="model-btn success"
        @click="openCNNFileDialog"
        :disabled="running"
      >
        <span class="btn-icon">🌐</span>
        <div class="btn-content">
          <span class="btn-text">卷积神经网络</span>
          <span class="btn-subtext">CNN 预测</span>
        </div>
        <span v-if="running" class="loading-spinner"></span>
      </button>

      <button 
        class="model-btn info"
        @click="runANN" 
        :disabled="running"
      >
        <span class="btn-icon">⚡</span>
        <div class="btn-content">
          <span class="btn-text">人工神经网络</span>
          <span class="btn-subtext">ANN 预测</span>
        </div>
        <span v-if="running" class="loading-spinner"></span>
      </button>
    </div>

    <div v-if="status" class="status-bar" :class="statusType">
      <span class="status-icon">ℹ️</span>
      <span>{{ status }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { runReclassModel } from '@/model/reclassModel'
import { runCNNModel } from '@/model/cnnModel'
import { runANNModel } from '@/model/annModel'

defineEmits(['close'])

const status = ref('')
const statusType = ref('info')
const cnnInput = ref(null)
const running = ref(false)

function openCNNFileDialog() {
  cnnInput.value.click()
}

async function onCNNFilesSelected(e) {
  const files = e.target.files
  if (!files.length) return

  const fileMap = {}
  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase()
    fileMap[ext] = f
  }

  if (!fileMap.csv || !fileMap.shp || !fileMap.dbf) {
    status.value = '请至少选择 csv、shp、dbf 文件'
    statusType.value = 'error'
    return
  }

  try {
    running.value = true
    status.value = '正在运行 CNN 模型...'
    statusType.value = 'info'
    
    await runCNNModel({
      csv: fileMap.csv,
      shp: fileMap.shp,
      shx: fileMap.shx,
      dbf: fileMap.dbf,
      prj: fileMap.prj
    })
    
    status.value = '✅ CNN 预测完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (err) {
    console.error(err)
    status.value = '❌ CNN 运行失败'
    statusType.value = 'error'
  } finally {
    running.value = false
    e.target.value = ''
  }
}

async function runReclass() {
  try {
    running.value = true
    status.value = '正在执行重分类...'
    statusType.value = 'info'
    
    await runReclassModel()
    
    status.value = '✅ 重分类完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (e) {
    console.error(e)
    status.value = '❌ 重分类失败'
    statusType.value = 'error'
  } finally {
    running.value = false
  }
}

async function runANN() {
  try {
    running.value = true
    status.value = '正在运行 ANN 模型...'
    statusType.value = 'info'
    
    await runANNModel()
    
    status.value = '✅ ANN 预测完成！'
    statusType.value = 'success'
    setTimeout(() => { status.value = '' }, 3000)
  } catch (e) {
    console.error(e)
    status.value = '❌ ANN 预测失败'
    statusType.value = 'error'
  } finally {
    running.value = false
  }
}
</script>

<style scoped>
.model-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.98) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  width: 320px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  z-index: 10;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.panel-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.model-section {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.model-section:last-of-type {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.section-title .icon {
  font-size: 16px;
}

.model-btn {
  width: 100%;
  padding: 14px 16px;
  margin-bottom: 10px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.model-btn:last-child {
  margin-bottom: 0;
}

.model-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.model-btn:hover::before {
  opacity: 1;
}

.model-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: rgba(102, 126, 234, 0.3);
}

.model-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.model-btn.success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
  border-color: rgba(17, 153, 142, 0.3);
}

.model-btn.success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(17, 153, 142, 0.4);
}

.model-btn.info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border-color: rgba(79, 172, 254, 0.3);
}

.model-btn.info:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4);
}

.model-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-icon {
  font-size: 22px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.btn-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.btn-text {
  font-size: 15px;
  font-weight: 600;
}

.btn-subtext {
  font-size: 11px;
  opacity: 0.8;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-bar {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-bar.info {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
}

.status-bar.success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  color: #388e3c;
}

.status-bar.error {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  color: #d32f2f;
}

.status-icon {
  font-size: 16px;
}
</style>
