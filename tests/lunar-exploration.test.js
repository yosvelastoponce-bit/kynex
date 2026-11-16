import test from 'node:test'
import assert from 'node:assert/strict'
import { createExplorationState, recordExplorationAction, updateExploration, saveExploration, restoreExploration, clearExploration } from '../src/world/LunarExplorationMissions.js'

const base = () => ({ zone: 'habitat', eclss: { operating: { ventilation: true, scrubber: true, regulator: true } }, sampleMission: { status: 'field' } })
test('four short missions require existing world actions in order, with no timer or repeated rewards', () => {
  const s = createExplorationState(), b = base()
  assert.equal(updateExploration(s, b), null)
  s.status = 'active'
  recordExplorationAction(s, 'inspect-solar')
  assert.equal(s.checks.solar, false)
  recordExplorationAction(s, 'control-opened')
  b.eclss.operating.scrubber = false
  assert.equal(updateExploration(s, b), null)
  b.eclss.operating.scrubber = true
  assert.equal(updateExploration(s, b).index, 0)
  assert.equal(updateExploration(s, b), null)
  b.zone = 'surface'; b.sampleMission.status = 'carried'
  assert.equal(updateExploration(s, b).index, 1)
  assert.equal(updateExploration(s, b), null)
  b.zone = 'habitat'; b.sampleMission.status = 'delivered'
  assert.equal(updateExploration(s, b).index, 2)
  recordExplorationAction(s, 'inspect-solar')
  assert.equal(updateExploration(s, b), null)
  b.zone = 'surface'; recordExplorationAction(s, 'inspect-battery')
  assert.equal(updateExploration(s, b), null)
  b.zone = 'habitat'
  assert.equal(updateExploration(s, b).index, 3)
  assert.equal(s.status, 'won')
  assert.equal(updateExploration(s, b), null)
})
test('mission and sample inventory world save together; reset clears new missions only', () => {
  const data = new Map([['kynex-survival-mission-v1', 'previous-save']])
  const storage = { getItem: k => data.get(k), setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) }
  const s = createExplorationState()
  Object.assign(s, { status: 'active', completed: 2, world: { sampleStatus: 'carried', clockDays: 0.2 } })
  saveExploration(s, storage)
  assert.deepEqual(restoreExploration(storage), s)
  clearExploration(storage)
  assert.deepEqual(restoreExploration(storage), createExplorationState())
  assert.equal(data.get('kynex-survival-mission-v1'), 'previous-save')
})
