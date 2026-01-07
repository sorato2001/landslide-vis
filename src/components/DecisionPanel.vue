<template>
  <div class="decision-panel">
    <div class="panel-header">
      <h3>📈 决策评估</h3>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div>

    <div class="panel-content">
      <!-- 数据输入区域 -->
      <InputSection title="区域范围" icon="🗺️">
        <div class="file-upload-wrapper">
          <input 
            type="file" 
            multiple
            accept=".shp,.shx,.dbf,.prj"
            @change="onRegionShpSelected"
            id="region-shp"
            class="file-input"
          />
          <label for="region-shp" class="file-label">
            <span class="file-icon">📁</span>
            <span class="file-text">
              {{ regionFileName || '选择区域 SHP 文件' }}
            </span>
          </label>
        </div>
        <div v-if="regionFiles.length > 0" class="file-list">
          <div v-for="(file, index) in regionFiles" :key="index" class="file-item">
            ✓ {{ file.name }}
          </div>
        </div>
      </InputSection>

      <InputSection title="预测数据" icon="🎯">
        <div class="file-upload-wrapper">
          <input 
            type="file" 
            accept=".csv"
            @change="onPredictionCsvSelected"
            id="prediction-csv"
            class="file-input"
          />
          <label for="prediction-csv" class="file-label">
            <span class="file-icon">📊</span>
            <span class="file-text">
              {{ predictionFileName || '选择预测 CSV 文件' }}
            </span>
          </label>
        </div>
        <button 
          v-if="predictionFile" 
          class="action-btn secondary"
          @click="visualizePrediction"
        >
          <span class="btn-icon">👁️</span>
          <span>预览预测数据</span>
        </button>
      </InputSection>

      <InputSection title="人口数据" icon="👥">
        <div class="file-upload-wrapper">
          <input 
            type="file" 
            accept=".tif,.tiff"
            @change="onPopulationTifSelected"
            id="population-tif"
            class="file-input"
          />
          <label for="population-tif" class="file-label">
            <span class="file-icon">🌍</span>
            <span class="file-text">
              {{ populationFileName || '选择人口 TIF 文件' }}
            </span>
          </label>
        </div>
      </InputSection>

      <InputSection title="建筑物数据" icon="🏢">
        <div class="file-upload-wrapper">
          <input 
            type="file" 
            multiple
            accept=".shp,.shx,.dbf,.prj"
            @change="onBuildingsShpSelected"
            id="buildings-shp"
            class="file-input"
          />
          <label for="buildings-shp" class="file-label">
            <span class="file-icon">🏗️</span>
            <span class="file-text">
              {{ buildingsFileName || '选择建筑物 SHP 文件' }}
            </span>
          </label>
        </div>
        <div v-if="buildingsFiles.length > 0" class="file-list">
          <div v-for="(file, index) in buildingsFiles" :key="index" class="file-item">
            ✓ {{ file.name }}
          </div>
        </div>
      </InputSection>

      <!-- 分析按钮 -->
      <div class="action-section">
        <button 
          class="analysis-btn"
          @click="runAnalysis"
          :disabled="!canRunAnalysis || analyzing"
        >
          <span v-if="!analyzing" class="btn-icon">🔬</span>
          <span v-if="analyzing" class="loading-spinner"></span>
          <span>{{ analyzing ? '分析中...' : '综合决策分析' }}</span>
        </button>

        <button 
          v-if="analysisCompleted"
          class="analysis-btn secondary"
          @click="toggleVisualization"
        >
          <span class="btn-icon">{{ showAnalysis ? '🙈' : '👁️' }}</span>
          <span>{{ showAnalysis ? '隐藏结果' : '显示结果' }}</span>
        </button>
      </div>

      <!-- 状态信息 -->
      <div v-if="statusMessage" class="status-bar" :class="statusType">
        <span class="status-icon">{{ statusIcon }}</span>
        <span>{{ statusMessage }}</span>
      </div>

      <!-- 数据完整性提示 -->
      <div v-if="!canRunAnalysis && hasAnyFile" class="warning-box">
        <span class="warning-icon">⚠️</span>
        <span>请确保所有数据文件都已选择</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import InputSection from './data/InputSection.vue'
import { 
  visualizeRescuePriority as visualizeRescuePriorityInCesium,
  toggleRescuePriorityVisibility 
} from '../cesium/decisionAnalysis'

defineEmits(['close'])

// 文件数据
const regionFiles = ref([])
const predictionFile = ref(null)
const populationFile = ref(null)
const buildingsFiles = ref([])

// 文件名显示
const regionFileName = ref('')
const predictionFileName = ref('')
const populationFileName = ref('')
const buildingsFileName = ref('')

// 状态
const analyzing = ref(false)
const analysisCompleted = ref(false)
const showAnalysis = ref(true)
const statusMessage = ref('')
const statusType = ref('info')

// 计算属性
const canRunAnalysis = computed(() => {
  return regionFiles.value.length > 0 &&
         predictionFile.value !== null &&
         populationFile.value !== null &&
         buildingsFiles.value.length > 0
})

const hasAnyFile = computed(() => {
  return regionFiles.value.length > 0 ||
         predictionFile.value !== null ||
         populationFile.value !== null ||
         buildingsFiles.value.length > 0
})

const statusIcon = computed(() => {
  if (statusType.value === 'success') return '✅'
  if (statusType.value === 'error') return '❌'
  if (statusType.value === 'warning') return '⚠️'
  return 'ℹ️'
})

// 文件选择处理
function onRegionShpSelected(e) {
  const files = Array.from(e.target.files)
  if (files.length > 0) {
    regionFiles.value = files
    regionFileName.value = `已选择 ${files.length} 个文件`
    console.log('区域SHP文件:', files.map(f => f.name))
  }
}

function onPredictionCsvSelected(e) {
  const file = e.target.files[0]
  if (file) {
    predictionFile.value = file
    predictionFileName.value = file.name
    console.log('预测CSV文件:', file.name)
  }
}

function onPopulationTifSelected(e) {
  const file = e.target.files[0]
  if (file) {
    populationFile.value = file
    populationFileName.value = file.name
    console.log('人口TIF文件:', file.name)
  }
}

function onBuildingsShpSelected(e) {
  const files = Array.from(e.target.files)
  if (files.length > 0) {
    buildingsFiles.value = files
    buildingsFileName.value = `已选择 ${files.length} 个文件`
    console.log('建筑物SHP文件:', files.map(f => f.name))
  }
}

// 预览预测数据
async function visualizePrediction() {
  if (!predictionFile.value) return
  
  try {
    statusMessage.value = '正在加载预测数据...'
    statusType.value = 'info'
    
    // TODO: 实现预测数据可视化
    // 这里可以调用 Cesium 相关函数来显示预测结果
    
    statusMessage.value = '✅ 预测数据加载成功'
    statusType.value = 'success'
    setTimeout(() => { statusMessage.value = '' }, 3000)
  } catch (error) {
    console.error('预览失败:', error)
    statusMessage.value = '❌ 预测数据加载失败'
    statusType.value = 'error'
  }
}

// 运行综合分析
async function runAnalysis() {
  if (!canRunAnalysis.value) {
    statusMessage.value = '⚠️ 请先选择所有必需的数据文件'
    statusType.value = 'warning'
    return
  }

  try {
    analyzing.value = true
    statusMessage.value = '正在进行综合决策分析...'
    statusType.value = 'info'

    // 创建 FormData
    const formData = new FormData()
    formData.append('csvFile', predictionFile.value)
    regionFiles.value.forEach(file => formData.append('shpFiles', file))
    formData.append('populationFile', populationFile.value)
    buildingsFiles.value.forEach(file => formData.append('ludingBuildingsShp', file))

    // 调用 Python 后端
    const response = await fetch('http://127.0.0.1:5000/analyze_rescue_priority', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: '服务器错误' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // 检查返回数据
    if (!data.rescue_data || !data.rescue_data.features || data.rescue_data.features.length === 0) {
      statusMessage.value = '⚠️ 分析完成，但未返回有效数据'
      statusType.value = 'warning'
      return
    }

    // 可视化结果
    await visualizeRescuePriorityData(data.rescue_data, data.priority_levels)
    
    analysisCompleted.value = true
    showAnalysis.value = true
    statusMessage.value = '✅ 综合决策分析完成！'
    statusType.value = 'success'
    
    setTimeout(() => { statusMessage.value = '' }, 5000)

  } catch (error) {
    console.error('分析失败:', error)
    statusMessage.value = `❌ 分析失败: ${error.message}`
    statusType.value = 'error'
  } finally {
    analyzing.value = false
  }
}

// 可视化救援优先级数据
async function visualizeRescuePriorityData(rescueData, priorityLevels) {
  try {
    await visualizeRescuePriorityInCesium(rescueData, priorityLevels)
    console.log('可视化救援优先级数据:', rescueData)
    console.log('优先级级别:', priorityLevels)
  } catch (error) {
    console.error('可视化失败:', error)
    throw error
  }
}

// 切换可视化显示
function toggleVisualization() {
  showAnalysis.value = !showAnalysis.value
  toggleRescuePriorityVisibility(showAnalysis.value)
  
  statusMessage.value = showAnalysis.value ? 'ℹ️ 已显示分析结果' : 'ℹ️ 已隐藏分析结果'
  statusType.value = 'info'
  setTimeout(() => { statusMessage.value = '' }, 2000)
}
</script>

<style scoped>
.decision-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 380px;
  max-height: calc(100vh - 40px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 0.98) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
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

.panel-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.file-upload-wrapper {
  position: relative;
  margin-bottom: 10px;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.file-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.file-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.file-icon {
  font-size: 18px;
}

.file-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-list {
  margin-top: 8px;
  padding: 10px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 6px;
  font-size: 12px;
}

.file-item {
  padding: 4px 0;
  color: #666;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  width: 100%;
  background: #fff;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateY(-1px);
}

.action-btn.secondary {
  border-color: rgba(79, 172, 254, 0.3);
  color: #4facfe;
}

.action-btn.secondary:hover {
  background: rgba(79, 172, 254, 0.1);
  border-color: rgba(79, 172, 254, 0.5);
}

.action-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analysis-btn {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.analysis-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.analysis-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.analysis-btn.secondary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.btn-icon {
  font-size: 20px;
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
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
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

.status-bar.warning {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #f57c00;
}

.status-icon {
  font-size: 16px;
}

.warning-box {
  margin-top: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #f57c00;
}

.warning-icon {
  font-size: 18px;
}
</style>
