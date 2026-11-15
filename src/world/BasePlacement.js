import { heightAt } from './LunarTerrain.js'

// Illustrative global coordinates close to the starting line of sight.
export const OUTPOST = Object.freeze({ x: -45, z: 220, name: 'KYNEX OUTPOST 01' })
export const SITE04_OUTPOST = Object.freeze({ x: 0, z: 0, name: 'Punto de apoyo educativo Site04' })

export function baseFloorHeight(sampleHeight = heightAt, origin = OUTPOST) {
  // Lift the slab above the highest sampled ground point; legs bridge the
  // remaining local relief without changing the procedural height function.
  let highest = -Infinity
  for (const dx of [-6, 0, 6]) for (const dz of [-4, 0, 5]) {
    highest = Math.max(highest, sampleHeight(origin.x + dx, origin.z + dz))
  }
  return highest + 0.45
}

export function localBasePosition(x, z, origin = OUTPOST) {
  return { x: x - origin.x, z: z - origin.z }
}
