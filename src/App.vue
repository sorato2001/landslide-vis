<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

import CesiumViewer from './components/CesiumViewer.vue'
import GraphPanel from './components/GraphPanel.vue'
import LeftMenu from './components/LeftMenu.vue'
import DataPanel from './components/DataPanel.vue'
import ModelPanel from './components/model/ModelPanel.vue'
import DecisionPanel from './components/DecisionPanel.vue'
import { setOnPointClickCallback } from './cesium/miniMapLink'

const active = ref(null)
const graphPanelRef = ref(null)

// ========== 侧栏拖拽调整宽度 ==========
const sidebarWidth = ref(360)
const isDragging = ref(false)
const mainAreaRef = ref(null)

const startDrag = (e) => {
  isDragging.value = true
  e.preventDefault()
}

const onDrag = (e) => {
  if (!isDragging.value) return
  const clientX = e.clientX || (e.touches && e.touches[0].clientX)
  if (clientX === undefined) return
  // 限制宽度范围 280 ~ 600
  const newWidth = Math.min(600, Math.max(280, clientX))
  sidebarWidth.value = newWidth
}

const stopDrag = () => {
  isDragging.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', stopDrag)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
})

// 当图谱面板挂载后，设置 Cesium 点击回调
watch(graphPanelRef, (panel) => {
  if (panel) {
    setOnPointClickCallback((loc, lng, lat, properties) => {
      if (panel.queryGraphByLoc) {
        panel.queryGraphByLoc(loc)
      }
    })
  }
})
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
    <div class="main-area" ref="mainAreaRef">
      <!-- 左侧边栏 -->
      <aside
        class="left-sidebar"
        v-show="active"
        :style="{ width: sidebarWidth + 'px', minWidth: sidebarWidth + 'px' }"
      >
        <GraphPanel v-if="active === 'data'" ref="graphPanelRef" @close="active = null" />
        <DataPanel v-if="active === 'input'" @close="active = null" />
        <ModelPanel v-if="active === 'model'" @close="active = null" />
        <DecisionPanel v-if="active === 'decision'" @close="active = null" />

        <!-- 拖拽把手 -->
        <div
          class="resize-handle"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <div class="resize-line"></div>
        </div>
      </aside>

      <!-- Cesium 地球 -->
      <div class="cesium-wrapper">
        <CesiumViewer />
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
  background: #f5f7fa;
  border-right: 2px solid #2A5298;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 10;
  flex-shrink: 0;
  position: relative;
}

/* ========== 拖拽把手 ========== */
.resize-handle {
  position: absolute;
  top: 0;
  right: -4px;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resize-handle:hover .resize-line,
.resize-handle:active .resize-line {
  background: #2A5298;
  width: 3px;
}

.resize-line {
  width: 2px;
  height: 40px;
  background: #b0c4de;
  border-radius: 2px;
  transition: all 0.2s ease;
}

/* ========== Cesium 区域 ========== */
.cesium-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
