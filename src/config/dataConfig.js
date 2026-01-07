// MapLibre 图谱可视化数据准备说明
// 
// 为了使图谱可视化功能正常工作，需要在 public 目录下准备以下数据文件：
//
// 1. 创建文件夹结构：
//    public/
//    ├── sun/
//    │   └── output1.geojson  (滑坡点位GeoJSON数据)
//    └── svg/
//        └── LOC.png          (地图标记图标)
//
// 2. output1.geojson 格式示例：
// {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "geometry": {
//         "type": "Point",
//         "coordinates": [经度, 纬度]
//       },
//       "properties": {
//         "LOC": "地点名称",
//         // 其他属性...
//       }
//     }
//   ]
// }
//
// 3. Neo4j 数据库配置：
//    - 确保 Neo4j 数据库运行在 bolt://localhost:7687
//    - 用户名: neo4j
//    - 密码: 21151211
//    - 如需修改连接信息，请编辑 src/components/MapLibreViewer.vue 中的 getCypherResult 函数
//
// 4. 如果暂时没有数据文件，可以创建空的GeoJSON文件：
//    public/sun/output1.geojson
//    内容：{"type": "FeatureCollection", "features": []}

export const DATA_PREPARATION_GUIDE = {
  requiredFiles: [
    'public/sun/output1.geojson',
    'public/svg/LOC.png'
  ],
  neo4jConfig: {
    url: 'bolt://localhost:7687',
    username: 'neo4j',
    password: '21151211'
  }
}
