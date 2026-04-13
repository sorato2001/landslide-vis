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
  background: rgba(10, 22, 40, 0.95);
  color: #E0E8F0;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #0A2E5C, #1A3A6B);
  border-bottom: 1px solid rgba(58, 123, 213, 0.4);
  flex-shrink: 0;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  flex: 1;
  font-size: 19px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(58, 123, 213, 0.5);
}

.close-btn {
  background: none;
  border: none;
  color: #8BA4C0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(58, 123, 213, 0.3);
  color: #FFFFFF;
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
  background: rgba(10, 22, 40, 0.5);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(58, 123, 213, 0.4);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(58, 123, 213, 0.6);
}
</style>
