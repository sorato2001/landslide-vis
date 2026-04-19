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

const currentTime = ref('')

function updateClock() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  currentTime.value = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}  ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

let timer
onMounted(() => { updateClock(); timer = setInterval(updateClock, 1000) })
onUnmounted(() => clearInterval(timer))

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
        <img class="title-logo" src="./assets/vge.png" alt="logo">
        <h1 class="system-title">知识引导的滑坡易发性评估智能决策系统</h1>
      </div>
      <LeftMenu @show="active = $event" :activeTab="active" />
      <div class="header-right">
        <div class="header-time">{{ currentTime }}</div>
      </div>
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
  position: relative;
  height: 70px;
  background: linear-gradient(180deg, #010e22 0%, #02153a 50%, #052a5c 100%);
  border-bottom: 1px solid rgba(0,212,255,0.5);
  z-index: 100;
  flex-shrink: 0;
  padding: 0 18px;
  gap: 16px;
  box-shadow: 0 2px 24px rgba(0, 149, 255, 0.295);
}

.top-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(0, 150, 255, 0.08) 0%, transparent 100%);
  pointer-events: none;
}

.top-bar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 1px;
  width: 30%;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
  animation: scan 3s linear infinite;
}

@keyframes scan {
  0%   { left: -30%; }
  100% { left: 100%; }
}

.title-box {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 50px;
  border: 2px solid #2A5298;
  /* border-radius: 6px; */
  flex-shrink: 0;
  gap: 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 4px 12px rgba(0,0,0,0.36);
}

/* 标题左上右下角样式，伪元素实现 */
.title-box::before,
.title-box::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
}

.title-box::before {
  top: -1px; left: -1px;
  border-top: 2px solid #00d4ff;
  border-left: 2px solid #00d4ff;
  box-shadow: -2px -2px 6px rgba(0,212,255,0.3);
}

.title-box::after {
  bottom: -1px; right: -1px;
  border-bottom: 2px solid #00d4ff;
  border-right: 2px solid #00d4ff;
  box-shadow: 2px 2px 6px rgba(0,212,255,0.3);
}

.title-logo {
  height: 36px; /* 根据需要调整大小 */
  width: auto;
  object-fit: contain;
}

.system-title {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 2px;
  white-space: nowrap;
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  text-shadow: 0 0 16px rgba(0,212,255,0.7);
}
@media (max-width: 900px) {
  .system-title { font-size: 14px; white-space: normal; }
  .top-bar { padding: 0 12px; height: 60px; }
  .title-box { padding: 4px 10px; height: 36px; }
}

.header-right {
  display: flex; 
  align-items: center; 
  gap: 16px; 
  flex-shrink: 0; 
}
.header-time { 
  font-size: 20px; 
  color: #5d8aaa; 
  letter-spacing: 1px; 
  font-variant-numeric: tabular-nums; 
  font-weight: 700;
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
  background: linear-gradient(180deg, rgba(4,22,48,0.95) 0%, rgba(2,12,30,0.98) 100%);
  border-right: 1px solid rgba(58, 123, 213, 0.3);
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
  background: #3A7BD5;
  width: 3px;
}

.resize-line {
  width: 2px;
  height: 40px;
  background: rgba(58, 123, 213, 0.4);
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
