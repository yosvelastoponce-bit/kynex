export { inspectDem, compareDem } from './Site04Inspection.js'

export const MOON_GRAVITY = 1.62
export const EARTH_GRAVITY = 9.81
export const MISSION_STORAGE_KEY = 'kynex-educational-missions-v1'

export function idealJump(speed, gravity) {
  return { height: speed ** 2 / (2 * gravity), time: 2 * speed / gravity }
}

export function shadowLength(height, solarElevation) {
  return height / Math.tan(solarElevation * Math.PI / 180)
}

export const GRAVITY_QUESTIONS = [
  { question: '¿Qué ocurre con la masa al viajar a la Luna?', choices: ['Disminuye seis veces', 'Permanece igual', 'Aumenta seis veces'], answer: 1, hint: 'La masa mide cuánta materia hay.', explanation: 'La masa sigue siendo 60 kg. Cambia el peso porque cambia la gravedad.' },
  { question: 'Con la misma velocidad inicial, ¿dónde llega más alto un salto vertical ideal?', choices: ['Tierra', 'Luna', 'Igual en ambos'], answer: 1, hint: 'Observa las barras del laboratorio.', explanation: 'La menor gravedad lunar frena el ascenso más lentamente.' },
  { question: '¿Por qué el peso es menor en la Luna?', choices: ['Disminuye la masa', 'No hay gravedad', 'La gravedad es menor'], answer: 2, hint: 'Peso = masa × gravedad.', explanation: 'La Luna sí tiene gravedad: aproximadamente 1,62 m/s².' },
]

export function createMissionState() {
  return { mission: 1, stage: 0, completed: [], jump: null, prediction: null, gravityStep: 0, gravitySpeed: 2.55,
    massViewed: [], quizIndex: 0, attempts: [0, 0, 0], mapPoint: null, points: [], hypothesis: null,
    shadowCompared: false, candidate: null, reasons: [], completedAt: {}, badges: [] }
}

export function restoreMissionState(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(MISSION_STORAGE_KEY) ?? 'null')
    if (saved?.version !== 1 || !saved.state || ![1, 2, 3].includes(saved.state.mission)) return createMissionState()
    const clean = createMissionState()
    return { ...clean, ...saved.state, completed: Array.isArray(saved.state.completed) ? saved.state.completed : [],
      points: Array.isArray(saved.state.points) ? saved.state.points.slice(0, 2) : [],
      gravityStep: Number.isInteger(saved.state.gravityStep) ? Math.max(0, Math.min(2, saved.state.gravityStep)) : 0,
      gravitySpeed: Number.isFinite(saved.state.gravitySpeed) ? Math.max(1, Math.min(5, saved.state.gravitySpeed)) : 2.55,
      massViewed: Array.isArray(saved.state.massViewed) ? saved.state.massViewed : [],
      attempts: Array.isArray(saved.state.attempts) ? saved.state.attempts.slice(0, 3) : [0, 0, 0] }
  } catch { return createMissionState() }
}

export function saveMissionState(state, storage = globalThis.localStorage) {
  try { storage?.setItem(MISSION_STORAGE_KEY, JSON.stringify({ version: 1, state })) } catch { /* Private mode or full storage. */ }
}

export function clearMissionState(storage = globalThis.localStorage) {
  try { storage?.removeItem(MISSION_STORAGE_KEY) } catch { /* Private mode or unavailable storage. */ }
}

export function advanceMission(state, stageCount) {
  if (state.stage + 1 < stageCount) { state.stage++; return }
  state.completedAt[state.mission] = new Date().toISOString()
  state.badges.push(state.mission === 1 ? 'Explorador lunar' : 'Investigador de Shackleton')
  state.completed.push(state.mission)
  state.mission++
  state.stage = 0
}
