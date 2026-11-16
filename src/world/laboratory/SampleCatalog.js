import { SAMPLE_CATALOG } from '../../data/lunar-samples/catalog.js'
export { SAMPLE_CATALOG }
export function sampleById(id) { return SAMPLE_CATALOG.find(sample=>sample.id===id) ?? null }
export function availableSamples(sampleStatus) {
  return SAMPLE_CATALOG.filter(s=>s.evidence!=='SCENARIO' || ['delivered','analyzed'].includes(sampleStatus))
}
