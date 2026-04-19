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
  background: rgba(6, 35, 85, 0.6);
  border: 1px solid rgba(63, 127, 218, 0.849);
  border-radius: 15px;
  padding: 12px;
}
.legend h4 {
  font-size: 15px;
  color: #fff;
  margin: 0 0 6px 0;
}
.item {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #fff;
  gap: 6px;
  margin-bottom: 2px;
}
.color {
  width: 14px;
  height: 14px;
  margin-right: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
