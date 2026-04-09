<script setup>
import { ref } from 'vue'

import CesiumViewer from './components/CesiumViewer.vue'
import MiniMapPanel from './components/MiniMapPanel.vue'
import LeftMenu from './components/LeftMenu.vue'
import DataPanel from './components/DataPanel.vue'
import ModelPanel from './components/model/ModelPanel.vue'
import DecisionPanel from './components/DecisionPanel.vue'

const active = ref(null)
</script>

<template>
  <!-- 单一视图：Cesium + 小地图/图谱 -->
  <div class="view-container">
    <CesiumViewer />
    
    <!-- 顶部标题栏 -->
    <div class="top-header">
      <h1 class="system-title">滑坡危险性评价集成化决策支持可视化系统</h1>
    </div>
    
    <MiniMapPanel />
    <LeftMenu @show="active = $event" />
    <DataPanel v-show="active === 'data'" @close="active = null" />
    <ModelPanel v-show="active === 'model'" @close="active = null" />
    <DecisionPanel v-show="active === 'decision'" @close="active = null" />
  </div>
</template>

<style scoped>
.view-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.top-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 15;
  text-align: center;
  padding: 10px 20px 10px;
  background: rgba(10, 10, 25);
  pointer-events: none;
}

.system-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 0 12px rgba(102, 126, 234, 0.6), 0 2px 4px rgba(0, 0, 0, 0.5);
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}
</style>
