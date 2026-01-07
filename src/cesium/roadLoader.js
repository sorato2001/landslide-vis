import shp from 'shpjs'
import * as Cesium from 'cesium'
import { getViewer } from './viewer'

let roadSource = null

export async function loadRoadZip(files) {

    const viewer = getViewer()
    if (!viewer) throw new Error('Cesium Viewer 未初始化')

    const zipFile = files[0]
    if (!zipFile) throw new Error('未选择 zip 文件')

    const arrayBuffer = await zipFile.arrayBuffer()

    // ⭐ 唯一正确的调用方式
    const geojson = await shp(arrayBuffer)

    if (roadSource) {
        viewer.dataSources.remove(roadSource, true)
    }

    roadSource = await Cesium.GeoJsonDataSource.load(geojson, {
        stroke: Cesium.Color.YELLOW,
        fill: Cesium.Color.YELLOW.withAlpha(0.5),
        strokeWidth: 2,
        clampToGround: true
    })

    viewer.dataSources.add(roadSource)
    viewer.flyTo(roadSource)
}

export function setRoadVisible(v) {
  if (roadSource) roadSource.show = v
}
