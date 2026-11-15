export const STEFAN_BOLTZMANN = 5.670374419e-8 // W m^-2 K^-4
export const SECONDS_PER_DAY = 86_400

// Educational effective layer parameters, not Diviner measurements.
export const THERMAL_CONFIG = Object.freeze({
  irradiance: 1361, // W/m² near 1 AU
  albedo: 0.12,
  emissivity: 0.95,
  surfaceCapacity: 25_000, // J/(m² K)
  subsurfaceCapacity: 150_000, // J/(m² K)
  subsurfaceConductance: 0.03, // W/(m² K)
  surroundingKelvin: 95,
  initialSubsurfaceKelvin: 110,
  minimumKelvin: 2.7,
})

export function solarAbsorbed(normal, sunDirection, visibleFraction, config = THERMAL_CONFIG) {
  const incidence = Math.max(0, normal.x * sunDirection.x + normal.y * sunDirection.y + normal.z * sunDirection.z)
  return (1 - config.albedo) * config.irradiance * incidence * Math.max(0, Math.min(1, visibleFraction))
}

export function emittedRadiation(kelvin, config = THERMAL_CONFIG) {
  return config.emissivity * STEFAN_BOLTZMANN * kelvin ** 4
}

// Implicit surface step: radiation and subsurface exchange are evaluated at
// the new temperature. Monotone bisection avoids Euler overshoot at 1 day/s.
export function thermalStep(surfaceKelvin, subsurfaceKelvin, solarWm2, terrainView, seconds, config = THERMAL_CONFIG) {
  if (seconds <= 0) return { surfaceKelvin, subsurfaceKelvin }
  const conduction = config.subsurfaceConductance
  const terrainWm2 = terrainView * emittedRadiation(config.surroundingKelvin, config)
  const residual = (temperature) => config.surfaceCapacity * (temperature - surfaceKelvin) / seconds
    - solarWm2 - terrainWm2 - conduction * (subsurfaceKelvin - temperature) + emittedRadiation(temperature, config)
  let low = config.minimumKelvin
  let high = Math.max(500, surfaceKelvin + 100)
  for (let i = 0; i < 32; i++) {
    const mid = (low + high) / 2
    if (residual(mid) > 0) high = mid
    else low = mid
  }
  const nextSurface = (low + high) / 2
  const ratio = seconds * conduction / config.subsurfaceCapacity
  const nextSubsurface = (subsurfaceKelvin + ratio * nextSurface) / (1 + ratio)
  return { surfaceKelvin: nextSurface, subsurfaceKelvin: nextSubsurface }
}

export function celsius(kelvin) { return kelvin - 273.15 }
