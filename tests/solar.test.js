import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { solarState, SOLAR_CONFIG } from '../src/world/SolarSystem.js'
import { SimulationClock, TIME_RATES } from '../src/world/SimulationClock.js'
import { createLighting } from '../src/world/Lighting.js'

test('the polar teaching model keeps the Sun near the horizon and completes one azimuth circuit', () => {
  const start = solarState(0)
  const circuit = solarState(29.53)
  assert.equal(start.azimuth, SOLAR_CONFIG.initialAzimuth)
  assert.ok(Math.abs(start.elevation - SOLAR_CONFIG.initialElevation) < 1e-10)
  assert.ok(Math.abs(circuit.azimuth - start.azimuth) < 1e-10)
  for (let day = 0; day < 365; day += 7) assert.ok(Math.abs(solarState(day).elevation) <= 1.5)
  assert.ok(Math.abs(Math.hypot(start.direction.x, start.direction.y, start.direction.z) - 1) < 1e-10)
})

test('time rates and reset control simulated Earth days', () => {
  const clock = new SimulationClock()
  clock.setRate('day')
  clock.update(2)
  assert.equal(clock.days, 2)
  clock.setRate('pause')
  clock.update(10)
  assert.equal(clock.days, 2)
  clock.setRate('realtime')
  clock.update(86400)
  assert.equal(clock.days, 3)
  assert.equal(TIME_RATES.hour, 1 / 24)
  clock.reset()
  assert.equal(clock.days, 0)
})

test('directional sunlight follows the visible Sun and switches off below the astronomical horizon', () => {
  const scene = new THREE.Scene()
  const lighting = createLighting(scene, () => 0)
  const day = solarState(0)
  lighting.updateAround(0, 250, day, true)
  assert.ok(lighting.sunlight.intensity > 0)
  assert.equal(lighting.sunlight.castShadow, true)
  const offset = lighting.sunlight.position.clone().sub(lighting.sunlight.target.position).normalize()
  assert.ok(offset.distanceTo(new THREE.Vector3(day.direction.x, day.direction.y, day.direction.z)) < 1e-10)
  const night = solarState(150)
  assert.ok(night.elevation < 0)
  lighting.updateAround(0, 250, night, true)
  assert.equal(lighting.sunlight.intensity, 0)
  assert.equal(lighting.sunlight.castShadow, false)
})
