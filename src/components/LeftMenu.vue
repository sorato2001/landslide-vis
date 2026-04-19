<template>
  <nav class="tab-nav">
    <button 
      class="tab-btn" 
      :class="{ active: activeTab === 'data' }"
      @click="handleClick('data')"
    >
      图谱查询
    </button>
    <span class="nav-sep">◇</span>
    <button 
      class="tab-btn"
      :class="{ active: activeTab === 'input' }"
      @click="handleClick('input')"
    >
      数据录入
    </button>
    <span class="nav-sep">◇</span>
    <button 
      class="tab-btn"
      :class="{ active: activeTab === 'model' }"
      @click="handleClick('model')"
    >
      模型集成
    </button>
    <span class="nav-sep">◇</span>
    <button 
      class="tab-btn" 
      :class="{ active: activeTab === 'decision' }"
      @click="handleClick('decision')"
    >
      智能决策
    </button>
  </nav>
</template>

<script setup>
const props = defineProps({
  activeTab: String
})
const emit = defineEmits(['show'])

const handleClick = (tab) => {
  emit('show', props.activeTab === tab ? null : tab)
}
</script>

<style scoped>
.tab-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
}

.tab-btn {
  padding: 6px 30px; 
  font-size: 20px; 
  font-weight: 700;
  color: #80b8d4; 
  /* color: #fff; */
  cursor: pointer;
  border-radius: 3px; 
  border: 1px solid transparent;
  transition: all 0.2s; 
  position: relative;
  letter-spacing: 2px; 
  white-space: nowrap;
  background-color: transparent;
}

.tab-btn:hover {
  color: #fff; 
  border-color: rgba(0,212,255,0.3);
  background: rgba(0,212,255,0.06);
}

.tab-btn.active {
  color: #fff;
  background: linear-gradient(180deg, rgba(0,120,255,0.3), rgba(0,60,180,0.2));
  border-color: rgba(0,212,255,0.5);
  box-shadow: 0 0 12px rgba(0,150,255,0.2), inset 0 1px 0 rgba(255,255,255,0.08);
  text-shadow: 0 0 10px rgba(0,212,255,0.8);
}

.tab-btn.active::after {
  content: ''; 
  position: absolute; 
  bottom: -1px; 
  left: 20%; 
  right: 20%;
  height: 2px; 
  background: #00d4ff; 
  box-shadow: 0 0 8px #00d4ff;
}

.nav-sep { 
  color: #00d4ff; 
  font-size: 16px; 
  user-select: none; 
}
</style>
