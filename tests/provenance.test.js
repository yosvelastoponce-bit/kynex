import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DATA_PROVENANCE, DATA_STATUS, validateProvenance } from '../src/world/DataProvenance.js'

test('all public science and scenario records carry valid provenance', () => {
  for (const [key, record] of Object.entries(DATA_PROVENANCE)) {
    assert.ok(validateProvenance(record), `Invalid provenance: ${key}`)
  }
})

test('an unsourced value cannot be marked as an observation', () => {
  assert.equal(validateProvenance({ name: 'Dose', value: 1, status: DATA_STATUS.OBSERVED,
    source: 'unknown', instrument: 'unknown', location: 'Site04' }), false)
  assert.equal(DATA_PROVENANCE.observedTemperature.status, DATA_STATUS.UNAVAILABLE)
  assert.equal(DATA_PROVENANCE.observedRadiation.status, DATA_STATUS.UNAVAILABLE)
  assert.equal(DATA_PROVENANCE.solarPosition.status, DATA_STATUS.MODELLED)
  assert.equal(DATA_PROVENANCE.earthPosition.status, DATA_STATUS.MODELLED)
  assert.equal(DATA_PROVENANCE.surfaceImage.status, DATA_STATUS.OBSERVED)
})

test('the public scene has one geographic mode and no procedural terrain imports', async () => {
  const app = await readFile(new URL('../src/App.vue', import.meta.url), 'utf8')
  const scene = await readFile(new URL('../src/world/LunarScene.js', import.meta.url), 'utf8')
  const player = await readFile(new URL('../src/player/PlayerController.js', import.meta.url), 'utf8')
  assert.doesNotMatch(app, /selectedSite|Entrenamiento lunar|selectProcedural/)
  assert.doesNotMatch(scene, /createLunarTerrain|createLunarRocks|selectProcedural/)
  assert.doesNotMatch(player, /LunarTerrain/)
})
