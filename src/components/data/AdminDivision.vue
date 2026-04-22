<template>
  <InputSection title="行政区划" icon="🗺️">
    <div class="admin-division">
      <div class="admin-info">
        <span class="info-label">区域:</span>
        <span class="info-value">{{ regionName }}</span>
      </div>
      <div class="admin-info">
        <span class="info-label">代码:</span>
        <span class="info-value">{{ regionCode }}</span>
      </div>
      <div class="admin-info">
        <span class="info-label">类型:</span>
        <span class="info-value">{{ regionType }}</span>
      </div>

      <div class="admin-actions">
        <button
          class="action-btn load-btn"
          :class="{ loaded: isLoaded }"
          @click="handleLoad"
          :disabled="isLoaded"
        >
          {{ isLoaded ? '已加载' : '加载边界' }}
        </button>
        <button
          class="action-btn toggle-btn"
          :class="{ active: isVisible }"
          @click="handleToggle"
          :disabled="!isLoaded"
        >
          {{ isVisible ? '隐藏边界' : '显示边界' }}
        </button>
        <button
          class="action-btn fly-btn"
          @click="handleFlyTo"
          :disabled="!isLoaded"
        >
          飞行至区域
        </button>
      </div>

      <!-- 状态提示 -->
      <div class="status-bar" :class="statusClass">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>
  </InputSection>
</template>

<script setup>
import { ref, computed } from 'vue'
import InputSection from './InputSection.vue'
import {
  loadAdminBoundary,
  setAdminBoundaryVisible,
  isAdminBoundaryLoaded,
  isAdminBoundaryVisible,
} from '../../cesium/miniMapLink'
import { getViewer } from '../../cesium/viewer'
import * as Cesium from 'cesium'

const regionName = ref('四川省')
const regionCode = ref('510000')
const regionType = ref('省')

const isLoaded = ref(false)
const isVisible = ref(false)

const statusClass = computed(() => {
  if (!isLoaded.value) return 'status-unloaded'
  return isVisible.value ? 'status-visible' : 'status-hidden'
})

const statusText = computed(() => {
  if (!isLoaded.value) return '未加载'
  return isVisible.value ? '边界可见' : '边界已隐藏'
})

const handleLoad = async () => {
  const result = await loadAdminBoundary('./sun/sichuan_WGS/sichuan.geojson')
  if (result) {
    isLoaded.value = true
    isVisible.value = true
  }
}

const handleToggle = () => {
  if (!isLoaded.value) return
  const newVal = !isVisible.value
  setAdminBoundaryVisible(newVal)
  isVisible.value = newVal
}

const handleFlyTo = () => {
  if (!isLoaded.value) return
  const viewer = getViewer()
  if (viewer) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(102.5, 30.5, 2500000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 2.0,
    })
  }
}
</script>

<style scoped>
.admin-division {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 16px;
}

.info-label {
  color: #8BA4C0;
  font-weight: 500;
  min-width: 50px;
}

.info-value {
  color: #E0E8F0;
  font-weight: 600;
}

.admin-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 80px;
  padding: 7px 12px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid;
  text-align: center;
}

.load-btn {
  background: rgba(0, 180, 255, 0.15);
  border-color: rgba(0, 180, 255, 0.5);
  color: #00d4ff;
}

.load-btn:hover:not(:disabled) {
  background: rgba(0, 180, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 180, 255, 0.3);
}

.load-btn.loaded {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.3);
  color: #5d8aaa;
  cursor: default;
}

.toggle-btn {
  background: rgba(58, 123, 213, 0.15);
  border-color: rgba(58, 123, 213, 0.5);
  color: #4A90D9;
}

.toggle-btn:hover:not(:disabled) {
  background: rgba(58, 123, 213, 0.3);
  box-shadow: 0 0 10px rgba(58, 123, 213, 0.3);
}

.toggle-btn.active {
  background: linear-gradient(135deg, rgba(58, 123, 213, 0.3), rgba(0, 180, 255, 0.2));
  border-color: rgba(0, 212, 255, 0.6);
  color: #00d4ff;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
}

.fly-btn {
  background: rgba(74, 144, 217, 0.15);
  border-color: rgba(74, 144, 217, 0.5);
  color: #4A90D9;
}

.fly-btn:hover:not(:disabled) {
  background: rgba(74, 144, 217, 0.3);
  box-shadow: 0 0 10px rgba(74, 144, 217, 0.3);
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 状态条 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  border: 1px solid;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-unloaded {
  background: rgba(139, 164, 192, 0.1);
  border-color: rgba(139, 164, 192, 0.3);
  color: #8BA4C0;
}

.status-unloaded .status-dot {
  background: #8BA4C0;
}

.status-visible {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.4);
  color: #00d4ff;
}

.status-visible .status-dot {
  background: #00d4ff;
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.6);
}

.status-hidden {
  background: rgba(245, 166, 35, 0.1);
  border-color: rgba(245, 166, 35, 0.4);
  color: #F5A623;
}

.status-hidden .status-dot {
  background: #F5A623;
}
</style>
