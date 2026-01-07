# 图谱可视化功能集成说明

## 功能概述

本项目已成功集成MapLibre图谱查询和地图可视化功能，支持在Cesium三维视图和MapLibre图谱视图之间切换。

## 主要功能

### 1. 视图切换
- 右上角有一个渐变紫色按钮，用于切换视图模式
- **三维模式**: 原有的Cesium 3D地图和模型预测功能
- **图谱模式**: MapLibre 2D地图 + Neo4j知识图谱可视化

### 2. 图谱模式功能
- 双地图联动（主地图 + 小地图）
- 滑坡点位可视化
- 点击滑坡点自动查询和展示知识图谱
- 三个过滤器（研究区域、关键因素、方法类别）
- 图谱显示/隐藏控制按钮
- 属性信息窗口

## 数据准备

### 1. GeoJSON数据文件
需要在 `public/sun/output1.geojson` 放置滑坡点位数据：

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [经度, 纬度]
      },
      "properties": {
        "LOC": "地点名称",
        "其他属性": "值"
      }
    }
  ]
}
```

### 2. 地图标记图标（可选）
在 `public/svg/LOC.png` 放置自定义标记图标

### 3. Neo4j数据库配置
- **URL**: bolt://localhost:7687
- **用户名**: neo4j
- **密码**: 21151211

如需修改，编辑 `src/components/MapLibreViewer.vue` 中的 `getCypherResult` 函数

## 文件结构

```
landslide-vis/
├── src/
│   ├── components/
│   │   ├── CesiumViewer.vue      # Cesium三维视图
│   │   ├── MapLibreViewer.vue    # MapLibre图谱视图（新增）
│   │   ├── LeftMenu.vue
│   │   ├── DataPanel.vue
│   │   └── model/
│   │       └── ModelPanel.vue
│   ├── config/
│   │   └── dataConfig.js         # 数据配置说明（新增）
│   └── App.vue                   # 主应用（已修改）
├── public/
│   ├── sun/
│   │   └── output1.geojson       # 滑坡点位数据（需要准备）
│   └── svg/
│       └── LOC.png               # 地图标记图标（可选）
└── package.json                  # 已添加新依赖
```

## 新增依赖包

已安装以下npm包：
- `maplibre-gl`: MapLibre地图库
- `d3`: 数据可视化和力导向图布局
- `d3-dsv`: CSV/TSV解析
- `d3-force-3d`: 3D力导向图
- `force-graph`: 2D力导向图组件
- `neo4j-driver`: Neo4j数据库驱动
- `three`: 3D图形库

## 使用说明

### 启动项目
```bash
npm run dev
```

### 切换视图
1. 项目启动后默认显示Cesium三维模式
2. 点击右上角的"📊 图谱模式"按钮切换到图谱视图
3. 在图谱模式下，点击"🌍 三维模式"按钮返回Cesium视图

### 图谱模式操作
1. **查看滑坡点位**: 地图上显示所有滑坡点（红色圆点）
2. **点击滑坡点**: 
   - 地图自动飞行到该点并放大
   - 自动查询Neo4j数据库获取相关图谱
   - 显示知识图谱（如果连接成功）
   - 显示属性信息窗口
3. **控制图谱显示**: 点击右侧的"G"按钮显示/隐藏图谱
4. **过滤滑坡点**: 使用顶部的三个过滤输入框
5. **操作图谱**: 右键点击节点可以聚焦查看

## 错误处理

如果遇到以下情况，系统会优雅降级：
- Neo4j数据库未连接：图谱功能不可用，但地图仍可正常使用
- GeoJSON文件缺失：控制台会提示，不影响其他功能
- 数据文件为空：控制台会给出提示信息

## 注意事项

1. **MapTiler API Key**: 当前使用的是示例key，生产环境建议更换为自己的key
2. **Neo4j连接**: 确保Neo4j数据库正在运行，否则图谱功能不可用
3. **数据文件**: 首次使用需要准备GeoJSON数据文件
4. **性能**: 大量节点时图谱渲染可能较慢，建议限制查询数量

## 技术特点

- Vue 3 Composition API
- 响应式视图切换
- 错误容错机制
- 地图联动同步
- 力导向图布局
- 实时数据库查询

## 后续扩展建议

1. 添加图谱节点详情面板
2. 实现更多过滤器功能
3. 添加数据导出功能
4. 优化大规模图谱渲染性能
5. 添加图谱搜索功能
