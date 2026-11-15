// SEP events are manually triggered teaching scenarios, never forecasts.
export class SpaceWeather {
  constructor() { this.event = null }
  start(days, { peakMsVPerDay = 2, durationDays = 0.5, azimuth = 0, elevation = 20 } = {}) {
    if (!Number.isFinite(days) || !Number.isFinite(peakMsVPerDay) || !Number.isFinite(durationDays)
      || peakMsVPerDay <= 0 || durationDays <= 0) throw new RangeError('Invalid SEP scenario')
    this.event = { startDays: days, endDays: days + durationDays, peakMsVPerDay,
      durationDays, azimuth: ((azimuth % 360) + 360) % 360, elevation }
    return this.event
  }
  stop() { this.event = null }
  active(days) { return !!this.event && days >= this.event.startDays && days < this.event.endDays }
  // A smooth pulse, rising to the configured hypothetical peak at mid-event.
  rate(days) {
    if (!this.active(days)) return 0
    const phase = (days - this.event.startDays) / this.event.durationDays
    return this.event.peakMsVPerDay * Math.sin(Math.PI * phase)
  }
  // Exact time integral of the pulse, so a short event survives a long frame.
  doseBetween(start, end) {
    if (!this.event || end <= start) return 0
    const a = Math.max(start, this.event.startDays), b = Math.min(end, this.event.endDays)
    if (b <= a) return 0
    const phaseA = (a - this.event.startDays) / this.event.durationDays
    const phaseB = (b - this.event.startDays) / this.event.durationDays
    return this.event.peakMsVPerDay * this.event.durationDays / Math.PI
      * (Math.cos(Math.PI * phaseA) - Math.cos(Math.PI * phaseB))
  }
  overlapDays(start, end) {
    if (!this.event) return 0
    return Math.max(0, Math.min(end, this.event.endDays) - Math.max(start, this.event.startDays))
  }
}
