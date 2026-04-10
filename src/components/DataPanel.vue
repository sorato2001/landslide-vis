<template>
  <div class="data-panel">
    <div class="panel-header">
      <span class="header-icon">📊</span>
      <span class="header-title">数据录入</span>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div>

    <div class="panel-content">
      <AreaInput />
      <ElevationInput />
      <SoilInput />
      <RoadInput />
    </div>
  </div>
</template>

<script setup>
import AreaInput from './data/AreaInput.vue'
import ElevationInput from './data/ElevationInput.vue'
import SoilInput from './data/SoilInput.vue'
import RoadInput from './data/RoadInput.vue'

defineEmits(['close'])
</script>

<style scoped>
.data-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #e8eef6;
  border-bottom: 2px solid #2A5298;
  flex-shrink: 0;
  gap: 8px;
}

.header-icon {
  font-size: 16px;
}

.header-title {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: #2A5298;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #d0dced;
  color: #2A5298;
}

.panel-content {
  padding: 14px;
  overflow-y: auto;
  flex: 1;
}

.panel-content::-webkit-scrollbar {
  width: 5px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #b0c4de;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #2A5298;
}
</style>
