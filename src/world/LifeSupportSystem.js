import { AtmosphereModel, GAS_NAMES, equalizeAtmospheres, saturationPressurePa } from './AtmosphereModel.js'

const HOUR = 24
export const ECLSS_CONFIG = Object.freeze({
  cabinVolumeM3: 100, lockVolumeM3: 8, initialTemperatureK: 294.15,
  pressureTargetPa: 56_500, o2Fraction: 0.34, co2PartialPa: 50,
  relativeHumidity: 45, crew: 4, occupied: true,
  o2UseKgPerPersonDay: 0.82, co2KgPerPersonDay: 1.04, crewMoistureKgPerPersonDay: 0.5,
  o2GeneratorKgDay: 4.2, co2RemovalKgDay: 5.2, condenserKgDay: 4.5,
  o2RegulatorKgDay: 8, n2RegulatorKgDay: 8,
  solarPowerW: 2400, batteryCapacityKWh: 120, batteryDischargeW: 2200,
  thermalCapacityJPerK: 50_000_000, heatLeakWPerK: 6, temperatureTargetC: 21,
  leakFractionPerDay: 0,
  // Operational teaching bands, not medical exposure limits.
  bands: { pressureKPa: [50, 62], o2KPa: [17, 23], co2KPa: [0, 0.4],
    temperatureC: [18, 27], humidity: [25, 75] },
  criticalBands: { pressureKPa: [40, 70], o2KPa: [14, 26], co2KPa: [0, 0.8],
    temperatureC: [10, 35], humidity: [10, 90] },
})

const EQUIPMENT_W = Object.freeze({ regulator: 35, ventilation: 170, scrubber: 470,
  generator: 760, condenser: 130, thermal: 1000, science: 250, laboratory: 0 })

export class LifeSupportSystem {
  constructor(config = {}) {
    this.config = { ...ECLSS_CONFIG, ...config, bands: { ...ECLSS_CONFIG.bands, ...config.bands },
      criticalBands: { ...ECLSS_CONFIG.criticalBands, ...config.criticalBands } }
    const c = this.config
    const waterPa = saturationPressurePa(c.initialTemperatureK - 273.15) * c.relativeHumidity / 100
    const o2Pa = c.pressureTargetPa * c.o2Fraction
    const n2Pa = c.pressureTargetPa - o2Pa - c.co2PartialPa - waterPa
    if (n2Pa <= 0) throw new Error('Inconsistent initial atmosphere')
    const partials = { O2: o2Pa, N2: n2Pa, CO2: c.co2PartialPa, H2O: waterPa }
    this.cabin = new AtmosphereModel(c.cabinVolumeM3, c.initialTemperatureK, partials)
    this.lock = new AtmosphereModel(c.lockVolumeM3, c.initialTemperatureK, partials)
    this.storage = { O2: 30, N2: 20, water: 100, hydrogen: 0, capturedCO2: 0,
      wastewater: 0, vented: { O2: 0, N2: 0, CO2: 0, H2O: 0 } }
    this.capacity = { O2: 40, N2: 30, water: 120, hydrogen: 20, capturedCO2: 100 }
    this.enabled = { regulator: true, ventilation: false, scrubber: false,
      generator: false, condenser: true, thermal: true, science: false, laboratory: false }
    this.laboratoryPowerW = 0
    this.laboratoryEnergyKWh = 0
    this.scienceFaultW = 0
    this.failed = Object.fromEntries(Object.keys(this.enabled).map(key => [key, false]))
    this.operating = Object.fromEntries(Object.keys(this.enabled).map(key => [key, false]))
    this.blocked = Object.fromEntries(Object.keys(this.enabled).map(key => [key, '']))
    this.powerLimitW = Infinity
    this.batteryKWh = c.batteryCapacityKWh
    this.energyUsedKWh = 0
    this.lastPower = { availableW: 0, demandW: 0, usedW: 0, solarW: 0 }
    this.leakFractionPerDay = c.leakFractionPerDay
    this.flows = { metabolicO2Kg: 0, metabolicCO2Kg: 0, oxygenGeneratedKg: 0,
      oxygenSuppliedKg: 0, n2SuppliedKg: 0, co2CapturedKg: 0, waterCondensedKg: 0 }
    this.days = 0
  }

  setDevice(name, value) {
    if (!Object.hasOwn(this.enabled, name)) return false
    this.enabled[name] = !!value
    return true
  }
  toggleDevice(name) { return this.setDevice(name, !this.enabled[name]) }
  setFailure(name, value) { if (Object.hasOwn(this.failed, name)) this.failed[name] = !!value }
  setLeak(fractionPerDay) { this.leakFractionPerDay = Math.max(0, fractionPerDay) }
  setPowerLimit(watts) { this.powerLimitW = Math.max(0, watts) }
  setScienceFault(watts) { this.scienceFaultW = Math.max(0, Number(watts) || 0) }
  setLaboratoryPower(watts) {
    this.laboratoryPowerW = Math.max(0, Math.min(1000, Number(watts) || 0))
    this.enabled.laboratory = this.laboratoryPowerW > 0
  }

  // Airlock transition accounting: no gas is silently restored after venting.
  onAirlockTransition(before, after) {
    if (before === 'cycling-to-vacuum' && after === 'exterior-open') {
      for (const gas of GAS_NAMES) this.storage.vented[gas] += this.lock.removeKg(gas, this.lock.massKg(gas))
    }
    if ((before === 'cycling-to-pressure' && after === 'interior-open')
      || (after === 'interior-open' && before === 'sealed-pressurized')) {
      equalizeAtmospheres(this.cabin, this.lock)
    }
  }
  canCycleToPressure() { return this.cabin.pressurePa >= this.config.bands.pressureKPa[0] * 1000 }

  update(deltaDays, solar = { aboveHorizon: true }, exteriorCelsius = -150) {
    if (!(deltaDays > 0) || !Number.isFinite(deltaDays)) return
    // Five simulated minutes maximum prevents negative reservoirs under fast time.
    let remaining = Math.min(deltaDays, 30)
    while (remaining > 1e-10) {
      const dt = Math.min(remaining, 1 / 288)
      this.step(dt, solar, exteriorCelsius)
      remaining -= dt
    }
    this.days += Math.min(deltaDays, 30)
  }

  step(dt, solar, exteriorCelsius) {
    const c = this.config
    const hours = dt * HOUR
    const solarW = solar.aboveHorizon ? c.solarPowerW : 0
    const batteryW = Math.min(c.batteryDischargeW, this.batteryKWh * 1000 / hours)
    let availableW = Math.min(this.powerLimitW, solarW + batteryW)
    let usedW = 0
    this.blocked.generator = this.storage.water <= 0 ? 'SIN AGUA'
      : this.storage.O2 >= this.capacity.O2 || this.storage.hydrogen >= this.capacity.hydrogen ? 'DEPÓSITO LLENO' : ''
    this.blocked.scrubber = this.storage.capturedCO2 >= this.capacity.capturedCO2 ? 'CAPTURA LLENA' : ''
    this.blocked.regulator = this.storage.O2 <= 0 && this.storage.N2 <= 0 ? 'SIN GAS' : ''
    const demandW = Object.entries(this.enabled).reduce((sum, [key, on]) =>
      sum + (on && !this.failed[key] && !this.blocked[key] ? EQUIPMENT_W[key] + (key === 'science' ? this.scienceFaultW : key === 'laboratory' ? this.laboratoryPowerW : 0) : 0), 0)
    for (const [key, watts] of Object.entries(EQUIPMENT_W)) {
      const drawW = watts + (key === 'science' ? this.scienceFaultW : key === 'laboratory' ? this.laboratoryPowerW : 0)
      const working = this.enabled[key] && !this.failed[key] && !this.blocked[key] && availableW >= drawW
      this.operating[key] = working
      if (working) { availableW -= drawW; usedW += drawW }
    }
    const solarUsedW = Math.min(usedW, solarW)
    this.batteryKWh = Math.max(0, this.batteryKWh - (usedW - solarUsedW) * hours / 1000)
    this.batteryKWh = Math.min(c.batteryCapacityKWh,
      this.batteryKWh + Math.max(0, solarW - usedW) * hours / 1000)
    this.energyUsedKWh += usedW * hours / 1000
    if (this.operating.laboratory) this.laboratoryEnergyKWh += this.laboratoryPowerW * hours / 1000
    this.lastPower = { availableW: Math.min(this.powerLimitW, solarW + batteryW), demandW, usedW, solarW }

    const crew = c.occupied ? c.crew : 0
    const o2Used = this.cabin.removeKg('O2', crew * c.o2UseKgPerPersonDay * dt)
    this.flows.metabolicO2Kg += o2Used
    const co2Made = crew * c.co2KgPerPersonDay * dt *
      (crew > 0 ? o2Used / (crew * c.o2UseKgPerPersonDay * dt) : 0)
    this.cabin.addKg('CO2', co2Made)
    this.flows.metabolicCO2Kg += co2Made
    const moisture = Math.min(this.storage.water, crew * c.crewMoistureKgPerPersonDay * dt)
    this.storage.water -= moisture
    this.cabin.addKg('H2O', moisture)

    if (this.operating.generator) {
      const produced = Math.min(c.o2GeneratorKgDay * dt, this.storage.water / 1.125,
        this.capacity.O2 - this.storage.O2, (this.capacity.hydrogen - this.storage.hydrogen) / 0.125)
      this.storage.water -= produced * 1.125
      this.storage.O2 += produced
      this.storage.hydrogen += produced * 0.125
      this.flows.oxygenGeneratedKg += produced
    }
    if (this.operating.scrubber) {
      const co2FloorKg = c.co2PartialPa * c.cabinVolumeM3
        / (8.314462618 * this.cabin.temperatureK) * 0.04401
      const captured = Math.min(c.co2RemovalKgDay * dt * (this.operating.ventilation ? 1 : 0.25),
        Math.max(0, this.cabin.massKg('CO2') - co2FloorKg), this.capacity.capturedCO2 - this.storage.capturedCO2)
      this.storage.capturedCO2 += this.cabin.removeKg('CO2', captured)
      this.flows.co2CapturedKg += captured
    }
    if (this.operating.condenser) {
      const targetWaterPa = saturationPressurePa(this.cabin.temperatureK - 273.15) * c.relativeHumidity / 100
      const excessMoles = Math.max(0, (this.cabin.partialPa('H2O') - targetWaterPa) * c.cabinVolumeM3
        / (8.314462618 * this.cabin.temperatureK))
      const removed = this.cabin.removeKg('H2O', Math.min(c.condenserKgDay * dt, excessMoles * 0.01801528))
      const recovered = Math.min(removed * 0.9, this.capacity.water - this.storage.water)
      this.storage.water += recovered
      this.storage.wastewater += removed - recovered
      this.flows.waterCondensedKg += removed
    }
    if (this.operating.regulator) {
      const o2Deficit = Math.max(0, (c.pressureTargetPa * c.o2Fraction - this.cabin.partialPa('O2'))
        * c.cabinVolumeM3 / (8.314462618 * this.cabin.temperatureK) * 0.031998)
      const o2 = Math.min(o2Deficit, c.o2RegulatorKgDay * dt, this.storage.O2)
      this.storage.O2 -= o2; this.cabin.addKg('O2', o2); this.flows.oxygenSuppliedKg += o2
      const n2Deficit = Math.max(0, (c.pressureTargetPa - this.cabin.pressurePa)
        * c.cabinVolumeM3 / (8.314462618 * this.cabin.temperatureK) * 0.028014)
      const n2 = Math.min(n2Deficit, c.n2RegulatorKgDay * dt, this.storage.N2)
      this.storage.N2 -= n2; this.cabin.addKg('N2', n2); this.flows.n2SuppliedKg += n2
    }

    if (this.leakFractionPerDay > 0) {
      const lost = this.cabin.removeFraction(1 - Math.exp(-this.leakFractionPerDay * dt))
      for (const gas of GAS_NAMES) this.storage.vented[gas] += lost[gas]
    }
    const external = Number.isFinite(exteriorCelsius) ? exteriorCelsius : -150
    const insideC = this.cabin.temperatureK - 273.15
    const crewW = crew * 100
    const equipmentHeatW = usedW * 0.35
    const passiveW = c.heatLeakWPerK * (insideC - external)
    const netBeforeControl = crewW + equipmentHeatW - passiveW
    let climateW = 0
    if (this.operating.thermal) {
      const targetDelta = (c.temperatureTargetC - insideC) * c.thermalCapacityJPerK / (hours * 3600)
      climateW = Math.max(-1200, Math.min(1200, targetDelta - netBeforeControl))
    }
    this.cabin.temperatureK = Math.max(150, this.cabin.temperatureK
      + (netBeforeControl + climateW) * hours * 3600 / c.thermalCapacityJPerK)
  }

  alerts() {
    const s = this.cabin.snapshot(), b = this.config.bands, critical = this.config.criticalBands, alerts = []
    const check = (value, range, criticalRange, message) => {
      if (value < range[0] || value > range[1]) alerts.push({
        level: value < criticalRange[0] || value > criticalRange[1] ? 'critica' : 'advertencia', message })
    }
    check(s.pressureKPa, b.pressureKPa, critical.pressureKPa, 'Presión fuera de la banda operativa KYNEX')
    check(s.partialKPa.O2, b.o2KPa, critical.o2KPa, 'Oxígeno parcial fuera de la banda operativa KYNEX')
    check(s.partialKPa.CO2, b.co2KPa, critical.co2KPa, 'CO₂ parcial sobre la consigna operativa KYNEX')
    check(s.temperatureC, b.temperatureC, critical.temperatureC, 'Temperatura interior fuera de consigna')
    check(s.relativeHumidity, b.humidity, critical.humidity, 'Humedad interior fuera de consigna')
    if (!this.operating.ventilation) alerts.push({ level: 'advertencia', message: 'Ventilación detenida: mezcla homogénea no garantizada' })
    for (const [key, reason] of Object.entries(this.blocked)) {
      if (this.enabled[key] && reason) alerts.push({ level: 'advertencia', message: `${key}: ${reason}` })
    }
    if (this.lastPower.usedW < this.lastPower.demandW) alerts.push({ level: 'critica', message: 'Energía insuficiente para los equipos solicitados' })
    if (this.storage.water < 10) alerts.push({ level: 'informacion', message: 'Reserva de agua por debajo de 10 kg' })
    return alerts
  }
  stable() {
    const s = this.cabin.snapshot(), b = this.config.bands
    return this.operating.ventilation && this.operating.scrubber && this.operating.regulator
      && this.lastPower.usedW >= this.lastPower.demandW
      && s.pressureKPa >= b.pressureKPa[0] && s.pressureKPa <= b.pressureKPa[1]
      && s.partialKPa.O2 >= b.o2KPa[0] && s.partialKPa.O2 <= b.o2KPa[1]
      && s.partialKPa.CO2 <= b.co2KPa[1]
      && s.temperatureC >= b.temperatureC[0] && s.temperatureC <= b.temperatureC[1]
      && s.relativeHumidity >= b.humidity[0] && s.relativeHumidity <= b.humidity[1]
  }
  snapshot() {
    return { cabin: this.cabin.snapshot(), lock: this.lock.snapshot(), storage: structuredClone(this.storage),
      enabled: { ...this.enabled }, operating: { ...this.operating }, failed: { ...this.failed }, blocked: { ...this.blocked },
      power: { ...this.lastPower, batteryKWh: this.batteryKWh, energyUsedKWh: this.energyUsedKWh, scienceFaultW: this.scienceFaultW,
        laboratoryPowerW: this.laboratoryPowerW, laboratoryEnergyKWh: this.laboratoryEnergyKWh },
      flows: { ...this.flows }, alerts: this.alerts(), stable: this.stable(),
      crew: this.config.crew, occupied: this.config.occupied, days: this.days }
  }
  serialize() {
    return { cabin: { moles: { ...this.cabin.moles }, temperatureK: this.cabin.temperatureK, volumeM3: this.config.cabinVolumeM3 },
      lock: { moles: { ...this.lock.moles }, temperatureK: this.lock.temperatureK },
      storage: structuredClone(this.storage), enabled: { ...this.enabled }, failed: { ...this.failed },
      batteryKWh: this.batteryKWh, energyUsedKWh: this.energyUsedKWh, flows: { ...this.flows },
      days: this.days, scienceFaultW: this.scienceFaultW, laboratoryPowerW:this.laboratoryPowerW, laboratoryEnergyKWh:this.laboratoryEnergyKWh }
  }
  restore(saved) {
    if (!saved || typeof saved !== 'object') return false
    for (const [model, record] of [[this.cabin, saved.cabin], [this.lock, saved.lock]]) {
      if (!record || !Number.isFinite(record.temperatureK) || record.temperatureK < 150) return false
      for (const gas of GAS_NAMES) if (!Number.isFinite(record.moles?.[gas]) || record.moles[gas] < 0) return false
    }
    for (const [model, record] of [[this.cabin, saved.cabin], [this.lock, saved.lock]]) {
      model.temperatureK = record.temperatureK
      model.moles = { ...record.moles }
      // Legacy saves predate the fitted-out pressurized lab. Preserve partial pressures
      // when adding its SCENARIO initial atmosphere, once; the new volume is serialized.
      if (model === this.cabin) {
        const oldVolume = Number(record.volumeM3) || 100
        for (const gas of GAS_NAMES) model.moles[gas] *= this.config.cabinVolumeM3 / oldVolume
      }
    }
    for (const key of Object.keys(this.storage)) {
      if (key === 'vented') {
        for (const gas of GAS_NAMES) this.storage.vented[gas] = Math.max(0, Number(saved.storage?.vented?.[gas]) || 0)
      } else this.storage[key] = Math.max(0, Number(saved.storage?.[key]) || 0)
    }
    for (const key of Object.keys(this.enabled)) {
      this.enabled[key] = !!saved.enabled?.[key]
      this.failed[key] = !!saved.failed?.[key]
    }
    this.batteryKWh = Math.max(0, Math.min(this.config.batteryCapacityKWh, Number(saved.batteryKWh) || 0))
    this.energyUsedKWh = Math.max(0, Number(saved.energyUsedKWh) || 0)
    for (const key of Object.keys(this.flows)) this.flows[key] = Math.max(0, Number(saved.flows?.[key]) || 0)
    this.days = Math.max(0, Number(saved.days) || 0)
    this.setScienceFault(saved.scienceFaultW)
    this.laboratoryEnergyKWh = Math.max(0, Number(saved.laboratoryEnergyKWh) || 0)
    this.setLaboratoryPower(saved.laboratoryPowerW)
    return true
  }
}
