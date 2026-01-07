<template>
  <div id="cesiumContainer"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { initCesium } from '../cesium/viewer'

onMounted(() => {
  initCesium('cesiumContainer')
})
</script>

<style scoped>
#cesiumContainer {
  position: absolute;
  inset: 0;
  z-index: 0;   /* 地图在最底层 */
}
</style>
