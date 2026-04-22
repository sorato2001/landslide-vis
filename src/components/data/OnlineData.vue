<template>
  <InputSection title="在线数据" icon="🌐">
    <div class="online-data">
      <div
        class="data-category"
        v-for="cat in categories"
        :key="cat.name"
      >
        <div class="category-label" @click="toggleCategory(cat.name)">
          <span class="category-dot" :style="{ background: cat.color }"></span>
          <span class="category-name">{{ cat.name }}</span>
          <span class="category-arrow" :class="{ open: openCategories[cat.name] }">▼</span>
        </div>
        <div class="category-links" v-show="openCategories[cat.name]">
          <div
            v-for="link in cat.links"
            :key="link.name"
            class="data-link"
            @click="openUrl(link)"
          >
            <span class="link-icon">🔗</span>
            <span class="link-name">{{ link.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </InputSection>
</template>

<script setup>
import { reactive } from 'vue'
import InputSection from './InputSection.vue'

const emit = defineEmits(['openUrl'])

const categories = [
  {
    name: '高程数据',
    color: '#4A90D9',
    links: [
      { name: 'AW3D30 DEM', url: 'https://portal.opentopography.org/raster?opentopoID=OTALOS.112016.4326.2' },
      { name: 'SRTM', url: 'https://glovis.usgs.gov/app' },
      { name: 'ASTER GDEM', url: 'https://asterweb.jpl.nasa.gov/gdem.asp' },
      { name: 'TanDEM-X DEM', url: 'https://data.europa.eu/data/datasets/5eecdf4c-de57-4624-99e9-60086b032aea?locale=en' },
    ],
  },
  {
    name: '土壤类型',
    color: '#F5A623',
    links: [
      { name: 'CAS', url: 'https://www.resdc.cn/data.aspx?DATAID=145' },
      { name: 'ISRIC - SoilGrids', url: 'https://soilgrids.org' },
      { name: 'FAO', url: 'https://www.fao.org/soils-portal/data-hub/soil-maps-and-databases/faounesco-soil-map-of-the-world/en/' },
    ],
  },
  {
    name: '断层',
    color: '#E74C3C',
    links: [
      { name: 'CN-faults', url: 'https://github.com/gmt-china/china-geospatial-data/releases' },
      { name: 'USGS Quaternary Fault', url: 'https://www.usgs.gov/programs/earthquake-hazards/faults' },
    ],
  },
  {
    name: '道路',
    color: '#2ECC71',
    links: [
      { name: 'OSM', url: 'https://www.openstreetmap.org' },
      { name: 'Line Shapefiles', url: 'https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html' },
    ],
  },
  {
    name: '水系',
    color: '#3498DB',
    links: [
      { name: '中国水系数据集', url: 'https://www.geodata.cn/data/datadetails.html?dataguid=21449321754982&docId=4777' },
      { name: 'HydroSHEDS', url: 'https://www.hydrosheds.org/hydrosheds-core-downloads' },
    ],
  },
  {
    name: '地层岩性',
    color: '#9B59B6',
    links: [
      { name: '中国地层岩性分布', url: 'http://www.gisrs.cn/shopdata?id=489a0052-6607-477a-949e-a3128341e186' },
    ],
  },
]

const openCategories = reactive(
  categories.reduce((acc, cat) => {
    acc[cat.name] = true
    return acc
  }, {})
)

const toggleCategory = (name) => {
  openCategories[name] = !openCategories[name]
}

const openUrl = (link) => {
  emit('openUrl', { name: link.name, url: link.url })
}
</script>

<style scoped>
.online-data {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.data-category {
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 20, 50, 0.4);
  border: 1px solid rgba(58, 123, 213, 0.15);
  transition: border-color 0.2s;
}

.data-category:hover {
  border-color: rgba(58, 123, 213, 0.35);
}

.category-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.category-label:hover {
  background: rgba(58, 123, 213, 0.1);
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.category-name {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: #E0E8F0;
}

.category-arrow {
  font-size: 10px;
  color: #8BA4C0;
  transition: transform 0.25s ease;
  transform: rotate(-90deg);
}

.category-arrow.open {
  transform: rotate(0deg);
}

.category-links {
  padding: 2px 8px 8px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  color: #C0D4EC;
  font-size: 15px;
  border-radius: 4px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid transparent;
  cursor: pointer;
}

.data-link:hover {
  background: rgba(58, 123, 213, 0.15);
  border-color: rgba(58, 123, 213, 0.3);
  color: #00d4ff;
  transform: translateX(2px);
}

.link-icon {
  font-size: 12px;
  flex-shrink: 0;
  opacity: 0.6;
}

.data-link:hover .link-icon {
  opacity: 1;
}

.link-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
