<template>
  <div class="input-section">
    <div class="section-header">
      <span class="section-icon">{{ icon }}</span>
      <h4 class="section-title">{{ title }}</h4>
    </div>
    <div class="section-body">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  icon: String
})
</script>

<style scoped>
.input-section {
  margin-bottom: 14px;
  padding: 12px;
  background: rgba(10, 30, 60, 0.4);
  border-radius: 8px;
  border: 1px solid rgba(58, 123, 213, 0.2);
  transition: all 0.2s ease;
}

.input-section:hover {
  border-color: rgba(58, 123, 213, 0.4);
  box-shadow: 0 0 8px rgba(58, 123, 213, 0.15);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.section-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #4A90D9;
  flex: 1;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
