import * as Cesium from 'cesium'
import { getViewer } from './viewer'
import shp from 'shpjs'

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
 * 根据筛选条件显示/隐藏 Cesium 中的点（支持区域+因子+方法三重筛选）
 * @param {Object} options - 筛选选项
 * @param {string} options.regionText - 区域筛选文本
 * @param {Set<string>|null} options.factorLocs - 因子筛选结果的 LOC 集合，null 表示未筛选
 * @param {string[]|null} options.methodClass4Values - 方法筛选的 class4 值列表，null 表示未筛选
 * @returns {number} 可见点数量
 */
export function filterCesiumPointsAdvanced({ regionText, factorLocs, methodClass4Values }) {
  const viewer = getViewer()
  if (!viewer || landslideEntities.length === 0) return 0

  const regionWords = regionText && regionText.trim() !== ''
    ? regionText.trim().toLowerCase().split(/\s+/)
    : []

  const hasNoFilter = regionWords.length === 0 && factorLocs === null && (!methodClass4Values || methodClass4Values.length === 0)

  let visibleCount = 0

  landslideEntities.forEach((entity) => {
    // 无任何筛选时恢复默认
    if (hasNoFilter) {
      entity.show = true
      entity.point = entity.point || {}
      entity.point.pixelSize = 10
      entity.point.color = Cesium.Color.RED.withAlpha(0.85)
      entity.point.outlineColor = Cesium.Color.WHITE.withAlpha(0.8)
      entity.point.outlineWidth = 1
      return
    }

    const loc = (entity._customLoc || '').toLowerCase()
    const locName = entity._customLoc || ''

    // 1. 区域筛选
    let regionMatch = true
    if (regionWords.length > 0) {
      regionMatch = regionWords.some((word) => loc.includes(word))
    }

    // 2. 因子筛选
    let factorMatch = true
    if (factorLocs !== null) {
      factorMatch = factorLocs.has(locName)
    }

    // 3. 方法筛选（基于 class4 属性）
    let methodMatch = true
    if (methodClass4Values && methodClass4Values.length > 0) {
      const class4Val = entity.properties?.class4?.getValue()
      if (class4Val != null) {
        methodMatch = methodClass4Values.includes(String(class4Val))
      } else {
        methodMatch = false
      }
    }

    const visible = regionMatch && factorMatch && methodMatch
    entity.show = visible

    if (visible) {
      entity.point = entity.point || {}
      entity.point.pixelSize = 14
      entity.point.color = Cesium.Color.YELLOW.withAlpha(0.95)
      entity.point.outlineColor = Cesium.Color.WHITE
      entity.point.outlineWidth = 2
      entity.point.disableDepthTestDistance = 10000
      visibleCount++
    } else {
      entity.point = entity.point || {}
      entity.point.pixelSize = 10
      entity.point.color = Cesium.Color.RED.withAlpha(0.3)
      entity.point.outlineColor = Cesium.Color.WHITE.withAlpha(0.3)
      entity.point.outlineWidth = 1
    }
  })

  return visibleCount
}

/**
 * 根据筛选条件显示/隐藏 Cesium 中的点（简单文本筛选，兼容旧接口）
 */
export function filterCesiumPoints(filterText, allLocValues) {
  return filterCesiumPointsAdvanced({
    regionText: filterText,
    factorLocs: null,
    methodClass4Values: null,
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

let adminBoundaryDataSource = null  // 行政区划边界数据源

/**
 * 在 Cesium 中加载四川省行政区划边界
 * @param {string} geoJsonUrl - GeoJSON 文件路径
 * @returns {Cesium.GeoJsonDataSource|null}
 */
export async function loadAdminBoundary(geoJsonUrl) {
  const viewer = getViewer()
  if (!viewer) return null

  // 如果已加载，直接返回
  if (adminBoundaryDataSource) {
    return adminBoundaryDataSource
  }

  try {
    const dataSource = await Cesium.GeoJsonDataSource.load(geoJsonUrl, {
      clampToGround: true,
    })

    const entities = dataSource.entities.values
    entities.forEach((entity) => {
      // 多边形填充
      if (entity.polygon) {
        entity.polygon.material = Cesium.Color.CYAN.withAlpha(0.12)
        entity.polygon.outline = true
        entity.polygon.outlineColor = Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.8)
        entity.polygon.outlineWidth = 2
        entity.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND
      }
      // 如果是线实体
      if (entity.polyline) {
        entity.polyline.material = Cesium.Color.fromCssColorString('#00d4ff').withAlpha(0.8)
        entity.polyline.width = 2
        entity.polyline.clampToGround = true
      }
    })

    viewer.dataSources.add(dataSource)
    adminBoundaryDataSource = dataSource

    console.log('四川省行政区划边界已加载')
    return dataSource
  } catch (error) {
    console.warn('加载行政区划边界失败:', error.message)
    return null
  }
}

/**
 * 设置行政区划边界的可见性
 * @param {boolean} visible
 */
export function setAdminBoundaryVisible(visible) {
  if (adminBoundaryDataSource) {
    adminBoundaryDataSource.show = visible
  }
}

/**
 * 获取行政区划边界是否已加载
 * @returns {boolean}
 */
export function isAdminBoundaryLoaded() {
  return adminBoundaryDataSource !== null
}

/**
 * 获取行政区划边界是否可见
 * @returns {boolean}
 */
export function isAdminBoundaryVisible() {
  return adminBoundaryDataSource ? adminBoundaryDataSource.show : false
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

/* ========== 芦山地震滑坡点加载 ========== */
let lushanDataSource = null

/**
 * 加载芦山地震滑坡 shapefile，用灰色点显示
 */
export async function loadLushanLandslide() {
  const viewer = getViewer()
  if (!viewer) return

  // 如果已加载，切换可见性
  if (lushanDataSource) {
    lushanDataSource.show = !lushanDataSource.show
    return lushanDataSource.show
  }

  try {
    const [shpBuf, dbfBuf] = await Promise.all([
      fetch('/sun/lushan_landslide/lushan_shape.shp').then(r => r.arrayBuffer()),
      fetch('/sun/lushan_landslide/lushan_shape.dbf').then(r => r.arrayBuffer()),
    ])
    const geojson = await shp({ shp: shpBuf, dbf: dbfBuf })

    lushanDataSource = await Cesium.GeoJsonDataSource.load(geojson, {
      clampToGround: true,
    })

    const entities = lushanDataSource.entities.values
    entities.forEach((entity) => {
      if (entity.billboard) entity.billboard = undefined
      if (entity.polygon) {
        // 多边形转质心点
        const positions = entity.polygon.hierarchy?.getValue(Cesium.JulianDate.now())?.positions
        if (positions && positions.length > 0) {
          const center = Cesium.BoundingSphere.fromPoints(positions).center
          const carto = Cesium.Cartographic.fromCartesian(center)
          entity.position = Cesium.Cartesian3.fromDegrees(
            Cesium.Math.toDegrees(carto.longitude),
            Cesium.Math.toDegrees(carto.latitude)
          )
          entity.polygon = undefined
          entity.point = {
            pixelSize: 5,
            color: Cesium.Color.fromCssColorString('#888888').withAlpha(0.85),
            outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: 10000,
          }
        }
      } else {
        // 已有点数据
        entity.point = {
          pixelSize: 5,
          color: Cesium.Color.fromCssColorString('#888888').withAlpha(0.85),
          outlineColor: Cesium.Color.WHITE.withAlpha(0.5),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: 10000,
        }
      }
    })

    viewer.dataSources.add(lushanDataSource)
    console.log(`芦山地震滑坡点已加载: ${entities.length} 个`)
    return true
  } catch (e) {
    console.warn('芦山滑坡shapefile加载失败:', e)
    return false
  }
}
