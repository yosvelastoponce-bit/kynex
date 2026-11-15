import test from 'node:test'
import assert from 'node:assert/strict'
import { GAS_NAMES, equalizeAtmospheres } from '../src/world/AtmosphereModel.js'
import { LifeSupportSystem } from '../src/world/LifeSupportSystem.js'
import { Mission02, ECLSS_MISSION_STEPS } from '../src/world/Mission02.js'
import { LunarBaseSystem } from '../src/world/LunarBaseSystem.js'
import { OUTPOST } from '../src/world/BasePlacement.js'
import { AirlockSystem } from '../src/world/AirlockSystem.js'
import { BaseMission } from '../src/world/BaseMission.js'
import { BASE_TARGETS } from '../src/world/BaseKnowledge.js'
import { LunarSampleMission, TRAINING_SAMPLE_MINERALS } from '../src/world/LunarSampleMission.js'

const close = (actual, expected, tolerance = 1e-7) => assert.ok(Math.abs(actual - expected) < tolerance,
  `${actual} differs from ${expected}`)

test('initial gas fractions, partial pressures and humidity come from one ideal-gas inventory', () => {
  const system = new LifeSupportSystem()
  const { cabin, lock } = system.snapshot()
  close(cabin.pressureKPa, 56.5)
  close(cabin.partialKPa.O2, 19.21)
  close(Object.values(cabin.partialKPa).reduce((a, b) => a + b, 0), cabin.pressureKPa)
  close(Object.values(cabin.fractions).reduce((a, b) => a + b, 0), 1)
  close(cabin.relativeHumidity, 45)
  close(lock.pressureKPa, cabin.pressureKPa)
  assert.equal(cabin.volumeM3, 100)
  assert.equal(lock.volumeM3, 8)
})

test('one crew metabolism flow consumes cabin oxygen and produces carbon dioxide', () => {
  const system = new LifeSupportSystem()
  system.setDevice('regulator', false)
  const beforeO2 = system.cabin.massKg('O2'), beforeCO2 = system.cabin.massKg('CO2')
  system.update(0.25)
  close(beforeO2 - system.cabin.massKg('O2'), 0.82, 1e-6)
  close(system.cabin.massKg('CO2') - beforeCO2, 1.04, 1e-6)
  close(system.flows.metabolicO2Kg, 0.82, 1e-6)
  close(system.flows.metabolicCO2Kg, 1.04, 1e-6)
})

test('CO2 rises without capture and is removed only into the captured inventory', () => {
  const off = new LifeSupportSystem(), on = new LifeSupportSystem()
  on.setDevice('ventilation', true)
  on.setDevice('scrubber', true)
  off.update(0.4); on.update(0.4)
  assert.ok(off.cabin.partialPa('CO2') > on.cabin.partialPa('CO2') + 200)
  close(on.flows.co2CapturedKg, on.storage.capturedCO2, 1e-7)
  assert.ok(on.storage.capturedCO2 > 0)
  assert.ok(off.alerts().some(alert => alert.message.includes('CO₂')))
})

test('electrolysis consumes water and power and stores oxygen and hydrogen stoichiometrically', () => {
  const system = new LifeSupportSystem({ occupied: false })
  system.setDevice('generator', true)
  const before = { water: system.storage.water, oxygen: system.storage.O2, hydrogen: system.storage.hydrogen }
  system.update(0.25)
  const made = system.storage.O2 - before.oxygen
  assert.ok(made > 0)
  close(before.water - system.storage.water, made * 1.125, 1e-6)
  close(system.storage.hydrogen - before.hydrogen, made * 0.125, 1e-6)
  assert.ok(system.energyUsedKWh > 0)
  const powerless = new LifeSupportSystem({ occupied: false })
  powerless.setDevice('generator', true)
  powerless.setPowerLimit(0)
  powerless.update(0.25)
  assert.equal(powerless.flows.oxygenGeneratedKg, 0)
  assert.equal(powerless.operating.generator, false)
  assert.ok(powerless.alerts().some(alert => alert.level === 'critica'))
  const dry = new LifeSupportSystem({ occupied: false })
  dry.storage.water = 0
  dry.setDevice('generator', true)
  dry.update(0.01)
  assert.equal(dry.operating.generator, false)
  assert.equal(dry.blocked.generator, 'SIN AGUA')
})

test('regulator spends stored oxygen, leaks vent gas, and no inventory turns negative', () => {
  const system = new LifeSupportSystem({ occupied: false })
  system.cabin.removeKg('O2', 2)
  const before = system.cabin.massKg('O2') + system.storage.O2
  system.update(0.1)
  close(system.cabin.massKg('O2') + system.storage.O2, before, 1e-6)
  const gasBeforeLeak = Object.fromEntries(GAS_NAMES.map(gas => [gas, system.cabin.massKg(gas) + system.storage.vented[gas]]))
  system.setDevice('regulator', false)
  system.setLeak(1)
  system.update(0.1)
  for (const gas of GAS_NAMES) {
    close(system.cabin.massKg(gas) + system.storage.vented[gas], gasBeforeLeak[gas], 0.05)
    assert.ok(system.cabin.massKg(gas) >= 0)
  }
})

test('airlock venting and pressure equalization account for each gas separately', () => {
  const system = new LifeSupportSystem({ occupied: false })
  const before = Object.fromEntries(GAS_NAMES.map(gas => [gas, system.cabin.massKg(gas) + system.lock.massKg(gas)]))
  system.onAirlockTransition('cycling-to-vacuum', 'exterior-open')
  close(system.lock.pressurePa, 0)
  for (const gas of GAS_NAMES) close(system.cabin.massKg(gas) + system.storage.vented[gas], before[gas])
  system.onAirlockTransition('cycling-to-pressure', 'interior-open')
  close(system.lock.pressurePa, system.cabin.pressurePa)
  for (const gas of GAS_NAMES) close(system.cabin.massKg(gas) + system.lock.massKg(gas) + system.storage.vented[gas], before[gas])
  equalizeAtmospheres(system.cabin, system.lock)
  close(system.lock.pressurePa, system.cabin.pressurePa)
})

test('interior temperature and humidity respond to equipment and pause', () => {
  const system = new LifeSupportSystem()
  const original = system.snapshot()
  system.update(0)
  assert.deepEqual(system.snapshot(), original)
  system.setDevice('condenser', false)
  system.setDevice('thermal', false)
  system.update(0.25, { aboveHorizon: false }, -150)
  assert.ok(system.cabin.relativeHumidity > original.cabin.relativeHumidity)
  assert.ok(system.cabin.temperatureK < original.cabin.temperatureC + 273.15)
  assert.notEqual(system.cabin.temperatureK - 273.15, -150)
})

test('Mission 02 requires real checks and an hour of stable simulated conditions', () => {
  const mission = new Mission02()
  const system = new LifeSupportSystem()
  mission.observe(1, system)
  assert.equal(mission.snapshot().count, 0)
  for (const step of ECLSS_MISSION_STEPS.slice(0, -1)) mission.complete(step.id)
  system.setDevice('ventilation', true); system.setDevice('scrubber', true)
  system.update(0.001)
  mission.observe(0.02, system)
  assert.equal(mission.snapshot().done, false)
  mission.observe(0.03, system)
  assert.equal(mission.snapshot().done, true)
})

test('ECLSS interaction needs proximity and facing while original airlock controls remain reachable', () => {
  const base = Object.create(LunarBaseSystem.prototype)
  base.origin = OUTPOST
  const position = { x: OUTPOST.x - 1.1, z: OUTPOST.z - 0.1 }
  assert.equal(base.nearby(position, { x: -1, z: 0 }).id, 'control')
  assert.notEqual(base.nearby(position, { x: 1, z: 0 })?.id, 'control')
  assert.equal(base.nearby({ x: OUTPOST.x, z: OUTPOST.z + 6.1 })?.id, 'outer-door')
})

test('inner hatch refuses a large cabin-to-lock pressure difference', () => {
  const base = Object.create(LunarBaseSystem.prototype)
  base.origin = OUTPOST
  base.eclss = new LifeSupportSystem()
  base.airlock = new AirlockSystem()
  base.mission = { complete() {} }
  base.eclss.cabin.removeKg('N2', 3)
  const result = base.interact({ x: OUTPOST.x, z: OUTPOST.z + 1.25 })
  assert.match(result.message, /Diferencia de presión/)
  assert.equal(base.airlock.interiorOpen, false)
})

test('using a base feature is separate from inspecting its information', () => {
  const base = Object.create(LunarBaseSystem.prototype)
  base.origin = OUTPOST
  base.airlock = new AirlockSystem()
  base.eclss = new LifeSupportSystem()
  base.mission = new BaseMission()
  base.mission02 = new Mission02()
  const solarPosition = { x: OUTPOST.x - 15, z: OUTPOST.z + 2.2 }

  const used = base.interact(solarPosition)
  assert.equal(used.info, undefined)
  assert.equal(base.mission.snapshot().count, 0)
  assert.match(used.message, /pulse F/)

  const inspected = base.inspect(solarPosition)
  assert.equal(inspected.info.name, 'Arreglo solar')
  assert.equal(base.mission.snapshot().steps.find(step => step.id === 'solar').done, true)

  const airlock = Object.create(LunarBaseSystem.prototype)
  airlock.origin = OUTPOST
  airlock.airlock = new AirlockSystem()
  airlock.eclss = new LifeSupportSystem()
  airlock.mission = new BaseMission()
  airlock.mission02 = new Mission02()
  const doorPosition = { x: OUTPOST.x, z: OUTPOST.z + 5.75 }
  const doorUse = airlock.interact(doorPosition)
  assert.equal(doorUse.info, undefined)
  assert.equal(airlock.airlock.state, 'cycling-to-vacuum')
  assert.equal(airlock.inspect(doorPosition).info.name, 'Esclusa EVA')
})

test('all discovery stations complete once and award their matching badges', () => {
  const base = Object.create(LunarBaseSystem.prototype)
  base.origin = OUTPOST
  base.airlock = new AirlockSystem()
  base.eclss = new LifeSupportSystem()
  base.mission = new BaseMission()
  base.mission02 = new Mission02()
  base.discoveries = { sample: false, garden: false, observatory: false }
  const targets = BASE_TARGETS.filter(target => target.kind === 'discovery' && target.discoveryId !== 'sample')

  for (const target of targets) {
    const position = { x: OUTPOST.x + target.x, z: OUTPOST.z + target.z }
    assert.match(base.interact(position).message, /Ganaste la insignia/)
    assert.match(base.interact(position).message, /ya está completa/)
    const count = base.mission.snapshot().discoveries.count
    assert.ok(base.inspect(position).info)
    assert.equal(base.mission.snapshot().discoveries.count, count)
  }
  const progress = base.mission.snapshot().discoveries
  assert.equal(progress.done, false)
  assert.equal(progress.count, targets.length)
  assert.ok(progress.badges.filter(badge => badge.id !== 'sample').every(badge => badge.earned))
  assert.equal(progress.badges.find(badge => badge.id === 'sample').earned, false)
})

test('sample mission requires collection, delivery, and the complete mineral set', () => {
  const mission = new LunarSampleMission()
  assert.equal(mission.deliver(), false)
  assert.equal(mission.analyze(TRAINING_SAMPLE_MINERALS).reason, 'not-delivered')
  assert.equal(mission.collect(), true)
  assert.equal(mission.collect(), false)
  assert.equal(mission.deliver(), true)

  const retry = mission.analyze(['plagioclase', 'orthopyroxene'])
  assert.equal(retry.complete, false)
  assert.deepEqual(retry.missing, ['olivine'])
  assert.equal(mission.snapshot().status, 'delivered')
  assert.equal(mission.analyze([...TRAINING_SAMPLE_MINERALS, 'ilmenite']).complete, false)
  assert.equal(mission.analyze(TRAINING_SAMPLE_MINERALS).complete, true)
  assert.equal(mission.snapshot().done, true)
})

test('collecting the field sample opens the lab and awards its badge only after analysis', () => {
  const base = Object.create(LunarBaseSystem.prototype)
  base.origin = OUTPOST
  base.airlock = new AirlockSystem()
  base.eclss = new LifeSupportSystem()
  base.mission = new BaseMission()
  base.mission02 = new Mission02()
  base.sampleMission = new LunarSampleMission()
  base.discoveries = { sample: false, garden: false, observatory: false }
  const samplePosition = { x: OUTPOST.x + 4, z: OUTPOST.z + 11.5 }
  const labPosition = { x: OUTPOST.x + 2.8, z: OUTPOST.z - 1.08 }

  assert.equal(base.interact(labPosition).sampleLab, undefined)
  assert.equal(base.sampleMission.snapshot().status, 'field')
  base.interact(samplePosition)
  assert.equal(base.sampleMission.snapshot().status, 'carried')
  assert.equal(base.nearby({ x: OUTPOST.x + 0.7, z: OUTPOST.z - 1.45 }).id, 'sample-lab')
  const delivered = base.interact(labPosition)
  assert.equal(delivered.sampleLab, true)
  assert.equal(base.sampleMission.snapshot().status, 'delivered')
  assert.equal(base.mission.snapshot().discoveries.badges.find(badge => badge.id === 'sample').earned, false)
  assert.equal(base.completeSampleAnalysis(['plagioclase']).complete, false)
  assert.equal(base.completeSampleAnalysis(TRAINING_SAMPLE_MINERALS).complete, true)
  assert.equal(base.mission.snapshot().discoveries.badges.find(badge => badge.id === 'sample').earned, true)
  assert.equal(base.interact(labPosition).sampleLab, undefined)
})

test('accelerated multi-day operation keeps reservoirs finite and non-negative', () => {
  const system = new LifeSupportSystem()
  system.setDevice('ventilation', true)
  system.setDevice('scrubber', true)
  system.setDevice('generator', true)
  system.update(4, { aboveHorizon: true }, -150)
  for (const value of Object.values(system.storage)) {
    if (typeof value === 'number') assert.ok(Number.isFinite(value) && value >= 0)
  }
  for (const gas of GAS_NAMES) assert.ok(Number.isFinite(system.cabin.massKg(gas)) && system.cabin.massKg(gas) >= 0)
  assert.ok(system.stable())
})
