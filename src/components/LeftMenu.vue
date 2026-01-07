<template>
  <div class="left-menu">
    <div class="menu-title">
      <span class="icon">⚙️</span>
      <span>功能菜单</span>
    </div>
    <button 
      class="menu-item" 
      :class="{ active: activeTab === 'data' }"
      @click="handleClick('data')"
    >
      <span class="icon">📊</span>
      <span class="label">数据录入</span>
      <span class="arrow">›</span>
    </button>
    <button 
      class="menu-item"
      :class="{ active: activeTab === 'model' }"
      @click="handleClick('model')"
    >
      <span class="icon">🤖</span>
      <span class="label">模型集成</span>
      <span class="arrow">›</span>
    </button>
    <button 
      class="menu-item" 
      :class="{ active: activeTab === 'decision' }"
      @click="handleClick('decision')"
    >
      <span class="icon">📈</span>
      <span class="label">决策评估</span>
      <span class="arrow">›</span>
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
.left-menu {
  position: absolute;
  top: 7%;
  left: 1%;
  z-index: 10;
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 200px;
}

.menu-title {
  padding: 12px 16px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 4px;
}

.menu-title .icon {
  font-size: 18px;
}

.menu-item {
  width: 100%;
  padding: 12px 16px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.menu-item:hover::before {
  transform: scaleY(1);
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  border-color: rgba(102, 126, 234, 0.5);
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.menu-item.active::before {
  transform: scaleY(1);
}

.menu-item .icon {
  font-size: 20px;
  display: flex;
  align-items: center;
}

.menu-item .label {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.menu-item .arrow {
  opacity: 0.5;
  transition: all 0.3s ease;
  font-size: 18px;
}

.menu-item:hover .arrow,
.menu-item.active .arrow {
  opacity: 1;
  transform: translateX(4px);
}
</style>
