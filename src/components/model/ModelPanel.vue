<template>
  <div class="model-panel">
    <div class="panel-header">
      <span class="header-icon">🤖</span>
      <span class="header-title">模型集成</span>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div>

    <div class="panel-content">
      <div class="section-group">
        <div class="section-label">数据信息</div>
        <button class="sub-btn" @click="$emit('close')">地理环境数据</button>
        <button class="sub-btn" @click="$emit('close')">动态触发数据</button>
        <button class="sub-btn" @click="$emit('close')">滑坡编录数据</button>
      </div>

      <div class="section-group">
        <div class="section-label">模型信息</div>

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
      </div>

      <div v-if="status" class="status-bar" :class="statusType">
        <span class="status-icon">ℹ️</span>
        <span>{{ status }}</span>
      </div>
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
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #e8eef6;
  border-bottom: 2px solid #2A5298;
  flex-shrink: 0;
  gap: 8px;
}

.header-icon {
  font-size: 16px;
}

.header-title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: #2A5298;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #d0dced;
  color: #2A5298;
}

.panel-content {
  padding: 14px;
  overflow-y: auto;
  flex: 1;
}

.panel-content::-webkit-scrollbar {
  width: 5px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #b0c4de;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #2A5298;
}

/* 分组标签 */
.section-group {
  margin-bottom: 16px;
  border: 1px solid #2A5298;
  border-radius: 8px;
  padding: 12px;
  background: #f8fafe;
}

.section-label {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #2A5298;
  padding: 4px 14px;
  border: 2px solid #2A5298;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 10px;
  background: #e8eef6;
}

.sub-btn {
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #2A5298;
  border-radius: 6px;
  color: #2A5298;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.sub-btn:hover {
  background: #e8eef6;
}

.sub-btn:last-of-type {
  margin-bottom: 0;
}

/* 模型区域 */
.model-section {
  padding: 10px 0;
  border-bottom: 1px solid #dde5f0;
}

.model-section:last-of-type {
  border-bottom: none;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  color: #2A5298;
  font-size: 14px;
  font-weight: 600;
}

.section-title .icon {
  font-size: 14px;
}

.model-btn {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 8px;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
}

.model-btn:last-child {
  margin-bottom: 0;
}

.model-btn.primary {
  background: #2A5298;
  border-color: #2A5298;
}

.model-btn.primary:hover {
  background: #1e3d72;
}

.model-btn.success {
  background: #0d7a5f;
  border-color: #0d7a5f;
}

.model-btn.success:hover {
  background: #095e48;
}

.model-btn.info {
  background: #3a7bd5;
  border-color: #3a7bd5;
}

.model-btn.info:hover {
  background: #2a5fa8;
}

.model-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 18px;
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
  font-size: 14px;
  font-weight: 600;
}

.btn-subtext {
  font-size: 11px;
  opacity: 0.85;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.status-bar {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  margin-top: 10px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.status-bar.info {
  background: #e8eef6;
  color: #2A5298;
}

.status-bar.success {
  background: #e6f7ef;
  color: #0d7a5f;
}

.status-bar.error {
  background: #fde8e8;
  color: #c0392b;
}

.status-icon {
  font-size: 14px;
}
</style>
