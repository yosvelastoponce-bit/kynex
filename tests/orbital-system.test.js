import test from 'node:test'
import assert from 'node:assert/strict'
import { earthOrbitPath, orbitalState, ORBIT_EPOCH_UTC } from '../src/world/OrbitalSystem.js'

const angularSeparation = (a, b) => {
  const dot = a.x * b.x + a.y * b.y + a.z * b.z
  const lengths = Math.hypot(a.x, a.y, a.z) * Math.hypot(b.x, b.y, b.z)
  return Math.acos(Math.max(-1, Math.min(1, dot / lengths))) * 180 / Math.PI
}

test('orbital diagram uses a reproducible UTC epoch and closes Earth orbit after about a year', () => {
  const start = orbitalState(0)
  assert.equal(start.utc, ORBIT_EPOCH_UTC)
  assert.ok(start.earthSunDistanceAu > 0.98 && start.earthSunDistanceAu < 1.02)
  assert.ok(angularSeparation(start.earth, orbitalState(365.25).earth) < 3)
  assert.equal(earthOrbitPath.length, 121)
})

test('Moon moves around Earth on a sidereal-month timescale at a realistic distance', () => {
  const start = orbitalState(0)
  const nextDay = orbitalState(1)
  const month = orbitalState(27.32)
  assert.ok(start.earthMoonDistanceKm > 350_000 && start.earthMoonDistanceKm < 410_000)
  assert.ok(angularSeparation(start.moon, nextDay.moon) > 10)
  assert.ok(angularSeparation(start.moon, month.moon) < 12)
  assert.deepEqual(orbitalState(0), start)
})
