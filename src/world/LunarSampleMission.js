export const SAMPLE_MINERALS = Object.freeze([
  { id: 'plagioclase', name: 'Plagioclasa', clue: 'Mineral claro, muy común en las rocas de las tierras altas lunares.' },
  { id: 'orthopyroxene', name: 'Ortopiroxeno', clue: 'Silicato que aparece en mapas espectrales de la región polar.' },
  { id: 'olivine', name: 'Olivino', clue: 'Silicato que aparece en mapas espectrales de la región polar.' },
  { id: 'clinopyroxene', name: 'Clinopiroxeno', clue: 'También existe en rocas lunares; no forma parte de esta mezcla de entrenamiento.' },
  { id: 'ilmenite', name: 'Ilmenita', clue: 'Óxido de hierro y titanio descrito en algunas muestras lunares Apollo.' },
])

export const TRAINING_SAMPLE_MINERALS = Object.freeze([
  'plagioclase',
  'orthopyroxene',
  'olivine',
])

const STEPS = Object.freeze([
  { id: 'find', label: 'Encontrar una roca en la superficie' },
  { id: 'collect', label: 'Recogerla con E' },
  { id: 'deliver', label: 'Llevarla al laboratorio' },
  { id: 'analyze', label: 'Analizarla con el microscopio' },
])

export class LunarSampleMission {
  constructor() {
    this.status = 'field'
  }

  collect() {
    if (this.status !== 'field') return false
    this.status = 'carried'
    return true
  }

  deliver() {
    if (this.status !== 'carried') return false
    this.status = 'delivered'
    return true
  }

  analyze(selectedMinerals) {
    if (this.status !== 'delivered') {
      return { complete: false, reason: 'not-delivered', missing: [...TRAINING_SAMPLE_MINERALS], extra: [] }
    }

    const selected = new Set(selectedMinerals)
    const target = new Set(TRAINING_SAMPLE_MINERALS)
    const missing = [...target].filter(mineral => !selected.has(mineral))
    const extra = [...selected].filter(mineral => !target.has(mineral))
    if (missing.length || extra.length) {
      return { complete: false, reason: 'try-again', missing, extra }
    }

    this.status = 'analyzed'
    return { complete: true, reason: 'identified', missing: [], extra: [] }
  }

  snapshot() {
    const completed = {
      find: true,
      collect: ['carried', 'delivered', 'analyzed'].includes(this.status),
      deliver: ['delivered', 'analyzed'].includes(this.status),
      analyze: this.status === 'analyzed',
    }
    const steps = STEPS.map(step => ({ ...step, done: completed[step.id] }))
    return {
      status: this.status,
      steps,
      count: steps.filter(step => step.done).length,
      total: steps.length,
      done: this.status === 'analyzed',
    }
  }
}
