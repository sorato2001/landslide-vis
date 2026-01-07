import shp from 'shpjs'
import proj4 from 'proj4'
import * as Cesium from 'cesium'
import { getViewer } from './viewer'

/* =========================
   1. 土壤类型定义
========================= */

export const soilTypes = {
  '01': '南方水稻土',
  '02': '鲜血水稻土',
  '03': '北方水稻土',
  '04': '黄刚土',
  '05': '黄堰土'
}

/* =========================
   2. 颜色分配（完全保留）
========================= */

const predefinedColors = [
  Cesium.Color.fromCssColorString('rgba(230,25,75,0.7)'),
  Cesium.Color.fromCssColorString('rgba(60,180,75,0.7)'),
  Cesium.Color.fromCssColorString('rgba(0,130,200,0.7)'),
  Cesium.Color.fromCssColorString('rgba(255,225,25,0.7)'),
  Cesium.Color.fromCssColorString('rgba(245,130,48,0.7)')
]

let colorAssignIndex = 0
const assignedDlColorsCache = {}

export function getSoilColor(dl) {
  if (assignedDlColorsCache[dl]) return assignedDlColorsCache[dl]
  const color = predefinedColors[colorAssignIndex % predefinedColors.length]
  assignedDlColorsCache[dl] = color
  colorAssignIndex++
  return color
}

/* =========================
   3. 主入口：Vue 调用
========================= */

let currentSoilDataSource = null

export async function loadSoilShp(files) {
  const viewer = getViewer()
  if (!viewer) throw new Error('Cesium Viewer 未初始化')

  const zipFile = files[0]
  if (!zipFile) throw new Error('未选择 zip 文件')

  const arrayBuffer = await zipFile.arrayBuffer()

  // ⭐ 唯一正确的调用方式
  const geojson = await shp(arrayBuffer)

  return loadGeoJSONToCesium(geojson, viewer)
}


/* =========================
   6. GeoJSON → Cesium
========================= */

function loadGeoJSONToCesium(geojson, viewer) {
  if (currentSoilDataSource) {
    viewer.dataSources.remove(currentSoilDataSource, true)
    currentSoilDataSource = null
  }

  const loadedDlSet = new Set()

  return Cesium.GeoJsonDataSource.load(geojson, {
    clampToGround: true
  }).then((ds) => {
    currentSoilDataSource = ds

    ds.entities.values.forEach((entity) => {
      const props = entity.properties
      if (!props) return

      const raw = props.DL?.getValue()
      let dl = raw ? String(raw).padStart(2, '0') : null

      if (dl && soilTypes[dl]) {
        loadedDlSet.add(dl)
        entity.polygon.material = getSoilColor(dl)
        entity.polygon.outline = true
        entity.polygon.outlineColor = Cesium.Color.BLACK

        entity.description = `
          <table>
            <tr><td>DL</td><td>${dl}</td></tr>
            <tr><td>类型</td><td>${soilTypes[dl]}</td></tr>
          </table>`
      } else {
        entity.polygon.material = Cesium.Color.GRAY.withAlpha(0.4)
      }
    })

    viewer.dataSources.add(ds)
    viewer.flyTo(ds)

    // ⭐ 返回给 Vue：用于图例
    return Array.from(loadedDlSet)
  })
}

/* =========================
   工具函数
========================= */

function transformCoords(coords, transformer) {
  if (typeof coords[0] === 'number') {
    return transformer.forward(coords)
  }
  return coords.map((c) => transformCoords(c, transformer))
}

// soilLoader.js 末尾新增

export function setSoilVisible(visible) {
  if (currentSoilDataSource) {
    currentSoilDataSource.show = visible
  }
}

export function setSoilOpacity(alpha) {
  if (!currentSoilDataSource) return

  currentSoilDataSource.entities.values.forEach((entity) => {
    if (entity.polygon && entity.polygon.material?.color) {
      const c = entity.polygon.material.color.getValue()
      entity.polygon.material = c.withAlpha(alpha)
    }
  })
}
