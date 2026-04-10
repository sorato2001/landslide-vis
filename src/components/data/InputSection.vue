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
  background: #f8fafe;
  border-radius: 8px;
  border: 1px solid #dde5f0;
  transition: all 0.2s ease;
}

.input-section:hover {
  border-color: #2A5298;
  box-shadow: 0 2px 8px rgba(42, 82, 152, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.section-icon {
  font-size: 16px;
  display: flex;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2A5298;
  flex: 1;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
