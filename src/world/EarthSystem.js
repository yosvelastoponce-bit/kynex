// Educational approximation near the lunar south pole, not an ephemeris.
// +Y is up, -Z is map north, +X is east; azimuth increases clockwise from -Z.
const DEG = Math.PI / 180
const SIDEREAL_DAY = 0.9972696 // Earth days (23 h 56 min 4 s)
export const EARTH_ANGULAR_DIAMETER = 1.9 // degrees

export const EARTH_CONFIG = Object.freeze({
  observerLatitude: -89.2,
  observerLongitude: 0,
  meanAzimuthAtZeroLongitude: 300,
  elevationAmplitude: 1.0,
  azimuthAmplitude: 8,
  elevationPeriodDays: 27.21,
  azimuthPeriodDays: 27.55,
  elevationPhase: Math.PI / 3,
  azimuthPhase: 0,
  axialTilt: 23.44,
})

export function earthState(days, solar, config = EARTH_CONFIG) {
  // The latitude/longitude mapping is illustrative. Real positions need SPICE.
  const meanElevation = 90 + config.observerLatitude
  const elevation = meanElevation + config.elevationAmplitude
    * Math.sin(2 * Math.PI * days / config.elevationPeriodDays + config.elevationPhase)
  const azimuth = ((config.meanAzimuthAtZeroLongitude + config.observerLongitude
    + config.azimuthAmplitude * Math.sin(2 * Math.PI * days / config.azimuthPeriodDays + config.azimuthPhase)) % 360 + 360) % 360
  const a = azimuth * DEG
  const h = elevation * DEG
  const direction = { x: Math.sin(a) * Math.cos(h), y: Math.sin(h), z: -Math.cos(a) * Math.cos(h) }
  const dot = direction.x * solar.direction.x + direction.y * solar.direction.y + direction.z * solar.direction.z
  // The viewer on the Moon looks toward Earth; sunlight comes from solar.direction.
  const illuminatedFraction = Math.max(0, Math.min(1, (1 - dot) / 2))
  const phase = illuminatedFraction < 0.035 ? 'NUEVA'
    : illuminatedFraction < 0.44 ? 'CRECIENTE'
      : illuminatedFraction < 0.56 ? 'CUARTO'
        : illuminatedFraction < 0.965 ? 'GIBOSA' : 'LLENA'

  return {
    days, azimuth, elevation, direction, illuminatedFraction, phase,
    spinRadians: days * 2 * Math.PI / SIDEREAL_DAY,
  }
}
