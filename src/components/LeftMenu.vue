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
      :class="{ active: activeTab === 'input' }"
      @click="handleClick('input')"
    >
      数据录入
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
  gap: 4px;
}

.tab-btn {
  padding: 8px 24px;
  font-size: 18px;
  font-weight: 500;
  border: 1px solid rgba(58, 123, 213, 0.4);
  border-radius: 6px;
  background: rgba(58, 123, 213, 0.1);
  color: #8BA4C0;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  background: rgba(58, 123, 213, 0.25);
  color: #C0D4EC;
  border-color: rgba(58, 123, 213, 0.6);
}

.tab-btn.active {
  background: linear-gradient(135deg, #1A3A6B, #3A7BD5);
  color: #fff;
  border-color: #3A7BD5;
  box-shadow: 0 0 12px rgba(58, 123, 213, 0.4);
}
</style>
