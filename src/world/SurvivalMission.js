export const SURVIVAL_STORAGE_KEY = 'kynex-survival-mission-v1'
export const SURVIVAL_HOURS = 24
export const INCIDENT_HOUR = 14
export const INCIDENT_EXTRA_W = 1600
export const CRITICAL_GRACE_HOURS = 0.75

export function createSurvivalState() {
  return { status: 'ready', elapsedHours: 0, unsafeHours: 0, reason: '',
    checks: { controlOpened: false, oxygen: false, pressure: false, power: false,
      initial: false, solar: false, battery: false, supply: false, evaStarted: false,
      evaInspected: false, evaReturned: false, incidentPanel: false, incidentVerified: false, final: false },
    incident: 'waiting', events: [], world: null, checkpoint: null }
}
export function restoreSurvivalState(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(SURVIVAL_STORAGE_KEY) ?? 'null')
    if (saved?.version !== 1 || !saved.state || !['ready', 'active', 'won', 'failed'].includes(saved.state.status)) return createSurvivalState()
    const clean = createSurvivalState(), state = saved.state
    return { ...clean, ...state, elapsedHours: Math.max(0, Math.min(48, Number(state.elapsedHours) || 0)),
      unsafeHours: Math.max(0, Number(state.unsafeHours) || 0), checks: { ...clean.checks, ...state.checks },
      events: Array.isArray(state.events) ? state.events.slice(-30) : [], world: state.world && typeof state.world === 'object' ? state.world : null }
  } catch { return createSurvivalState() }
}
export function saveSurvivalState(state, storage = globalThis.localStorage) {
  try { storage?.setItem(SURVIVAL_STORAGE_KEY, JSON.stringify({ version: 1, state })) } catch { /* Storage is optional. */ }
}
export function clearSurvivalState(storage = globalThis.localStorage) {
  try { storage?.removeItem(SURVIVAL_STORAGE_KEY) } catch { /* Storage is optional. */ }
}
function emit(state, type) {
  if (state.events.some(event => event.type === type)) return false
  state.events.push({ type, hour: Number(state.elapsedHours.toFixed(2)) })
  return true
}
export function startSurvival(state) {
  if (state.status !== 'ready') return false
  state.status = 'active'
  emit(state, 'mission:started')
  return true
}
export function survivalStage(state) {
  if (!state.checks.initial) return 1
  if (!state.checks.supply) return 2
  if (!state.checks.evaReturned) return 3
  if (state.incident !== 'resolved') return 4
  return 5
}
export function recordSurvivalAction(state, action, context = {}) {
  if (state.status !== 'active') return false
  const c = state.checks
  switch (action) {
    case 'control-opened': c.controlOpened = true; break
    case 'verify-oxygen': c.oxygen = true; break
    case 'verify-pressure': c.pressure = true; break
    case 'verify-power': c.power = true; if (state.incident === 'active') c.incidentVerified = true; break
    case 'inspect-solar': c.solar = true; break
    case 'inspect-battery': c.battery = true; break
    case 'inspect-eva-point': if (c.evaStarted) c.evaInspected = true; break
    case 'incident-panel': if (state.incident === 'active') c.incidentPanel = true; break
    case 'zone':
      if (context.zone === 'surface' && c.initial && c.supply && !c.evaStarted) c.evaStarted = true
      else if (context.zone === 'habitat' && c.evaStarted && c.evaInspected && !c.evaReturned) c.evaReturned = true
      else return false
      break
    case 'confirm-initial':
      if (!(context.zone === 'habitat' && c.controlOpened && c.oxygen && c.pressure && c.power && context.eclss?.stable)) return false
      c.initial = true; emit(state, 'habitat:initial-check-completed'); break
    case 'confirm-power':
      if (!(c.initial && c.solar && c.battery && c.power && context.eclss?.power?.usedW >= context.eclss?.power?.demandW)) return false
      c.supply = true; emit(state, 'power:inspection-completed'); break
    case 'confirm-final':
      if (!(state.elapsedHours >= SURVIVAL_HOURS && c.initial && c.supply && c.evaReturned && state.incident === 'resolved' && context.eclss?.stable && context.zone === 'habitat')) return false
      c.final = true; state.status = 'won'; emit(state, 'mission:survived-24-hours'); break
    default: return false
  }
  if (c.evaStarted) emit(state, 'eva:started')
  if (c.evaInspected) emit(state, 'eva:inspection-completed')
  if (c.evaReturned) emit(state, 'eva:return-confirmed')
  return true
}
export function advanceSurvival(state, deltaHours, snapshot) {
  if (state.status !== 'active' || !(deltaHours > 0)) return []
  const before = state.events.length
  state.elapsedHours = Math.min(48, state.elapsedHours + Math.min(deltaHours, 0.05))
  if (state.elapsedHours >= INCIDENT_HOUR && state.incident === 'waiting') {
    state.incident = 'active'; emit(state, 'incident:detected')
  }
  const eclss = snapshot?.eclss
  if (state.incident === 'active' && state.checks.incidentPanel && state.checks.incidentVerified
    && eclss?.enabled?.science === false && eclss?.power?.usedW >= eclss?.power?.demandW
    && eclss?.operating?.regulator && eclss?.operating?.ventilation && eclss?.operating?.scrubber) {
    state.incident = 'resolved'; emit(state, 'incident:resolved')
  }
  const partial = eclss?.cabin?.partialKPa
  const critical = !eclss || (eclss.power.batteryKWh <= 0.1 && eclss.power.solarW < 1 && eclss.power.usedW < eclss.power.demandW)
    || eclss.cabin.pressureKPa < 40 || partial.O2 < 14 || partial.CO2 > 0.8
    || eclss.cabin.temperatureC < 10 || eclss.cabin.temperatureC > 35
  state.unsafeHours = critical ? state.unsafeHours + deltaHours : 0
  if (state.unsafeHours >= CRITICAL_GRACE_HOURS) {
    state.status = 'failed'
    state.reason = 'Las condiciones del hábitat permanecieron críticas durante 45 minutos simulados.'
    emit(state, 'mission:failed')
  }
  return state.events.slice(before)
}
