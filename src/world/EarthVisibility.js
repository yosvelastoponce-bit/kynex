import { EARTH_ANGULAR_DIAMETER } from './EarthSystem.js'

const DEG = Math.PI / 180
const RADIUS = EARTH_ANGULAR_DIAMETER / 2

// An inexpensive, independent estimate for the HUD. The actual visible pixels
// are occluded by the 3D terrain's depth buffer, including partial disk cover.
export function earthVisibility(eye, state, sampleHeight, bounds) {
  if (state.elevation + RADIUS <= 0) return 'BAJO HORIZONTE ASTRONÓMICO'
  let exposed = 0
  let total = 0
  for (const offset of [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9]) {
    const azimuth = (state.azimuth + offset * RADIUS) * DEG
    const dx = Math.sin(azimuth), dz = -Math.cos(azimuth)
    let horizon = -90
    for (let distance = 20; distance <= 5000; distance += distance < 300 ? 20 : 80) {
      const x = eye.x + dx * distance, z = eye.z + dz * distance
      if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) break
      const terrain = sampleHeight(x, z)
      horizon = Math.max(horizon, Math.atan2(terrain - eye.y, distance) / DEG)
    }
    const halfHeight = Math.sqrt(1 - offset * offset) * RADIUS
    for (const vertical of [-0.8, -0.4, 0, 0.4, 0.8]) {
      total++
      if (state.elevation + vertical * halfHeight > horizon) exposed++
    }
  }
  if (exposed === 0) return 'OCULTA POR TERRENO'
  if (exposed === total) return 'VISIBLE'
  return 'PARCIALMENTE OCULTA'
}
