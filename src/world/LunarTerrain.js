import * as THREE from 'three'

// Only a moving polar surface patch is rendered, never the whole Moon.
export const MOON_RADIUS = 1_737_500 // metres
const PATCH_RADIUS = 10_000
const SEGMENTS = 256
const RECENTER_DISTANCE = 90

const LOCAL_CRATERS = [
  { x: 11, z: -19, r: 7.5, depth: 1.45 },
  { x: -17, z: -35, r: 9.5, depth: 1.8 },
  { x: 0, z: -54, r: 24, depth: 4.7 },
  { x: -74, z: -95, r: 36, depth: 7.2 },
  { x: 66, z: -104, r: 29, depth: 5.8 },
]

function hash(x, z, seed = 0) {
  let n = Math.imul(x, 374761393) + Math.imul(z, 668265263) + seed | 0
  n = Math.imul(n ^ n >>> 13, 1274126177)
  return ((n ^ n >>> 16) >>> 0) / 4294967296
}

function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z)
  const fx = x - ix, fz = z - iz
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz)
  const a = THREE.MathUtils.lerp(hash(ix, iz), hash(ix + 1, iz), sx)
  const b = THREE.MathUtils.lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), sx)
  return THREE.MathUtils.lerp(a, b, sz) * 2 - 1
}

function craterShape(distance, radius, depth) {
  const q = distance / radius
  let h = 0
  if (q < 1) h -= depth * (1 - q * q) ** 2
  if (q < 1.55 && q > 0.6) {
    const rim = (q - 1.04) / 0.16
    h += depth * 0.24 * Math.exp(-rim * rim)
  }
  return h
}

function craterField(x, z, cell, seed, minRadius, maxRadius, depthRatio, density) {
  const ix = Math.floor(x / cell), iz = Math.floor(z / cell)
  let h = 0
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = ix + dx, cz = iz + dz
      if (hash(cx, cz, seed) > density) continue
      const radius = THREE.MathUtils.lerp(minRadius, maxRadius, hash(cx, cz, seed + 1))
      const px = (cx + 0.15 + hash(cx, cz, seed + 2) * 0.7) * cell
      const pz = (cz + 0.15 + hash(cx, cz, seed + 3) * 0.7) * cell
      const rx = x - px, rz = z - pz
      if (Math.abs(rx) > radius * 1.55 || Math.abs(rz) > radius * 1.55) continue
      const distance = Math.hypot(rx, rz)
      if (distance < radius * 1.55) h += craterShape(distance, radius, radius * depthRatio)
    }
  }
  return h
}

// This is continuous in world coordinates, so rendering and player contact agree.
export function heightAt(x, z) {
  let h = noise(x / 1200, z / 1200) * 24
    + noise(x / 430, z / 430) * 10
    + noise(x / 130, z / 130) * 3.5
    + noise(x / 24, z / 24) * 0.75
    + noise(x / 4, z / 4) * 0.12

  h += craterField(x, z, 1400, 31, 160, 470, 0.16, 0.82)
  h += craterField(x, z, 360, 71, 27, 95, 0.14, 0.70)
  h += craterField(x, z, 62, 117, 4, 14, 0.16, 0.43)
  for (const crater of LOCAL_CRATERS) {
    const distance = Math.hypot(x - crater.x, z - crater.z)
    if (distance < crater.r * 1.55) h += craterShape(distance, crater.r, crater.depth)
  }

  // Sagitta of a spherical surface in the tangent frame at the pole.
  const radialSquared = x * x + z * z
  h -= radialSquared / (2 * MOON_RADIUS)
  return h
}

function dustTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(256, 256)
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const grain = hash(x, y) * 48
      const mottling = noise(x / 18, y / 18) * 15
      const v = Math.max(0, Math.min(255, 180 + grain + mottling))
      const i = (y * 256 + x) * 4
      image.data[i] = v
      image.data[i + 1] = v * 0.99
      image.data[i + 2] = v * 0.97
      image.data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function ringRadii() {
  const radii = []
  for (let r = 2; r <= 180; r += 2) radii.push(r)
  let r = 180
  while (r < PATCH_RADIUS) {
    r = Math.min(PATCH_RADIUS, r * 1.085)
    radii.push(r)
  }
  return radii
}

export function createLunarTerrain() {
  const radii = ringRadii()
  const vertexCount = 1 + radii.length * SEGMENTS
  const positions = new Float32Array(vertexCount * 3)
  const colors = new Float32Array(vertexCount * 3)
  const uvs = new Float32Array(vertexCount * 2)
  const indices = []

  for (let i = 0; i < SEGMENTS; i++) {
    const next = (i + 1) % SEGMENTS
    indices.push(0, 1 + next, 1 + i)
  }
  for (let ring = 0; ring < radii.length - 1; ring++) {
    const inner = 1 + ring * SEGMENTS
    const outer = inner + SEGMENTS
    for (let i = 0; i < SEGMENTS; i++) {
      const next = (i + 1) % SEGMENTS
      indices.push(inner + i, inner + next, outer + next)
      indices.push(inner + i, outer + next, outer + i)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(indices)
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  const texture = dustTexture()
  const material = new THREE.MeshStandardMaterial({ map: texture, vertexColors: true, roughness: 1, metalness: 0, side: THREE.FrontSide })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  mesh.frustumCulled = false
  let centerX = Number.POSITIVE_INFINITY, centerZ = Number.POSITIVE_INFINITY

  function updateAround(x, z, force = false) {
    if (!force && Math.hypot(x - centerX, z - centerZ) < RECENTER_DISTANCE) return false
    centerX = x
    centerZ = z
    mesh.position.set(x, 0, z)

    function setVertex(index, localX, localZ, radius) {
      const worldX = centerX + localX, worldZ = centerZ + localZ
      let height = heightAt(worldX, worldZ)
      // The outer skirt remains below the true horizon, preventing a visible cap edge.
      if (radius > 6_500) height -= ((radius - 6_500) / 3_500) ** 2 * 140
      positions[index * 3] = localX
      positions[index * 3 + 1] = height
      positions[index * 3 + 2] = localZ
      uvs[index * 2] = worldX / 8
      uvs[index * 2 + 1] = worldZ / 8
      const variation = noise(worldX / 110, worldZ / 110) * 0.07 + noise(worldX / 17, worldZ / 17) * 0.025
      const shade = THREE.MathUtils.clamp(0.59 + variation + Math.min(0, height) * 0.0015, 0.36, 0.78)
      colors[index * 3] = shade
      colors[index * 3 + 1] = shade * 0.99
      colors[index * 3 + 2] = shade * 0.97
    }

    setVertex(0, 0, 0, 0)
    for (let ring = 0; ring < radii.length; ring++) {
      const radius = radii[ring]
      for (let i = 0; i < SEGMENTS; i++) {
        const angle = i * Math.PI * 2 / SEGMENTS
        setVertex(1 + ring * SEGMENTS + i, Math.cos(angle) * radius, Math.sin(angle) * radius, radius)
      }
    }
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.color.needsUpdate = true
    geometry.attributes.uv.needsUpdate = true
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    return true
  }

  updateAround(0, 0, true)
  return { mesh, updateAround, dispose: () => { geometry.dispose(); material.dispose(); texture.dispose() } }
}
