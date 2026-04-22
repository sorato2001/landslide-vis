<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

import CesiumViewer from './components/CesiumViewer.vue'
import GraphPanel from './components/GraphPanel.vue'
import LeftMenu from './components/LeftMenu.vue'
import DataPanel from './components/DataPanel.vue'
import ModelPanel from './components/model/ModelPanel.vue'
import DecisionPanel from './components/DecisionPanel.vue'
import ShapLegend from './components/ShapLegend.vue'
import { setOnPointClickCallback } from './cesium/miniMapLink'

const active = ref(null)
const graphPanelRef = ref(null)

// ========== SHAP 图例 ==========
const shapLegendVisible = ref(false)
const shapLegendType = ref('importance')
const shapLegendData = ref([])

const openShapLegend = ({ type, data }) => {
  shapLegendType.value = type
  shapLegendData.value = data
  shapLegendVisible.value = true
}

const closeShapLegend = () => {
  shapLegendVisible.value = false
}

// ========== CNN 模型进度浮层 ==========
const cnnProgress = ref({
  active: false,
  percent: 0,
  text: '',
  stage: ''
})

const CNN_STAGES = [
  { key: 'upload',  label: '模型调用',  sub: '接收训练请求',  icon: '📱' },
  { key: 'process', label: '训练中',    sub: '模型训练与调优', icon: '⚙️' },
  { key: 'render',  label: '结果生成',  sub: '生成训练结果',  icon: '📊' },
  { key: 'done',    label: '返回结果',  sub: '返回调用方',    icon: '✓' },
]
const CNN_STAGE_KEYS = CNN_STAGES.map(s => s.key)

function onCNNProgress(p) {
  cnnProgress.value = { ...p }
}

function cnnStageStatus(key) {
  const idx = CNN_STAGE_KEYS.indexOf(key)
  const currentIdx = CNN_STAGE_KEYS.indexOf(cnnProgress.value.stage)
  if (currentIdx > idx) return 'done'
  if (currentIdx === idx) return 'active'
  return 'pending'
}

// ========== 在线数据 Web 预览 ==========
const webPreviewVisible = ref(false)
const webPreviewUrl = ref('')
const webPreviewName = ref('')

const openWebPreview = ({ name, url }) => {
  webPreviewName.value = name
  webPreviewUrl.value = url
  webPreviewVisible.value = true
}

const closeWebPreview = () => {
  webPreviewVisible.value = false
  webPreviewUrl.value = ''
  webPreviewName.value = ''
}

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
        <h1 class="system-title">基于知识图谱的滑坡易发性智能评估原型系统</h1>
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
        <DataPanel v-if="active === 'input'" @close="active = null" @openUrl="openWebPreview" />
        <ModelPanel v-if="active === 'model'" @close="active = null" @cnnProgress="onCNNProgress" />
        <DecisionPanel v-if="active === 'decision'" @close="active = null" @showLegend="openShapLegend" />

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

        <!-- 在线数据 Web 预览浮层 -->
        <div class="web-preview-overlay" v-if="webPreviewVisible">
          <div class="web-preview-container">
            <div class="web-preview-header">
              <span class="preview-title">🌐 {{ webPreviewName }}</span>
              <div class="preview-actions">
                <a class="preview-external" :href="webPreviewUrl" target="_blank" rel="noopener noreferrer" title="在新标签页打开">
                  ↗
                </a>
                <button class="preview-close" @click="closeWebPreview" title="关闭">✕</button>
              </div>
            </div>
            <div class="web-preview-body">
              <iframe
                :src="webPreviewUrl"
                class="preview-iframe"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>

        <!-- SHAP 图例浮层 -->
        <ShapLegend
          :visible="shapLegendVisible"
          :chartType="shapLegendType"
          :data="shapLegendData"
          @close="closeShapLegend"
        />

        <!-- CNN 模型进度浮层 -->
        <div v-if="cnnProgress.active" class="cnn-progress-overlay">
          <div class="cnn-progress-card">
            <!-- 标题栏 -->
            <div class="cnn-progress-title">
              <span class="cnn-icon">🧠</span>
              <span>模型正在训练</span>
              <span class="cnn-percent">{{ cnnProgress.percent }}%</span>
            </div>

            <!-- 数据已加载状态 -->
            <div class="cnn-loaded-hint" v-if="cnnProgress.stage !== 'upload'">
              <span class="cnn-loaded-check">✓</span>
              <span>数据已加载</span>
            </div>

            <!-- 进度条 -->
            <div class="cnn-progress-track">
              <div
                class="cnn-progress-fill"
                :style="{ width: cnnProgress.percent + '%' }"
                :class="cnnProgress.percent >= 100 ? 'complete' : ''"
              >
                <div class="cnn-progress-shine"></div>
              </div>
            </div>

            <!-- 4阶段流程 -->
            <div class="cnn-flow">
              <div
                v-for="(s, i) in CNN_STAGES"
                :key="s.key"
                class="cnn-flow-step"
                :class="cnnStageStatus(s.key)"
              >
                <div class="cnn-flow-icon">
                  <span>{{ s.icon }}</span>
                </div>
                <div class="cnn-flow-label">{{ s.label }}</div>
                <div class="cnn-flow-sub">{{ s.sub }}</div>
                <div v-if="i < CNN_STAGES.length - 1" class="cnn-flow-arrow">
                  <span>···</span><span class="arrow-head">›</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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

/* ========== Web 预览浮层 ========== */
.web-preview-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.web-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(5, 15, 30, 0.98);
  overflow: hidden;
}

.web-preview-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #0A2E5C, #1A3A6B);
  border-bottom: 1px solid rgba(0, 212, 255, 0.4);
  flex-shrink: 0;
  gap: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.preview-title {
  flex: 1;
  font-size: 18px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  letter-spacing: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-external {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background: rgba(0, 180, 255, 0.15);
  border: 1px solid rgba(0, 180, 255, 0.4);
  color: #00d4ff;
  font-size: 18px;
  text-decoration: none;
  transition: all 0.2s;
}

.preview-external:hover {
  background: rgba(0, 180, 255, 0.3);
  box-shadow: 0 0 8px rgba(0, 180, 255, 0.4);
}

.preview-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  background: rgba(231, 76, 60, 0.15);
  border: 1px solid rgba(231, 76, 60, 0.4);
  color: #E74C3C;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.preview-close:hover {
  background: rgba(231, 76, 60, 0.35);
  box-shadow: 0 0 8px rgba(231, 76, 60, 0.4);
  color: #fff;
}

.web-preview-body {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

/* ========== CNN 进度浮层 ========== */
.cnn-progress-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 60;
  pointer-events: none;
}

.cnn-progress-card {
  min-width: 560px;
  padding: 24px 32px 20px;
  background: rgba(5, 18, 40, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.4);
  border-radius: 14px;
  box-shadow: 0 0 40px rgba(0, 150, 255, 0.25), inset 0 0 30px rgba(0, 100, 200, 0.06);
  backdrop-filter: blur(12px);
  animation: cnnFadeIn 0.4s ease;
}

@keyframes cnnFadeIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.cnn-progress-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 20px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  letter-spacing: 1px;
}

.cnn-icon {
  font-size: 26px;
}

.cnn-percent {
  margin-left: auto;
  font-size: 24px;
  font-weight: 800;
  color: #00d4ff;
  font-variant-numeric: tabular-nums;
}

/* 数据已加载提示 */
.cnn-loaded-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 16px;
  color: #34d399;
  font-weight: 600;
}

.cnn-loaded-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(52, 211, 153, 0.2);
  border: 1px solid rgba(52, 211, 153, 0.5);
  font-size: 14px;
  color: #34d399;
}

.cnn-progress-track {
  height: 10px;
  background: rgba(0, 20, 50, 0.8);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid rgba(0, 212, 255, 0.15);
  margin-bottom: 20px;
}

.cnn-progress-fill {
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, #0055aa, #00aaff, #00d4ff);
  transition: width 0.4s ease;
  position: relative;
  overflow: hidden;
}

.cnn-progress-fill.complete {
  background: linear-gradient(90deg, #058D49, #0AA85A, #34d399);
}

.cnn-progress-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  animation: cnnShine 1.5s infinite;
}

@keyframes cnnShine {
  0% { left: -100%; }
  100% { left: 100%; }
}

/* 4阶段流程 */
.cnn-flow {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
}

.cnn-flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 0 0 auto;
  width: 100px;
}

.cnn-flow-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background: rgba(0, 40, 80, 0.8);
  border: 2px solid rgba(93, 138, 170, 0.4);
  transition: all 0.3s;
  margin-bottom: 8px;
}

.cnn-flow-step.active .cnn-flow-icon {
  background: rgba(0, 150, 255, 0.2);
  border-color: #00d4ff;
  box-shadow: 0 0 16px rgba(0, 212, 255, 0.5);
}

.cnn-flow-step.done .cnn-flow-icon {
  background: rgba(52, 211, 153, 0.15);
  border-color: #34d399;
  box-shadow: 0 0 12px rgba(52, 211, 153, 0.3);
}

.cnn-flow-label {
  font-size: 15px;
  font-weight: 700;
  color: #5d8aaa;
  transition: color 0.3s;
  margin-bottom: 2px;
}

.cnn-flow-step.active .cnn-flow-label {
  color: #00d4ff;
}

.cnn-flow-step.done .cnn-flow-label {
  color: #34d399;
}

.cnn-flow-sub {
  font-size: 12px;
  color: rgba(93, 138, 170, 0.7);
  transition: color 0.3s;
  white-space: nowrap;
}

.cnn-flow-step.active .cnn-flow-sub {
  color: rgba(0, 212, 255, 0.7);
}

.cnn-flow-step.done .cnn-flow-sub {
  color: rgba(52, 211, 153, 0.7);
}

/* 箭头连接 */
.cnn-flow-arrow {
  position: absolute;
  top: 16px;
  right: -32px;
  display: flex;
  align-items: center;
  gap: 0;
  color: rgba(93, 138, 170, 0.4);
  font-size: 14px;
  letter-spacing: -2px;
  transition: color 0.3s;
}

.cnn-flow-step.done .cnn-flow-arrow {
  color: rgba(52, 211, 153, 0.6);
}

.arrow-head {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0;
}
</style>
