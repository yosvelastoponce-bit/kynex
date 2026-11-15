import * as THREE from 'three'
import {
  computeSlopeGrid, interpolateHeightGrid, SITE04_BOUNDS, SITE04_CENTER,
  SITE04_GRID_WIDTH, SITE04_HALF_SIZE_METERS, SITE04_PIXEL_METERS,
  sampleSite04Height, site04GridCoordinates,
} from './Site04Data.js'

const TILE_URL = '/assets/site04-dem.bin'

export async function createSite04Terrain(fetchAsset = fetch) {
  const response = await fetchAsset(TILE_URL)
  if (!response.ok) throw new Error(`No se pudo cargar el DEM Site04 (${response.status}).`)
  const buffer = await response.arrayBuffer()
  const expectedBytes = SITE04_GRID_WIDTH * SITE04_GRID_WIDTH * Float32Array.BYTES_PER_ELEMENT
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(`El DEM Site04 tiene ${buffer.byteLength} bytes; se esperaban ${expectedBytes}.`)
  }

  const view = new DataView(buffer)
  const elevations = new Float32Array(SITE04_GRID_WIDTH * SITE04_GRID_WIDTH)
  let minimum = Infinity, maximum = -Infinity
  for (let i = 0; i < elevations.length; i++) {
    const elevation = view.getFloat32(i * Float32Array.BYTES_PER_ELEMENT, true)
    if (!Number.isFinite(elevation)) throw new Error(`El DEM Site04 contiene un dato inválido en la celda ${i}.`)
    elevations[i] = elevation
    minimum = Math.min(minimum, elevation)
    maximum = Math.max(maximum, elevation)
  }

  const slopes = computeSlopeGrid(elevations)
  const elevationReference = sampleSite04Height(elevations, 0, 0)
  const sortedSlopes = Float32Array.from(slopes).sort()
  const firstSteepCell = sortedSlopes.findIndex(value => value >= 10)
  const metrics = {
    areaKm2: (SITE04_GRID_WIDTH * SITE04_PIXEL_METERS / 1000) ** 2,
    slopeBelowTenPercent: +(100 * (firstSteepCell < 0 ? sortedSlopes.length : firstSteepCell) / sortedSlopes.length).toFixed(1),
    medianSlopeDegrees: +sortedSlopes[Math.floor(sortedSlopes.length / 2)].toFixed(1),
    minimumSlopeDegrees: sortedSlopes[0], maximumSlopeDegrees: sortedSlopes.at(-1),
  }
  const vertexCount = SITE04_GRID_WIDTH * SITE04_GRID_WIDTH
  const positions = new Float32Array(vertexCount * 3)
  const indices = new Uint32Array((SITE04_GRID_WIDTH - 1) ** 2 * 6)
  for (let row = 0; row < SITE04_GRID_WIDTH; row++) {
    for (let column = 0; column < SITE04_GRID_WIDTH; column++) {
      const i = row * SITE04_GRID_WIDTH + column
      positions[i * 3] = -SITE04_HALF_SIZE_METERS + column * SITE04_PIXEL_METERS
      positions[i * 3 + 1] = elevations[i] - elevationReference
      positions[i * 3 + 2] = -SITE04_HALF_SIZE_METERS + row * SITE04_PIXEL_METERS
    }
  }
  let offset = 0
  for (let row = 0; row < SITE04_GRID_WIDTH - 1; row++) {
    for (let column = 0; column < SITE04_GRID_WIDTH - 1; column++) {
      const i = row * SITE04_GRID_WIDTH + column
      indices[offset++] = i
      indices[offset++] = i + SITE04_GRID_WIDTH
      indices[offset++] = i + 1
      indices[offset++] = i + 1
      indices[offset++] = i + SITE04_GRID_WIDTH
      indices[offset++] = i + SITE04_GRID_WIDTH + 1
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  const material = new THREE.MeshStandardMaterial({
    color: 0x9b9994, roughness: 1, metalness: 0, side: THREE.DoubleSide,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = 'NASA LOLA Site04 candidate DEM'
  mesh.receiveShadow = true
  mesh.castShadow = false

  return {
    mesh,
    data: elevations,
    slopes,
    bounds: SITE04_BOUNDS,
    center: SITE04_CENTER,
    pixelMeters: SITE04_PIXEL_METERS,
    metrics,
    elevationReference,
    elevationRange: { minimum, maximum },
    heightAt: (x, z) => sampleSite04Height(elevations, x, z) - elevationReference,
    slopeAt: (x, z) => {
      const point = site04GridCoordinates(x, z)
      return interpolateHeightGrid(slopes, SITE04_GRID_WIDTH, SITE04_GRID_WIDTH, point.column, point.row)
    },
    updateAround: () => false,
    dispose: () => { geometry.dispose(); material.dispose() },
  }
}
