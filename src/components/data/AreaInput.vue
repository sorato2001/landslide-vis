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
  color: #888;
  margin: 0 0 8px 0;
}

.disabled-btn {
  width: 100%;
  padding: 8px 14px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #999;
  font-size: 13px;
  cursor: not-allowed;
}
</style>
