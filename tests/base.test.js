import test from 'node:test'
import assert from 'node:assert/strict'
import { heightAt } from '../src/world/LunarTerrain.js'
import { OUTPOST, baseFloorHeight, localBasePosition } from '../src/world/BasePlacement.js'
import { AirlockSystem } from '../src/world/AirlockSystem.js'
import { BaseMission } from '../src/world/BaseMission.js'
import { baseGroundHeight, baseZone, resolveBaseMovement } from '../src/world/BaseCollisions.js'

test('foundation uses stable world coordinates and clears nearby procedural ground', () => {
  const floor = baseFloorHeight()
  for (const dx of [-6, 0, 6]) for (const dz of [-4, 0, 5]) {
    assert.ok(floor - heightAt(OUTPOST.x + dx, OUTPOST.z + dz) >= 0.44)
  }
  assert.deepEqual(localBasePosition(OUTPOST.x + 2, OUTPOST.z - 3), { x: 2, z: -3 })
  assert.equal(baseGroundHeight(OUTPOST.x, OUTPOST.z, floor), floor)
  assert.equal(baseZone(OUTPOST.x, OUTPOST.z), 'habitat')
  assert.equal(baseZone(OUTPOST.x, OUTPOST.z + 3.5), 'airlock')
  assert.equal(baseZone(0, 250), 'surface')
})

test('airlock entry and exit never leave both doors open', () => {
  const lock = new AirlockSystem(1)
  assert.equal(lock.state, 'sealed-pressurized')
  assert.equal(lock.request('exterior').state, 'cycling-to-vacuum')
  assert.equal(lock.request('interior').accepted, false)
  lock.update(1)
  assert.equal(lock.exteriorOpen, true)
  assert.equal(lock.request('interior').accepted, false)
  lock.request('exterior')
  assert.equal(lock.state, 'sealed-vacuum')
  lock.request('interior')
  assert.equal(lock.state, 'cycling-to-pressure')
  lock.update(1)
  assert.equal(lock.interiorOpen, true)
  assert.equal(lock.exteriorOpen, false)
  assert.equal(lock.request('exterior').accepted, false)
  lock.request('interior')
  assert.equal(lock.state, 'sealed-pressurized')
  lock.request('interior')
  assert.equal(lock.interiorOpen, true)
  lock.request('interior')
  lock.request('exterior')
  lock.update(1)
  assert.equal(lock.exteriorOpen, true)
  assert.equal(lock.interiorOpen, false)
})

test('closed airlock doors block walking while open doors permit passage', () => {
  const lock = new AirlockSystem(0.1)
  const x = OUTPOST.x, z = OUTPOST.z
  const blockedOutside = resolveBaseMovement({ x, z: z + 5.8 }, { x, z: z + 5.4 }, lock)
  assert.ok(blockedOutside.z > z + 5.5)
  lock.request('exterior'); lock.update(0.1)
  const inside = resolveBaseMovement({ x, z: z + 5.4 }, { x, z: z + 5.0 }, lock)
  assert.equal(inside.z, z + 5)
  const blockedInside = resolveBaseMovement({ x, z: z + 2.7 }, { x, z: z + 2.2 }, lock)
  assert.ok(blockedInside.z > z + 2.3)
  lock.request('exterior'); lock.request('interior'); lock.update(0.1)
  const habitat = resolveBaseMovement({ x, z: z + 2.3 }, { x, z: z + 1.8 }, lock)
  assert.equal(habitat.z, z + 1.8)
})

test('habitat walls and service modules block movement, mission retains progress', () => {
  const lock = new AirlockSystem()
  const x = OUTPOST.x, z = OUTPOST.z
  const wall = resolveBaseMovement({ x: x - 2, z: z + 2.6 }, { x: x - 2, z: z + 2.1 }, lock)
  assert.ok(wall.z > z + 2.3)
  const mission = new BaseMission()
  assert.equal(mission.complete('find'), true)
  assert.equal(mission.complete('find'), false)
  assert.equal(mission.complete('unknown'), false)
  assert.equal(mission.snapshot().count, 1)
  assert.equal(mission.snapshot().steps[0].done, true)
})
