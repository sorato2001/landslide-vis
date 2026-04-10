<template>
  <nav class="tab-nav">
    <button 
      class="tab-btn" 
      :class="{ active: activeTab === 'data' }"
      @click="handleClick('data')"
    >
      图谱查询
    </button>
    <button 
      class="tab-btn"
      :class="{ active: activeTab === 'model' }"
      @click="handleClick('model')"
    >
      模型集成
    </button>
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
  gap: 6px;
}

.tab-btn {
  padding: 6px 22px;
  font-size: 14px;
  font-weight: 500;
  border: 2px solid #2A5298;
  border-radius: 6px;
  background: #e8eef6;
  color: #2A5298;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: #d0dced;
}

.tab-btn.active {
  background: #2A5298;
  color: #fff;
  border-color: #2A5298;
}
</style>
