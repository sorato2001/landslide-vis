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
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: all 0.3s ease;
}

.input-section:hover {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(102, 126, 234, 0.25);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #e0e0e0;
  flex: 1;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
