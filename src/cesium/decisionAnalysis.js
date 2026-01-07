import * as Cesium from 'cesium'
import { getViewer } from './viewer'

let rescueDataSource = null
let legendDiv = null

/**
 * 优先级颜色映射
 * 根据救援优先级返回对应的颜色
 * 支持数字(1-5)和中文字符串两种格式
 */
function getPriorityColor(priority) {
  // 处理数字优先级 (1=最高, 5=最低)
  const numPriority = parseInt(priority)
  if (!isNaN(numPriority)) {
    switch (numPriority) {
      case 1:
        return Cesium.Color.FIREBRICK.withAlpha(0.7)  // 最高优先级 - 红色
      case 2:
        return Cesium.Color.ORANGE.withAlpha(0.7)     // 高优先级 - 橙色
      case 3:
        return Cesium.Color.GOLD.withAlpha(0.7)       // 中优先级 - 金色
      case 4:
        return Cesium.Color.FORESTGREEN.withAlpha(0.7) // 低优先级 - 绿色
      case 5:
        return Cesium.Color.BLUE.withAlpha(0.7)       // 极低优先级 - 蓝色
      default:
        return Cesium.Color.SLATEGRAY.withAlpha(0.6)
    }
  }
  
  // 处理中文字符串优先级
  const colors = {
    '极高优先级': Cesium.Color.FIREBRICK.withAlpha(0.7),
    '高优先级': Cesium.Color.ORANGE.withAlpha(0.7),
    '中优先级': Cesium.Color.GOLD.withAlpha(0.7),
    '低优先级': Cesium.Color.FORESTGREEN.withAlpha(0.7),
    '极低优先级': Cesium.Color.BLUE.withAlpha(0.7)
  }
  return colors[priority] || Cesium.Color.SLATEGRAY.withAlpha(0.6)
}

/**
 * 生成图例
 */
export function generateRescueLegend(priorityLevels) {
  const viewer = getViewer()
  if (!viewer) return

  // 移除旧图例
  if (legendDiv) {
    legendDiv.remove()
    legendDiv = null
  }

  if (!priorityLevels || priorityLevels.length === 0) return

  legendDiv = document.createElement('div')
  legendDiv.id = 'rescuePriorityLegend'
  legendDiv.style.position = 'absolute'
  legendDiv.style.bottom = '50px'
  legendDiv.style.left = '20px'
  legendDiv.style.background = 'rgba(255,255,255,0.95)'
  legendDiv.style.padding = '16px'
  legendDiv.style.borderRadius = '12px'
  legendDiv.style.zIndex = '1000'
  legendDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  legendDiv.style.minWidth = '200px'

  const title = document.createElement('h4')
  title.innerText = '救援优先级'
  title.style.margin = '0 0 12px 0'
  title.style.fontSize = '16px'
  title.style.fontWeight = '600'
  title.style.color = '#333'
  legendDiv.appendChild(title)

  priorityLevels.forEach((level) => {
    const item = document.createElement('div')
    item.style.display = 'flex'
    item.style.alignItems = 'center'
    item.style.marginBottom = '8px'

    const colorBox = document.createElement('div')
    colorBox.style.width = '24px'
    colorBox.style.height = '24px'
    colorBox.style.marginRight = '10px'
    colorBox.style.borderRadius = '4px'
    
    const color = getPriorityColor(level.level)
    colorBox.style.background = `rgba(${color.red * 255}, ${color.green * 255}, ${color.blue * 255}, ${color.alpha})`
    colorBox.style.border = '1px solid rgba(0,0,0,0.1)'

    const label = document.createElement('span')
    label.innerText = `${level.level} (${level.count || 0})`
    label.style.fontSize = '14px'
    label.style.color = '#666'

    item.appendChild(colorBox)
    item.appendChild(label)
    legendDiv.appendChild(item)
  })

  viewer.container.appendChild(legendDiv)
}

/**
 * 可视化救援优先级数据
 */
export async function visualizeRescuePriority(rescueData, priorityLevels) {
  const viewer = getViewer()
  if (!viewer) throw new Error('Viewer 未初始化')

  // 清除旧的数据源
  if (rescueDataSource) {
    viewer.dataSources.remove(rescueDataSource)
    rescueDataSource = null
  }

  // 创建新的数据源
  rescueDataSource = new Cesium.GeoJsonDataSource('rescue-priority')
  
  try {
    await rescueDataSource.load(rescueData, {
      clampToGround: true
    })

    console.log('GeoJSON数据加载成功')
    console.log('第一个要素的属性:', rescueData.features[0]?.properties)

    // 为每个实体设置样式
    const entities = rescueDataSource.entities.values
    console.log(`共 ${entities.length} 个实体`)
    
    entities.forEach((entity, index) => {
      if (entity.polygon) {
        // 尝试多种属性名称（兼容不同后端返回格式）
        let priority = null
        if (entity.properties?.rescue_priority) {
          priority = entity.properties.rescue_priority.getValue()
        } else if (entity.properties?.priority) {
          priority = entity.properties.priority.getValue()
        }
        
        if (index === 0) {
          console.log('第一个实体的优先级:', priority, '类型:', typeof priority)
        }
        
        const color = getPriorityColor(priority)
        
        entity.polygon.material = color
        entity.polygon.outline = true
        entity.polygon.outlineColor = Cesium.Color.BLACK.withAlpha(0.8)
        entity.polygon.outlineWidth = 1

        // 添加描述信息
        if (entity.properties) {
          const props = entity.properties
          const description = `
            <div style="font-family: Arial, sans-serif; padding: 10px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">救援信息</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px; font-weight: bold;">优先级:</td>
                  <td style="padding: 4px;">${priority || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px; font-weight: bold;">危险度:</td>
                  <td style="padding: 4px;">${props.probability?.getValue() || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px; font-weight: bold;">人口:</td>
                  <td style="padding: 4px;">${props.population?.getValue() || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px; font-weight: bold;">建筑物数量:</td>
                  <td style="padding: 4px;">${props.building_count?.getValue() || 'N/A'}</td>
                </tr>
              </table>
            </div>
          `
          entity.description = description
        }
      }
    })

    // 添加到场景
    await viewer.dataSources.add(rescueDataSource)

    // 飞行到数据位置
    viewer.flyTo(rescueDataSource, {
      duration: 2.0,
      offset: new Cesium.HeadingPitchRange(
        0.0,
        Cesium.Math.toRadians(-45),
        0
      )
    })

    // 生成图例
    if (priorityLevels) {
      generateRescueLegend(priorityLevels)
    }

    console.log('救援优先级数据可视化完成')

  } catch (error) {
    console.error('救援优先级可视化失败:', error)
    throw error
  }

  return rescueDataSource
}

/**
 * 切换救援优先级可视化显示
 */
export function toggleRescuePriorityVisibility(visible) {
  if (!rescueDataSource) return

  rescueDataSource.show = visible

  if (legendDiv) {
    legendDiv.style.display = visible ? 'block' : 'none'
  }
}

/**
 * 清除救援优先级可视化
 */
export function clearRescuePriority() {
  const viewer = getViewer()
  if (!viewer) return

  if (rescueDataSource) {
    viewer.dataSources.remove(rescueDataSource)
    rescueDataSource = null
  }

  if (legendDiv) {
    legendDiv.remove()
    legendDiv = null
  }
}

/**
 * 获取当前数据源
 */
export function getRescueDataSource() {
  return rescueDataSource
}
