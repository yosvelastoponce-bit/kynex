// Short missions observe existing world actions; they never change physics or resources.
export const EXPLORATION_STORAGE_KEY = 'kynex-lunar-exploration-v1'
export const LUNAR_MISSIONS = [
  { title: 'Prepara tu refugio', description: 'Acércate a la consola del hábitat y pulsa E. Enciende Ventilación y Captura CO₂; deja el Regulador encendido.', hint: 'La consola está dentro, a la izquierda. El aire necesita circular y limpiarse.', result: 'El aire circula y el CO₂ se retira. Tu refugio está preparado.' },
  { title: 'Recoge una roca lunar', description: 'Sal por la esclusa. Busca la roca de entrenamiento junto a la base, acércate y pulsa E.', hint: 'Cierra una compuerta antes de abrir la otra. La roca está cerca del pie de la rampa.', result: '¡Muestra recogida! Ya tienes una roca para estudiar.' },
  { title: 'Lleva la roca al laboratorio', description: 'Regresa por la esclusa. Acércate a la mesa del laboratorio y pulsa E para entregar tu muestra.', hint: 'El laboratorio está dentro, a la derecha. Puedes usar el microscopio después de entregar la roca.', result: 'Muestra entregada. El microscopio queda disponible para investigar sus minerales.' },
  { title: 'Revisa la energía y vuelve', description: 'En el exterior, inspecciona los paneles solares y las baterías con F. Después regresa al hábitat.', hint: 'Los paneles están a un lado de la base; las baterías, al otro. Acércate hasta que aparezca su nombre.', result: 'Inspección completada y regreso seguro. ¡Has terminado tu primera exploración lunar!' },
]
export function createExplorationState() {
  return { status: 'ready', completed: 0, checks: { console: false, solar: false, battery: false }, world: null }
}
export function saveExploration(state, storage = globalThis.localStorage) {
  try { storage?.setItem(EXPLORATION_STORAGE_KEY, JSON.stringify({ version: 1, state })) } catch { /* Optional storage. */ }
}
export function restoreExploration(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(EXPLORATION_STORAGE_KEY) ?? 'null')
    if (saved?.version !== 1 || !['ready', 'active', 'won'].includes(saved.state?.status)) return createExplorationState()
    const completed = Math.max(0, Math.min(4, Math.floor(Number(saved.state.completed) || 0)))
    return { ...createExplorationState(), completed, status: completed === 4 ? 'won' : saved.state.status === 'ready' ? 'ready' : 'active',
      checks: { console: saved.state.checks?.console === true, solar: saved.state.checks?.solar === true, battery: saved.state.checks?.battery === true },
      world: saved.state.world && typeof saved.state.world === 'object' ? saved.state.world : null }
  } catch { return createExplorationState() }
}
export function clearExploration(storage = globalThis.localStorage) {
  try { storage?.removeItem(EXPLORATION_STORAGE_KEY) } catch { /* Optional storage. */ }
}
export function recordExplorationAction(state, action) {
  if (state.status !== 'active') return
  if (action === 'control-opened') state.checks.console = true
  if (action === 'inspect-solar' && state.completed === 3) state.checks.solar = true
  if (action === 'inspect-battery' && state.completed === 3) state.checks.battery = true
}
export function updateExploration(state, base) {
  if (state.status !== 'active') return null
  const sample = base?.sampleMission?.status
  const conditions = [
    base?.zone === 'habitat' && state.checks.console && base?.eclss?.operating?.ventilation && base?.eclss?.operating?.scrubber && base?.eclss?.operating?.regulator,
    ['carried', 'delivered', 'analyzed'].includes(sample),
    ['delivered', 'analyzed'].includes(sample),
    state.checks.solar && state.checks.battery && base?.zone === 'habitat',
  ]
  if (!conditions[state.completed]) return null
  const result = { index: state.completed, ...LUNAR_MISSIONS[state.completed] }
  state.completed++
  if (state.completed === LUNAR_MISSIONS.length) state.status = 'won'
  return result
}
