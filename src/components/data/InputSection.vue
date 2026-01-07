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
  background: rgba(102, 126, 234, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.input-section:hover {
  background: rgba(102, 126, 234, 0.05);
  border-color: rgba(102, 126, 234, 0.2);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
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
  color: #333;
  flex: 1;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
