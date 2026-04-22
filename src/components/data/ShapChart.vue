<template>
  <InputSection title="SHAP 分析" icon="📈">
    <div class="shap-chart">
      <!-- 文件加载 -->
      <div class="file-load-section">
        <div class="file-row">
          <label class="file-label">特征重要性:</label>
          <button class="file-btn" @click="loadDefaultImportance" :disabled="loading">
            {{ importanceLoaded ? '已加载' : '加载默认' }}
          </button>
          <label class="file-btn upload-btn" :class="{ loaded: importanceLoaded }">
            {{ importanceFileName || '上传CSV' }}
            <input type="file" accept=".csv" @change="handleImportanceUpload" hidden />
          </label>
        </div>
        <div class="file-row">
          <label class="file-label">SHAP值:</label>
          <button class="file-btn" @click="loadDefaultValues" :disabled="loading">
            {{ valuesLoaded ? '已加载' : '加载默认' }}
          </button>
          <label class="file-btn upload-btn" :class="{ loaded: valuesLoaded }">
            {{ valuesFileName || '上传CSV' }}
            <input type="file" accept=".csv" @change="handleValuesUpload" hidden />
          </label>
        </div>
      </div>

      <!-- 图表类型切换 -->
      <div class="chart-switch" v-if="importanceLoaded || valuesLoaded">
        <button
          class="switch-btn"
          :class="{ active: chartType === 'importance' }"
          @click="chartType = 'importance'"
          :disabled="!importanceLoaded"
        >
          特征重要性
        </button>
        <button
          class="switch-btn"
          :class="{ active: chartType === 'beeswarm' }"
          @click="chartType = 'beeswarm'"
          :disabled="!valuesLoaded"
        >
          SHAP值分布
        </button>
      </div>

      <!-- 显示图例按钮 -->
      <button
        class="show-legend-btn"
        v-if="importanceLoaded || valuesLoaded"
        @click="$emit('showLegend', { type: chartType, data: currentChartData })"
      >
        在地图上显示图例
      </button>
    </div>
  </InputSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import InputSection from './InputSection.vue'

const emit = defineEmits(['showLegend'])

const loading = ref(false)
const chartType = ref('importance')

// 特征重要性数据
const importanceData = ref([])
const importanceLoaded = ref(false)
const importanceFileName = ref('')

// SHAP值数据
const valuesData = ref([])
const valuesLoaded = ref(false)
const valuesFileName = ref('')

const currentChartData = computed(() => {
  if (chartType.value === 'importance') return importanceData.value
  return valuesData.value
})

// CSV解析工具
function parseCSV(text) {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = line.split(',')
    const obj = {}
    headers.forEach((h, i) => {
      const v = values[i]?.trim() || ''
      obj[h] = isNaN(Number(v)) ? v : Number(v)
    })
    return obj
  })
}

// 加载默认特征重要性
async function loadDefaultImportance() {
  loading.value = true
  try {
    const resp = await fetch('./sun/SHAP_Feature_Importance_Data_Stacking_GBDT_XGB.csv')
    if (resp.ok) {
      const text = await resp.text()
      importanceData.value = parseCSV(text)
      importanceLoaded.value = true
      importanceFileName.value = '默认数据'
      chartType.value = 'importance'
    }
  } catch (e) {
    console.error('加载特征重要性数据失败:', e)
  } finally {
    loading.value = false
  }
}

// 加载默认SHAP值
async function loadDefaultValues() {
  loading.value = true
  try {
    const resp = await fetch('./sun/SHAP_Values_Stacking_GBDT_XGB.csv')
    if (resp.ok) {
      const text = await resp.text()
      valuesData.value = parseCSV(text)
      valuesLoaded.value = true
      valuesFileName.value = '默认数据'
      chartType.value = 'beeswarm'
    }
  } catch (e) {
    console.error('加载SHAP值数据失败:', e)
  } finally {
    loading.value = false
  }
}

// 上传特征重要性CSV
async function handleImportanceUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  importanceFileName.value = file.name
  const text = await file.text()
  importanceData.value = parseCSV(text)
  importanceLoaded.value = true
  chartType.value = 'importance'
}

// 上传SHAP值CSV
async function handleValuesUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  valuesFileName.value = file.name
  const text = await file.text()
  valuesData.value = parseCSV(text)
  valuesLoaded.value = true
  chartType.value = 'beeswarm'
}
</script>

<style scoped>
.shap-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-load-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-label {
  font-size: 15px;
  color: #8BA4C0;
  min-width: 80px;
  font-weight: 500;
}

.file-btn {
  padding: 5px 12px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(0, 180, 255, 0.4);
  background: rgba(0, 180, 255, 0.1);
  color: #00d4ff;
  white-space: nowrap;
}

.file-btn:hover:not(:disabled) {
  background: rgba(0, 180, 255, 0.25);
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.2);
}

.file-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.upload-btn {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  border-color: rgba(58, 123, 213, 0.4);
  background: rgba(58, 123, 213, 0.08);
  color: #C0D4EC;
  position: relative;
}

.upload-btn.loaded {
  border-color: rgba(46, 204, 113, 0.5);
  color: #2ECC71;
}

.upload-btn:hover {
  background: rgba(58, 123, 213, 0.2);
}

.chart-switch {
  display: flex;
  gap: 6px;
}

.switch-btn {
  flex: 1;
  padding: 6px 10px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.25s;
  border: 1px solid rgba(58, 123, 213, 0.3);
  background: rgba(58, 123, 213, 0.08);
  color: #8BA4C0;
}

.switch-btn:hover:not(:disabled) {
  background: rgba(58, 123, 213, 0.2);
}

.switch-btn.active {
  background: linear-gradient(135deg, rgba(0, 180, 255, 0.2), rgba(58, 123, 213, 0.25));
  border-color: rgba(0, 212, 255, 0.6);
  color: #00d4ff;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
}

.switch-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.show-legend-btn {
  width: 100%;
  padding: 8px 16px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s;
  border: 1px solid rgba(0, 180, 255, 0.5);
  background: linear-gradient(135deg, rgba(0, 180, 255, 0.15), rgba(58, 123, 213, 0.15));
  color: #00d4ff;
  text-shadow: 0 0 6px rgba(0, 212, 255, 0.3);
}

.show-legend-btn:hover {
  background: linear-gradient(135deg, rgba(0, 180, 255, 0.3), rgba(58, 123, 213, 0.3));
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.3);
  transform: translateY(-1px);
}
</style>
