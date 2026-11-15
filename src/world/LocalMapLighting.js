// Approximate shadows from the same local height field displayed by the map.
// This is bounded to 400 m, matching the limited shadow window in the 3D scene.
export function litMapPixels(heights, size, span, min, max, azimuth, elevation) {
  const pixels = new Uint8ClampedArray(size * size * 4)
  const cell = span / (size - 1)
  const angle = azimuth * Math.PI / 180
  const towardX = Math.sin(angle)
  const towardY = -Math.cos(angle) // map down is world +Z
  const horizonSlope = Math.tan(elevation * Math.PI / 180)
  const aboveHorizon = elevation > 0
  const maxSteps = Math.ceil(400 / (cell * 2))
  const range = Math.max(1, max - min)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const h = heights[i]
      const left = heights[y * size + Math.max(0, x - 1)]
      const right = heights[y * size + Math.min(size - 1, x + 1)]
      const up = heights[Math.max(0, y - 1) * size + x]
      const down = heights[Math.min(size - 1, y + 1) * size + x]
      const relief = (left - right + up - down) * 3.8
      const grain = ((x * 13 + y * 37) % 17) - 8
      const base = Math.max(23, Math.min(222, 64 + (h - min) / range * 105 + relief + grain))

      let shadowed = !aboveHorizon
      if (aboveHorizon) {
        for (let step = 1; step <= maxSteps; step++) {
          const distanceCells = step * 2
          const sampleX = Math.round(x + towardX * distanceCells)
          const sampleY = Math.round(y + towardY * distanceCells)
          if (sampleX < 0 || sampleX >= size || sampleY < 0 || sampleY >= size) break
          const distance = distanceCells * cell
          if (heights[sampleY * size + sampleX] > h + horizonSlope * distance + 0.5) {
            shadowed = true
            break
          }
        }
      }

      const slopeTowardSun = (left - right) / (2 * cell) * towardX
        + (up - down) / (2 * cell) * towardY
      const direct = Math.max(0, horizonSlope + slopeTowardSun)
      const factor = shadowed ? 0.32 : 0.65 + Math.min(0.45, direct * 8)
      const value = base * factor
      const p = i * 4
      pixels[p] = value
      pixels[p + 1] = value
      pixels[p + 2] = value * 0.98
      pixels[p + 3] = 255
    }
  }
  return pixels
}
