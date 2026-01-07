import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

let viewer = null

export function initCesium(containerId) {
  if (viewer) return viewer

  Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0NDg1ZTc5My1iODBjLTQwNTYtYjdjMC0zMjE5NDNiNDA2OWIiLCJpZCI6OTg4MjAsImlhdCI6MTcwOTU5NTAwNH0.ruYh5ktTx1EGLG1Tr9_BaoQ3LXT0dpO1zXbYkoT10HE'

  viewer = new Cesium.Viewer(containerId, {
    terrain: Cesium.Terrain.fromWorldTerrain(),
    imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),
    animation: false,
    Clock: false,
    timeline: false
  })

  return viewer
}

export function getViewer() {
  return viewer
}
