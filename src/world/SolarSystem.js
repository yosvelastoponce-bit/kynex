// Teaching model for the geographic south pole, not a Shackleton ephemeris.
// World axes: +Y up, -Z map north, +X map east. Azimuth is clockwise from -Z.
const DEG = Math.PI / 180
const LUNAR_DAY = 29.53 // Earth days per solar circuit
const SEASONAL_YEAR = 365.24 // Earth days

export const SOLAR_CONFIG = Object.freeze({
  initialAzimuth: 60, // degrees: a clear horizon from the illustrative spawn
  initialElevation: 1.2, // degrees, within the polar +/-1.5 degree band
  maxElevation: 1.5,
})

export function solarState(days, config = SOLAR_CONFIG) {
  const phase = Math.asin(config.initialElevation / config.maxElevation)
  const azimuth = ((config.initialAzimuth + 360 * days / LUNAR_DAY) % 360 + 360) % 360
  const elevation = config.maxElevation * Math.sin(2 * Math.PI * days / SEASONAL_YEAR + phase)
  const a = azimuth * DEG
  const h = elevation * DEG
  return {
    days,
    azimuth,
    elevation,
    aboveHorizon: elevation > 0,
    direction: { x: Math.sin(a) * Math.cos(h), y: Math.sin(h), z: -Math.cos(a) * Math.cos(h) },
  }
}
