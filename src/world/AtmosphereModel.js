export const GAS = Object.freeze({ O2: 0.031998, N2: 0.028014, CO2: 0.04401, H2O: 0.01801528 }) // kg/mol
export const GAS_CONSTANT = 8.314462618 // Pa m³/(mol K)
export const GAS_NAMES = Object.freeze(Object.keys(GAS))

// Magnus equation for liquid water, used only near the configured cabin range.
export function saturationPressurePa(celsius) {
  return 610.94 * Math.exp(17.625 * celsius / (celsius + 243.04))
}

export class AtmosphereModel {
  constructor(volumeM3, temperatureK, partialPa = {}) {
    if (!(volumeM3 > 0) || !(temperatureK > 0)) throw new Error('Invalid atmosphere volume or temperature')
    this.volumeM3 = volumeM3
    this.temperatureK = temperatureK
    this.moles = Object.fromEntries(GAS_NAMES.map(gas => [gas,
      Math.max(0, partialPa[gas] ?? 0) * volumeM3 / (GAS_CONSTANT * temperatureK)]))
  }
  partialPa(gas) { return this.moles[gas] * GAS_CONSTANT * this.temperatureK / this.volumeM3 }
  get pressurePa() { return GAS_NAMES.reduce((sum, gas) => sum + this.partialPa(gas), 0) }
  get relativeHumidity() {
    return 100 * this.partialPa('H2O') / saturationPressurePa(this.temperatureK - 273.15)
  }
  get fractions() {
    const total = GAS_NAMES.reduce((sum, gas) => sum + this.moles[gas], 0)
    return Object.fromEntries(GAS_NAMES.map(gas => [gas, total > 0 ? this.moles[gas] / total : 0]))
  }
  massKg(gas) { return this.moles[gas] * GAS[gas] }
  addKg(gas, kg) {
    if (!(kg >= 0) || !Number.isFinite(kg)) throw new Error('Invalid gas addition')
    this.moles[gas] += kg / GAS[gas]
  }
  removeKg(gas, kg) {
    if (!(kg >= 0) || !Number.isFinite(kg)) throw new Error('Invalid gas removal')
    const removed = Math.min(kg, this.massKg(gas))
    this.moles[gas] = Math.max(0, this.moles[gas] - removed / GAS[gas])
    return removed
  }
  removeFraction(fraction) {
    const removed = {}
    for (const gas of GAS_NAMES) removed[gas] = this.removeKg(gas, this.massKg(gas) * Math.min(1, Math.max(0, fraction)))
    return removed
  }
  snapshot() {
    return { volumeM3: this.volumeM3, temperatureC: this.temperatureK - 273.15,
      pressureKPa: this.pressurePa / 1000, relativeHumidity: this.relativeHumidity,
      partialKPa: Object.fromEntries(GAS_NAMES.map(gas => [gas, this.partialPa(gas) / 1000])),
      fractions: this.fractions, massKg: Object.fromEntries(GAS_NAMES.map(gas => [gas, this.massKg(gas)])) }
  }
}

// Idealized common-temperature equalization while the interior hatch is open.
export function equalizeAtmospheres(cabin, lock) {
  const totalVolume = cabin.volumeM3 + lock.volumeM3
  lock.temperatureK = cabin.temperatureK
  for (const gas of GAS_NAMES) {
    const total = cabin.moles[gas] + lock.moles[gas]
    cabin.moles[gas] = total * cabin.volumeM3 / totalVolume
    lock.moles[gas] = total * lock.volumeM3 / totalVolume
  }
}
