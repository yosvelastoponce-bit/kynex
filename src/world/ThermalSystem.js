import { heightAt } from './LunarTerrain.js'
import { solarState } from './SolarSystem.js'
import { celsius, SECONDS_PER_DAY, solarAbsorbed, thermalStep, THERMAL_CONFIG } from './ThermalPhysics.js'
import { solarExposure, terrainNormal } from './SolarExposure.js'

export const THERMAL_CELL_METERS = 100
const RECENT_STEP_DAYS = 0.125
const MAX_CATCHUP_STEPS = 192

export class ThermalSystem {
  constructor({ sampleHeight = heightAt, getSolar = solarState, config = THERMAL_CONFIG } = {}) {
    this.sampleHeight = sampleHeight
    this.getSolar = getSolar
    this.config = config
    this.sectors = new Map()
    this.minKelvin = Infinity
    this.maxKelvin = -Infinity
  }

  reset() {
    this.sectors.clear()
    this.minKelvin = Infinity
    this.maxKelvin = -Infinity
  }

  key(x, z) { return `${Math.floor(x / THERMAL_CELL_METERS)},${Math.floor(z / THERMAL_CELL_METERS)}` }

  createSector(x, z, days) {
    const ix = Math.floor(x / THERMAL_CELL_METERS), iz = Math.floor(z / THERMAL_CELL_METERS)
    const sx = (ix + 0.5) * THERMAL_CELL_METERS, sz = (iz + 0.5) * THERMAL_CELL_METERS
    const height = this.sampleHeight(sx, sz)
    const neighborMean = (
      this.sampleHeight(sx - 20, sz) + this.sampleHeight(sx + 20, sz)
      + this.sampleHeight(sx, sz - 20) + this.sampleHeight(sx, sz + 20)) / 4
    const terrainView = Math.max(0.04, Math.min(0.4, 0.12 + Math.max(0, neighborMean - height) / 50))
    const sector = { x: sx, z: sz, height, normal: terrainNormal(sx, sz, this.sampleHeight),
      terrainView, horizons: new Map(), lastUpdatedDays: days, sinceChangeDays: 0,
      sunlitDays: 0, shadowDays: 0, trendKelvinPerDay: 0 }
    const exposure = solarExposure(sector, this.getSolar(days), this.sampleHeight)
    sector.visibleFraction = exposure.visibleFraction
    sector.illuminated = !exposure.shadowed
    // A spatially varying baseline for unseen ground, not a measured 2026 temperature.
    sector.surfaceKelvin = 112 + 85 * exposure.incidence * exposure.visibleFraction
    sector.subsurfaceKelvin = this.config.initialSubsurfaceKelvin
    this.record(sector)
    return sector
  }

  record(sector) {
    this.minKelvin = Math.min(this.minKelvin, sector.surfaceKelvin)
    this.maxKelvin = Math.max(this.maxKelvin, sector.surfaceKelvin)
  }

  advance(sector, days) {
    const gap = days - sector.lastUpdatedDays
    if (gap <= 0) return sector
    const stepSize = Math.max(RECENT_STEP_DAYS, gap / MAX_CATCHUP_STEPS)
    const steps = Math.ceil(gap / stepSize)
    const dtDays = gap / steps
    const firstTemperature = sector.surfaceKelvin
    for (let i = 0; i < steps; i++) {
      const midpoint = sector.lastUpdatedDays + dtDays / 2
      const exposure = solarExposure(sector, this.getSolar(midpoint), this.sampleHeight)
      const nextIlluminated = !exposure.shadowed
      if (nextIlluminated !== sector.illuminated) sector.sinceChangeDays = 0
      sector.sinceChangeDays += dtDays
      if (nextIlluminated) sector.sunlitDays += dtDays
      else sector.shadowDays += dtDays
      sector.illuminated = nextIlluminated
      sector.visibleFraction = exposure.visibleFraction
      const incoming = solarAbsorbed(sector.normal, this.getSolar(midpoint).direction,
        exposure.visibleFraction, this.config)
      const next = thermalStep(sector.surfaceKelvin, sector.subsurfaceKelvin,
        incoming, sector.terrainView, dtDays * SECONDS_PER_DAY, this.config)
      sector.surfaceKelvin = next.surfaceKelvin
      sector.subsurfaceKelvin = next.subsurfaceKelvin
      sector.lastUpdatedDays += dtDays
    }
    sector.lastUpdatedDays = days
    sector.trendKelvinPerDay = (sector.surfaceKelvin - firstTemperature) / gap
    this.record(sector)
    return sector
  }

  sectorAt(x, z, days) {
    const key = this.key(x, z)
    let sector = this.sectors.get(key)
    if (!sector) {
      sector = this.createSector(x, z, days)
      this.sectors.set(key, sector)
    } else this.advance(sector, days)
    return sector
  }

  telemetryAt(x, z, days) {
    const sector = this.sectorAt(x, z, days)
    return { x: sector.x, z: sector.z, kelvin: sector.surfaceKelvin,
      celsius: celsius(sector.surfaceKelvin), illuminated: sector.illuminated,
      visibleFraction: sector.visibleFraction, trendKelvinPerDay: sector.trendKelvinPerDay,
      sinceChangeDays: sector.sinceChangeDays,
      minimumCelsius: celsius(this.minKelvin), maximumCelsius: celsius(this.maxKelvin) }
  }
}
