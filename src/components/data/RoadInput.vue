<template>
  <section class="section">
    <h4>道路数据</h4>

    <input type="file" accept=".zip" @change="onChange" />

    <label v-if="loaded">
      <input type="checkbox" v-model="visible" @change="toggle" />
      显示道路
    </label>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { loadRoadZip, setRoadVisible } from '../../cesium/roadLoader'

const loaded = ref(false)
const visible = ref(true)

async function onChange(e) {
  await loadRoadZip(e.target.files)
  loaded.value = true
}

function toggle() {
  setRoadVisible(visible.value)
}
</script>

<style scoped>
.section { margin-bottom: 10px; }
</style>
