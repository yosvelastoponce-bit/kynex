import { heightAt } from './LunarTerrain.js'
import { OUTPOST, localBasePosition } from './BasePlacement.js'

const PLAYER_RADIUS = 0.33
const wall = (x1, x2, z1, z2) => ({ x1, x2, z1, z2 })

export function baseObstacles(airlock) {
  const obstacles = [
    wall(-5.15, -4.9, -1.9, 1.9), wall(4.9, 5.15, -1.9, 1.9),
    wall(-5.1, 5.1, -2.02, -1.78),
    wall(-5.1, -1.02, 1.78, 2.02), wall(1.02, 5.1, 1.78, 2.02),
    wall(-1.37, -1.13, 1.86, 5.16), wall(1.13, 1.37, 1.86, 5.16),
    wall(-1.35, -0.92, 4.95, 5.2), wall(0.92, 1.35, 4.95, 5.2),
    wall(10.5, 15.5, -1.7, 1.7),
    wall(10, 12.8, 7.0, 9.4),
    wall(16.5, 17.5, -8.5, -7.5),
    // Interior equipment leaves a central route between the hatches and zones.
    wall(-4.4, -2.3, -1.7, -0.45), wall(1.7, 4.3, -1.7, -0.5),
    wall(-4.35, -2.45, 0.75, 1.7), wall(2.7, 4.3, 0.7, 1.7),
  ]
  if (!airlock.interiorOpen) obstacles.push(wall(-1.02, 1.02, 1.78, 2.02))
  if (!airlock.exteriorOpen) obstacles.push(wall(-0.92, 0.92, 4.95, 5.2))
  return obstacles
}

function inside(x, z, block) {
  return x > block.x1 - PLAYER_RADIUS && x < block.x2 + PLAYER_RADIUS
    && z > block.z1 - PLAYER_RADIUS && z < block.z2 + PLAYER_RADIUS
}

export function resolveBaseMovement(previous, next, airlock, origin = OUTPOST) {
  const p = localBasePosition(previous.x, previous.z, origin)
  const n = localBasePosition(next.x, next.z, origin)
  if (Math.abs(n.x) > 35 && Math.abs(p.x) > 35) return next
  if (Math.abs(n.z) > 25 && Math.abs(p.z) > 25) return next
  const blocks = baseObstacles(airlock)
  let x = n.x, z = p.z
  for (const block of blocks) {
    if (!inside(x, z, block)) continue
    if (p.x <= block.x1 - PLAYER_RADIUS) x = Math.min(x, block.x1 - PLAYER_RADIUS)
    else if (p.x >= block.x2 + PLAYER_RADIUS) x = Math.max(x, block.x2 + PLAYER_RADIUS)
    else x = p.x
  }
  z = n.z
  for (const block of blocks) {
    if (!inside(x, z, block)) continue
    if (p.z <= block.z1 - PLAYER_RADIUS) z = Math.min(z, block.z1 - PLAYER_RADIUS)
    else if (p.z >= block.z2 + PLAYER_RADIUS) z = Math.max(z, block.z2 + PLAYER_RADIUS)
    else z = p.z
  }
  return { x: x + origin.x, z: z + origin.z }
}

export function baseGroundHeight(x, z, floorY, sampleHeight = heightAt, origin = OUTPOST) {
  const p = localBasePosition(x, z, origin)
  if (p.x >= -6.1 && p.x <= 6.1 && p.z >= -3.2 && p.z <= 5.4) return floorY
  if (Math.abs(p.x) <= 1.4 && p.z > 5.4 && p.z < 9.4) {
    const t = (p.z - 5.4) / 4
    return floorY * (1 - t) + sampleHeight(x, z) * t
  }
  return sampleHeight(x, z)
}

export function baseZone(x, z, origin = OUTPOST) {
  const p = localBasePosition(x, z, origin)
  if (Math.abs(p.x) < 1.1 && p.z > 2.1 && p.z < 4.9) return 'airlock'
  if (Math.abs(p.x) < 4.7 && Math.abs(p.z) < 1.7) return 'habitat'
  return 'surface'
}
