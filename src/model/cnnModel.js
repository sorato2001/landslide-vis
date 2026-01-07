import * as Cesium from 'cesium'
import { getViewer } from '@/cesium/viewer'

let predictionEntities = []
let legendDiv = null

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
export async function runCNNModel(files) {
  const viewer = getViewer()
  if (!viewer) throw new Error('Viewer 未初始化')

  clearPrediction(viewer)

  const formData = new FormData()
  formData.append('csvFile', files.csv)
  formData.append('shpFile', files.shp)
  formData.append('shxFile', files.shx)
  formData.append('dbfFile', files.dbf)
  formData.append('prjFile', files.prj)

  const res = await fetch('http://127.0.0.1:5000/process_and_visualize', {
    method: 'POST',
    body: formData
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error)

  /* ========== Cesium 可视化（等价 demo6） ========== */
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
  })

  generateCNNLegend()

  /* ========== 自动对准预测结果 ========== */
  if (predictionEntities.length > 0) {
    viewer.flyTo(predictionEntities, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(
        0.0,
        Cesium.Math.toRadians(-45),
        0
      )
    })
  }

  /* ========== 下载 CSV（完全保留 demo6 行为） ========== */
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
}
