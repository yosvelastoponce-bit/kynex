import { SITE04_CENTER, SITE04_PIXEL_METERS } from './Site04Data.js'

export function inspectDem(site, x, z) {
  if (!site?.bounds || !Number.isFinite(x) || !Number.isFinite(z)
    || x < site.bounds.minX || x > site.bounds.maxX || z < site.bounds.minZ || z > site.bounds.maxZ) return null
  return { x, z, projectedX: SITE04_CENTER.x + x, projectedY: SITE04_CENTER.y - z,
    elevation: site.heightAt(x, z) + site.elevationReference, slope: site.slopeAt(x, z), resolution: SITE04_PIXEL_METERS }
}

export function compareDem(a, b) {
  if (!a || !b || Math.hypot(a.x - b.x, a.z - b.z) < SITE04_PIXEL_METERS) return null
  return { distance: Math.hypot(a.x - b.x, a.z - b.z), elevationDifference: b.elevation - a.elevation }
}
