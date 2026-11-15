import test from 'node:test'
import assert from 'node:assert/strict'
import { emittedRadiation, solarAbsorbed, thermalStep, THERMAL_CONFIG } from '../src/world/ThermalPhysics.js'
import { solarExposure, terrainNormal } from '../src/world/SolarExposure.js'
import { ThermalSystem } from '../src/world/ThermalSystem.js'
import { thermalColor } from '../src/world/ThermalPalette.js'

const sun = { aboveHorizon: true, azimuth: 90, elevation: 2,
  direction: { x: Math.cos(2 * Math.PI / 180), y: Math.sin(2 * Math.PI / 180), z: 0 } }

test('solar absorption respects slope, incidence and full shadow', () => {
  assert.equal(solarAbsorbed({ x: 0, y: 1, z: 0 }, sun.direction, 0), 0)
  const facing = solarAbsorbed({ x: 1, y: 0, z: 0 }, sun.direction, 1)
  const flat = solarAbsorbed({ x: 0, y: 1, z: 0 }, sun.direction, 1)
  assert.ok(facing > flat * 20)
  assert.ok(flat > 0)
})

test('terrain ridge casts a thermal shadow along solar azimuth', () => {
  const sector = { x: 0, z: 0, height: 0, normal: { x: 0, y: 1, z: 0 }, horizons: new Map() }
  const ridge = (x) => x > 40 && x < 250 ? 10 : 0
  assert.equal(solarExposure(sector, sun, ridge).visibleFraction, 0)
  assert.equal(solarExposure({ ...sector, horizons: new Map() }, sun, () => 0).visibleFraction, 1)
  assert.ok(terrainNormal(0, 0, (x) => x / 4).x < 0)
})

test('Stefan–Boltzmann emission uses Kelvin and implicit step stays physical at day scale', () => {
  assert.ok(Math.abs(emittedRadiation(300) - THERMAL_CONFIG.emissivity * 5.670374419e-8 * 300 ** 4) < 1e-9)
  let surface = 110, below = 110
  for (let i = 0; i < 30; i++) {
    const next = thermalStep(surface, below, i % 2 ? 0 : 1100, 0.1, 86_400)
    surface = next.surfaceKelvin; below = next.subsurfaceKelvin
    assert.ok(Number.isFinite(surface) && surface >= 2.7 && surface < 500)
    assert.ok(Number.isFinite(below) && below >= 2.7 && below < 500)
  }
})

test('thermal sectors retain history after moving away and returning', () => {
  const model = new ThermalSystem({ sampleHeight: () => 0, getSolar: () => sun })
  const sector = model.sectorAt(10, 10, 0)
  model.sectorAt(1200, 1200, 2)
  const returned = model.sectorAt(10, 10, 2)
  assert.equal(returned, sector)
  assert.ok(returned.surfaceKelvin > 112)
  assert.ok(returned.sunlitDays > 1.9)
  assert.equal(model.sectorAt(20, 20, 2), sector)
  model.reset()
  assert.notEqual(model.sectorAt(10, 10, 0), sector)
})

test('thermal palette clips extremes and changes across its fixed range', () => {
  assert.deepEqual(thermalColor(-300), thermalColor(-250))
  assert.deepEqual(thermalColor(100), thermalColor(60))
  assert.notDeepEqual(thermalColor(-180), thermalColor(-30))
})
