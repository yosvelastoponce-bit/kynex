import test from 'node:test'
import assert from 'node:assert/strict'
import { litMapPixels } from '../src/world/LocalMapLighting.js'

test('a ridge darkens the downstream map cells and the shadow reverses with the Sun', () => {
  const size = 11
  const heights = new Float32Array(size * size)
  for (let y = 0; y < size; y++) heights[y * size + 5] = 10
  const east = litMapPixels(heights, size, 100, 0, 10, 90, 1.2)
  const west = litMapPixels(heights, size, 100, 0, 10, 270, 1.2)
  const value = (pixels, x) => pixels[(5 * size + x) * 4]
  assert.ok(value(east, 3) < value(east, 7))
  assert.ok(value(west, 7) < value(west, 3))
})

test('the local map loses direct illumination below the astronomical horizon', () => {
  const heights = new Float32Array(9 * 9)
  const day = litMapPixels(heights, 9, 80, 0, 1, 60, 1.2)
  const night = litMapPixels(heights, 9, 80, 0, 1, 60, -1.2)
  assert.ok(night[4 * (9 * 4 + 4)] < day[4 * (9 * 4 + 4)])
})
