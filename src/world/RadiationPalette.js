// Relative visual scale for this teaching model, in mSv per Earth day.
const STOPS = [[0.7, [18, 42, 71]], [1.0, [30, 101, 121]],
  [1.369, [103, 166, 134]], [2.5, [209, 173, 91]], [6, [212, 101, 64]]]

export function radiationColor(rate) {
  if (rate <= STOPS[0][0]) return STOPS[0][1]
  for (let i = 1; i < STOPS.length; i++) {
    const [limit, color] = STOPS[i]
    if (rate <= limit) {
      const [previous, before] = STOPS[i - 1]
      const t = (rate - previous) / (limit - previous)
      return before.map((value, channel) => Math.round(value + t * (color[channel] - value)))
    }
  }
  return STOPS.at(-1)[1]
}
