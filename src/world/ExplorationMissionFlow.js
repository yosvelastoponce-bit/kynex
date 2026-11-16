export const EXPLORATION_MISSION_KEY = 'kynex-exploration-missions-v1'
export const MISSION_OBJECTIVES = Object.freeze({
  1: ['Llega al punto de entrenamiento', 'Realiza un salto lunar', 'Explora los alrededores'],
  2: ['Abre el mapa NASA', 'Investiga una elevación o pendiente', 'Explora un sector del terreno'],
})
export function createExplorationMissionState() { return { mission: 1, stage: 0, completed: [], completedAt: {} } }
export function restoreExplorationMissionState(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(EXPLORATION_MISSION_KEY) ?? 'null')
    const state = saved?.version === 1 ? saved.state : null
    if (!state || ![1, 2, 3].includes(state.mission) || !Number.isInteger(state.stage)) return createExplorationMissionState()
    return { mission: state.mission, stage: Math.max(0, Math.min(2, state.stage)),
      completed: Array.isArray(state.completed) ? state.completed.filter(n => n === 1 || n === 2) : [],
      completedAt: state.completedAt && typeof state.completedAt === 'object' ? state.completedAt : {} }
  } catch { return createExplorationMissionState() }
}
export function saveExplorationMissionState(state, storage = globalThis.localStorage) {
  try { storage?.setItem(EXPLORATION_MISSION_KEY, JSON.stringify({ version: 1, state })) } catch { /* Storage is optional. */ }
}
export function clearExplorationMissionState(storage = globalThis.localStorage) {
  try { storage?.removeItem(EXPLORATION_MISSION_KEY) } catch { /* Storage is optional. */ }
}
export function recordMissionAction(state, action, timestamp = new Date().toISOString()) {
  const expected = { 1: ['marker', 'jump', 'explore'], 2: ['map', 'dem', 'sector'] }
  if (expected[state.mission]?.[state.stage] !== action) return false
  state.stage++
  if (state.stage === 3) {
    state.completed.push(state.mission)
    state.completedAt[state.mission] = timestamp
    state.mission++
    state.stage = 0
  }
  return true
}
