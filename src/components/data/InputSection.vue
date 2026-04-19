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
/* .input-section {
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
} */

.input-section {
  margin-bottom: 14px;
  background: rgba(0, 20, 50, 0.6);
  border: 2px solid rgba(0, 179, 255, 0.342);
  border-radius: 8px;
  padding: 14px;
  position: relative;
  overflow: hidden;
  animation: fadein 0.5s ease both;
  transition: border-color 0.2s;
}

.input-section:hover {
  border-color: rgba(0, 179, 255, 0.685);
}

.input-section:nth-child(1) { animation-delay: 0.05s; }
.input-section:nth-child(2) { animation-delay: 0.12s; }
.input-section:nth-child(3) { animation-delay: 0.20s; }
.input-section:nth-child(4) { animation-delay: 0.28s; }

.input-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
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
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
