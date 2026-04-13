import * as Cesium from 'cesium'
import { getViewer } from './viewer'

/**
 * Cesium 滑坡点与图谱联动模块
 * 负责：
 * 1. 在 Cesium 中显示/高亮/筛选滑坡点
 * 2. 点击滑坡点时触发图谱查询（通过回调）
 * 3. 外部调用高亮并飞行到指定点
 */

let landslideEntities = []      // 所有滑坡点实体
let highlightedEntity = null     // 当前高亮的实体
let clickHandler = null          // Cesium 点击事件处理器
let onPointClickCallback = null  // 图谱查询回调

/**
 * 设置点击滑坡点时的回调函数（由 GraphPanel 调用）
 * @param {Function} callback - 回调函数，参数为 (loc, lng, lat, properties)
 */
export function setOnPointClickCallback(callback) {
  onPointClickCallback = callback
}

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
      const loc = entity.properties?.LOC?.getValue() || ''
      entity._customLoc = loc
    })

    viewer.dataSources.add(dataSource)
    landslideEntities = entities

    // 设置 Cesium 点击事件
    setupClickHandler(viewer)

    console.log(`Cesium 中加载了 ${entities.length} 个滑坡点`)
    return dataSource
  } catch (error) {
    console.warn('Cesium 加载滑坡点失败:', error.message)
  }
}

/**
 * 设置 Cesium 点击事件 - 点击滑坡点时触发图谱查询
 */
function setupClickHandler(viewer) {
  // 移除旧的点击处理器
  if (clickHandler) {
    clickHandler.destroy()
    clickHandler = null
  }

  clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  clickHandler.setInputAction((click) => {
    const pickedObject = viewer.scene.pick(click.position)
    if (Cesium.defined(pickedObject) && pickedObject.id) {
      const entity = pickedObject.id
      if (entity && entity._customLoc) {
        const loc = entity._customLoc
        const pos = entity.position?.getValue(Cesium.JulianDate.now())
        let lng = null, lat = null
        if (pos) {
          const carto = Cesium.Cartographic.fromCartesian(pos)
          lng = Cesium.Math.toDegrees(carto.longitude)
          lat = Cesium.Math.toDegrees(carto.latitude)
        }

        // 高亮此点
        highlightAndFlyToCesiumPoint(lng, lat, loc)

        // 触发图谱查询回调
        if (onPointClickCallback) {
          // 获取所有属性
          const props = {}
          if (entity.properties) {
            const propertyNames = entity.properties.propertyNames
            for (const name of propertyNames) {
              props[name] = entity.properties[name]?.getValue()
            }
          }
          onPointClickCallback(loc, lng, lat, props)
        }
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
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
    if (loc && e._customLoc === loc) return true
    if (lng != null && lat != null) {
      const pos = e.position?.getValue(Cesium.JulianDate.now())
      if (pos) {
        const carto = Cesium.Cartographic.fromCartesian(pos)
        const eLng = Cesium.Math.toDegrees(carto.longitude)
        const eLat = Cesium.Math.toDegrees(carto.latitude)
        return Math.abs(eLng - lng) < 0.001 && Math.abs(eLat - lat) < 0.001
      }
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

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 500000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 2.0,
    })
  } else if (lng != null && lat != null) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 500000),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 2.0,
    })

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

  if (clickHandler) {
    clickHandler.destroy()
    clickHandler = null
  }

  landslideEntities = []
  highlightedEntity = null
}
