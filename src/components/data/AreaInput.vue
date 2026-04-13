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
  font-size: 14px;
  color: #8BA4C0;
  margin: 0 0 8px 0;
}

.disabled-btn {
  width: 100%;
  padding: 8px 14px;
  background: rgba(10, 22, 40, 0.4);
  border: 1px solid rgba(58, 123, 213, 0.2);
  border-radius: 6px;
  color: #5A7A9E;
  font-size: 15px;
  cursor: not-allowed;
}
</style>
