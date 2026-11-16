export const DISCOVERY_STORAGE_KEY = 'kynex-discoveries-v1'

// A geographic discovery is enabled only after its Site04 location is verified.
export const DISCOVERIES = Object.freeze([
  { id: 'crater', name: 'Cráter lunar', category: 'Geología lunar', type: 'UNAVAILABLE', trigger: 'Inventario de cráteres Site04 pendiente', distance: null, entity: null,
    summary: 'Los impactos han dejado huellas en la Luna.', explanation: 'Muchos cráteres nacieron de impactos. Sin lluvia ni viento como en la Tierra, sus formas pueden conservarse durante muchísimo tiempo.', fact: 'Algunos cráteres lunares tienen miles de millones de años.', source: 'https://science.nasa.gov/moon/lunar-craters/' },
  { id: 'gravity', name: 'Gravedad lunar', category: 'Gravedad y movimiento', type: 'MODELLED', trigger: 'Primer salto válido', distance: null, entity: 'salto',
    summary: 'Tu salto revela la gravedad lunar.', explanation: 'La gravedad lunar es aproximadamente una sexta parte de la terrestre. Con igual velocidad inicial, un salto ideal llega más alto y dura más.', fact: 'Tierra ≈ 9,81 m/s² · Luna ≈ 1,62 m/s²', source: 'https://science.nasa.gov/moon/facts/' },
  { id: 'shadows', name: 'Sombras del polo sur', category: 'Iluminación y sombras', type: 'DERIVED', trigger: 'Consulta válida de elevación o pendiente Site04', distance: null, entity: 'DEM Site04',
    summary: 'El relieve modifica la luz que llega al suelo.', explanation: 'Cerca del polo sur lunar, el Sol puede estar muy bajo. Las elevaciones bloquean la luz y producen sombras largas. También importan la dirección del Sol y los obstáculos cercanos.', fact: 'La fracción de iluminación temporal de este punto no está validada.', source: 'https://science.nasa.gov/mission/lro/' },
  { id: 'regolith', name: 'Regolito lunar', category: 'Suelo lunar', type: 'SCENARIO', trigger: 'Estación educativa de muestras', distance: 4, entity: 'Roca de entrenamiento de la base',
    summary: 'Observa el material fragmentado del suelo.', explanation: 'El regolito es material fragmentado por impactos y otros procesos. El polvo lunar puede adherirse a los equipos y complicar las operaciones.', fact: 'Esta estación y su muestra son simuladas; no representan una recolección real en Site04.', source: 'https://www.nasa.gov/dust-mitigation/' },
  { id: 'airlock', name: 'Esclusa EVA', category: 'Sistemas de la base', type: 'SCENARIO', trigger: 'Primer uso aceptado de una compuerta', distance: null, entity: 'Esclusa de KYNEX Lunar Outpost 01',
    summary: 'La esclusa protege el aire del hábitat.', explanation: 'La Luna prácticamente no tiene atmósfera. Una esclusa permite entrar y salir manteniendo aislado el aire de la base.', fact: 'Exterior: vacío → esclusa: cambia de presión → hábitat: aire controlado.', source: 'https://ntrs.nasa.gov/citations/20230000121' },
  { id: 'solar', name: 'Paneles solares', category: 'Energía', type: 'SCENARIO', trigger: 'Inspección de paneles de la base', distance: 3.1, entity: 'Arreglo solar KYNEX',
    summary: 'La luz puede convertirse en electricidad.', explanation: 'Los paneles convierten luz en electricidad. La orientación y las sombras del relieve importan especialmente cerca del polo sur lunar.', fact: 'La instalación y sus valores de potencia son un modelo KYNEX, no una medición NASA.', source: 'https://www.nasa.gov/moonbase-systems/' },
  { id: 'eclss', name: 'Soporte vital ECLSS', category: 'Supervivencia espacial', type: 'SCENARIO', trigger: 'Inspección de equipo ECLSS', distance: 3.1, entity: 'Equipo ECLSS de la base',
    summary: 'El hábitat necesita aire respirable.', explanation: 'El soporte vital ayuda a suministrar oxígeno, retirar dióxido de carbono y mantener presión y temperatura habitables.', fact: 'Oxígeno, CO₂, presión y temperatura interior son variables simuladas del prototipo.', source: 'https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/' },
])

export function createDiscoveryState() { return { found: {}, read: {} } }
export function restoreDiscoveryState(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(DISCOVERY_STORAGE_KEY) ?? 'null')
    if (saved?.version !== 1) return createDiscoveryState()
    const ids = new Set(DISCOVERIES.map(item => item.id))
    const found = Object.fromEntries(Object.entries(saved.found ?? {}).filter(([id, date]) => ids.has(id) && typeof date === 'string'))
    const read = Object.fromEntries(Object.entries(saved.read ?? {}).filter(([id, value]) => ids.has(id) && value === true))
    return { found, read }
  } catch { return createDiscoveryState() }
}
export function saveDiscoveryState(state, storage = globalThis.localStorage) {
  try { storage?.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify({ version: 1, found: state.found, read: state.read })) } catch { /* Storage is optional. */ }
}
export function findDiscovery(state, id, timestamp = new Date().toISOString()) {
  if (!DISCOVERIES.some(item => item.id === id && item.type !== 'UNAVAILABLE') || state.found[id]) return false
  state.found[id] = timestamp
  return true
}
export function readDiscovery(state, id) {
  if (!state.found[id] || state.read[id]) return false
  state.read[id] = true
  return true
}
