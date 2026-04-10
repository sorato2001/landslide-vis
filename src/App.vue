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
  <div class="app-layout">
    <!-- 顶部导航栏：标题 + 功能标签 -->
    <header class="top-bar">
      <div class="title-box">
        <h1 class="system-title">知识引导的滑坡易发性评估智能决策系统</h1>
      </div>
      <LeftMenu @show="active = $event" :activeTab="active" />
    </header>

    <!-- 主内容区 -->
    <div class="main-area">
      <!-- 左侧边栏 -->
      <aside class="left-sidebar" v-show="active">
        <DataPanel v-if="active === 'data'" @close="active = null" />
        <ModelPanel v-if="active === 'model'" @close="active = null" />
        <DecisionPanel v-if="active === 'decision'" @close="active = null" />
      </aside>

      <!-- Cesium 地球 -->
      <div class="cesium-wrapper">
        <CesiumViewer />
        <MiniMapPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ========== 顶部导航栏 ========== */
.top-bar {
  display: flex;
  align-items: center;
  height: 48px;
  background: #fff;
  border-bottom: 2px solid #2A5298;
  z-index: 100;
  flex-shrink: 0;
  padding: 0 12px;
  gap: 16px;
}

.title-box {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 34px;
  border: 2px solid #2A5298;
  border-radius: 6px;
  flex-shrink: 0;
}

.system-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #2A5298;
  letter-spacing: 2px;
  white-space: nowrap;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

/* ========== 主内容区 ========== */
.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* ========== 左侧边栏 ========== */
.left-sidebar {
  width: 320px;
  min-width: 320px;
  background: #f5f7fa;
  border-right: 2px solid #2A5298;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
  flex-shrink: 0;
}

/* ========== Cesium 区域 ========== */
.cesium-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
