<template>
  <div class="maplibre-container">
    <!-- 标题 -->
    <header>
      <h1>Landslide Hazard Assessment Knowledge Recommendation System</h1>
    </header>

    <!-- 主地图 -->
    <div id="map" ref="mapContainer"></div>

    <!-- 小地图 -->
    <div id="map2" ref="map2Container"></div>

    <!-- 图谱容器 -->
    <div id="3dgraph" ref="graphContainer" :style="{ display: graphVisible ? 'block' : 'none' }"></div>

    <!-- 属性窗口 -->
    <div id="propertyWindow" ref="propertyWindow"></div>

    <!-- 图谱控制按钮 -->
    <button id="graphControl" @click="toggleGraph">G</button>

    <!-- 过滤器 -->
    <div class="filter-ctrl" id="filter1">
      <p>Study Region:</p>
      <input type="text" placeholder="Filter by name" @input="handleFilter" />
    </div>
    <div class="filter-ctrl" id="filter2">
      <p>Key Factor:</p>
      <input type="text" placeholder="Filter by name" />
    </div>
    <div class="filter-ctrl" id="filter3">
      <p>Method category:</p>
      <input type="text" placeholder="Filter by name" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import ForceGraph from 'force-graph'
import * as d3 from 'd3'
import neo4j from 'neo4j-driver'

const mapContainer = ref(null)
const map2Container = ref(null)
const graphContainer = ref(null)
const propertyWindow = ref(null)
const graphVisible = ref(false)

let map1 = null
let map2 = null
let graph = null
let layerIDs = []
let selectedId = null

const maptilerKey = 'ycORim2UMOdY1xFgUl1e'

const colorNameToHex = {
  MOD: '#058D49',
  PaperID: '#C76170',
  INF: '#2579E8',
  Coordinate: '#ED7D31',
  Title: '#ED7D31',
}

// 切换图谱显示
const toggleGraph = () => {
  graphVisible.value = !graphVisible.value
  if (graphVisible.value && graph) {
    graph.zoom(4.5, 200)
  }
}

// 获取节点颜色
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

// 从Neo4j读取图谱数据
const getCypherResult = async (limit_items = 100, name = null) => {
  try {
    const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', '21151211'))
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

      const result = await session.run(query, { name: name, limit: neo4j.int(limit_items) })
      
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
                name: item.properties?.loc || item.properties?.content || item.properties?.value || item.properties?.text || item.properties?.url || item.properties?.id,
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
    console.warn('Neo4j连接失败，图谱功能将不可用:', error.message)
    // 加载空图谱数据，避免组件崩溃
    loadGraph({ nodes: [], links: [] })
  }
}

// 加载图谱
const loadGraph = (data) => {
  const container = graphContainer.value
  if (!container) return

  const { clientWidth, clientHeight } = container

  graph = ForceGraph()(container)
    .graphData(data)
    .width(clientWidth)
    .height(clientHeight)
    .nodeLabel('name')
    .nodeColor((node) => node.color)
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
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()

      // 绘制文字
      ctx.save()
      ctx.font = `${fontSize}px Times New Roman`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#FFFFFF'

      let displayText = label
      let textWidth = ctx.measureText(displayText).width
      if (textWidth > maxTextWidth) {
        while (displayText.length > 0 && ctx.measureText(displayText + '...').width > maxTextWidth) {
          displayText = displayText.slice(0, -1)
        }
        displayText += '...'
      }

      ctx.fillText(displayText, node.x, node.y)
      ctx.restore()
    })
    .nodeCanvasObjectMode(() => 'after')
    .linkWidth(5)
    .onNodeRightClick(async (node) => {
      graph.centerAt(node.x, node.y, 1000)
      graph.zoom(4.5, 200)
    })

  // 配置力导向布局
  const nodeCount = data.nodes.length
  graph.d3Force('charge', d3.forceManyBody().strength(-Math.max(300, nodeCount)))
  graph.d3Force('link').distance(() => 20).strength(0.105)
  graph.d3Force('collision', d3.forceCollide().radius(12).strength(0.5))
  graph.d3Force('center', d3.forceCenter(0, 0))
}

// 初始化地图
const initMaps = () => {
  // 小地图
  map2 = new maplibregl.Map({
    container: map2Container.value,
    style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${maptilerKey}`,
    center: [9, 0],
    zoom: -0.74,
  })

  map2.on('load', () => {
    map2.addSource('landslide', {
      type: 'geojson',
      data: './sun/output1.geojson',
    })

    map2.addLayer({
      id: 'landslide',
      type: 'circle',
      source: 'landslide',
      paint: {
        'circle-color': '#ff0000',
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 0, 1, 2, 3, 3, 4, 4, 6, 5, 8],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, 0.1, 2, 0.5, 3, 1, 4, 2, 5, 3],
      },
    })
  })

  // 主地图
  map1 = new maplibregl.Map({
    container: mapContainer.value,
    center: [9, 0],
    zoom: 1.9,
    style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${maptilerKey}`,
  })

  map1.on('load', async () => {
    map1.addSource('landslide', {
      type: 'geojson',
      data: './sun/output1.geojson',
    })

    // 尝试加载自定义图标（可选，失败不影响主要功能）
    try {
      const image = await map1.loadImage('./svg/LOC.png')
      map1.addImage('custom-marker', image.data)
    } catch (error) {
      console.warn('自定义图标加载失败，将使用默认圆点标记:', error.message)
    }

    // 加载GeoJSON并创建图层
    fetch('./sun/output1.geojson')
      .then((response) => {
        if (!response.ok) {
          throw new Error('GeoJSON文件加载失败')
        }
        return response.json()
      })
      .then((data) => {
        if (!data.features || data.features.length === 0) {
          console.warn('GeoJSON文件为空，请添加滑坡点位数据')
          return
        }
        
        console.log(`成功加载 ${data.features.length} 个滑坡点位`)
        
        // 添加统一的滑坡点图层（所有点）
        if (!map1.getLayer('landslide-points')) {
          map1.addLayer({
            id: 'landslide-points',
            type: 'circle',
            source: 'landslide',
            paint: {
              'circle-color': '#ff0000',
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4, 5, 6, 7, 10],
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 0, 0.1, 2, 0.5, 3, 1, 4, 2, 5, 3],
            },
          })
        }
        
        // 为每个独特的LOC创建过滤图层（用于搜索和高亮）
        const uniqueLOCs = new Set()
        data.features.forEach((feature) => {
          const symbol = feature.properties['LOC']
          if (symbol && !uniqueLOCs.has(symbol)) {
            uniqueLOCs.add(symbol)
            const layerID = `poi-${symbol}`
            layerIDs.push(layerID)
          }
        })
        
        console.log(`创建了 ${uniqueLOCs.size} 个不同的滑坡点位图层`)

        // 点击事件（使用统一图层）
        map1.on('click', 'landslide-points', async (e) => {
          const feature = e.features[0]
          if (!feature) return
          
          // 高亮当前点
          if (selectedId) {
            map1.setPaintProperty('landslide-points', 'circle-color', '#ff0000')
          }
          
          // 临时高亮
          map1.setPaintProperty('landslide-points', 'circle-color', [
            'case',
            ['==', ['get', 'LOC'], feature.properties.LOC],
            'rgb(255, 153, 0)',
            '#ff0000'
          ])
          selectedId = 'landslide-points'

          // 跳转到节点并显示图谱
          const name = feature.properties.LOC
          await getCypherResult(100, name)
          const node = graph?.graphData().nodes.find((n) => n.name === name)
          if (node) {
            graphVisible.value = true
            graph.centerAt(node.x, node.y, 1000)
            graph.zoom(4.5, 200)
          }

          // 地图飞行到该点
          const coordinates = feature.geometry.coordinates.slice()
          map1.flyTo({
            center: coordinates,
            zoom: 8,
            essential: true,
          })

          // 显示属性窗口
          showPropertyWindow(feature.properties)
        })
      })
      .catch((error) => {
        console.warn('加载GeoJSON数据失败:', error.message)
        console.info('请确保 public/sun/output1.geojson 文件存在')
      })

    // 添加控件
    map1.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }))
  })

  // 地图同步
  map1.on('move', () => {
    const center = map1.getCenter()
    map2.setCenter(center)
  })

  map2.on('rotate', () => {
    const bearing = map2.getBearing()
    map1.rotateTo(bearing, { duration: 0 })
  })

  map2.on('pitch', () => {
    const pitch = map2.getPitch()
    map1.setPitch(pitch)
  })

  // 添加小地图控件
  map2.addControl(new maplibregl.NavigationControl({ visualizePitch: true, showZoom: true, showCompass: true }))
}

// 显示属性窗口
const showPropertyWindow = (properties) => {
  const tableRows = Object.entries(properties)
    .map(([key, value]) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #555;"><strong>${key}</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #555;">${value}</td>
      </tr>
    `)
    .join('')

  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <strong style="font-size: 25px;">滑坡信息</strong>
      <button id="closeBtn" style="
        background: transparent;
        color: white;
        border: none;
        font-size: 18px;
        cursor: pointer;
      " title="关闭">&times;</button>
    </div>
    <table style="width: 100%; border-collapse: collapse; font-size: 20px; color: white;">
      ${tableRows}
    </table>
  `

  propertyWindow.value.innerHTML = content
  propertyWindow.value.style.display = 'block'

  setTimeout(() => {
    document.getElementById('closeBtn')?.addEventListener('click', () => {
      propertyWindow.value.style.display = 'none'
    })
  }, 0)
}

// 过滤处理
const handleFilter = (e) => {
  const value = e.target.value.trim().toLowerCase()
  const searchWords = value.split(/\s+/)
  layerIDs.forEach((layerID) => {
    const lowerLayerID = layerID.toLowerCase()
    const matches = searchWords.some((word) => lowerLayerID.includes(word))
    map1.setLayoutProperty(layerID, 'visibility', matches ? 'visible' : 'none')
  })
}

onMounted(() => {
  initMaps()
  // getCypherResult() // 初始加载图谱
})

onUnmounted(() => {
  if (map1) map1.remove()
  if (map2) map2.remove()
})
</script>

<style scoped>
.maplibre-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

header {
  position: absolute;
  width: 80%;
  height: 11vh;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 10px 20px;
  text-align: center;
  border-radius: 30px;
}

header h1 {
  margin: 0;
  font-size: 2.3vh;
  font-weight: 700;
  font-family: 'Times New Roman', 'Roboto', sans-serif;
  color: #0158bb;
  letter-spacing: 0.5px;
  line-height: 1.4;
  display: inline-block;
  padding-bottom: 8px;
  background-color: transparent;
  text-shadow: 0 0 3px #ffffff9a, 0 0 6px #ffffff9a, 0 0 10px rgba(255, 255, 255, 0.6);
}

#map {
  height: 100%;
  width: 100%;
  position: absolute;
  z-index: 3;
}

#map2 {
  height: 42%;
  width: 42vh;
  position: absolute;
  bottom: 0.5%;
  left: 0.5%;
  z-index: 4;
  border: 2px solid black;
  border-radius: 8px;
}

#3dgraph {
  height: 100%;
  width: 100vw;
  position: absolute;
  z-index: 6;
  background-color: rgba(0, 0, 0, 0);
}

#propertyWindow {
  height: 42vh;
  min-height: 100px;
  width: 42vh;
  max-width: 90vw;
  position: absolute;
  bottom: 1%;
  right: 1%;
  z-index: 999;
  border-radius: 12px;
  background: rgba(30, 30, 30, 0.85);
  color: #f1f1f1;
  font-family: 'Times New Roman', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  padding: 16px;
  display: none;
}

#graphControl {
  height: 32px;
  width: 32px;
  position: absolute;
  top: 145px;
  right: 8px;
  z-index: 10;
  background-color: #ffffff;
  border: 2px solid rgba(153, 153, 153, 0.89);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

#graphControl:hover {
  background-color: #ffffffd5;
}

#graphControl:active {
  background-color: #868686;
}

.filter-ctrl {
  position: absolute;
  top: 8vh;
  z-index: 11;
  display: flex;
  align-items: center;
  gap: 10px;
}

#filter1 {
  left: 25vw;
  transform: translateX(-50%);
}

#filter2 {
  left: 50vw;
  transform: translateX(-50%);
}

#filter3 {
  left: 75vw;
  transform: translateX(-50%);
}

.filter-ctrl p {
  margin: 0;
  font-size: 2.3vh;
  font-weight: 700;
  font-family: 'Times New Roman', 'Roboto', sans-serif;
  color: #000000;
}

.filter-ctrl input[type='text'] {
  font: 2vh 'Times New Roman', Tahoma, Geneva, Verdana, sans-serif;
  width: 10vw;
  border: 0;
  background-color: #d6d6d6cc;
  margin: 0;
  color: rgb(0, 0, 0);
  padding: 10px;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.747);
  border-radius: 10px;
}

.filter-ctrl input[type='text']:focus {
  background-color: #d6d6d6cc;
  color: rgb(0, 0, 0);
  outline: 2px solid #8d8d8d;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.747);
}
</style>
