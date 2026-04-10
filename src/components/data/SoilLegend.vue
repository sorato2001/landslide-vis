<template>
  <div v-if="dlList.length" class="legend">
    <h4>土壤类型图例</h4>

    <div v-for="dl in sorted" :key="dl" class="item">
      <span
        class="color"
        :style="{ background: getSoilColor(dl).toCssColorString() }"
      />
      {{ dl }} - {{ soilTypes[dl] }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { soilTypes, getSoilColor } from '../../cesium/soilLoader'

const props = defineProps({
  dlList: { type: Array, default: () => [] }
})

const sorted = computed(() =>
  [...props.dlList].sort((a, b) => Number(a) - Number(b))
)
</script>

<style scoped>
.legend {
  margin-top: 10px;
}
.legend h4 {
  font-size: 13px;
  color: #2A5298;
  margin: 0 0 6px 0;
}
.item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #333;
}
.color {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 1px solid #999;
  border-radius: 2px;
}
</style>
