<template>
  <div class="decision-panel">
    <!-- <div class="panel-header">
      <span class="header-icon">📈</span>
      <span class="header-title">智能决策</span>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div> -->

    <div class="panel-content">
      <!-- 数据输入区域 -->
      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>易发性评估制图</span>
        </div>

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
              <!-- <span class="file-icon">📁</span> -->
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
              <!-- <span class="file-icon">📊</span> -->
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
      </div>

      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>多维空间渲染</span>
        </div>

        <InputSection title="风险数据" icon="👥">
          <div class="file-upload-wrapper">
            <input 
              type="file" 
              accept=".shp,.shx,.dbf,.prj"
              @change="onPopulationShpSelected"
              id="population-shp"
              class="file-input"
            />
            <label for="population-shp" class="file-label">
              <!-- <span class="file-icon">🌍</span> -->
              <span class="file-text">
                {{ populationFileName || '选择风险 SHP 文件' }}
              </span>
            </label>
          </div>
        </InputSection>
      </div>

      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>评估结果统计分析</span>
        </div>

        <InputSection title="评估结果" icon="🏢">
          <div class="file-upload-wrapper">
            <input 
              type="file" 
              multiple
              accept=".csv"
              @change="onBuildingsCsvSelected"
              id="results-csv"
              class="file-input"
            />
            <label for="results-csv" class="file-label">
              <span class="file-icon"></span>
              <span class="file-text">
                {{ buildingsFileName || '选择评估结果 CSV 文件' }}
              </span>
            </label>
          </div>
          <div v-if="buildingsFiles.length > 0" class="file-list">
            <div v-for="(file, index) in buildingsFiles" :key="index" class="file-item">
              ✓ {{ file.name }}
            </div>
          </div>
        </InputSection>
      </div>

      <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>SHAP可解释性分析</span>
        </div>

        <InputSection title="特征重要性分析" icon="🌍">
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
              <!-- <span class="file-icon">🏗️</span> -->
              <span class="file-text">
                {{ buildingsFileName || '选择待分析文件' }}
              </span>
            </label>
          </div>
          <div v-if="buildingsFiles.length > 0" class="file-list">
            <div v-for="(file, index) in buildingsFiles" :key="index" class="file-item">
              ✓ {{ file.name }}
            </div>
          </div>
        </InputSection>
      </div>

      <!-- <div class="section-group">
        <div class="section-label">
          <span class="section-bar"></span>
          <span>决策建议</span>
        </div>

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
      </div> -->

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

    const formData = new FormData()
    formData.append('csvFile', predictionFile.value)
    regionFiles.value.forEach(file => formData.append('shpFiles', file))
    formData.append('populationFile', populationFile.value)
    buildingsFiles.value.forEach(file => formData.append('ludingBuildingsShp', file))

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

    if (!data.rescue_data || !data.rescue_data.features || data.rescue_data.features.length === 0) {
      statusMessage.value = '⚠️ 分析完成，但未返回有效数据'
      statusType.value = 'warning'
      return
    }

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
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(10, 22, 40, 0.95);
  color: #E0E8F0;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #0A2E5C, #1A3A6B);
  /* background: linear-gradient(180deg, #010e22 0%, #02153a 50%, #052a5c 100%); */
  /* background: linear-gradient(180deg, #052a5c 0%, #02153a 50%, #010e22 100%); */
  border-bottom: 1px solid rgba(58, 123, 213, 0.4);
  flex-shrink: 0;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  flex: 1;
  font-size: 19px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(58, 123, 213, 0.5);
}

.close-btn {
  background: none;
  border: none;
  color: #8BA4C0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(58, 123, 213, 0.3);
  color: #FFFFFF;
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
  background: rgba(10, 22, 40, 0.5);
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(58, 123, 213, 0.4);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(58, 123, 213, 0.6);
}

/* 分组 */
.section-group {
  margin-bottom: 14px;
  background: rgba(0, 20, 50, 0.6);
  border: 2px solid rgba(0, 179, 255, 0.342);
  border-radius: 8px;
  padding: 14px;
  position: relative;
  animation: fadein 0.5s ease both;
  transition: border-color 0.2s;
}

.section-group:hover {
  border-color: rgba(0, 179, 255, 0.685);
}

.section-group::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
}

.section-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 179, 255, 0.2);
}

.section-bar {
  display: inline-block;
  flex-shrink: 0;
  width: 4px;
  height: 20px;
  background: #00d4ff;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
  border-radius: 2px;
}

/* 文件上传 */
.file-upload-wrapper {
  position: relative;
  margin-bottom: 8px;
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
  gap: 8px;
  padding: 10px 14px;
  background: rgba(10, 22, 40, 0.6);
  /* color: #4A90D9; */
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 17px;
  font-weight: 500;
  border: 1px solid rgba(58, 123, 213, 0.4);
}

.file-label:hover {
  background: rgba(58, 123, 213, 0.2);
  border-color: rgba(58, 123, 213, 0.6);
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
  margin-top: 6px;
  padding: 8px;
  background: rgba(10, 30, 60, 0.4);
  border-radius: 6px;
  font-size: 14px;
  border: 1px solid rgba(58, 123, 213, 0.2);
}

.file-item {
  padding: 3px 0;
  color: #4A90D9;
}

/* 操作按钮 */
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  width: 100%;
  background: rgba(10, 22, 40, 0.6);
  border: 1px solid rgba(58, 123, 213, 0.4);
  border-radius: 6px;
  color: #4A90D9;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(58, 123, 213, 0.2);
  border-color: rgba(58, 123, 213, 0.6);
}

.action-btn.secondary {
  border-color: rgba(58, 123, 213, 0.3);
  color: #8BA4C0;
}

.action-btn.secondary:hover {
  background: rgba(58, 123, 213, 0.15);
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.analysis-btn {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(58, 123, 213, 0.5);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #0A2E5C, #3A7BD5);
  color: #fff;
}

.analysis-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1A3A6B, #4A90D9);
  box-shadow: 0 0 12px rgba(58, 123, 213, 0.4);
}

.analysis-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.analysis-btn.secondary {
  background: rgba(10, 22, 40, 0.6);
  color: #4A90D9;
  border-color: rgba(58, 123, 213, 0.4);
}

.analysis-btn.secondary:hover {
  background: rgba(58, 123, 213, 0.2);
}

.btn-icon {
  font-size: 20px;
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
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.status-bar.info {
  background: rgba(58, 123, 213, 0.15);
  color: #4A90D9;
  border: 1px solid rgba(58, 123, 213, 0.3);
}

.status-bar.success {
  background: rgba(5, 141, 73, 0.15);
  color: #0AA85A;
  border: 1px solid rgba(5, 141, 73, 0.3);
}

.status-bar.error {
  background: rgba(192, 57, 43, 0.15);
  color: #E74C3C;
  border: 1px solid rgba(192, 57, 43, 0.3);
}

.status-bar.warning {
  background: rgba(255, 153, 0, 0.15);
  color: #FF9900;
  border: 1px solid rgba(255, 153, 0, 0.3);
}

.status-icon {
  font-size: 16px;
}

.warning-box {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255, 153, 0, 0.1);
  border: 1px solid rgba(255, 153, 0, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #FF9900;
}

.warning-icon {
  font-size: 18px;
}

@keyframes fadein {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
