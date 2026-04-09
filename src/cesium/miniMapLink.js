import * as Cesium from 'cesium'
import { getViewer } from './viewer'

/**
 * Cesium 与 MapLibre 联动模块
 * 负责：
 * 1. 在 Cesium 中显示/高亮 MapLibre 筛选出的滑坡点
 * 2. MapLibre 点击点时在 Cesium 中飞行并高亮
 */

let landslideEntities = []      // 所有滑坡点实体
let highlightedEntity = null     // 当前高亮的实体
let highlightHandler = null      // 点击事件处理器

/**
 * 在 Cesium 中加载滑坡点位（从 GeoJSON 数据）
 */
export async function loadLandslidePointsInCesium(geoJsonUrl) {
  const viewer = getViewer()
  if (!viewer) return

  // 清除旧实体
  clearLandslidePoints()

  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, {
      clampToGround: true,
    })

    const entities = dataSource.entities.values
    entities.forEach((entity) => {
      if (entity.billboard) {
        // 移除默认 billboard，改用 point
        entity.billboard = undefined
      }
      entity.point = {
        pixelSize: 10,
        color: Cesium.Color.RED.withAlpha(0.85),
        outlineColor: Cesium.Color.WHITE.withAlpha(0.8),
        outlineWidth: 1,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: 10000,
      }
      // 保存 LOC 属性用于筛选
      const loc = entity.properties?.LOC?.getValue() || ''
      entity._customLoc = loc
    })

    viewer.dataSources.add(dataSource)
    landslideEntities = entities

    console.log(`Cesium 中加载了 ${entities.length} 个滑坡点`)
    return dataSource
  } catch (error) {
    console.warn('Cesium 加载滑坡点失败:', error.message)
  }
}

/**
 * 根据筛选条件显示/隐藏 Cesium 中的点
 * @param {string} filterText - 筛选文本
 * @param {string[]} allLocValues - 所有的 LOC 值列表
 */
export function filterCesiumPoints(filterText, allLocValues) {
  const viewer = getViewer()
  if (!viewer || landslideEntities.length === 0) return

  if (!filterText || filterText.trim() === '') {
    // 无筛选，显示所有点
    landslideEntities.forEach((entity) => {
      entity.show = true
      entity.point = entity.point || {}
      entity.point.pixelSize = 10
      entity.point.color = Cesium.Color.RED.withAlpha(0.85)
    })
    return
  }

  const searchWords = filterText.trim().toLowerCase().split(/\s+/)

  landslideEntities.forEach((entity) => {
    const loc = (entity._customLoc || '').toLowerCase()
    const matches = searchWords.some((word) => loc.includes(word))
    entity.show = matches
    if (matches) {
      entity.point = entity.point || {}
      entity.point.pixelSize = 14
      entity.point.color = Cesium.Color.YELLOW.withAlpha(0.95)
      entity.point.outlineColor = Cesium.Color.WHITE
      entity.point.outlineWidth = 2
      entity.point.disableDepthTestDistance = 10000
    }
  })
}

/**
 * 在 Cesium 中高亮指定坐标的滑坡点并飞行过去
 * @param {number} lng - 经度
 * @param {number} lat - 纬度
 * @param {string} loc - LOC 属性名
 */
export function highlightAndFlyToCesiumPoint(lng, lat, loc) {
  const viewer = getViewer()
  if (!viewer) return

  // 取消之前的高亮
  if (highlightedEntity) {
    highlightedEntity.point = highlightedEntity.point || {}
    highlightedEntity.point.color = Cesium.Color.RED.withAlpha(0.85)
    highlightedEntity.point.pixelSize = 10
    highlightedEntity.point.outlineWidth = 1
    highlightedEntity = null
  }

  // 查找匹配实体
  const target = landslideEntities.find((e) => {
    if (e._customLoc === loc) return true
    // 也尝试坐标匹配
    const pos = e.position?.getValue(Cesium.JulianDate.now())
    if (pos) {
      const carto = Cesium.Cartographic.fromCartesian(pos)
      const eLng = Cesium.Math.toDegrees(carto.longitude)
      const eLat = Cesium.Math.toDegrees(carto.latitude)
      return Math.abs(eLng - lng) < 0.001 && Math.abs(eLat - lat) < 0.001
    }
    return false
  })

  if (target) {
    highlightedEntity = target
    target.point = target.point || {}
    target.point.color = Cesium.Color.LIME
    target.point.pixelSize = 20
    target.point.outlineColor = Cesium.Color.WHITE
    target.point.outlineWidth = 3
    target.point.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
    target.point.disableDepthTestDistance = 10000

    viewer.flyTo(target, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(
        0.0,
        Cesium.Math.toRadians(-45),
        0
      ),
    })
  } else {
    // 没有找到实体，直接飞到坐标
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 5000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 2.0,
    })

    // 在该位置创建临时高亮点
    const tempEntity = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lng, lat),
      point: {
        pixelSize: 20,
        color: Cesium.Color.LIME,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 3,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: 10000,
      },
    })
    // 5秒后移除临时点
    setTimeout(() => {
      viewer.entities.remove(tempEntity)
    }, 8000)
  }
}

/**
 * 清除所有滑坡点
 */
export function clearLandslidePoints() {
  const viewer = getViewer()
  if (!viewer) return

  // 注意：不在这里移除 dataSource，因为可能由其他模块管理
  landslideEntities = []
  highlightedEntity = null
}
