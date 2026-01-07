import { fromArrayBuffer } from 'geotiff'
import * as Cesium from 'cesium'
import { getViewer } from './viewer'

let elevationLayer = null
let grayCanvas = null
let colorCanvas = null
let currentMode = 'color' // 'color' | 'gray'
let currentRectangle = null
let currentSize = null
let currentImageUrl = null

export async function loadElevationTif(file) {
  const viewer = getViewer()
  if (!viewer) throw new Error('Cesium Viewer 未初始化')

  const arrayBuffer = await file.arrayBuffer()
  const tiff = await fromArrayBuffer(arrayBuffer)
  const image = await tiff.getImage()

  const width = image.getWidth()
  const height = image.getHeight()
  const raster = await image.readRasters({ interleave: true })

  const bbox = image.getBoundingBox()
  const west  = Math.min(bbox[0], bbox[2])
  const east  = Math.max(bbox[0], bbox[2])
  const south = Math.min(bbox[1], bbox[3])
  const north = Math.max(bbox[1], bbox[3])

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
