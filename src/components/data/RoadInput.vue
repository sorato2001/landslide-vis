<template>
  <InputSection title="道路数据" icon="🛣️">
    <div class="file-upload-wrapper">
      <input type="file" accept=".zip" @change="onChange" id="road-file" class="file-input" />
      <label for="road-file" class="file-label">
        <span class="file-icon">📁</span>
        <span class="file-text">选择 ZIP 文件</span>
      </label>
    </div>

    <label v-if="loaded" class="checkbox-label">
      <input type="checkbox" v-model="visible" @change="toggle" />
      <span class="checkbox-text">显示道路</span>
    </label>
  </InputSection>
</template>

<script setup>
import { ref } from 'vue'
import InputSection from './InputSection.vue'
import { loadRoadZip, setRoadVisible } from '../../cesium/roadLoader'

const loaded = ref(false)
const visible = ref(true)

async function onChange(e) {
  await loadRoadZip(e.target.files)
  loaded.value = true
}

function toggle() {
  setRoadVisible(visible.value)
}
</script>

<style scoped>
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

.file-icon { font-size: 16px; }

.file-text { flex: 1; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #dde5f0;
  border-radius: 6px;
  cursor: pointer;
}

.checkbox-label:hover {
  border-color: #2A5298;
}

.checkbox-text { font-size: 13px; color: #333; }
</style>
