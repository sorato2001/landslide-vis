<script setup>
import { ref } from 'vue'

import CesiumViewer from './components/CesiumViewer.vue'
import MapLibreViewer from './components/MapLibreViewer.vue'
import LeftMenu from './components/LeftMenu.vue'
import DataPanel from './components/DataPanel.vue'
import ModelPanel from './components/model/ModelPanel.vue'
import DecisionPanel from './components/DecisionPanel.vue'

const active = ref(null)
const viewMode = ref('cesium') // 'cesium' 或 'maplibre'

const switchView = () => {
  viewMode.value = viewMode.value === 'cesium' ? 'maplibre' : 'cesium'
}
</script>

<template>
  <!-- 视图切换按钮 -->
  <button class="view-switch-btn" @click="switchView">
    <span v-if="viewMode === 'cesium'">📊 图谱模式</span>
    <span v-else>🌍 三维模式</span>
  </button>

  <!-- 1️⃣ Cesium 地图视图 -->
  <div v-show="viewMode === 'cesium'" class="view-container">
    <CesiumViewer />
    <LeftMenu @show="active = $event" />
    <DataPanel v-show="active === 'data'" @close="active = null" />
    <ModelPanel v-show="active === 'model'" @close="active = null" />
    <DecisionPanel v-show="active === 'decision'" @close="active = null" />
  </div>

  <!-- 2️⃣ MapLibre 图谱视图 -->
  <div v-show="viewMode === 'maplibre'" class="view-container">
    <MapLibreViewer />
  </div>
</template>

<style scoped>
.view-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.view-switch-btn {
  position: fixed;
  top: 1%;
  left: 1%;
  z-index: 1000;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.view-switch-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.view-switch-btn:active {
  transform: translateY(0);
}

.view-switch-btn span {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
