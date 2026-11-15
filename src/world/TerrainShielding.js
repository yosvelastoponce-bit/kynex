import { heightAt } from './LunarTerrain.js'

const DEG = Math.PI / 180
const RAY_DISTANCES = [25, 50, 100, 200, 400, 800, 1200]
export const RADIATION_CELL_METERS = 100
export const HORIZON_SAMPLES = 16

// Angles are clockwise from world -Z. Values are stable world coordinates,
// independent of the moving render mesh and visible-light shadow map.
export function sampleHorizon(x, z, sampleHeight = heightAt, directions = HORIZON_SAMPLES) {
  const eyeHeight = sampleHeight(x, z) + 1.7
  const angles = new Float32Array(directions)
  for (let i = 0; i < directions; i++) {
    const angle = i * Math.PI * 2 / directions
    const dx = Math.sin(angle), dz = -Math.cos(angle)
    let highest = 0
    for (const distance of RAY_DISTANCES) {
      const rise = sampleHeight(x + dx * distance, z + dz * distance) - eyeHeight
      highest = Math.max(highest, Math.atan2(rise, distance))
    }
    angles[i] = highest / DEG
  }
  return angles
}

// Fraction of the upper hemisphere visible above the sampled horizon.
// This is geometry only: it is not an attenuation coefficient for particles.
export function skyViewFactor(angles) {
  if (!angles.length) return 1
  let sum = 0
  for (const angle of angles) sum += 1 - Math.sin(Math.max(0, Math.min(90, angle)) * DEG)
  return Math.max(0, Math.min(1, sum / angles.length))
}

export function horizonAtAzimuth(angles, azimuth) {
  const scaled = (((azimuth % 360) + 360) % 360) / 360 * angles.length
  const left = Math.floor(scaled), right = (left + 1) % angles.length
  const weight = scaled - left
  return angles[left] * (1 - weight) + angles[right] * weight
}

export class RadiationGrid {
  constructor(sampleHeight = heightAt) {
    this.sampleHeight = sampleHeight
    this.sectors = new Map()
  }
  key(x, z) { return `${Math.floor(x / RADIATION_CELL_METERS)},${Math.floor(z / RADIATION_CELL_METERS)}` }
  sectorAt(x, z) {
    const key = this.key(x, z)
    let sector = this.sectors.get(key)
    if (!sector) {
      const ix = Math.floor(x / RADIATION_CELL_METERS), iz = Math.floor(z / RADIATION_CELL_METERS)
      const centerX = (ix + 0.5) * RADIATION_CELL_METERS
      const centerZ = (iz + 0.5) * RADIATION_CELL_METERS
      const horizon = sampleHorizon(centerX, centerZ, this.sampleHeight)
      sector = { x: centerX, z: centerZ, horizon, skyView: skyViewFactor(horizon),
        environment: 'surface', lastUpdatedDays: 0 }
      this.sectors.set(key, sector)
    }
    return sector
  }
}
