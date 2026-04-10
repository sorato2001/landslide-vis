<template>
  <InputSection title="高程数据（DEM）" icon="🏞️">
    <div class="file-upload-wrapper">
      <input 
        type="file" 
        accept=".tif,.tiff" 
        @change="onChange"
        id="elevation-file"
        class="file-input"
      />
      <label for="elevation-file" class="file-label">
        <span class="file-icon">📁</span>
        <span class="file-text">
          {{ fileName || '选择 TIF 文件' }}
        </span>
      </label>
    </div>

    <div v-if="loaded" class="controls">
      <label class="checkbox-label">
        <input type="checkbox" v-model="visible" @change="toggle" />
        <span class="checkbox-text">显示高程图层</span>
      </label>

      <button class="action-btn" @click="toggle1">
        <span class="btn-icon">🔄</span>
        <span>切换显示模式</span>
      </button>
    </div>

    <div v-if="loaded" class="status-badge success">
      ✅ 已加载
    </div>
  </InputSection>
</template>

<script setup>
import { ref } from 'vue'
import InputSection from './InputSection.vue'
import { loadElevationTif, setElevationVisible, toggleElevationMode } from '../../cesium/tifLoader'

const visible = ref(true)
const loaded = ref(false)
const fileName = ref('')

async function onChange(e) {
  const file = e.target.files[0]
  if (!file) return

  fileName.value = file.name
  await loadElevationTif(file)
  loaded.value = true
  visible.value = true
}

function toggle() {
  setElevationVisible(visible.value)
}

function toggle1() {
  toggleElevationMode()
}
</script>

<style scoped>
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
  background: #e8eef6;
  color: #2A5298;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #2A5298;
}

.file-label:hover {
  background: #d0dced;
}

.file-icon {
  font-size: 16px;
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
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #dde5f0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  border-color: #2A5298;
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #2A5298;
}

.checkbox-text {
  font-size: 13px;
  color: #333;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #2A5298;
  border-radius: 6px;
  color: #2A5298;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #e8eef6;
}

.btn-icon {
  font-size: 14px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.status-badge.success {
  background: #e6f7ef;
  color: #0d7a5f;
  border: 1px solid #b0dcc8;
}
</style>
