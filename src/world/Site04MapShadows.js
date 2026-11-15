import { interpolateTriangularGrid } from './Site04Data.js'

// DEM-derived teaching shadow mask. Rays end at the edge of the available DEM;
// terrain beyond Site04 cannot be inferred. Photo shadows remain baked in.
export function site04ShadowMask(elevations, {
  width = 480, outputSize = 120, pixelMeters = 5,
  azimuth, elevation, rayStepCells = 2,
}) {
  const pixels = new Uint8ClampedArray(outputSize * outputSize * 4)
  const night = elevation <= 0
  const angle = azimuth * Math.PI / 180
  const towardX = Math.sin(angle), towardY = -Math.cos(angle)
  const sunSlope = Math.tan(elevation * Math.PI / 180)
  const gridScale = (width - 1) / (outputSize - 1)
  for (let row = 0; row < outputSize; row++) {
    for (let column = 0; column < outputSize; column++) {
      let shadowed = night
      if (!night) {
        const x = column * gridScale, y = row * gridScale
        const ground = interpolateTriangularGrid(elevations, width, x, y)
        for (let distance = rayStepCells; distance < width * Math.SQRT2; distance += rayStepCells) {
          const sx = x + towardX * distance, sy = y + towardY * distance
          if (sx < 0 || sx > width - 1 || sy < 0 || sy > width - 1) break
          const rayHeight = ground + sunSlope * distance * pixelMeters + 0.35
          if (interpolateTriangularGrid(elevations, width, sx, sy) > rayHeight) {
            shadowed = true
            break
          }
        }
      }
      const index = (row * outputSize + column) * 4
      pixels[index + 3] = shadowed ? (night ? 190 : 168) : 0
    }
  }
  return pixels
}
