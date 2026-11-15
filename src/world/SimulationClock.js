// Simulated Earth days advanced per real second.
export const TIME_RATES = Object.freeze({ pause: 0, realtime: 1 / 86400, hour: 1 / 24, day: 1 })

export class SimulationClock {
  constructor() {
    this.days = 0
    this.rate = TIME_RATES.realtime
  }

  update(seconds) { this.days += seconds * this.rate }
  setRate(key) { if (Object.hasOwn(TIME_RATES, key)) this.rate = TIME_RATES[key] }
  reset() { this.days = 0 }
}
