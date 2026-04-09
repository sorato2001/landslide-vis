<template>
  <InputSection title="区域范围" icon="🗺️">
    <p class="hint">
      区域范围将与第三核心部分联动，此处暂不实装。
    </p>
    <button class="disabled-btn" disabled>绘制区域</button>
  </InputSection>
</template>

<script setup>
import InputSection from './InputSection.vue'
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: #aaa;
  margin: 0 0 10px 0;
}

.disabled-btn {
  width: 100%;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #666;
  font-size: 14px;
  cursor: not-allowed;
}
</style>
