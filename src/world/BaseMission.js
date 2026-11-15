export const MISSION_STEPS = Object.freeze([
  { id: 'find', label: 'Encontrar KYNEX Outpost 01' },
  { id: 'habitat', label: 'Inspeccionar el hábitat' },
  { id: 'airlock', label: 'Identificar la esclusa' },
  { id: 'solar', label: 'Revisar paneles solares' },
  { id: 'battery', label: 'Localizar las baterías' },
  { id: 'eclss', label: 'Consultar soporte vital' },
  { id: 'antenna', label: 'Inspeccionar la antena' },
  { id: 'enter', label: 'Entrar al hábitat mediante la esclusa' },
])

export const DISCOVERY_STEPS = Object.freeze([
  { id: 'sample', label: 'Analizar una roca lunar' },
  { id: 'garden', label: 'Cuidar una planta del invernadero' },
  { id: 'observatory', label: 'Observar la Tierra con el telescopio' },
])

const DISCOVERY_BADGES = Object.freeze([
  { id: 'sample', name: 'Geóloga lunar' },
  { id: 'garden', name: 'Guardiana del jardín' },
  { id: 'observatory', name: 'Astrónoma exploradora' },
])

export class BaseMission {
  constructor() { this.completed = new Set() }
  complete(id) {
    if (![...MISSION_STEPS, ...DISCOVERY_STEPS].some(step => step.id === id) || this.completed.has(id)) return false
    this.completed.add(id)
    return true
  }
  snapshot() {
    const steps = MISSION_STEPS.map(step => ({ ...step, done: this.completed.has(step.id) }))
    const discoveries = DISCOVERY_STEPS.map(step => ({ ...step, done: this.completed.has(step.id) }))
    const discoveryCount = discoveries.filter(step => step.done).length
    return {
      steps,
      count: steps.filter(step => step.done).length,
      total: MISSION_STEPS.length,
      done: steps.every(step => step.done),
      discoveries: {
        steps: discoveries,
        count: discoveryCount,
        total: DISCOVERY_STEPS.length,
        done: discoveryCount === DISCOVERY_STEPS.length,
        badges: DISCOVERY_BADGES.map(badge => ({ ...badge, earned: this.completed.has(badge.id) })),
      },
    }
  }
}
