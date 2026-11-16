import test from 'node:test'
import assert from 'node:assert/strict'
import { advanceMission, clearMissionState, compareDem, createMissionState, EARTH_GRAVITY, idealJump, inspectDem,
  MOON_GRAVITY, restoreMissionState, saveMissionState, shadowLength } from '../src/world/EducationalMissions.js'

test('ideal jump uses the same launch speed and the correct two gravities', () => {
  const earth = idealJump(2.55, EARTH_GRAVITY)
  const moon = idealJump(2.55, MOON_GRAVITY)
  assert.ok(Math.abs(moon.height / earth.height - EARTH_GRAVITY / MOON_GRAVITY) < 1e-10)
  assert.ok(moon.time > earth.time)
  assert.equal(60 * MOON_GRAVITY, 97.2)
})

test('shadow laboratory length responds to elevation and obstacle height', () => {
  assert.ok(Math.abs(shadowLength(10, 45) - 10) < 1e-10)
  assert.ok(shadowLength(10, 1) > shadowLength(10, 30))
  assert.equal(shadowLength(20, 10), shadowLength(10, 10) * 2)
})

test('DEM inspection uses projected coordinates, source heights and real separation', () => {
  const site = { bounds: { minX: -1200, maxX: 1195, minZ: -1200, maxZ: 1195 },
    elevationReference: 125, heightAt: (x, z) => x / 10 + z / 20, slopeAt: (x) => Math.abs(x) / 10 }
  const a = inspectDem(site, 0, 0)
  const b = inspectDem(site, 30, 40)
  assert.equal(a.projectedX, -3800)
  assert.equal(a.projectedY, -12800)
  assert.equal(b.elevation, 130)
  assert.equal(b.slope, 3)
  assert.equal(compareDem(a, b).distance, 50)
  assert.equal(compareDem(a, a), null)
  assert.equal(inspectDem(site, 1200, 0), null)
})

test('mission progress stores no identity and resumes at the same stage', () => {
  const records = new Map()
  const storage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value),
    removeItem: key => records.delete(key) }
  const state = createMissionState()
  state.stage = 4
  state.gravityStep = 2
  state.gravitySpeed = 3.4
  state.attempts[0] = 2
  saveMissionState(state, storage)
  assert.equal(restoreMissionState(storage).stage, 4)
  assert.equal(restoreMissionState(storage).gravityStep, 2)
  assert.equal(restoreMissionState(storage).gravitySpeed, 3.4)
  assert.equal(restoreMissionState(storage).attempts[0], 2)
  advanceMission(state, 6)
  assert.equal(state.stage, 5)
  advanceMission(state, 6)
  assert.equal(state.mission, 2)
  assert.deepEqual(state.badges, ['Explorador lunar'])
  clearMissionState(storage)
  assert.deepEqual(restoreMissionState(storage), createMissionState())
})
