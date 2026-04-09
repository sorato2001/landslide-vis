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
}

.file-icon { font-size: 18px; }

.file-text { flex: 1; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  cursor: pointer;
}

.checkbox-text { font-size: 14px; color: #e0e0e0; }
</style>
