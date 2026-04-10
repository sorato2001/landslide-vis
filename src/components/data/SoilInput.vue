<template>
  <InputSection title="土壤 SHP" icon="🌿">
    <div class="file-upload-wrapper">
      <input type="file" accept=".zip" @change="onFileChange" id="soil-file" class="file-input" />
      <label for="soil-file" class="file-label">
        <span class="file-icon">📁</span>
        <span class="file-text">选择 ZIP 文件</span>
      </label>
    </div>

    <div v-if="loaded" class="controls">
      <label class="checkbox-label">
        <input type="checkbox" v-model="visible" @change="toggle" />
        <span class="checkbox-text">显示土壤图层</span>
      </label>

      <div class="slider-row">
        <span class="slider-label">透明度</span>
        <input type="range" min="0" max="1" step="0.05" v-model.number="opacity" @input="changeOpacity" />
        <span class="slider-value">{{ opacity }}</span>
      </div>
    </div>

    <SoilLegend :dl-list="dlList" />
  </InputSection>
</template>

<script setup>
import { ref } from 'vue'
import InputSection from './InputSection.vue'
import {
  loadSoilShp,
  setSoilVisible,
  setSoilOpacity
} from '../../cesium/soilLoader'
import SoilLegend from './SoilLegend.vue'

const dlList = ref([])
const loaded = ref(false)
const visible = ref(true)
const opacity = ref(0.7)

async function onFileChange(e) {
  dlList.value = await loadSoilShp(e.target.files)
  loaded.value = true
  visible.value = true
  setSoilOpacity(opacity.value)
}

function toggle() {
  setSoilVisible(visible.value)
}

function changeOpacity() {
  setSoilOpacity(opacity.value)
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
}

.checkbox-label:hover {
  border-color: #2A5298;
}

.checkbox-text { font-size: 13px; color: #333; }

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #dde5f0;
  border-radius: 6px;
}

.slider-label { font-size: 12px; color: #666; }

.slider-value { font-size: 12px; color: #2A5298; min-width: 30px; }

input[type="range"] {
  flex: 1;
  accent-color: #2A5298;
}
</style>
