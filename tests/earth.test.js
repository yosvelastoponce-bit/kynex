import test from 'node:test'
import assert from 'node:assert/strict'
import { earthState, EARTH_ANGULAR_DIAMETER, EARTH_CONFIG } from '../src/world/EarthSystem.js'
import { earthVisibility } from '../src/world/EarthVisibility.js'
import { solarState } from '../src/world/SolarSystem.js'
import { heightAt } from '../src/world/LunarTerrain.js'

test('Earth librates around a fixed horizon region instead of orbiting the sky', () => {
  const positions = Array.from({ length: 120 }, (_, day) => earthState(day, solarState(day)))
  const meanAzimuth = EARTH_CONFIG.meanAzimuthAtZeroLongitude + EARTH_CONFIG.observerLongitude
  for (const position of positions) {
    assert.ok(Math.abs(position.azimuth - meanAzimuth) <= EARTH_CONFIG.azimuthAmplitude + 1e-9)
    assert.ok(Math.abs(position.elevation - (90 + EARTH_CONFIG.observerLatitude)) <= EARTH_CONFIG.elevationAmplitude + 1e-9)
    assert.ok(Math.abs(Math.hypot(...Object.values(position.direction)) - 1) < 1e-10)
  }
  assert.equal(EARTH_ANGULAR_DIAMETER, 1.9)
  assert.ok(Math.abs(positions[0].azimuth - positions[30].azimuth) < 6)
})

test('Earth phases come from the shared Sun direction', () => {
  const reference = earthState(0, solarState(0))
  const sameDirection = earthState(0, { direction: reference.direction })
  const oppositeDirection = earthState(0, { direction: {
    x: -reference.direction.x, y: -reference.direction.y, z: -reference.direction.z,
  } })
  assert.equal(sameDirection.phase, 'NUEVA')
  assert.equal(sameDirection.illuminatedFraction, 0)
  assert.equal(oppositeDirection.phase, 'LLENA')
  assert.equal(oppositeDirection.illuminatedFraction, 1)
  assert.ok(reference.illuminatedFraction > 0.7 && reference.illuminatedFraction < 0.8)
})

test('rotation advances independently of apparent sky position', () => {
  const a = earthState(0, solarState(0))
  const b = earthState(1, solarState(1))
  assert.ok(b.spinRadians - a.spinRadians > 2 * Math.PI)
  assert.ok(Math.abs(b.azimuth - a.azimuth) < 2)
})

test('nearby terrain can partially or fully conceal the modeled Earth', () => {
  const eye = { x: 0, y: heightAt(0, 250) + 1.7, z: 250 }
  const bounds = { minX: -6000, maxX: 6000, minZ: -6000, maxZ: 6000 }
  assert.equal(earthVisibility(eye, earthState(0, solarState(0)), heightAt, bounds), 'VISIBLE')
  assert.equal(earthVisibility(eye, earthState(10, solarState(10)), heightAt, bounds), 'PARCIALMENTE OCULTA')
  assert.equal(earthVisibility(eye, earthState(15, solarState(15)), heightAt, bounds), 'OCULTA POR TERRENO')
})
