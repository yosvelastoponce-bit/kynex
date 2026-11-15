// A teachable state machine. The caller supplies seconds from the shared
// simulation clock, so a paused clock also pauses an airlock cycle.
export class AirlockSystem {
  constructor(cycleSeconds = 2) {
    this.cycleSeconds = cycleSeconds
    this.state = 'sealed-pressurized'
    this.remaining = 0
    this.message = 'Cámara presurizada; ambas compuertas cerradas.'
  }
  get interiorOpen() { return this.state === 'interior-open' }
  get exteriorOpen() { return this.state === 'exterior-open' }
  get cycling() { return this.state.startsWith('cycling-') }
  get pressure() {
    return ['sealed-vacuum', 'exterior-open', 'cycling-to-pressure'].includes(this.state)
      ? 'VACÍO SIMULADO' : 'PRESURIZADA'
  }
  request(side) {
    if (this.cycling) return this.reject('Espere a que termine el ciclo de la cámara.')
    if (side === 'exterior') {
      if (this.exteriorOpen) return this.set('sealed-vacuum', 'Compuerta exterior cerrada. Cámara aislada.')
      if (this.interiorOpen) return this.reject('Cierre primero la compuerta interior.')
      if (this.state === 'sealed-vacuum') return this.set('exterior-open', 'Compuerta exterior abierta. Acceso a la superficie.')
      return this.cycle('cycling-to-vacuum', 'Aislando y despresurizando la cámara...')
    }
    if (side === 'interior') {
      if (this.interiorOpen) return this.set('sealed-pressurized', 'Compuerta interior cerrada. Cámara aislada.')
      if (this.exteriorOpen) return this.reject('Cierre primero la compuerta exterior.')
      if (this.state === 'sealed-pressurized') return this.set('interior-open', 'Compuerta interior abierta. Acceso al hábitat.')
      return this.cycle('cycling-to-pressure', 'Presurizando la cámara aislada...')
    }
    return this.reject('Control de compuerta desconocido.')
  }
  set(state, message) { this.state = state; this.message = message; return { accepted: true, state, message } }
  reject(message) { this.message = message; return { accepted: false, state: this.state, message } }
  cycle(state, message) { this.remaining = this.cycleSeconds; return this.set(state, message) }
  update(seconds) {
    if (!this.cycling) return null
    this.remaining = Math.max(0, this.remaining - Math.max(0, seconds))
    if (this.remaining > 0) return null
    return this.state === 'cycling-to-vacuum'
      ? this.set('exterior-open', 'Ciclo terminado: compuerta exterior abierta.')
      : this.set('interior-open', 'Ciclo terminado: compuerta interior abierta.')
  }
}
