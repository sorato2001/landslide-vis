<template>
  <div class="data-panel">
    <div class="panel-header">
      <h3>📊 数据录入</h3>
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
  position: absolute;
  top: 100px;
  left: 20px;
  width: 360px;
  max-height: calc(100vh - 40px);
  background: rgba(10, 10, 25, 0.94);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.panel-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}
</style>
