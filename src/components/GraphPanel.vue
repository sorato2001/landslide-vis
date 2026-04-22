<template>
  <div class="graph-panel">
    <div class="panel-header">
      <span class="header-icon">🗺️</span>
      <span class="header-title">图谱查询</span>
      <button class="close-btn" @click="$emit('close')" title="关闭">&times;</button>
    </div>

    <div class="panel-content">
      <!-- 图例区域 -->
      <div class="legend-section">
        <div class="legend-group">
          <div class="legend-group-header">
            <span class="section-bar"></span>
            <div class="legend-group-title">实体名称</div>
          </div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="dot" style="background:#2579E8"></span>
              <span class="legend-text">地理空间信息</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#F1A537"></span>
              <span class="legend-text">影响因素</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#058D49"></span>
              <span class="legend-text">评估模型</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#8B5CF6"></span>
              <span class="legend-text">评估数据</span>
            </div>
          </div>
        </div>

        <div class="legend-group">
          <div class="legend-group-header">
            <span class="section-bar"></span>
            <div class="legend-group-title">
              属性名称</div>
          </div>
          <div class="legend-items">
            <div class="legend-item">
              <span class="dot" style="background:#C76170"></span>
              <span class="legend-text">Paper ID</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#D8929C"></span>
              <span class="legend-text">Paper title</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#71717A"></span>
              <span class="legend-text">Paper link</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#71717A"></span>
              <span class="legend-text underline">PubTime</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#71717A"></span>
              <span class="legend-text">Model type</span>
            </div>
            <div class="legend-item">
              <span class="dot" style="background:#7FAEE1"></span>
              <span class="legend-text">经纬度</span>
            </div>
          </div>
        </div>

        <div class="legend-group">
          <div class="legend-group-header">
            <span class="section-bar"></span>
            <div class="legend-group-title">关系名称</div>
          </div>
          <div class="legend-items">
            <div class="legend-item relation-item">
              <span class="relation-line">—CONTAINS_OF—</span>
            </div>
            <div class="legend-item relation-item">
              <span class="relation-line">—MAPPING_TO—</span>
            </div>
            <div class="legend-item relation-item">
              <span class="relation-line">—USES_OF—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 筛选器 -->
      <div class="filter-area">
        <div class="filter-row">
          <label>区域查询:</label>
          <input v-model="filters.region" placeholder="输入区域名称" @keydown.enter="handleSearch" />
        </div>
        <div class="filter-row">
          <label>因子查询:</label>
          <input v-model="filters.factor" placeholder="如: earthquake/slope/rainfall" @keydown.enter="handleSearch" />
        </div>
        <div class="filter-row">
          <label>方法查询:</label>
          <input v-model="filters.method" placeholder="如: 机器学习/专家评价/数学统计/启发式" @keydown.enter="handleSearch" />
        </div>
        <button class="search-btn" @click="handleSearch" :disabled="searching">
          {{ searching ? '查询中...' : '查询' }}
        </button>
      </div>

      <!-- 筛选结果提示 -->
      <div class="filter-toast" :class="{ show: toastVisible }">
        {{ toastMessage }}
      </div>

      <!-- 图谱容器（侧栏内嵌） -->
      <div class="graph-container-wrapper" ref="graphWrapperRef">
        <div id="graph-view" ref="graphContainer"></div>
        <div class="graph-btns">
          <button class="graph-action-btn" @click="toggleGraph">
            {{ graphVisible ? '隐藏图谱' : '显示图谱' }}
          </button>
          <button class="graph-action-btn fullscreen-btn" @click="openFullscreen">
            全屏展示
          </button>
        </div>
      </div>

      <!-- 属性弹窗 -->
      <div class="property-popup" v-show="popupVisible">
        <div class="popup-header">
          <span>节点属性</span>
          <button class="popup-close" @click="popupVisible = false">&times;</button>
        </div>
        <div class="popup-content" v-html="popupContent"></div>
      </div>
    </div>

    <!-- ★ 全屏图谱弹窗 ★ -->
    <Teleport to="body">
      <div class="fullscreen-overlay" v-if="fullscreenVisible" @keydown.esc="closeFullscreen">
        <div class="fullscreen-panel">
          <div class="fullscreen-header">
            <span class="fullscreen-title"></span>
            <div class="fullscreen-btns">
              <button class="fullscreen-action" @click="closeFullscreen">退出全屏</button>
              <button class="fullscreen-close" @click="closeFullscreen">&times;</button>
            </div>
          </div>
          <div class="fullscreen-body" ref="fullscreenBodyRef">
            <div id="fullscreen-graph"></div>
          </div>
          <!-- 全屏属性弹窗 -->
          <div class="fs-property-popup" v-show="fsPopupVisible">
            <div class="popup-header">
              <span>节点属性</span>
              <button class="popup-close" @click="fsPopupVisible = false">&times;</button>
            </div>
            <div class="popup-content" v-html="fsPopupContent"></div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import ForceGraph from 'force-graph'
import * as d3 from 'd3'
import neo4j from 'neo4j-driver'
import {
  loadLandslidePointsInCesium,
  filterCesiumPointsAdvanced,
  highlightAndFlyToCesiumPoint,
} from '../cesium/miniMapLink'

defineEmits(['close'])

const graphContainer = ref(null)
const graphWrapperRef = ref(null)
const fullscreenBodyRef = ref(null)

const graphVisible = ref(true)
const popupVisible = ref(false)
const popupContent = ref('')

const fullscreenVisible = ref(false)
const fsPopupVisible = ref(false)
const fsPopupContent = ref('')

const filters = ref({
  region: '',
  factor: '',
  method: '',
})

const searching = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')

let inlineGraph = null    // 侧栏内嵌图谱
let fullGraph = null      // 全屏图谱
let geoJsonData = null
let currentGraphData = null  // 缓存当前图谱数据，全屏时复用

// ============ 方法类别映射 ============
// 支持中文别名、英文缩写、数字输入，以及模糊匹配
const methodAliases = {
  EE: {
    class4: ['1'],
    names: ['专家评价', 'Expert Evaluation', 'EE', 'ee', '1', '专家', '评价'],
  },
  MS: {
    class4: ['2'],
    names: ['数学统计', 'Mathematical Statistics', 'MS', 'ms', 'Ms', '2', '数学', '统计'],
  },
  MM: { class4: ['3'], names: ['机器学习模型', 'MM', 'mm', 'Mm', '3', '模型'] },
  ML: {
    class4: ['4'],
    names: ['机器学习', 'Machine Learning', 'ML', 'ml', 'Ml', '4', '机器'],
  },
  HM: {
    class4: ['5', '6'],
    names: ['启发式方法', 'Heuristic Method', 'HM', 'hm', 'Hm', '5', '6', '启发', '启发式'],
  },
}

// 方法查询: 将用户输入转换为 class4 值列表，支持模糊匹配
function getMethodClass4Values(input) {
  const value = input.trim()
  if (!value) return null
  const words = value.split(/[,，\s]+/).filter((w) => w.length > 0)
  const class4Set = new Set()

  for (const word of words) {
    for (const [, info] of Object.entries(methodAliases)) {
      const matched = info.names.some(
        (name) =>
          name.toLowerCase() === word.toLowerCase() ||
          (name.length >= 2 && word.length >= 2 && name.includes(word))
      )
      if (matched) {
        info.class4.forEach((v) => class4Set.add(v))
        break
      }
    }
  }
  return class4Set.size > 0 ? Array.from(class4Set) : null
}

// 因子筛选结果缓存: Set<loc> 或 null(未筛选)
let cachedFactorLocs = null

// 查询 Neo4j 获取包含指定因子的 LOC 列表
async function getFactorLocs(terms) {
  if (!terms || terms.trim() === '') return null
  try {
    const driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', '21151211')
    )
    const session = driver.session()
    try {
      const searchTerms = terms
        .split(/[,，]+/)
        .map((s) => s.trim())
        .filter(Boolean)
      const query = `
        MATCH (i:INF)-[]-(p:PaperID)-[]-(f:FAC)
        WHERE i.loc IS NOT NULL
          AND f.content IS NOT NULL
          AND ANY(term IN $terms WHERE toLower(toString(f.content)) CONTAINS toLower(term))
        RETURN DISTINCT i.loc AS Location
        ORDER BY Location
      `
      const result = await session.run(query, { terms: searchTerms })
      const locSet = new Set()
      result.records.forEach((record) => {
        const loc = record.get('Location')
        if (loc) locSet.add(loc)
      })
      console.log(`因子查询: "${terms}" 匹配到 ${locSet.size} 个区域`)
      return locSet.size > 0 ? locSet : new Set()
    } finally {
      await Promise.all([session.close(), driver.close()])
    }
  } catch (err) {
    console.error('因子查询失败:', err)
    return null
  }
}

// Toast 提示
let toastTimer = null
function showToast(message) {
  toastMessage.value = message
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

// 统一查询: 组合三个筛选条件
const handleSearch = async () => {
  searching.value = true
  try {
    const factorValue = filters.value.factor.trim()
    // 先执行因子查询(异步)
    if (factorValue) {
      cachedFactorLocs = await getFactorLocs(factorValue)
    } else {
      cachedFactorLocs = null
    }

    const regionText = filters.value.region.trim()
    const methodClass4Values = getMethodClass4Values(filters.value.method)

    // 调用 Cesium 高级筛选
    const visibleCount = filterCesiumPointsAdvanced({
      regionText,
      factorLocs: cachedFactorLocs,
      methodClass4Values,
    })

    showToast(`筛选结果: 共 ${visibleCount} 个点`)
  } catch (err) {
    console.error('查询失败:', err)
    showToast('查询失败，请检查输入')
  } finally {
    searching.value = false
  }
}

// ResizeObserver 监听侧栏图谱容器大小变化
let resizeObserver = null

// ============ 颜色映射 ============
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
  if (labels.includes('DAT')) return '#8B5CF6'
  if (labels.includes('PaperID')) return '#C76170'
  if (labels.includes('Title')) return '#D8929C'
  if (labels.includes('Coordinate')) return '#7FAEE1'
  if (labels.includes('Link')) return '#71717A'
  return '#999'
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

      currentGraphData = graphData
      loadInlineGraph(graphData)

      // 如果全屏开着，也更新全屏图谱
      if (fullscreenVisible.value) {
        loadFullscreenGraph(graphData)
      }
    } finally {
      await Promise.all([session.close(), driver.close()])
    }
  } catch (error) {
    console.warn('Neo4j连接失败，图谱功能不可用:', error.message)
  }
}

const queryGraphByLoc = (loc) => {
  getCypherResult(100, loc)
}

defineExpose({ queryGraphByLoc })

// ============ 创建图谱的公共配置 ============
const createGraphInstance = (el, data, width, height, isFullscreen) => {
  const fg = ForceGraph()(el)
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

      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = node.color || 'rgba(100, 150, 255, 0.8)'
      ctx.fill()
      ctx.strokeStyle = highlightNodes.has(node)
        ? 'rgba(255, 0, 0, 0.9)'
        : 'rgba(0, 0, 0, 0.2)'
      ctx.lineWidth = highlightNodes.has(node) ? 2 : 1
      ctx.stroke()

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
          hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]
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
      const LABEL_NODE_MARGIN = fg.nodeRelSize() * 1.5
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
      ctx.fillStyle = '#FFFFFF'
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
      fg.centerAt(node.x, node.y, 1000)
      fg.zoom(4.5, 200)

      // 显示属性弹窗
      if (node && node.properties) {
        const rows = Object.entries(node.properties)
          .filter(([key]) => key !== '__isOffline__')
          .map(
            ([key, value]) =>
              `<div class="prop-row"><span class="prop-key">${key}</span><span class="prop-val">${value}</span></div>`
          )
          .join('')
        if (isFullscreen) {
          fsPopupContent.value = rows
          fsPopupVisible.value = true
        } else {
          popupContent.value = rows
          popupVisible.value = true
        }
      }

      // 联动 Cesium
      if (node && node.labels && node.labels.includes('INF')) {
        const props = node.properties
        if (props && props.loc) {
          highlightAndFlyToCesiumPoint(null, null, props.loc)
        }
      }
    })
    .onNodeClick((node) => {
      if (node && node.properties) {
        const rows = Object.entries(node.properties)
          .filter(([key]) => key !== '__isOffline__')
          .map(
            ([key, value]) =>
              `<div class="prop-row"><span class="prop-key">${key}</span><span class="prop-val">${value}</span></div>`
          )
          .join('')
        if (isFullscreen) {
          fsPopupContent.value = rows
          fsPopupVisible.value = true
        } else {
          popupContent.value = rows
          popupVisible.value = true
        }
      }
    })

  const nodeCount = data.nodes.length
  // 排斥力适当，避免节点过于密集
  fg.d3Force('charge', d3.forceManyBody().strength(-200))
  // 增大链接距离让节点更分散
  fg.d3Force('link').distance(() => 60).strength(0.08)
  fg.d3Force(
    'collision',
    d3.forceCollide().radius((node) => {
      return node.value ? Math.sqrt(node.size) * 3 : 25
    }).strength(0.3)
  )
  fg.d3Force('center', d3.forceCenter(0, 0, 0))

  // 初始缩放填充视口
  setTimeout(() => {
    fg.zoomToFit(400, 40)
  }, 800)

  return fg
}

function updateHighlight() {
  if (inlineGraph) {
    inlineGraph.nodeColor(inlineGraph.nodeColor())
    inlineGraph.linkWidth(inlineGraph.linkWidth())
  }
  if (fullGraph) {
    fullGraph.nodeColor(fullGraph.nodeColor())
    fullGraph.linkWidth(fullGraph.linkWidth())
  }
}

// ============ 侧栏内嵌图谱 ============
const loadInlineGraph = (data) => {
  const el = document.getElementById('graph-view')
  if (!el) return

  graphVisible.value = true

  const width = el.clientWidth || 300
  const height = el.clientHeight || 250

  if (inlineGraph) {
    inlineGraph.graphData(data)
    // 数据更新后自动缩放填充
    setTimeout(() => {
      inlineGraph.zoomToFit(400, 40)
    }, 800)
    return
  }

  inlineGraph = createGraphInstance(el, data, width, height, false)
}

// ============ 全屏图谱 ============
const loadFullscreenGraph = (data) => {
  const el = document.getElementById('fullscreen-graph')
  if (!el) return

  const width = el.clientWidth || window.innerWidth
  const height = el.clientHeight || window.innerHeight - 50

  if (fullGraph) {
    fullGraph.graphData(data)
    fullGraph.width(width)
    fullGraph.height(height)
    // 数据更新后自动缩放填充
    setTimeout(() => {
      fullGraph.zoomToFit(400, 40)
    }, 800)
    return
  }

  fullGraph = createGraphInstance(el, data, width, height, true)
}

const openFullscreen = () => {
  fullscreenVisible.value = true
  nextTick(() => {
    if (currentGraphData) {
      loadFullscreenGraph(currentGraphData)
      // 全屏图谱延迟缩放填充
      if (fullGraph) {
        setTimeout(() => {
          fullGraph.zoomToFit(400, 40)
        }, 1000)
      }
    }
  })
}

const closeFullscreen = () => {
  fullscreenVisible.value = false
  fsPopupVisible.value = false
  // 销毁全屏图谱实例释放资源
  if (fullGraph) {
    fullGraph._destructor()
    fullGraph = null
  }
}

const toggleGraph = () => {
  graphVisible.value = !graphVisible.value
  if (graphVisible.value && inlineGraph) {
    nextTick(() => {
      inlineGraph.zoom(4.5, 200)
      resizeInlineGraph()
    })
  }
}

const resizeInlineGraph = () => {
  const el = document.getElementById('graph-view')
  if (!el || !inlineGraph) return
  inlineGraph.width(el.clientWidth)
  inlineGraph.height(el.clientHeight)
}

// ============ 筛选（已迁移到 handleSearch 统一查询） ============

// ============ 初始化 ============
const initGraphPanel = async () => {
  try {
    await loadLandslidePointsInCesium('./sun/output1.geojson')
    const response = await fetch('./sun/output1.geojson')
    if (response.ok) {
      geoJsonData = await response.json()
      console.log(`图谱面板加载了 ${geoJsonData.features.length} 个滑坡点`)
    }
  } catch (error) {
    console.warn('加载滑坡点数据失败:', error.message)
  }

  getCypherResult(100, null)
}

// ============ 生命周期 ============
onMounted(() => {
  nextTick(() => {
    initGraphPanel()
  })

  // ResizeObserver 监听图谱容器大小变化（侧栏拖拽时自动适配）
  resizeObserver = new ResizeObserver(() => {
    resizeInlineGraph()
  })
  if (graphWrapperRef.value) {
    resizeObserver.observe(graphWrapperRef.value)
  }

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  window.removeEventListener('resize', handleResize)
  if (inlineGraph) {
    inlineGraph._destructor()
    inlineGraph = null
  }
  if (fullGraph) {
    fullGraph._destructor()
    fullGraph = null
  }
})

const handleResize = () => {
  resizeInlineGraph()
  if (fullscreenVisible.value && fullGraph) {
    const el = document.getElementById('fullscreen-graph')
    if (el) {
      fullGraph.width(el.clientWidth)
      fullGraph.height(el.clientHeight)
    }
  }
}
</script>

<style scoped>
.graph-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(10, 22, 40, 0.8);
  color: #E0E8F0;
}

.panel-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: linear-gradient(135deg, #0A2E5C, #1A3A6B);
  border-bottom: 1px solid rgba(58, 123, 213, 0.4);
  flex-shrink: 0;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  flex: 1;
  font-size: 19px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(58, 123, 213, 0.5);
}

.close-btn {
  background: none;
  border: none;
  color: #8BA4C0;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(58, 123, 213, 0.3);
  color: #FFFFFF;
}

.panel-content {
  padding: 10px 12px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-content::-webkit-scrollbar {
  width: 5px;
}

.panel-content::-webkit-scrollbar-track {
  background: rgba(10, 22, 40, 0.5);
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(58, 123, 213, 0.4);
  border-radius: 3px;
}

/* ============ 图例 ============ */
/* .legend-section {
  border: 1px solid rgba(58, 123, 213, 0.3);
  border-radius: 8px;
  padding: 10px;
  background: transparent;
} */

.legend-section {
  margin-bottom: 14px;
  background: rgba(0, 20, 50, 0.6);
  border: 2px solid rgba(0, 179, 255, 0.342);
  border-radius: 8px;
  padding: 14px;
  position: relative;
  animation: fadein 0.5s ease both;
  transition: border-color 0.2s;
}

.legend-section:hover {
  border-color: rgba(0, 179, 255, 0.685);
}

.legend-section:nth-child(1) { animation-delay: 0.05s; }
.legend-section:nth-child(2) { animation-delay: 0.12s; }
.legend-section:nth-child(3) { animation-delay: 0.20s; }
.legend-section:nth-child(4) { animation-delay: 0.28s; }

.legend-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
}

.legend-group {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 179, 255, 0.2);
}

.legend-group:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.legend-group-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.section-bar {
  display: inline-block;
  flex-shrink: 0;
  width: 4px;
  height: 20px;
  background: #00d4ff;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.8);
  border-radius: 2px;
}

.legend-group-title {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  border-radius: 20px;
  display: inline-block;
}

.legend-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 16px;
  padding-left: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 17px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 4px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.3);
}

.legend-text {
  line-height: 1.3;
}

.legend-text.underline {
  text-decoration: underline;
}

.relation-item {
  padding-left: 0;
}

.relation-line {
  font-size: 16px;
  color: #ffffff;
  font-family: 'Consolas', 'Courier New', monospace;
  letter-spacing: 0.5px;
  background: rgba(255, 255, 255, 0.1);
  padding: 6px 14px;
  border-radius: 4px;
}

/* ============ 筛选器 ============ */
.filter-area {
  position: fixed;
  top: 10%;
  left: 58%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: row;
  gap: 16px;
  padding: 8px 20px;
  background: linear-gradient(135deg, rgba(15, 35, 65, 0.95), rgba(8, 20, 45, 0.95));
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(0, 200, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.filter-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.5), transparent);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-row label {
  color: #00d4ff;
  font-size: 18px;
  white-space: nowrap;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
}

.filter-row input {
  width: 180px;
  padding: 6px 14px;
  font-size: 18px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 200, 255, 0.25);
  border-radius: 6px;
  color: #ffffff;
  outline: none;
  transition: all 0.3s ease;
}

.filter-row input:focus {
  border-color: rgba(0, 200, 255, 0.6);
  box-shadow: 
    0 0 12px rgba(0, 200, 255, 0.3),
    inset 0 0 8px rgba(0, 200, 255, 0.1);
  background: rgba(0, 30, 60, 0.8);
}

.filter-row input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* ============ 查询按钮 ============ */
.search-btn {
  padding: 6px 22px;
  font-size: 17px;
  font-weight: 600;
  background: linear-gradient(135deg, #0D5BBE, #3A7BD5);
  color: #fff;
  border: 1px solid rgba(58, 123, 213, 0.6);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 8px rgba(58, 123, 213, 0.3);
  white-space: nowrap;
}

.search-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #1A6BD5, #4A90D9);
  box-shadow: 0 0 16px rgba(58, 123, 213, 0.6);
  transform: translateY(-1px);
}

.search-btn:active:not(:disabled) {
  transform: translateY(0);
}

.search-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ============ 筛选结果提示 ============ */
.filter-toast {
  position: fixed;
  top: calc(10% + 70px);
  left: 58%;
  transform: translateX(-50%) translateY(-10px);
  padding: 10px 24px;
  background: linear-gradient(135deg, rgba(15, 35, 65, 0.95), rgba(8, 20, 45, 0.95));
  color: #00d4ff;
  font-size: 17px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.4);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 200, 255, 0.15);
  z-index: 1001;
  opacity: 0;
  pointer-events: none;
  transition: all 0.4s ease;
  backdrop-filter: blur(8px);
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
}

.filter-toast.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

/* ============ 图谱容器 ============ */
.graph-container-wrapper {
  position: relative;
  flex: 1;
  min-height: 250px;
  margin-bottom: 14px;
  background: rgba(0, 20, 50, 0.6);
  border: 2px solid rgba(0, 179, 255, 0.342);
  border-radius: 8px;
  padding: 14px;
  overflow: hidden;
  animation: fadein 0.5s ease both;
  transition: border-color 0.2s;
}

.graph-container-wrapper:hover {
  border-color: rgba(0, 179, 255, 0.685);
}

.graph-container-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0, 180, 255, 0.6), transparent);
}

#graph-view {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

.graph-btns {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  z-index: 5;
}

.graph-action-btn {
  padding: 6px 16px;
  font-size: 15px;
  background: linear-gradient(135deg, #1A3A6B, #3A7BD5);
  color: #fff;
  border: 1px solid rgba(58, 123, 213, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.graph-action-btn:hover {
  background: linear-gradient(135deg, #2A4E8B, #4A90D9);
  box-shadow: 0 0 10px rgba(58, 123, 213, 0.4);
}

.fullscreen-btn {
  background: linear-gradient(135deg, #0D2847, #1A3A6B);
  border-color: rgba(58, 123, 213, 0.4);
}

.fullscreen-btn:hover {
  background: linear-gradient(135deg, #1A3A6B, #2A4E8B);
}

/* ============ 属性弹窗（侧栏） ============ */
.property-popup {
  background: rgba(10, 22, 40, 0.95);
  border-radius: 6px;
  border: 1px solid rgba(58, 123, 213, 0.5);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.4);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: linear-gradient(135deg, #0A2E5C, #1A3A6B);
  color: #FFFFFF;
  font-size: 17px;
  font-weight: 600;
}

.popup-close {
  background: none;
  border: none;
  color: #8BA4C0;
  font-size: 20px;
  cursor: pointer;
  line-height: 1;
}

.popup-close:hover {
  color: #FFFFFF;
}

.popup-content {
  padding: 8px 12px;
  max-height: 180px;
  overflow-y: auto;
  color: #C0D4EC;
  font-size: 18px;
}

.prop-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  border-bottom: 1px solid rgba(58, 123, 213, 0.15);
}

.prop-key {
  font-weight: 600;
  color: #4A90D9;
  margin-right: 12px;
  font-size: 17px;
}

.prop-val {
  color: #8BA4C0;
  font-size: 17px;
}

/* ============ 全屏图谱弹窗 ============ */
.fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadein {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fullscreen-panel {
  width: 100vw;
  height: 100vh;
  background: #050f1e00;
  border-radius: 12px;
  border: 1px solid rgba(58, 123, 213, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
}

.fullscreen-header {
  top: 10vh;
  display: flex;
  align-items: center;
  padding: 12px 18px;
  background: linear-gradient(135deg, #0a2e5c00, #1A3A6B);
  border-bottom: 1px solid rgba(58, 123, 213, 0.4);
  flex-shrink: 0;
  gap: 12px;
}

.fullscreen-title {
  flex: 1;
  font-size: 22px;
  font-weight: 700;
  color: #FFFFFF;
  text-shadow: 0 0 8px rgba(58, 123, 213, 0.5);
}

.fullscreen-btns {
  display: flex;
  gap: 8px;
  align-items: center;
}

.fullscreen-action {
  padding: 8px 20px;
  font-size: 17px;
  background: linear-gradient(135deg, #1A3A6B, #3A7BD5);
  color: #fff;
  border: 1px solid rgba(58, 123, 213, 0.5);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.fullscreen-action:hover {
  background: linear-gradient(135deg, #2A4E8B, #4A90D9);
  box-shadow: 0 0 10px rgba(58, 123, 213, 0.4);
}

.fullscreen-close {
  background: none;
  border: none;
  color: #8BA4C0;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.fullscreen-close:hover {
  background: rgba(58, 123, 213, 0.3);
  color: #FFFFFF;
}

.fullscreen-body {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: rgba(5, 15, 30, 0.2);
}

#fullscreen-graph {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

/* 全屏属性弹窗 */
.fs-property-popup {
  position: absolute;
  top: 12px;
  left: 12px;
  width: 320px;
  max-height: 300px;
  background: rgba(10, 22, 40, 0.95);
  border-radius: 8px;
  border: 1px solid rgba(58, 123, 213, 0.5);
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  z-index: 10;
}
</style>
