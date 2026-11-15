import test from 'node:test'
import assert from 'node:assert/strict'
import { SimulationClock } from '../src/world/SimulationClock.js'
import { RadiationGrid, sampleHorizon, skyViewFactor, horizonAtAzimuth } from '../src/world/TerrainShielding.js'
import { SpaceWeather } from '../src/world/SpaceWeather.js'
import { AstronautDosimeter } from '../src/world/AstronautDosimeter.js'
import { RadiationSystem } from '../src/world/RadiationSystem.js'
import { radiationColor } from '../src/world/RadiationPalette.js'

test('LND reference accumulates 9.583 mSv over seven simulated days', () => {
  const system = new RadiationSystem({ sampleHeight: () => 0 })
  const sample = system.update(7, 0, 0)
  assert.ok(Math.abs(sample.gcr - 1.369) < 1e-10)
  assert.ok(Math.abs(sample.doseMsV - 9.583) < 1e-10)
  assert.equal(sample.exposureDays, 7)
  assert.equal(sample.sep, 0)
})

test('shared clock pauses and accelerates without browser-time accumulation', () => {
  const clock = new SimulationClock()
  const system = new RadiationSystem({ sampleHeight: () => 0 })
  clock.setRate('day'); clock.update(1)
  assert.ok(Math.abs(system.update(clock.days, 0, 0).doseMsV - 1.369) < 1e-10)
  clock.setRate('pause'); clock.update(100)
  assert.ok(Math.abs(system.update(clock.days, 0, 0).doseMsV - 1.369) < 1e-10)
  clock.setRate('hour'); clock.update(24)
  assert.ok(Math.abs(system.update(clock.days, 0, 0).doseMsV - 2.738) < 1e-10)
  clock.reset(); system.rebaseClock(clock.days)
  assert.ok(Math.abs(system.update(clock.days, 0, 0).doseMsV - 2.738) < 1e-10)
})

test('terrain sky factor is spatial and independent of solar darkness', () => {
  const ridge = (x, z) => Math.abs(x - 150) < 28 && Math.abs(z - 50) < 100 ? 50 : 0
  const grid = new RadiationGrid(ridge)
  const exposed = grid.sectorAt(-500, 50)
  const sheltered = grid.sectorAt(50, 50)
  assert.ok(sheltered.skyView < exposed.skyView)
  assert.equal(grid.sectorAt(49, 60), sheltered)
  assert.equal(grid.sectorAt(50, 50), sheltered)
  const system = new RadiationSystem({ sampleHeight: ridge })
  const dark = system.ratesAt(50, 50, 0)
  assert.ok(dark.gcr > 0)
  assert.ok(dark.gcr < system.ratesAt(-500, 50, 0).gcr)
  assert.equal(dark.sep, 0)
  assert.equal(dark.environment, 'surface')
})

test('horizon sampling and grid use stable world coordinates', () => {
  const angles = sampleHorizon(50, 50, () => 0)
  assert.equal(angles.length, 16)
  assert.equal(skyViewFactor(angles), 1)
  assert.equal(horizonAtAzimuth(angles, 273), 0)
  const grid = new RadiationGrid(() => 0)
  assert.equal(grid.sectorAt(-1, -1).x, -50)
  assert.equal(grid.sectorAt(101, 101).z, 150)
})

test('SEP pulse is bounded, integrates across sparse updates, and ends', () => {
  const weather = new SpaceWeather()
  weather.start(2, { peakMsVPerDay: 2, durationDays: 0.5, azimuth: 90, elevation: 20 })
  assert.equal(weather.rate(1.9), 0)
  assert.ok(Math.abs(weather.rate(2.25) - 2) < 1e-10)
  assert.equal(weather.rate(2.5), 0)
  assert.ok(Math.abs(weather.doseBetween(1.5, 3) - 2 / Math.PI) < 1e-10)
  assert.equal(weather.overlapDays(1.5, 3), 0.5)
  weather.stop()
  assert.equal(weather.doseBetween(1.5, 3), 0)
})

test('scenario adds temporary equivalent dose without changing the GCR background', () => {
  const system = new RadiationSystem({ sampleHeight: () => 0 })
  system.update(1, 0, 0)
  const before = system.telemetry(1, 0, 0)
  system.startScenario(1, { peakMsVPerDay: 2, durationDays: 0.5, azimuth: 90, elevation: 20 })
  const middle = system.update(1.25, 0, 0)
  assert.equal(middle.gcr, before.gcr)
  assert.ok(middle.sep > 0)
  assert.ok(middle.doseMsV > before.doseMsV)
  const after = system.update(1.6, 0, 0)
  assert.equal(after.sep, 0)
  assert.equal(after.sepActive, false)
  assert.ok(Math.abs(after.sepDays - 0.5) < 1e-10)
  assert.ok(Math.abs(after.doseMsV - (1.6 * 1.369 + 2 / Math.PI)) < 1e-10)
})

test('terrain can block the hypothetical SEP direction while GCR remains', () => {
  const ridge = (x, z) => Math.abs(x - 150) < 28 && Math.abs(z - 50) < 100 ? 50 : 0
  const system = new RadiationSystem({ sampleHeight: ridge })
  system.startScenario(0, { peakMsVPerDay: 5, durationDays: 1, azimuth: 90, elevation: 20 })
  const behindRidge = system.ratesAt(50, 50, 0.5)
  const open = system.ratesAt(-500, 50, 0.5)
  assert.equal(behindRidge.sep, 0)
  assert.ok(behindRidge.gcr > 0)
  assert.ok(open.sep > 0)
})

test('moving to a geometrically sheltered sector never removes accumulated dose', () => {
  const ridge = (x, z) => Math.abs(x - 150) < 28 && Math.abs(z - 50) < 100 ? 50 : 0
  const system = new RadiationSystem({ sampleHeight: ridge })
  const open = system.update(1, -500, 50)
  const sheltered = system.update(2, 50, 50)
  const shelterSector = system.grid.sectorAt(50, 50)
  assert.ok(sheltered.gcr < open.gcr)
  assert.ok(sheltered.doseMsV > open.doseMsV)
  system.update(2, -500, 50)
  assert.equal(system.grid.sectorAt(50, 50), shelterSector)
  assert.equal(system.dosimeter.doseMsV, sheltered.doseMsV)
})

test('dosimeter rejects backwards time and preserves exposure on rebase', () => {
  const meter = new AstronautDosimeter()
  meter.advance(1, { gcrRate: 1.369 })
  meter.advance(0.5, { gcrRate: 1.369 })
  assert.equal(meter.doseMsV, 1.369)
  meter.rebase(0)
  meter.advance(1, { gcrRate: 1.369 })
  assert.equal(meter.doseMsV, 2.738)
})

test('radiation colors are a fixed rate scale in mSv per day', () => {
  assert.deepEqual(radiationColor(0), radiationColor(0.7))
  assert.deepEqual(radiationColor(20), radiationColor(6))
  assert.notDeepEqual(radiationColor(1), radiationColor(5))
})
