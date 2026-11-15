export const SITE04_GRID_WIDTH = 480
export const SITE04_PIXEL_METERS = 5
export const SITE04_HALF_SIZE_METERS = 1200
export const SITE04_CENTER = Object.freeze({ x: -3800, y: -12800 })
export const SITE04_BOUNDS = Object.freeze({
  minX: -SITE04_HALF_SIZE_METERS,
  maxX: SITE04_HALF_SIZE_METERS - SITE04_PIXEL_METERS,
  minZ: -SITE04_HALF_SIZE_METERS,
  maxZ: SITE04_HALF_SIZE_METERS - SITE04_PIXEL_METERS,
})
export function site04GridCoordinates(x, z) {
  return {
    column: (x + SITE04_HALF_SIZE_METERS) / SITE04_PIXEL_METERS,
    row: (z + SITE04_HALF_SIZE_METERS) / SITE04_PIXEL_METERS,
  }
}

export function interpolateHeightGrid(data, width, height, column, row) {
  const clampedColumn = Math.max(0, Math.min(width - 1, column))
  const clampedRow = Math.max(0, Math.min(height - 1, row))
  const x0 = Math.floor(clampedColumn), y0 = Math.floor(clampedRow)
  const x1 = Math.min(width - 1, x0 + 1), y1 = Math.min(height - 1, y0 + 1)
  const tx = clampedColumn - x0, ty = clampedRow - y0
  const top = data[y0 * width + x0] * (1 - tx) + data[y0 * width + x1] * tx
  const bottom = data[y1 * width + x0] * (1 - tx) + data[y1 * width + x1] * tx
  return top * (1 - ty) + bottom * ty
}

export function sampleSite04Height(data, x, z) {
  const { column, row } = site04GridCoordinates(x, z)
  return interpolateTriangularGrid(data, SITE04_GRID_WIDTH, column, row)
}

export function interpolateTriangularGrid(data, width, column, row) {
  const c = Math.max(0, Math.min(width - 1, column))
  const r = Math.max(0, Math.min(width - 1, row))
  const x0 = Math.min(width - 2, Math.floor(c))
  const y0 = Math.min(width - 2, Math.floor(r))
  const tx = c - x0, ty = r - y0
  const i = y0 * width + x0
  const a = data[i], b = data[i + 1], d = data[i + width], e = data[i + width + 1]
  // Matches the two triangles in Site04Terrain's indexed mesh.
  return tx + ty <= 1 ? a + tx * (b - a) + ty * (d - a)
    : e + (1 - tx) * (d - e) + (1 - ty) * (b - e)
}

export function computeSlopeGrid(data, width = SITE04_GRID_WIDTH, height = width) {
  const slopes = new Float32Array(width * height)
  const gradient = (x, y, horizontal) => {
    const before = horizontal ? y * width + Math.max(0, x - 1) : Math.max(0, y - 1) * width + x
    const after = horizontal ? y * width + Math.min(width - 1, x + 1) : Math.min(height - 1, y + 1) * width + x
    const cells = horizontal ? Math.min(width - 1, x + 1) - Math.max(0, x - 1)
      : Math.min(height - 1, y + 1) - Math.max(0, y - 1)
    return (data[after] - data[before]) / (cells * SITE04_PIXEL_METERS)
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      slopes[y * width + x] = Math.atan(Math.hypot(gradient(x, y, true), gradient(x, y, false))) * 180 / Math.PI
    }
  }
  return slopes
}
