export class AstronautDosimeter {
  constructor(days = 0) {
    this.lastDays = days
    this.doseMsV = 0
    this.exposureDays = 0
    this.sepDays = 0
    this.history = []
  }
  advance(days, { gcrRate, sepDose = 0, sepDays = 0 }) {
    if (days <= this.lastDays) return
    const elapsed = days - this.lastDays
    if (!Number.isFinite(gcrRate) || gcrRate < 0 || !Number.isFinite(sepDose) || sepDose < 0) {
      throw new RangeError('Invalid equivalent dose rate')
    }
    const increment = gcrRate * elapsed + sepDose
    this.doseMsV += increment
    this.exposureDays += elapsed
    this.sepDays += Math.max(0, Math.min(elapsed, sepDays))
    this.lastDays = days
    if (this.history.length === 0 || days - this.history.at(-1).days >= 0.1) {
      this.history.push({ days, doseMsV: this.doseMsV })
      if (this.history.length > 120) this.history.shift()
    }
  }
  // Resetting the visual clock starts a new epoch; received dose is retained.
  rebase(days) { this.lastDays = days }
}
