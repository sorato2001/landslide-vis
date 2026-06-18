import * as Cesium from 'cesium'
import { getViewer } from '@/cesium/viewer'
import shp from 'shpjs'

let predictionEntities = []
let legendDiv = null
let regionBoundaryLoaded = false
let fallbackRectEntity = null

/* ========== 加载研究区边界 ========== */
// 立即显示矩形范围框
function showRegionRect(viewer) {
  if (regionBoundaryLoaded) return
  fallbackRectEntity = viewer.entities.add({
    rectangle: {
      coordinates: Cesium.Rectangle.fromDegrees(101.7, 29.4, 102.7, 30.3),
      material: Cesium.Color.fromCssColorString('rgba(0, 150, 255, 0.2)'),
      outline: true,
      outlineColor: Cesium.Color.fromCssColorString('#00d4ff'),
      outlineWidth: 2,
      classificationType: Cesium.ClassificationType.BOTH,
    }
  })
  regionBoundaryLoaded = true
  console.log('研究区矩形范围框已显示')
}

// 异步加载shapefile替换矩形
async function loadRegionBoundary(viewer) {
  try {
    const [shpBuf, dbfBuf] = await Promise.all([
      fetch('/sun/region/Luding_StudyRegion.shp').then(r => r.arrayBuffer()),
      fetch('/sun/region/Luding_StudyRegion.dbf').then(r => r.arrayBuffer()),
    ])
    const regionGeojson = await shp({ shp: shpBuf, dbf: dbfBuf })
    const regionDs = await Cesium.GeoJsonDataSource.load(regionGeojson, {
      stroke: Cesium.Color.fromCssColorString('#00d4ff'),
      fill: Cesium.Color.fromCssColorString('rgba(0, 150, 255, 0.15)'),
      strokeWidth: 2,
      clampToGround: true
    })
    // 移除之前的矩形
    if (fallbackRectEntity) {
      viewer.entities.remove(fallbackRectEntity)
      fallbackRectEntity = null
    }
    viewer.dataSources.add(regionDs)
    console.log('研究区shapefile边界替换成功')
  } catch (e) {
    console.warn('研究区shapefile加载失败，保留矩形范围框:', e)
  }
}

/* ========== 颜色映射（完全等价 demo6） ========== */
function getColor(probability) {
  const hue = (1 - probability) * 240
  return Cesium.Color.fromHsl(hue / 360, 1.0, 0.5, 0.7)
}

/* ========== 图例 ========== */
export function generateCNNLegend() {
  const viewer = getViewer()
  if (!viewer) return

  if (legendDiv) return

  legendDiv = document.createElement('div')
  legendDiv.style.position = 'absolute'
  legendDiv.style.bottom = '50px'
  legendDiv.style.left = '20px'
  legendDiv.style.background = 'rgba(255,255,255,0.9)'
  legendDiv.style.padding = '10px'
  legendDiv.style.borderRadius = '6px'
  legendDiv.style.zIndex = '1000'

  const title = document.createElement('h4')
  title.innerText = 'CNN 预测概率'
  legendDiv.appendChild(title)

  for (let i = 0; i < 10; i++) {
    const probability = i / 9
    const color = getColor(probability)

    const item = document.createElement('div')
    item.style.display = 'flex'
    item.style.alignItems = 'center'
    item.style.marginBottom = '4px'

    const box = document.createElement('div')
    box.style.width = '20px'
    box.style.height = '20px'
    box.style.marginRight = '6px'
    box.style.background = `rgb(${color.red * 255}, ${color.green * 255}, ${color.blue * 255})`

    const label = document.createElement('span')
    label.innerText = probability.toFixed(2)

    item.appendChild(box)
    item.appendChild(label)
    legendDiv.appendChild(item)
  }

  viewer.container.appendChild(legendDiv)
}

/* ========== 清理旧预测 ========== */
function clearPrediction(viewer) {
  predictionEntities.forEach(e => viewer.entities.remove(e))
  predictionEntities = []
}

/* ========== CNN 预测主函数 ========== */
export async function runCNNModel(files, { onProgress } = {}) {
  const viewer = getViewer()
  if (!viewer) throw new Error('Viewer 未初始化')

  clearPrediction(viewer)

  // 立即飞到研究区范围（泸定地区）
  viewer.camera.flyTo({
    destination: Cesium.Rectangle.fromDegrees(101.7, 29.4, 102.7, 30.3),
    duration: 1.5,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-50),
      roll: 0
    }
  })

  // 立即显示研究区范围框
  showRegionRect(viewer)
  // 后台加载shapefile替换矩形
  loadRegionBoundary(viewer)

  // 阶段1: 模型调用 - 上传数据
  onProgress?.({ stage: 'upload', percent: 0, text: '接收训练请求...' })

  const formData = new FormData()
  formData.append('csvFile', files.csv)
  formData.append('shpFile', files.shp)
  formData.append('shxFile', files.shx)
  formData.append('dbfFile', files.dbf)
  formData.append('prjFile', files.prj)

  // 使用 XMLHttpRequest 以追踪上传进度
  const res = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', 'http://192.168.1.25:5000/process_and_visualize')

    // 上传进度: 0-50%
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 50)
        onProgress?.({ stage: 'upload', percent: pct, text: '数据上传中...' })
      }
    }

    // 上传完成后，等待服务器推理期间缓慢推进进度
    xhr.upload.onload = () => {
      onProgress?.({ stage: 'process', percent: 55, text: '数据已上传，模型训练中...' })
      // 模拟等待期间缓慢递增（60%→64%），让用户知道还在工作
      let waitPct = 55
      const waitTimer = setInterval(() => {
        if (waitPct >= 64) { clearInterval(waitTimer); return }
        waitPct += 1
        onProgress?.({ stage: 'process', percent: waitPct, text: '模型训练与调优中...' })
      }, 2000)
      // 保存timer以便xhr.onload时清除
      xhr._waitTimer = waitTimer
    }

    xhr.onload = () => {
      if (xhr._waitTimer) clearInterval(xhr._waitTimer)
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.({ stage: 'render', percent: 70, text: '生成训练结果...' })
        resolve(xhr.responseText)
      } else {
        reject(new Error(`服务器错误: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('网络错误，无法连接服务器'))
    xhr.ontimeout = () => reject(new Error('请求超时'))

    xhr.send(formData)
  })

  const data = JSON.parse(res)
  if (data.error) throw new Error(data.error)

  // 阶段2: 训练中 → 结果生成
  onProgress?.({ stage: 'render', percent: 75, text: '生成训练结果...' })

  /* ========== Cesium 可视化（等价 demo6） ========== */
  const totalFeatures = data.geojson.features.length
  data.geojson.features.forEach((feature, index) => {
    const coords = feature.geometry.coordinates[0]
    const hierarchy = coords.map(c =>
      Cesium.Cartesian3.fromDegrees(c[0], c[1])
    )

    const probability = data.predictions[index].probability
    const color = getColor(probability)

    const entity = viewer.entities.add({
      polygon: {
        hierarchy,
        material: color,
        outline: false
      }
    })

    predictionEntities.push(entity)

    // 渲染进度: 75-95%
    if (index % Math.max(1, Math.floor(totalFeatures / 10)) === 0 || index === totalFeatures - 1) {
      const renderPct = 75 + Math.round((index / totalFeatures) * 20)
      onProgress?.({ stage: 'render', percent: renderPct, text: `结果生成中 (${index + 1}/${totalFeatures})...` })
    }
  })

  onProgress?.({ stage: 'render', percent: 96, text: '生成图例...' })
  generateCNNLegend()

  onProgress?.({ stage: 'render', percent: 98, text: '导出预测结果...' })
  if (data.prediction_csv) {
    const blob = new Blob([data.prediction_csv], {
      type: 'text/csv;charset=utf-8;'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cnn_predictions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  onProgress?.({ stage: 'done', percent: 100, text: '训练完成，结果已返回' })
}
