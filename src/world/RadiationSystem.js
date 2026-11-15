import { RadiationGrid, horizonAtAzimuth } from './TerrainShielding.js'
import { SpaceWeather } from './SpaceWeather.js'
import { AstronautDosimeter } from './AstronautDosimeter.js'

export const RADIATION_CONFIG = Object.freeze({
  referenceGcrMsVPerDay: 1.369, // LND measured equivalent dose, context-specific
  geometricSensitivity: 0.45, // uncalibrated teaching hypothesis
})

export class RadiationSystem {
  constructor({ sampleHeight, config = RADIATION_CONFIG } = {}) {
    this.config = config
    this.grid = new RadiationGrid(sampleHeight)
    this.weather = new SpaceWeather()
    this.dosimeter = new AstronautDosimeter()
    this.lastX = 0
    this.lastZ = 0
  }
  // Model extension point: a material transport model can replace these
  // geometric proxies for habitats, refuges and secondary particles.
  gcrRate(sector) {
    return this.config.referenceGcrMsVPerDay
      * (1 - this.config.geometricSensitivity * (1 - sector.skyView))
  }
  sepVisibility(sector) {
    const event = this.weather.event
    if (!event) return 0
    // Event direction is a manually set approximation, not the light vector.
    return event.elevation > horizonAtAzimuth(sector.horizon, event.azimuth) ? 1 : 0
  }
  ratesAt(x, z, days) {
    const sector = this.grid.sectorAt(x, z)
    sector.lastUpdatedDays = days
    const gcr = this.gcrRate(sector)
    const sep = this.weather.rate(days) * this.sepVisibility(sector)
    return { x: sector.x, z: sector.z, skyView: sector.skyView,
      geometricShelter: 1 - sector.skyView, environment: sector.environment,
      gcr, sep, total: gcr + sep, sepActive: this.weather.active(days),
      event: this.weather.event, model: 'EDUCATIVO / NO CALIBRADO' }
  }
  update(days, x, z) {
    const sector = this.grid.sectorAt(x, z)
    const start = this.dosimeter.lastDays
    if (days > start) {
      const sepVisible = this.sepVisibility(sector)
      this.dosimeter.advance(days, { gcrRate: this.gcrRate(sector),
        sepDose: this.weather.doseBetween(start, days) * sepVisible,
        sepDays: this.weather.overlapDays(start, days) })
    }
    this.lastX = x; this.lastZ = z
    return this.telemetry(days, x, z)
  }
  telemetry(days, x = this.lastX, z = this.lastZ) {
    return { ...this.ratesAt(x, z, days), doseMsV: this.dosimeter.doseMsV,
      exposureDays: this.dosimeter.exposureDays, sepDays: this.dosimeter.sepDays }
  }
  startScenario(days, settings) {
    this.weather.start(days, settings)
    return this.telemetry(days)
  }
  endScenario(days) {
    this.update(days, this.lastX, this.lastZ)
    this.weather.stop()
    return this.telemetry(days)
  }
  rebaseClock(days) {
    this.weather.stop()
    this.dosimeter.rebase(days)
    return this.telemetry(days)
  }
}
