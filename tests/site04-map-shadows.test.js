import test from 'node:test'
import assert from 'node:assert/strict'
import { site04ShadowMask } from '../src/world/Site04MapShadows.js'

const alphaAt = (mask, size, x, y) => mask[(y * size + x) * 4 + 3]

test('DEM ridge moves its map shadow when the simulated Sun reverses direction', () => {
  const size = 9
  const heights = new Float32Array(size * size)
  for (let row = 0; row < size; row++) heights[row * size + 4] = 20
  const eastSun = site04ShadowMask(heights, { width: size, outputSize: size,
    pixelMeters: 5, rayStepCells: 1, azimuth: 90, elevation: 3 })
  const westSun = site04ShadowMask(heights, { width: size, outputSize: size,
    pixelMeters: 5, rayStepCells: 1, azimuth: 270, elevation: 3 })
  assert.equal(alphaAt(eastSun, size, 2, 4), 168)
  assert.equal(alphaAt(eastSun, size, 6, 4), 0)
  assert.equal(alphaAt(westSun, size, 2, 4), 0)
  assert.equal(alphaAt(westSun, size, 6, 4), 168)
})

test('map is darkened below the model astronomical horizon', () => {
  const mask = site04ShadowMask(new Float32Array(9 * 9), { width: 9, outputSize: 9,
    azimuth: 0, elevation: -1 })
  assert.equal(alphaAt(mask, 9, 4, 4), 190)
})
