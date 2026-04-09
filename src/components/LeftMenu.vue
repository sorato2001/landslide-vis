<template>
  <div class="top-bar">
    <button 
      class="menu-item" 
      :class="{ active: activeTab === 'data' }"
      @click="handleClick('data')"
    >
      <span class="icon">📊</span>
      <span class="label">数据录入</span>
    </button>
    <button 
      class="menu-item"
      :class="{ active: activeTab === 'model' }"
      @click="handleClick('model')"
    >
      <span class="icon">🤖</span>
      <span class="label">模型集成</span>
    </button>
    <button 
      class="menu-item" 
      :class="{ active: activeTab === 'decision' }"
      @click="handleClick('decision')"
    >
      <span class="icon">📈</span>
      <span class="label">决策评估</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['show'])
const activeTab = ref(null)

const handleClick = (tab) => {
  activeTab.value = activeTab.value === tab ? null : tab
  emit('show', activeTab.value === tab ? tab : null)
}
</script>

<style scoped>
.top-bar {
  position: absolute;
  top: 42px;
  left: 0;
  right: 0;
  z-index: 16;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(10, 10, 25);
}

.menu-item {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.menu-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: transform 0.3s ease;
  border-radius: 2px;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.25);
}

.menu-item:hover::after {
  transform: translateX(-50%) scaleX(1);
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.35) 0%, rgba(118, 75, 162, 0.35) 100%);
  border-color: rgba(102, 126, 234, 0.5);
  color: #fff;
  box-shadow: 0 2px 14px rgba(102, 126, 234, 0.4);
}

.menu-item.active::after {
  transform: translateX(-50%) scaleX(1);
}

.menu-item .icon {
  font-size: 16px;
  display: flex;
  align-items: center;
}

.menu-item .label {
  font-weight: 500;
}
</style>
