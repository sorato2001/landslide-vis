<template>
  <div class="mini-map-panel" :class="{ expanded: isExpanded }">
    <!-- 面板头部 -->
    <div class="panel-header" @click="toggleExpand">
      <span class="header-icon">🗺️</span>
      <span class="header-title">图谱地图</span>
      <span class="expand-icon">{{ isExpanded ? '▼' : '▲' }}</span>
    </div>

    <!-- 筛选器区域 -->
    <div class="filter-area" v-show="isExpanded">
      <div class="filter-row">
        <label>区域:</label>
        <input v-model="filters.region" @input="applyFilters" placeholder="筛选地区" />
      </div>
      <div class="filter-row">
        <label>因子:</label>
        <input v-model="filters.factor" @input="applyFilters" placeholder="筛选因子" />
      </div>
      <div class="filter-row">
        <label>方法:</label>
        <input v-model="filters.method" @input="applyFilters" placeholder="筛选方法" />
      </div>
    </div>

    <!-- MapLibre 小地图 -->
    <div id="mini-map" ref="miniMapContainer" v-show="isExpanded"></div>

    <!-- 图谱容器 -->
    <div id="mini-graph" v-show="isExpanded && graphVisible"></div>

    <!-- 图谱控制按钮 -->
    <button class="graph-toggle-btn" @click="toggleGraph" v-show="isExpanded">
      {{ graphVisible ? '隐藏图谱' : '显示图谱' }}
    </button>

    <!-- 属性弹窗 -->
    <div class="property-popup" ref="propertyPopup" v-show="isExpanded && popupVisible">
      <div class="popup-header">
        <span>滑坡信息</span>
        <button class="popup-close" @click="popupVisible = false">&times;</button>
      </div>
      <div class="popup-content" v-html="popupContent"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import ForceGraph from 'force-graph'
import * as d3 from 'd3'
import neo4j from 'neo4j-driver'
import {
  loadLandslidePointsInCesium,
  filterCesiumPoints,
  highlightAndFlyToCesiumPoint,
} from '../cesium/miniMapLink'

const miniMapContainer = ref(null)
const propertyPopup = ref(null)
const isExpanded = ref(true)
const graphVisible = ref(false)
const popupVisible = ref(false)
const popupContent = ref('')

const filters = ref({
  region: '',
  factor: '',
  method: '',
})

let map = null
let graph = null
let layerIDs = []
let selectedId = null
let geoJsonData = null

const maptilerKey = 'ycORim2UMOdY1xFgUl1e'

const colorNameToHex = {
  MOD: '#058D49',
  PaperID: '#C76170',
  INF: '#2579E8',
  Coordinate: '#ED7D31',
  Title: '#ED7D31',
}

const getNodeColor = (labels) => {
  if (labels.includes('INF')) return '#2579E8'
  if (labels.includes('MOD')) return '#058D49'
  if (labels.includes('FAC')) return '#F1A537'
  if (labels.includes('DAT')) return 'purple'
  if (labels.includes('PaperID')) return '#C76170'
  if (labels.includes('Title')) return '#D8929C'
  if (labels.includes('Coordinate')) return '#7FAEE1'
  return 'gray'
}

// ============ 图谱相关 ============
const highlightNodes = new Set()
let hoverNode = null

const getCypherResult = async (limit_items = 100, name = null) => {
  try {
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', '21151211')
    )
    const session = driver.session()

    try {
      let query
      if (name == null) {
        query = `
          MATCH (n)-[r:use_of]->(m)
          RETURN n, r, m
          LIMIT $limit
        `
      } else {
        query = `
          MATCH (n:INF)
          WHERE n.loc = $name
          OPTIONAL MATCH (n)-[r_fac]-(fac:FAC)
          OPTIONAL MATCH (n)-[r_mod]-(mod:MOD)
          OPTIONAL MATCH (n)-[r_coord]-(coord:Coordinate)
          OPTIONAL MATCH (n)-[r_paper]-(paper:PaperID)
          OPTIONAL MATCH (paper)-[r_title]-(title:Title)
          OPTIONAL MATCH (paper)-[r_link]-(link:Link)
          OPTIONAL MATCH (paper)-[r_dat]-(dat:DAT)
          OPTIONAL MATCH (fac)-[r_fac_dat]-(dat)
          OPTIONAL MATCH (mod)-[r_mod_dat]-(dat)
          RETURN n, r_fac, fac, r_mod, mod, r_coord, coord, r_paper, paper, r_title, title, r_link, link, r_dat, dat, r_fac_dat, r_mod_dat
        `
      }

      const result = await session.run(query, {
        name: name,
        limit: neo4j.int(limit_items),
      })

      const nodes = new Map()
      const links = []

      result.records.forEach((record) => {
        for (const key of record.keys) {
          const item = record.get(key)
          if (!item || !item.identity) continue

          if (item.labels) {
            const nodeId = item.identity.toNumber()
            if (!nodes.has(nodeId)) {
              nodes.set(nodeId, {
                id: nodeId,
                elementId: item.elementId,
                labels: item.labels,
                name:
                  item.properties?.loc ||
                  item.properties?.content ||
                  item.properties?.value ||
                  item.properties?.text ||
                  item.properties?.url ||
                  item.properties?.id,
                properties: item.properties,
                color: getNodeColor(item.labels),
              })
            }
          } else if (item.type) {
            links.push({
              source: item.start.toNumber(),
              target: item.end.toNumber(),
              id: item.identity.toNumber(),
              properties: item.type,
            })
          }
        }
      })

      const graphData = {
        nodes: Array.from(nodes.values()),
        links,
      }

      loadGraph(graphData)
    } finally {
      await Promise.all([session.close(), driver.close()])
    }
  } catch (error) {
    console.warn('Neo4j连接失败，图谱功能不可用:', error.message)
  }
}

const loadGraph = (data) => {
  const el = document.getElementById('mini-graph')
  if (!el) return

  graphVisible.value = true

  const width = el.clientWidth || 400
  const height = el.clientHeight || 300

  if (graph) {
    graph.graphData(data)
    return
  }

  graph = ForceGraph()(el)
    .graphData(data)
    .width(width)
    .height(height)
    .nodeLabel('name')
    .nodeColor((node) =>
      highlightNodes.has(node)
        ? node === hoverNode
          ? 'rgb(255,0,0,1)'
          : 'rgba(255,160,0,0.8)'
        : node.color
    )
    .nodeCanvasObject((node, ctx, globalScale) => {
      const label = node.name || ''
      const radius = 12
      const paddingRatio = 0.85
      const maxTextWidth = radius * 2 * paddingRatio

      let fontSize = Math.min((radius * globalScale) / 10, 20)
      fontSize = Math.max(fontSize, 4)

      // 绘制节点圆
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = node.color || 'rgba(100, 150, 255, 0.8)'
      ctx.fill()
      ctx.strokeStyle = highlightNodes.has(node)
        ? 'rgba(255, 0, 0, 0.9)'
        : 'rgba(0, 0, 0, 0.2)'
      ctx.lineWidth = highlightNodes.has(node) ? 2 : 1
      ctx.stroke()

      // 绘制文字
      ctx.save()
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.clip()
      ctx.font = `${fontSize}px Times New Roman`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const getContrastColor = (inputColor) => {
        if (!inputColor) return '#000000'
        let hex = colorNameToHex[inputColor.trim().toLowerCase()] || inputColor
        if (!hex.startsWith('#')) hex = `#${hex}`
        if (hex.length === 4)
          hex =
            '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        return brightness > 128 ? '#000000' : '#FFFFFF'
      }
      ctx.fillStyle = getContrastColor(node.color)

      let displayText = label
      const textWidth = ctx.measureText(displayText).width
      if (textWidth > maxTextWidth) {
        while (
          displayText.length > 0 &&
          ctx.measureText(displayText + '...').width > maxTextWidth
        ) {
          displayText = displayText.slice(0, -1)
        }
        displayText += '...'
      }
      ctx.fillText(displayText, node.x, node.y)
      ctx.restore()
    })
    .nodeCanvasObjectMode(() => 'after')
    .linkCanvasObjectMode(() => 'after')
    .linkCanvasObject((link, ctx) => {
      const MAX_FONT_SIZE = 4
      const LABEL_NODE_MARGIN = graph.nodeRelSize() * 1.5
      const start = link.source
      const end = link.target
      if (typeof start !== 'object' || typeof end !== 'object') return

      const textPos = Object.assign(
        ...['x', 'y'].map((c) => ({
          [c]: start[c] + (end[c] - start[c]) / 2,
        }))
      )

      const relLink = { x: end.x - start.x, y: end.y - start.y }
      const maxTextLength =
        Math.sqrt(Math.pow(relLink.x, 2) + Math.pow(relLink.y, 2)) -
        LABEL_NODE_MARGIN * 2

      let textAngle = Math.atan2(relLink.y, relLink.x)
      if (textAngle > Math.PI / 2) textAngle = -(Math.PI - textAngle)
      if (textAngle < -Math.PI / 2) textAngle = -(-Math.PI - textAngle)

      const label = `${link.properties}`
      ctx.font = '1px Times New Roman'
      const fontSize = Math.min(
        MAX_FONT_SIZE,
        maxTextLength / ctx.measureText(label).width
      )
      ctx.font = `${fontSize}px Times New Roman`

      ctx.save()
      ctx.translate(textPos.x, textPos.y)
      ctx.rotate(textAngle)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#515353'
      ctx.fillText(label, 0, 0)
      ctx.restore()
    })
    .linkWidth(5)
    .onNodeRightClick(async (node) => {
      highlightNodes.clear()
      if (node) {
        highlightNodes.add(node)
      }
      hoverNode = node || null
      updateHighlight()
      graph.centerAt(node.x, node.y, 1000)
      graph.zoom(4.5, 200)
    })

  const nodeCount = data.nodes.length
  graph.d3Force(
    'charge',
    d3.forceManyBody().strength(-Math.max(300, nodeCount))
  )
  graph
    .d3Force('link')
    .distance(() => 20)
    .strength(0.105)
  graph.d3Force(
    'collision',
    d3
      .forceCollide()
      .radius((node) => {
        return node.value ? Math.sqrt(node.size) * 3 : 20
      })
      .strength(0.5)
  )
  graph.d3Force('center', d3.forceCenter(0, 0, 0))
}

function updateHighlight() {
  graph
    .nodeColor(graph.nodeColor())
    .linkWidth(graph.linkWidth())
    .linkDirectionalParticles(graph.linkDirectionalParticles())
}

const toggleGraph = () => {
  graphVisible.value = !graphVisible.value
  if (graphVisible.value && graph) {
    nextTick(() => {
      graph.zoom(4.5, 200)
      resizeGraph()
    })
  }
}

const resizeGraph = () => {
  const el = document.getElementById('mini-graph')
  if (!el || !graph) return
  graph.width(el.clientWidth)
  graph.height(el.clientHeight)
}

// ============ 小地图 ============
const initMiniMap = () => {
  map = new maplibregl.Map({
    container: miniMapContainer.value,
    style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${maptilerKey}`,
    center: [9, 0],
    zoom: 1.5,
    attributionControl: false,
  })

  map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right')

  map.on('load', async () => {
    // 添加滑坡数据源
    map.addSource('landslide', {
      type: 'geojson',
      data: './sun/output1.geojson',
    })

    // 添加高亮源
    map.addSource('highlight-point', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    })

    // 高亮图层
    map.addLayer({
      id: 'highlight-point',
      type: 'circle',
      source: 'highlight-point',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 5, 10, 20, 40],
        'circle-color': '#00ff00',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    })

    // 加载GeoJSON并创建图层
    try {
      const response = await fetch('./sun/output1.geojson')
      if (!response.ok) throw new Error('GeoJSON文件加载失败')
      geoJsonData = await response.json()

      console.log(`小地图加载 ${geoJsonData.features.length} 个滑坡点`)

      // 同时在 Cesium 中加载滑坡点
      await loadLandslidePointsInCesium('./sun/output1.geojson')

      geoJsonData.features.forEach((feature) => {
        const symbol = feature.properties['LOC']
        const layerID = `poi-${symbol}`

        if (!map.getLayer(layerID)) {
          map.addLayer({
            id: layerID,
            type: 'circle',
            source: 'landslide',
            paint: {
              'circle-color': '#ff0000',
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                3,
                3,
                5,
                5,
                7,
                8,
              ],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0,
                0.1,
                3,
                1,
                5,
                2,
              ],
            },
            filter: ['==', 'LOC', symbol],
          })
          layerIDs.push(layerID)
        }

        // 点击事件 - 关键：联动 Cesium
        map.on('click', layerID, (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0]
            const loc = feature.properties.LOC
            const coordinates = feature.geometry.coordinates.slice()

            // 高亮小地图上的点
            if (selectedId) {
              map.setPaintProperty(selectedId, 'circle-color', '#ff0000')
            }
            map.setPaintProperty(layerID, 'circle-color', 'rgb(255, 153, 0)')
            selectedId = layerID

            // 小地图飞行
            map.flyTo({
              center: coordinates,
              zoom: 8,
              essential: true,
            })

            // ★ 关键：联动 Cesium 高亮并飞行 ★
            highlightAndFlyToCesiumPoint(coordinates[0], coordinates[1], loc)

            // 查询图谱
            getCypherResult(100, loc)

            // 显示属性弹窗
            showPropertyPopup(feature.properties)
          }
        })
      })
    } catch (error) {
      console.warn('加载GeoJSON数据失败:', error.message)
    }
  })
}

// ============ 筛选 ============
const applyFilters = () => {
  if (!map || layerIDs.length === 0) return

  const regionVal = filters.value.region.trim().toLowerCase()
  const searchWords = regionVal.split(/\s+/).filter((w) => w)

  layerIDs.forEach((layerID) => {
    const lowerLayerID = layerID.toLowerCase()
    if (searchWords.length === 0) {
      map.setLayoutProperty(layerID, 'visibility', 'visible')
    } else {
      const matches = searchWords.some((word) => lowerLayerID.includes(word))
      map.setLayoutProperty(layerID, 'visibility', matches ? 'visible' : 'none')
    }
  })

  // 同步筛选到 Cesium
  filterCesiumPoints(regionVal, [])
}

// ============ 属性弹窗 ============
const showPropertyPopup = (properties) => {
  const rows = Object.entries(properties)
    .map(
      ([key, value]) =>
        `<div class="prop-row"><span class="prop-key">${key}</span><span class="prop-val">${value}</span></div>`
    )
    .join('')
  popupContent.value = rows
  popupVisible.value = true
}

// ============ 面板控制 ============
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value && map) {
    nextTick(() => {
      map.resize()
      resizeGraph()
    })
  }
}

// ============ 生命周期 ============
onMounted(() => {
  nextTick(() => {
    initMiniMap()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (map) map.remove()
  window.removeEventListener('resize', handleResize)
})

const handleResize = () => {
  if (map) map.resize()
  resizeGraph()
}
</script>

<style scoped>
.mini-map-panel {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 20;
  width: 520px;
  background: rgba(15, 15, 25, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: all 0.3s ease;
}

.mini-map-panel.expanded {
  height: 640px;
}

.mini-map-panel:not(.expanded) {
  height: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  user-select: none;
  transition: background 0.2s;
}

.panel-header:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.5), rgba(118, 75, 162, 0.5));
}

.header-icon {
  font-size: 18px;
  margin-right: 8px;
}

.header-title {
  flex: 1;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.expand-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

/* 筛选器 */
.filter-area {
  display: flex;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.filter-row label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  white-space: nowrap;
}

.filter-row input {
  width: 100%;
  padding: 4px 8px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #fff;
  outline: none;
}

.filter-row input:focus {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(255, 255, 255, 0.15);
}

.filter-row input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* 小地图 */
#mini-map {
  width: 100%;
  height: 360px;
  position: relative;
}

/* 图谱 */
#mini-graph {
  width: 100%;
  height: 240px;
  position: relative;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* 图谱切换按钮 */
.graph-toggle-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 12px;
  font-size: 11px;
  background: rgba(102, 126, 234, 0.6);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  z-index: 5;
  transition: all 0.2s;
}

.graph-toggle-btn:hover {
  background: rgba(102, 126, 234, 0.8);
}

/* 属性弹窗 */
.property-popup {
  position: absolute;
  top: 50px;
  left: 8px;
  right: 8px;
  max-height: 180px;
  background: rgba(30, 30, 40, 0.95);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 10;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(102, 126, 234, 0.3);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.popup-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}

.popup-close:hover {
  color: #fff;
}

.popup-content {
  padding: 8px 12px;
  max-height: 130px;
  overflow-y: auto;
  color: #e0e0e0;
  font-size: 12px;
}

.prop-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.prop-key {
  font-weight: 600;
  color: rgba(102, 126, 234, 0.9);
  margin-right: 12px;
}

.prop-val {
  color: #ccc;
}
</style>
