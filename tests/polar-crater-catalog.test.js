import test from 'node:test'
import assert from 'node:assert/strict'
import { POLAR_CRATERS, polarChartPoint } from '../src/world/PolarCraterCatalog.js'

test('USGS crater centers project to the correct polar quadrants', () => {
  assert.deepEqual(polarChartPoint(-90, 0), { x: 50, y: 50 })
  const shackleton = POLAR_CRATERS.find((crater) => crater.name === 'Shackleton')
  const cabeus = POLAR_CRATERS.find((crater) => crater.name === 'Cabeus')
  const amundsen = POLAR_CRATERS.find((crater) => crater.name === 'Amundsen')
  assert.ok(Math.hypot(shackleton.x - 50, shackleton.y - 50) < 3)
  assert.ok(cabeus.x < 50 && cabeus.y < 50)
  assert.ok(amundsen.x > 50 && amundsen.y < 50)
  assert.equal(new Set(POLAR_CRATERS.map((crater) => crater.name)).size, POLAR_CRATERS.length)
})
