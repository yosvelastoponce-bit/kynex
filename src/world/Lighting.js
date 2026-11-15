import * as THREE from 'three'

export function createLighting(scene, sampleHeight) {
  // One local shadow window follows the astronaut; distant terrain is outside it.
  const sunlight = new THREE.DirectionalLight(0xffe9d0, 3.1)
  sunlight.castShadow = true
  sunlight.shadow.mapSize.set(2048, 2048)
  sunlight.shadow.camera.left = -230
  sunlight.shadow.camera.right = 230
  sunlight.shadow.camera.top = 230
  sunlight.shadow.camera.bottom = -230
  sunlight.shadow.camera.near = 1
  sunlight.shadow.camera.far = 1450
  sunlight.shadow.bias = -0.00005
  sunlight.shadow.normalBias = 0.3
  scene.add(sunlight, sunlight.target)

  // Small indirect fill keeps shadowed terrain legible without atmospheric light.
  const fill = new THREE.HemisphereLight(0x8d9ba7, 0x090a0b, 0.12)
  scene.add(fill)
  let lastX = Number.POSITIVE_INFINITY, lastZ = Number.POSITIVE_INFINITY, lastAzimuth = Number.POSITIVE_INFINITY, lastElevation = Number.POSITIVE_INFINITY

  function updateAround(x, z, state, force = false) {
    const lit = state.aboveHorizon
    sunlight.intensity = lit ? 3.1 : 0
    sunlight.castShadow = lit
    if (!force && Math.hypot(x - lastX, z - lastZ) < 8
      && Math.abs(state.azimuth - lastAzimuth) < 0.12
      && Math.abs(state.elevation - lastElevation) < 0.02) return false
    lastX = x
    lastZ = z
    lastAzimuth = state.azimuth
    lastElevation = state.elevation
    const ground = sampleHeight(x, z)
    sunlight.position.set(x + state.direction.x * 650, ground + state.direction.y * 650, z + state.direction.z * 650)
    sunlight.target.position.set(x, ground, z)
    sunlight.target.updateMatrixWorld()
    return true
  }
  return { sunlight, fill, updateAround }
}
