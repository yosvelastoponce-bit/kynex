import * as Astronomy from 'astronomy-engine'

// The orbital inset has a reproducible UTC epoch. It shares the simulation's
// elapsed days, but the existing surface sky remains an educational model.
export const ORBIT_EPOCH_UTC = '2026-11-11T00:00:00.000Z'
export const MOON_ORBIT_ENLARGEMENT = 55
const EPOCH_MS = Date.parse(ORBIT_EPOCH_UTC)
const MS_PER_DAY = 86_400_000
const AU_KM = 149_597_870.7
const ecliptic = Astronomy.Rotation_EQJ_ECL()

function project(vector) {
  const rotated = Astronomy.RotateVector(ecliptic, vector)
  return { x: rotated.x, y: rotated.y, z: rotated.z }
}

function at(days) { return new Astronomy.AstroTime(new Date(EPOCH_MS + days * MS_PER_DAY)) }

export function orbitalState(days) {
  const time = at(days)
  const earth = project(Astronomy.HelioVector(Astronomy.Body.Earth, time))
  const moon = project(Astronomy.GeoVector(Astronomy.Body.Moon, time, false))
  return {
    utc: time.date.toISOString(), earth, moon,
    earthSunDistanceAu: Math.hypot(earth.x, earth.y, earth.z),
    earthMoonDistanceKm: Math.hypot(moon.x, moon.y, moon.z) * AU_KM,
  }
}

// True heliocentric Earth positions sampled for the visible orbit line.
export const earthOrbitPath = Array.from({ length: 121 }, (_, i) => {
  const earth = project(Astronomy.HelioVector(Astronomy.Body.Earth, at(i * 365.25 / 120)))
  return { x: earth.x, y: earth.y }
})
