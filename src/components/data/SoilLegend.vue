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
.item {
  display: flex;
  align-items: center;
  font-size: 12px;
}
.color {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 1px solid #333;
}
</style>
