import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createSite04Terrain } from '../src/world/Site04Terrain.js'
import { interpolateHeightGrid, site04GridCoordinates, SITE04_BOUNDS } from '../src/world/Site04Data.js'

test('Site04 local coordinates map to the supplied 5 m/pixel candidate crop', () => {
  assert.deepEqual(site04GridCoordinates(-1200, -1200), { column: 0, row: 0 })
  assert.deepEqual(site04GridCoordinates(0, 0), { column: 240, row: 240 })
  assert.deepEqual(site04GridCoordinates(1200, 1200), { column: 480, row: 480 })
})

test('elevation grid sampling interpolates between adjacent DEM cells', () => {
  assert.equal(interpolateHeightGrid(new Float32Array([0, 10, 20, 30]), 2, 2, 0.5, 0.5), 15)
  assert.equal(interpolateHeightGrid(new Float32Array([0, 10, 20, 30]), 2, 2, -3, 5), 20)
})

test('Site04 loader builds the candidate terrain from the bundled raster crop', async () => {
  const assetPath = fileURLToPath(new URL('../public/assets/site04-dem.bin', import.meta.url))
  const bytes = await readFile(assetPath)
  assert.equal(bytes.byteLength, 480 * 480 * Float32Array.BYTES_PER_ELEMENT)
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  let requestedUrl
  const terrain = await createSite04Terrain(async url => {
    requestedUrl = url
    return { ok: true, arrayBuffer: async () => arrayBuffer }
  })

  assert.equal(requestedUrl, '/assets/site04-dem.bin')
  assert.ok(Math.abs(terrain.elevationReference - 1244.21) < 0.01)
  assert.equal(terrain.heightAt(0, 0), 0)
  assert.ok(Number.isFinite(terrain.slopeAt(0, 0)))
  assert.ok(terrain.metrics.slopeBelowTenPercent >= 0 && terrain.metrics.slopeBelowTenPercent <= 100)
  assert.equal(terrain.mesh.material.vertexColors, false)
  assert.equal(terrain.mesh.geometry.attributes.position.count, 480 * 480)
  const positions = terrain.mesh.geometry.attributes.position
  for (const [column, row] of [[0, 0], [240, 240], [479, 479], [84, 317]]) {
    const index = row * 480 + column
    const x = -1200 + column * 5, z = -1200 + row * 5
    assert.ok(Math.abs(positions.getY(index) - terrain.heightAt(x, z)) < 0.0001)
  }
  assert.equal(SITE04_BOUNDS.maxX, 1195)
  assert.equal(SITE04_BOUNDS.maxZ, 1195)
  terrain.dispose()
})

test('LROC map image uses the same 480-cell frame as the Site04 DEM', async () => {
  const bytes = await readFile(fileURLToPath(new URL('../public/assets/site04-lroc-nac.png', import.meta.url)))
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(bytes.readUInt32BE(16), 480)
  assert.equal(bytes.readUInt32BE(20), 480)
})
