import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { createStars, LUNAR_SIDEREAL_DAYS, starRotationRadians } from '../src/world/StarField.js'

test('stars complete a sidereal circuit with the simulated clock and reset', () => {
  const quarter = LUNAR_SIDEREAL_DAYS / 4
  assert.equal(starRotationRadians(0), 0)
  assert.ok(Math.abs(starRotationRadians(quarter) + Math.PI / 2) < 1e-12)
  assert.ok(Math.abs(starRotationRadians(LUNAR_SIDEREAL_DAYS)) < 1e-12)

  const stars = createStars()
  const observer = new THREE.Vector3(125, 2, -480)
  stars.update(observer, quarter)
  assert.ok(stars.points.position.equals(observer))
  assert.ok(Math.abs(stars.points.rotation.y + Math.PI / 2) < 1e-12)
  stars.update(observer, 0)
  assert.equal(stars.points.rotation.y, 0)
  stars.dispose()
})
