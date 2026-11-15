import { heightAt } from './LunarTerrain.js'

const DEG = Math.PI / 180
const SUN_RADIUS_DEGREES = 0.266
const RAY_DISTANCES = [12, 24, 48, 96, 192, 384, 768, 1200]

export function terrainNormal(x, z, sampleHeight = heightAt) {
  const step = 4
  const dx = (sampleHeight(x + step, z) - sampleHeight(x - step, z)) / (2 * step)
  const dz = (sampleHeight(x, z + step) - sampleHeight(x, z - step)) / (2 * step)
  const length = Math.hypot(dx, 1, dz)
  return { x: -dx / length, y: 1 / length, z: -dz / length }
}

// Reuse a sector's horizon profile as the Sun moves through nearby azimuths.
export function terrainHorizon(sector, azimuth, sampleHeight = heightAt) {
  const key = Math.round(azimuth / 3) % 120
  if (sector.horizons.has(key)) return sector.horizons.get(key)
  const angle = key * 3 * DEG
  const dx = Math.sin(angle), dz = -Math.cos(angle)
  let horizon = 0
  for (const distance of RAY_DISTANCES) {
    const height = sampleHeight(sector.x + dx * distance, sector.z + dz * distance)
    horizon = Math.max(horizon, Math.atan2(height - sector.height + 0.15, distance) / DEG)
  }
  if (sector.horizons.size >= 24) sector.horizons.delete(sector.horizons.keys().next().value)
  sector.horizons.set(key, horizon)
  return horizon
}

export function solarExposure(sector, solar, sampleHeight = heightAt) {
  if (!solar.aboveHorizon) return { visibleFraction: 0, incidence: 0, shadowed: true }
  const n = sector.normal, d = solar.direction
  const incidence = Math.max(0, n.x * d.x + n.y * d.y + n.z * d.z)
  if (incidence === 0) return { visibleFraction: 0, incidence, shadowed: true }
  const horizon = terrainHorizon(sector, solar.azimuth, sampleHeight)
  const visibleFraction = Math.max(0, Math.min(1,
    (solar.elevation - horizon + SUN_RADIUS_DEGREES) / (2 * SUN_RADIUS_DEGREES)))
  return { visibleFraction, incidence, shadowed: visibleFraction < 0.05 }
}
