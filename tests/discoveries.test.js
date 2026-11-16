import test from 'node:test'
import assert from 'node:assert/strict'
import { DISCOVERIES, createDiscoveryState, findDiscovery, readDiscovery, restoreDiscoveryState, saveDiscoveryState } from '../src/world/Discoveries.js'
import { createExplorationMissionState, recordMissionAction, restoreExplorationMissionState, saveExplorationMissionState } from '../src/world/ExplorationMissionFlow.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}

test('discoveries register once, are optional to read, and persist separately', () => {
  const storage = memoryStorage(), state = createDiscoveryState()
  assert.equal(findDiscovery(state, 'gravity', '2026-11-15T00:00:00Z'), true)
  assert.equal(findDiscovery(state, 'gravity'), false)
  assert.equal(state.read.gravity, undefined)
  assert.equal(readDiscovery(state, 'gravity'), true)
  saveDiscoveryState(state, storage)
  assert.deepEqual(restoreDiscoveryState(storage), state)
})

test('geographic crater remains unavailable without a validated Site04 location', () => {
  const crater = DISCOVERIES.find(item => item.id === 'crater')
  assert.equal(crater.type, 'UNAVAILABLE')
  assert.equal(crater.distance, null)
  assert.equal(findDiscovery(createDiscoveryState(), 'crater'), false)
})

test('both missions complete from actions without quizzes or discovery gates', () => {
  const storage = memoryStorage(), state = createExplorationMissionState()
  assert.equal(recordMissionAction(state, 'jump'), false)
  for (const action of ['marker', 'jump', 'explore']) assert.equal(recordMissionAction(state, action), true)
  assert.equal(state.mission, 2)
  for (const action of ['map', 'dem', 'sector']) assert.equal(recordMissionAction(state, action), true)
  assert.equal(state.mission, 3)
  assert.deepEqual(state.completed, [1, 2])
  saveExplorationMissionState(state, storage)
  assert.deepEqual(restoreExplorationMissionState(storage), state)
})
