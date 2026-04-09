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
  gap: 10px;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.25);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.file-label:hover {
  background: rgba(102, 126, 234, 0.4);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
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
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.checkbox-label:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(102, 126, 234, 0.4);
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-text {
  font-size: 14px;
  color: #e0e0e0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  color: #90caf9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.5);
}

.btn-icon {
  font-size: 16px;
}

.status-badge {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

.status-badge.success {
  background: rgba(46, 213, 115, 0.2);
  color: #81c784;
}
</style>
