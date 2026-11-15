export const ECLSS_MISSION_STEPS = Object.freeze([
  { id: 'enter', label: 'Entrar al hábitat por la esclusa' },
  { id: 'console', label: 'Encontrar el control ambiental' },
  { id: 'pressure', label: 'Comprobar la presión interior' },
  { id: 'oxygen', label: 'Inspeccionar reservas de oxígeno' },
  { id: 'power', label: 'Verificar energía disponible' },
  { id: 'ventilation', label: 'Activar ventilación' },
  { id: 'scrubber', label: 'Activar captura de CO₂' },
  { id: 'supply', label: 'Verificar generación o suministro de O₂' },
  { id: 'climate', label: 'Revisar temperatura y humedad' },
  { id: 'stable', label: 'Confirmar estabilidad durante 1 h simulada' },
])

export class Mission02 {
  constructor() { this.completed = new Set(); this.stableDays = 0 }
  complete(id) {
    if (!ECLSS_MISSION_STEPS.some(step => step.id === id)) return false
    const before = this.completed.size
    this.completed.add(id)
    return this.completed.size !== before
  }
  observe(deltaDays, eclss) {
    if (this.completed.size < ECLSS_MISSION_STEPS.length - 1) return
    this.stableDays = eclss.stable() ? this.stableDays + Math.max(0, deltaDays) : 0
    if (this.stableDays >= 1 / 24) this.complete('stable')
  }
  snapshot() {
    return { steps: ECLSS_MISSION_STEPS.map(step => ({ ...step, done: this.completed.has(step.id) })),
      count: this.completed.size, total: ECLSS_MISSION_STEPS.length,
      stableMinutes: Math.min(60, this.stableDays * 1440),
      done: this.completed.size === ECLSS_MISSION_STEPS.length }
  }
}
