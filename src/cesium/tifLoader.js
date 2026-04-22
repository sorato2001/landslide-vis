import { fromArrayBuffer } from 'geotiff'
import * as Cesium from 'cesium'
import { getViewer } from './viewer'
import proj4 from 'proj4'
import shp from 'shpjs'

let elevationLayer = null
let grayCanvas = null
let colorCanvas = null
let currentMode = 'color' // 'color' | 'gray'
let currentRectangle = null
let currentSize = null
let currentImageUrl = null

// ========== 易发性图层状态 ==========
let susceptibilityLayer = null
let susceptibilityCanvas = null
let susceptibilityRectangle = null
let susceptibilityImageUrl = null
let susceptibilityLegendEl = null

export async function loadElevationTif(file) {
  const viewer = getViewer()
  if (!viewer) throw new Error('Cesium Viewer 未初始化')

  const arrayBuffer = await file.arrayBuffer()
  const tiff = await fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()

  const width = image.getWidth()
  const height = image.getHeight()
  const raster = await image.readRasters({ interleave: true })

  const { west, south, east, north } = getGeoBounds(image)

  currentRectangle = Cesium.Rectangle.fromDegrees(west, south, east, north)
  currentSize = { width, height }

  // 计算实际的高程范围
  let minHeight = Infinity
  let maxHeight = -Infinity
  for (let i = 0; i < width * height; i++) {
    const h = Number.isFinite(raster[i]) ? raster[i] : 0
    if (h > 0) { // 忽略无效值
      minHeight = Math.min(minHeight, h)
      maxHeight = Math.max(maxHeight, h)
    }
  }
  
  console.log(`高程范围: ${minHeight.toFixed(2)} ~ ${maxHeight.toFixed(2)} 米`)

  // ===== 黑白 canvas =====
  grayCanvas = document.createElement('canvas')
  grayCanvas.width = width
  grayCanvas.height = height
  const gctx = grayCanvas.getContext('2d')
  const gimg = gctx.createImageData(width, height)

  // ===== 彩色 canvas =====
  colorCanvas = document.createElement('canvas')
  colorCanvas.width = width
  colorCanvas.height = height
  const cctx = colorCanvas.getContext('2d')
  const cimg = cctx.createImageData(width, height)

  for (let i = 0; i < width * height; i++) {
    const h = Number.isFinite(raster[i]) ? raster[i] : 0

    // 黑白 - 使用实际高程范围
    const normalizedGray = (h - minHeight) / (maxHeight - minHeight)
    const gray = Math.max(0, Math.min(255, normalizedGray * 255))
    let idx = i * 4
    gimg.data[idx]     = gray
    gimg.data[idx + 1] = gray
    gimg.data[idx + 2] = gray
    gimg.data[idx + 3] = 255

    // 彩色 - 使用实际高程范围
    const color = getColorForHeight(h, minHeight, maxHeight)
    cimg.data[idx]     = color.r
    cimg.data[idx + 1] = color.g
    cimg.data[idx + 2] = color.b
    cimg.data[idx + 3] = 255
  }

  gctx.putImageData(gimg, 0, 0)
  cctx.putImageData(cimg, 0, 0)

  // 默认显示彩色
  currentMode = 'color'
  applyCanvasToCesium(viewer)
  createElevationLegend(viewer, minHeight, maxHeight)

  viewer.flyTo(elevationLayer)
}

async function applyCanvasToCesium(viewer) {
  if (currentImageUrl) {
    URL.revokeObjectURL(currentImageUrl)
    currentImageUrl = null
  }

  const canvas = currentMode === 'color' ? colorCanvas : grayCanvas

  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, 'image/png')
  )

  currentImageUrl = URL.createObjectURL(blob)

  if (elevationLayer) {
    viewer.imageryLayers.remove(elevationLayer)
    elevationLayer = null
  }

  elevationLayer = viewer.imageryLayers.addImageryProvider(
    new Cesium.SingleTileImageryProvider({
      url: currentImageUrl,
      rectangle: currentRectangle,
      tileWidth: currentSize.width,
      tileHeight: currentSize.height
    })
  )
}


export function setElevationVisible(v) {
  if (elevationLayer) elevationLayer.show = v
}

function getColorForHeight(height, minHeight, maxHeight) {
  // 使用实际高程范围进行归一化
  const normalizedHeight = (height - minHeight) / (maxHeight - minHeight)
  const clamped = Math.min(Math.max(normalizedHeight, 0), 1)

  // 使用更鲜明的颜色梯度
  if (clamped < 0.2) return { r: 34,  g: 102, b: 221 } // 深蓝
  else if (clamped < 0.4) return { r: 52,  g: 211, b: 153 } // 青绿
  else if (clamped < 0.6) return { r: 46,  g: 213, b: 115 } // 绿色
  else if (clamped < 0.8) return { r: 255, g: 193, b: 7 }   // 金黄
  else return { r: 231, g: 76,  b: 60 }  // 红色
}


let elevationLegend = null

function createElevationLegend(viewer, minHeight, maxHeight) {
  if (elevationLegend) {
    elevationLegend.remove()
    elevationLegend = null
  }

  const legend = document.createElement('div')
  legend.style.position = 'absolute'
  legend.style.bottom = '50px'
  legend.style.right = '20px'
  legend.style.backgroundColor = 'rgba(255,255,255,0.95)'
  legend.style.padding = '15px 20px'
  legend.style.borderRadius = '12px'
  legend.style.fontSize = '13px'
  legend.style.zIndex = '1000'
  legend.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'

  const title = document.createElement('div')
  title.textContent = '高程图例 (m)'
  title.style.fontWeight = 'bold'
  title.style.marginBottom = '10px'
  title.style.fontSize = '14px'
  title.style.color = '#333'
  legend.appendChild(title)

  const gradient = document.createElement('div')
  gradient.style.width = '30px'
  gradient.style.height = '180px'
  gradient.style.background =
    'linear-gradient(to bottom,' +
    'rgb(231, 76, 60) 0%,' +
    'rgb(255, 193, 7) 25%,' +
    'rgb(46, 213, 115) 50%,' +
    'rgb(52, 211, 153) 75%,' +
    'rgb(34, 102, 221) 100%)'
  gradient.style.borderRadius = '6px'
  gradient.style.float = 'left'
  gradient.style.border = '1px solid rgba(0,0,0,0.1)'

  const labels = document.createElement('div')
  labels.style.marginLeft = '12px'
  labels.style.height = '180px'
  labels.style.display = 'flex'
  labels.style.flexDirection = 'column'
  labels.style.justifyContent = 'space-between'

  // 使用实际高程范围生成标签
  const step = (maxHeight - minHeight) / 4
  ;[maxHeight, maxHeight - step, maxHeight - 2*step, maxHeight - 3*step, minHeight].forEach(v => {
    const label = document.createElement('div')
    label.textContent = v.toFixed(0)
    label.style.color = '#666'
    label.style.fontSize = '12px'
    labels.appendChild(label)
  })

  const container = document.createElement('div')
  container.style.display = 'flex'
  container.style.alignItems = 'center'
  container.appendChild(gradient)
  container.appendChild(labels)

  legend.appendChild(container)

  viewer.container.appendChild(legend)
  elevationLegend = legend
}


export async function toggleElevationMode() {
  const viewer = getViewer()
  if (!viewer || !grayCanvas || !colorCanvas) return

  currentMode = currentMode === 'color' ? 'gray' : 'color'
  await applyCanvasToCesium(viewer)
}

// =====================================================================
// 通用: 从 GeoTIFF image 获取 WGS84 经纬度范围
// 自动检测 CRS，若为投影坐标系则转为经纬度
// =====================================================================
function getGeoBounds(image) {
  const bbox = image.getBoundingBox()
  let west  = Math.min(bbox[0], bbox[2])
  let east  = Math.max(bbox[0], bbox[2])
  let south = Math.min(bbox[1], bbox[3])
  let north = Math.max(bbox[1], bbox[3])

  // 检测是否已经是经纬度 (WGS84)
  // 经度范围 -180~180，纬度范围 -90~90
  if (west >= -180 && east <= 180 && south >= -90 && north <= 90) {
    console.log('TIFF bbox 已为 WGS84:', { west, south, east, north })
    return { west, south, east, north }
  }

  // 投影坐标系，需要转换
  console.log('TIFF bbox 为投影坐标，尝试转换为 WGS84:', bbox)

  try {
    // 尝试从 GeoTIFF 元数据获取 CRS
    const geoKeys = image.getGeoKeys?.() || null
    let sourceProj = null

    if (geoKeys) {
      const projectedCSType = geoKeys.ProjectedCSType || geoKeys.GeographicType
      if (projectedCSType) {
        const epsg = `EPSG:${projectedCSType}`
        sourceProj = proj4(epsg)
        console.log('从 GeoKeys 获取 CRS:', epsg)
      }
    }

    // 如果没有 GeoKeys 或无法解析，尝试常见 EPSG
    if (!sourceProj) {
      // 中国常见投影: CGCS2000 / 3-degree Gauss-Kruger
      const candidates = ['EPSG:4527', 'EPSG:4528', 'EPSG:4529', 'EPSG:4530',
                          'EPSG:32648', 'EPSG:32649', 'EPSG:4490']
      for (const epsg of candidates) {
        try {
          sourceProj = proj4(epsg)
          // 测试转换：中心点转换后经度应在 70-140 范围（中国区域）
          const cx = (west + east) / 2
          const cy = (south + north) / 2
          const test = proj4(epsg, 'EPSG:4326', [cx, cy])
          if (test[0] >= 70 && test[0] <= 140 && test[1] >= 15 && test[1] <= 55) {
            console.log('匹配到 CRS:', epsg, '转换中心:', test)
            break
          }
          sourceProj = null
        } catch {
          sourceProj = null
        }
      }
    }

    if (sourceProj) {
      const sw = proj4(sourceProj, 'EPSG:4326', [west, south])
      const ne = proj4(sourceProj, 'EPSG:4326', [east, north])
      west = sw[0]
      south = sw[1]
      east = ne[0]
      north = ne[1]
      console.log('转换为 WGS84:', { west, south, east, north })
    } else {
      console.warn('无法识别 TIFF 坐标系，将直接使用 bbox 值作为经纬度')
    }
  } catch (e) {
    console.warn('CRS 转换失败:', e.message)
  }

  return { west, south, east, north }
}

// =====================================================================
// 易发性概率 TIFF 分层渲染
// 5级: 0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0
// =====================================================================

// 5级分色色表 (蓝→青→绿→橙→红)
const SUSCEPTIBILITY_COLORS = [
  { min: 0,   max: 0.2, color: { r: 48,  g: 95,  b: 207 } },   // #305FCF
  { min: 0.2, max: 0.4, color: { r: 159, g: 167, b: 201 } },   // #9FA7C9
  { min: 0.4, max: 0.6, color: { r: 255, g: 255, b: 191 } },   // #FFFFBF
  { min: 0.6, max: 0.8, color: { r: 232, g: 157, b: 116 } },   // #E89D74
  { min: 0.8, max: 1.0, color: { r: 196, g: 69,  b: 57  } },   // #C44539
]

function getSusceptibilityColor(value) {
  for (const band of SUSCEPTIBILITY_COLORS) {
    if (value >= band.min && value < band.max) return band.color
  }
  // value == 1.0 时归入最高级
  if (value >= 0.8) return SUSCEPTIBILITY_COLORS[4].color
  return { r: 0, g: 0, b: 0, a: 0 }  // 无效值透明
}

/**
 * 加载易发性概率 TIFF 并分层渲染到 Cesium
 * @param {File|string} source - File 对象或 URL 字符串
 */
export async function loadSusceptibilityTif(source) {
  const viewer = getViewer()
  if (!viewer) throw new Error('Cesium Viewer 未初始化')

  // 移除旧图层
  removeSusceptibilityLayer()

  let arrayBuffer
  if (typeof source === 'string') {
    const resp = await fetch(source)
    arrayBuffer = await resp.arrayBuffer()
  } else {
    arrayBuffer = await source.arrayBuffer()
  }

  const tiff = await fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()

  const width = image.getWidth()
  const height = image.getHeight()
  const raster = await image.readRasters({ interleave: true })

  const { west, south, east, north } = getGeoBounds(image)

  susceptibilityRectangle = Cesium.Rectangle.fromDegrees(west, south, east, north)

  // 统计有效值范围
  let minVal = Infinity, maxVal = -Infinity
  let validCount = 0
  for (let i = 0; i < width * height; i++) {
    const v = raster[i]
    if (Number.isFinite(v) && v >= 0 && v <= 1) {
      minVal = Math.min(minVal, v)
      maxVal = Math.max(maxVal, v)
      validCount++
    }
  }
  console.log(`易发性TIFF: ${width}x${height}, 有效像元: ${validCount}, 值域: ${minVal.toFixed(3)}~${maxVal.toFixed(3)}`)

  // 生成分类彩色 Canvas
  susceptibilityCanvas = document.createElement('canvas')
  susceptibilityCanvas.width = width
  susceptibilityCanvas.height = height
  const ctx = susceptibilityCanvas.getContext('2d')
  const imgData = ctx.createImageData(width, height)

  for (let i = 0; i < width * height; i++) {
    const v = raster[i]
    const idx = i * 4
    if (!Number.isFinite(v) || v < 0 || v > 1) {
      // 无效值 - 透明
      imgData.data[idx]     = 0
      imgData.data[idx + 1] = 0
      imgData.data[idx + 2] = 0
      imgData.data[idx + 3] = 0
    } else {
      const c = getSusceptibilityColor(v)
      imgData.data[idx]     = c.r
      imgData.data[idx + 1] = c.g
      imgData.data[idx + 2] = c.b
      imgData.data[idx + 3] = 210  // 稍透明
    }
  }

  ctx.putImageData(imgData, 0, 0)

  // 叠加到 Cesium
  const blob = await new Promise(resolve => susceptibilityCanvas.toBlob(resolve, 'image/png'))
  susceptibilityImageUrl = URL.createObjectURL(blob)

  susceptibilityLayer = viewer.imageryLayers.addImageryProvider(
    new Cesium.SingleTileImageryProvider({
      url: susceptibilityImageUrl,
      rectangle: susceptibilityRectangle,
      tileWidth: width,
      tileHeight: height,
    })
  )

  // 创建图例
  createSusceptibilityLegend(viewer)

  // 加载研究区边界并缩放
  try {
    const [shpBuf, dbfBuf] = await Promise.all([
      fetch('/sun/region/Luding_StudyRegion.shp').then(r => r.arrayBuffer()),
      fetch('/sun/region/Luding_StudyRegion.dbf').then(r => r.arrayBuffer()),
    ])
    const regionGeojson = await shp([shpBuf, dbfBuf])
    const regionDs = await Cesium.GeoJsonDataSource.load(regionGeojson, {
      stroke: Cesium.Color.fromCssColorString('#00d4ff'),
      fill: Cesium.Color.fromCssColorString('rgba(0, 150, 255, 0.15)'),
      strokeWidth: 2,
      clampToGround: true
    })
    viewer.dataSources.add(regionDs)
    viewer.flyTo(regionDs, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(
        0.0,
        Cesium.Math.toRadians(-50),
        0
      )
    })
  } catch (e) {
    console.warn('研究区shp加载失败，回退到TIFF范围:', e)
    viewer.camera.flyTo({
      destination: Cesium.Rectangle.fromDegrees(west, south, east, north),
      duration: 2,
    })
  }

  return { width, height, minVal, maxVal, validCount }
}

/**
 * 设置易发性图层可见性
 */
export function setSusceptibilityVisible(v) {
  if (susceptibilityLayer) susceptibilityLayer.show = v
}

/**
 * 获取易发性图层是否已加载
 */
export function isSusceptibilityLoaded() {
  return susceptibilityLayer !== null
}

/**
 * 移除易发性图层
 */
export function removeSusceptibilityLayer() {
  const viewer = getViewer()
  if (susceptibilityLayer && viewer) {
    viewer.imageryLayers.remove(susceptibilityLayer)
    susceptibilityLayer = null
  }
  if (susceptibilityImageUrl) {
    URL.revokeObjectURL(susceptibilityImageUrl)
    susceptibilityImageUrl = null
  }
  if (susceptibilityLegendEl) {
    susceptibilityLegendEl.remove()
    susceptibilityLegendEl = null
  }
}

/**
 * 创建易发性图例 (深蓝科技风格)
 */
function createSusceptibilityLegend(viewer) {
  if (susceptibilityLegendEl) {
    susceptibilityLegendEl.remove()
    susceptibilityLegendEl = null
  }

  const legend = document.createElement('div')
  legend.style.cssText = `
    position: absolute; bottom: 16px; left: 16px; z-index: 40;
    background: rgba(5, 15, 30, 0.92);
    border-radius: 10px;
    border: 1px solid rgba(0, 212, 255, 0.4);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 180, 255, 0.15);
    padding: 12px 16px;
    font-family: 'Microsoft YaHei', sans-serif;
    animation: slideUp 0.3s ease;
  `

  // 标题
  const title = document.createElement('div')
  title.textContent = '滑坡易发性分级'
  title.style.cssText = `
    font-size: 15px; font-weight: 700; color: #FFFFFF;
    text-shadow: 0 0 6px rgba(0, 212, 255, 0.4);
    margin-bottom: 10px; padding-bottom: 8px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.2);
  `
  legend.appendChild(title)

  // 颜色条目
  const labels = ['极低 (0-0.2)', '低 (0.2-0.4)', '中 (0.4-0.6)', '高 (0.6-0.8)', '极高 (0.8-1.0)']
  SUSCEPTIBILITY_COLORS.forEach((band, i) => {
    const row = document.createElement('div')
    row.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 4px;'

    const swatch = document.createElement('div')
    swatch.style.cssText = `
      width: 18px; height: 14px; border-radius: 3px; flex-shrink: 0;
      background: rgb(${band.color.r}, ${band.color.g}, ${band.color.b});
      border: 1px solid rgba(255, 255, 255, 0.15);
    `

    const label = document.createElement('span')
    label.textContent = labels[i]
    label.style.cssText = 'font-size: 13px; color: #C0D4EC;'

    row.appendChild(swatch)
    row.appendChild(label)
    legend.appendChild(row)
  })

  // 数据源
  const src = document.createElement('div')
  src.textContent = '数据源: Stacking GBDT-XGB'
  src.style.cssText = 'font-size: 11px; color: #5d8aaa; text-align: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(0, 212, 255, 0.15);'
  legend.appendChild(src)

  viewer.container.appendChild(legend)
  susceptibilityLegendEl = legend
}
