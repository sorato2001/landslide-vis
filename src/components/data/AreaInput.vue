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
  font-size: 17px;
  color: #fff;
  margin: 0 0 8px 0;
}

.disabled-btn {
  width: 100%;
  padding: 8px 14px;
  background: rgba(6, 35, 85, 0.6);
  border: 1px solid rgba(63, 127, 218, 0.849);
  border-radius: 15px;
  color: #fff;
  font-size: 17px;
  cursor: not-allowed;
}
</style>
