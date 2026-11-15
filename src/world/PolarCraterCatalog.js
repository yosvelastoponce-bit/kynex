// IAU-adopted crater centers from the USGS Gazetteer of Planetary Nomenclature.
// Coordinates are planetographic, positive east. The source chart is LAC 144.
const centers = [
  ['Drygalski', -79.57, -87.18, 9, 44],
  ['Cabeus', -85.33, -42.13, 24, 29],
  ['Malapert', -85.00, 11.40, 57, 21],
  ['Haworth', -86.90, -4.00, 45, 31],
  ['Nobile', -85.28, 53.27, 72, 32],
  ['Shoemaker', -88.14, 45.91, 61, 42],
  ['de Gerlache', -88.48, -88.34, 26, 54],
  ['Shackleton', -89.67, 129.78, 47, 61],
  ['Faustini', -87.18, 84.31, 64, 54],
  ['Amundsen', -84.44, 83.07, 77, 57],
  ['Sverdrup', -88.32, -153.39, 35, 66],
]

// Matches the south-polar stereographic orientation of the USGS LAC 144 chart:
// 0° east at the top, 90° east at the right, pole at the center.
export function polarChartPoint(latitude, longitude) {
  const radius = 47.6 * Math.tan((90 + latitude) * Math.PI / 360) / Math.tan(10 * Math.PI / 360)
  const angle = longitude * Math.PI / 180
  return { x: 50 + radius * Math.sin(angle), y: 50 - radius * Math.cos(angle) }
}

export const POLAR_CRATERS = centers.map(([name, latitude, longitude, labelX, labelY]) => ({
  name, latitude, longitude, labelX, labelY,
  ...polarChartPoint(latitude, longitude),
}))
