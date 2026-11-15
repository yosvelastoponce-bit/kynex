import * as THREE from 'three'
import { heightAt } from './LunarTerrain.js'

const ROCK_RADIUS = 650
const CELL = 40
const RECENTER_DISTANCE = 140

function randomGenerator(seed) {
  return () => {
    seed |= 0
    seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function createLunarRocks() {
  const group = new THREE.Group()
  const resources = []
  const dummy = new THREE.Object3D()
  let centerX = Number.POSITIVE_INFINITY, centerZ = Number.POSITIVE_INFINITY

  for (let kind = 0; kind < 3; kind++) {
    const geometry = new THREE.IcosahedronGeometry(1, 0)
    const material = new THREE.MeshStandardMaterial({ color: [0x696a68, 0x83837e, 0x555958][kind], roughness: 1, flatShading: true })
    const rocks = new THREE.InstancedMesh(geometry, material, [900, 420, 180][kind])
    rocks.castShadow = true
    rocks.receiveShadow = true
    rocks.count = 0
    group.add(rocks)
    resources.push({ geometry, material, rocks, kind })
  }

  function updateAround(x, z, force = false) {
    if (!force && Math.hypot(x - centerX, z - centerZ) < RECENTER_DISTANCE) return false
    centerX = x
    centerZ = z
    const minX = Math.floor((x - ROCK_RADIUS) / CELL)
    const maxX = Math.ceil((x + ROCK_RADIUS) / CELL)
    const minZ = Math.floor((z - ROCK_RADIUS) / CELL)
    const maxZ = Math.ceil((z + ROCK_RADIUS) / CELL)

    for (const { rocks, kind } of resources) {
      let count = 0
      for (let cz = minZ; cz <= maxZ; cz++) {
        for (let cx = minX; cx <= maxX; cx++) {
          const seed = Math.imul(cx, 73856093) ^ Math.imul(cz, 19349663) ^ Math.imul(kind + 1, 83492791)
          const random = randomGenerator(seed)
          if (random() > [0.55, 0.22, 0.075][kind]) continue
          const worldX = (cx + random()) * CELL
          const worldZ = (cz + random()) * CELL
          if (Math.hypot(worldX - x, worldZ - z) > ROCK_RADIUS || Math.hypot(worldX, worldZ) < 7) continue
          if (count >= rocks.instanceMatrix.count) continue
          const size = (0.32 + random() ** 2 * 1.4) * [0.55, 1.2, 2.4][kind]
          dummy.position.set(worldX, heightAt(worldX, worldZ) + size * 0.18, worldZ)
          dummy.rotation.set((random() - 0.5) * 0.3, random() * Math.PI * 2, (random() - 0.5) * 0.4)
          dummy.scale.set(size, size * (0.58 + random() * 0.4), size * (0.7 + random() * 0.45))
          dummy.updateMatrix()
          rocks.setMatrixAt(count++, dummy.matrix)
        }
      }
      rocks.count = count
      rocks.instanceMatrix.needsUpdate = true
      rocks.computeBoundingSphere()
    }
    return true
  }

  updateAround(0, 0, true)
  return { group, updateAround, dispose: () => resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose() }) }
}
