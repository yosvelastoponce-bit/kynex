// Fixed educational color scale. Celsius, not a Diviner product.
export const THERMAL_STOPS = [
  [-250, [9, 15, 42]],
  [-180, [29, 63, 137]],
  [-100, [41, 148, 156]],
  [-30, [214, 173, 91]],
  [60, [201, 66, 36]],
]

export function thermalColor(celsius) {
  if (celsius <= THERMAL_STOPS[0][0]) return THERMAL_STOPS[0][1]
  for (let i = 1; i < THERMAL_STOPS.length; i++) {
    const [end, endColor] = THERMAL_STOPS[i]
    if (celsius <= end) {
      const [start, startColor] = THERMAL_STOPS[i - 1]
      const t = (celsius - start) / (end - start)
      return startColor.map((value, channel) => Math.round(value + t * (endColor[channel] - value)))
    }
  }
  return THERMAL_STOPS.at(-1)[1]
}
