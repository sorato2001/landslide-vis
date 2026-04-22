<template>
  <InputSection title="易发性概率图" icon="🗺️">
    <div class="sus-section">
      <div class="sus-desc">加载滑坡易发性概率 TIFF，自动分为5级渲染</div>

      <!-- 默认加载按钮 -->
      <button class="action-btn primary" @click="loadDefault" :disabled="loading">
        <span class="btn-icon">📂</span>
        <span>{{ loading ? '加载中...' : '加载默认数据' }}</span>
      </button>

      <!-- 文件上传 -->
      <div class="file-upload-wrapper">
        <input
          type="file"
          accept=".tif,.tiff"
          @change="onFileChange"
          id="susceptibility-file"
          class="file-input"
        />
        <label for="susceptibility-file" class="file-label">
          <span class="file-icon">📁</span>
          <span class="file-text">{{ fileName || '上传 TIF 文件' }}</span>
        </label>
      </div>
    </div>

    <div v-if="loaded" class="controls">
      <label class="checkbox-label">
        <input type="checkbox" v-model="visible" @change="toggleVisible" />
        <span class="checkbox-text">显示易发性图层</span>
      </label>

      <button class="action-btn danger" @click="removeLayer">
        <span class="btn-icon">🗑️</span>
        <span>移除图层</span>
      </button>
    </div>

    <div v-if="loaded" class="status-badge success">
      ✅ 已加载 ({{ info }})
    </div>

    <!-- 分级图例 -->
    <div v-if="loaded && visible" class="mini-legend">
      <div class="legend-title">易发性分级</div>
      <div class="legend-row" v-for="(band, i) in bands" :key="i">
        <div class="legend-swatch" :style="{ background: band.bg }"></div>
        <span class="legend-text">{{ band.label }}</span>
      </div>
    </div>
  </InputSection>
</template>

<script setup>
import { ref } from 'vue'
import InputSection from './InputSection.vue'
import {
  loadSusceptibilityTif,
  setSusceptibilityVisible,
  removeSusceptibilityLayer,
  isSusceptibilityLoaded,
} from '../../cesium/tifLoader'

const visible = ref(true)
const loaded = ref(false)
const loading = ref(false)
const fileName = ref('')
const info = ref('')

const bands = [
  { label: '极低 (0-0.2)',  bg: '#305FCF' },
  { label: '低 (0.2-0.4)',  bg: '#9FA7C9' },
  { label: '中 (0.4-0.6)',  bg: '#FFFFBF' },
  { label: '高 (0.6-0.8)',  bg: '#E89D74' },
  { label: '极高 (0.8-1.0)', bg: '#C44539' },
]

async function loadDefault() {
  loading.value = true
  try {
    const result = await loadSusceptibilityTif('./sun/Stacking_GBDT_XGB_model_LD_y_prob_reclassified.tif')
    loaded.value = true
    visible.value = true
    fileName.value = '默认数据'
    info.value = `${result.width}×${result.height}`
  } catch (e) {
    console.error('加载默认易发性TIFF失败:', e)
    alert('加载失败: ' + e.message)
  } finally {
    loading.value = false
  }
}

async function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  loading.value = true
  fileName.value = file.name
  try {
    const result = await loadSusceptibilityTif(file)
    loaded.value = true
    visible.value = true
    info.value = `${result.width}×${result.height}`
  } catch (err) {
    console.error('加载易发性TIFF失败:', err)
    alert('加载失败: ' + err.message)
  } finally {
    loading.value = false
  }
}

function toggleVisible() {
  setSusceptibilityVisible(visible.value)
}

function removeLayer() {
  removeSusceptibilityLayer()
  loaded.value = false
  visible.value = true
  fileName.value = ''
  info.value = ''
}
</script>

<style scoped>
.sus-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sus-desc {
  font-size: 14px;
  color: #8BA4C0;
  line-height: 1.4;
}

.file-upload-wrapper {
  position: relative;
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
  background: rgba(6, 35, 85, 0.6);
  color: #fff;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 17px;
  font-weight: 500;
  border: 1px solid rgba(63, 127, 218, 0.849);
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

.controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(6, 35, 85, 0.6);
  border: 1px solid rgba(63, 127, 218, 0.849);
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  border-color: rgba(58, 123, 213, 0.4);
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3A7BD5;
}

.checkbox-text {
  font-size: 17px;
  color: #fff;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(6, 35, 85, 0.6);
  border: 1px solid rgba(63, 127, 218, 0.849);
  border-radius: 15px;
  color: #fff;
  font-size: 17px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(58, 123, 213, 0.2);
  border-color: rgba(58, 123, 213, 0.6);
}

.action-btn.primary {
  background: rgba(0, 180, 255, 0.15);
  border-color: rgba(0, 180, 255, 0.5);
  color: #00d4ff;
}

.action-btn.primary:hover {
  background: rgba(0, 180, 255, 0.3);
  border-color: rgba(0, 180, 255, 0.7);
}

.action-btn.danger {
  background: rgba(231, 76, 60, 0.1);
  border-color: rgba(231, 76, 60, 0.4);
  color: #E74C3C;
}

.action-btn.danger:hover {
  background: rgba(231, 76, 60, 0.25);
  border-color: rgba(231, 76, 60, 0.6);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 16px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  margin-top: 6px;
}

.status-badge.success {
  background: rgba(5, 141, 73, 0.15);
  color: #0AA85A;
  border: 1px solid rgba(5, 141, 73, 0.3);
}

/* 迷你图例 */
.mini-legend {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(0, 20, 50, 0.7);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
}

.mini-legend .legend-title {
  font-size: 14px;
  font-weight: 700;
  color: #E0E8F0;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 3px;
}

.legend-swatch {
  width: 16px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.legend-text {
  font-size: 13px;
  color: #C0D4EC;
}
</style>
