<template>
  <section class="section">
    <h4>土壤 SHP</h4>

    <input type="file" accept=".zip" @change="onFileChange" />

    <div v-if="loaded">
      <label>
        <input type="checkbox" v-model="visible" @change="toggle" />
        显示土壤图层
      </label>

      <div style="margin-top:8px;">
        透明度：
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          v-model.number="opacity"
          @input="changeOpacity"
        />
        {{ opacity }}
      </div>
    </div>

    <SoilLegend :dl-list="dlList" />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import {
  loadSoilShp,
  setSoilVisible,
  setSoilOpacity
} from '../../cesium/soilLoader'
import SoilLegend from './SoilLegend.vue'

const dlList = ref([])
const loaded = ref(false)
const visible = ref(true)
const opacity = ref(0.7)

async function onFileChange(e) {
  dlList.value = await loadSoilShp(e.target.files)
  loaded.value = true
  visible.value = true
  setSoilOpacity(opacity.value)
}

function toggle() {
  setSoilVisible(visible.value)
}

function changeOpacity() {
  setSoilOpacity(opacity.value)
}
</script>


<style scoped>
.section { margin-bottom: 10px; }
.hint { font-size: 12px; color: #777; }

</style>
