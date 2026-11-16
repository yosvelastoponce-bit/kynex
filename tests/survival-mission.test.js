import test from 'node:test'
import assert from 'node:assert/strict'
import { LifeSupportSystem } from '../src/world/LifeSupportSystem.js'
import { TIME_RATES } from '../src/world/SimulationClock.js'
import { advanceSurvival, createSurvivalState, recordSurvivalAction, restoreSurvivalState,
  saveSurvivalState, startSurvival, SURVIVAL_HOURS } from '../src/world/SurvivalMission.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}
function safeBase(eclss) { return { eclss: eclss.snapshot(), zone: 'habitat' } }

test('24 terrestrial hours take 20 real minutes and preserve the lunar solar clock', () => {
  assert.equal(TIME_RATES.mission * 1200, 1)
  assert.equal(SURVIVAL_HOURS, 24)
})

test('ECLSS battery supplies essential loads for 24 hours in darkness and fault isolation reduces demand', () => {
  const system = new LifeSupportSystem({ batteryDischargeW: 5000 })
  for (const device of ['ventilation', 'scrubber', 'generator']) system.setDevice(device, true)
  for (let step = 0; step < 24 * 12; step++) {
    if (step === 14 * 12) { system.setDevice('science', true); system.setScienceFault(1600) }
    if (step === 18 * 12) system.setDevice('science', false)
    system.update(1 / 288, { aboveHorizon: false }, -150)
    if (step === 14 * 12) assert.ok(system.snapshot().power.demandW > 4000)
    if (step === 18 * 12) assert.ok(system.snapshot().power.demandW < 3000)
  }
  const end = system.snapshot()
  assert.ok(end.power.batteryKWh > 25)
  assert.ok(end.stable, JSON.stringify(end.alerts))
  assert.ok(end.cabin.partialKPa.O2 > 17)
  assert.ok(end.cabin.partialKPa.CO2 < 0.4)
  const saved = system.serialize(), restored = new LifeSupportSystem({ batteryDischargeW: 5000 })
  assert.equal(restored.restore(saved), true)
  assert.ok(Math.abs(restored.snapshot().power.batteryKWh - end.power.batteryKWh) < 1e-9)
})

test('mission needs real checks, EVA, incident isolation and final habitability', () => {
  const system = new LifeSupportSystem({ batteryDischargeW: 5000 })
  for (const device of ['ventilation', 'scrubber', 'generator']) system.setDevice(device, true)
  system.update(1 / 288, { aboveHorizon: false }, -150)
  const state = createSurvivalState()
  startSurvival(state)
  assert.equal(recordSurvivalAction(state, 'confirm-initial', safeBase(system)), false)
  for (const action of ['control-opened', 'verify-oxygen', 'verify-pressure', 'verify-power']) recordSurvivalAction(state, action)
  assert.equal(recordSurvivalAction(state, 'confirm-initial', safeBase(system)), true)
  for (const action of ['inspect-solar', 'inspect-battery']) recordSurvivalAction(state, action)
  assert.equal(recordSurvivalAction(state, 'confirm-power', safeBase(system)), true)
  recordSurvivalAction(state, 'zone', { zone: 'surface' })
  recordSurvivalAction(state, 'inspect-eva-point')
  recordSurvivalAction(state, 'zone', { zone: 'habitat' })
  assert.equal(state.checks.evaReturned, true)
  let incident = []
  for (let i = 0; i < 280; i++) incident.push(...advanceSurvival(state, 0.05, safeBase(system)))
  assert.ok(incident.some(item => item.type === 'incident:detected'))
  assert.equal(advanceSurvival(state, 0.1, safeBase(system)).some(item => item.type === 'incident:detected'), false)
  recordSurvivalAction(state, 'incident-panel')
  recordSurvivalAction(state, 'verify-power')
  assert.ok(advanceSurvival(state, 0.1, safeBase(system)).some(item => item.type === 'incident:resolved'))
  while (state.elapsedHours < 24) advanceSurvival(state, 0.05, safeBase(system))
  assert.equal(recordSurvivalAction(state, 'confirm-final', safeBase(system)), true)
  assert.equal(state.status, 'won')
  const storage = memoryStorage(); saveSurvivalState(state, storage)
  assert.equal(restoreSurvivalState(storage).status, 'won')
})

test('sustained critical conditions fail after a recovery window', () => {
  const system = new LifeSupportSystem({ batteryDischargeW: 5000 })
  const state = createSurvivalState(); startSurvival(state)
  const bad = safeBase(system); bad.eclss.cabin.partialKPa.O2 = 10
  for (let i = 0; i < 15; i++) advanceSurvival(state, 0.05, bad)
  assert.equal(state.status, 'failed')
  assert.match(state.reason, /45 minutos/)
})
