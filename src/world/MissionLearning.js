import { BASE_TARGETS } from './BaseKnowledge.js'

// Short, child-facing prompts for the mission steps already tracked by the simulation.
export const MISSION_LESSONS = Object.freeze({
  '01': {
    find: { prompt: 'Encuentra la base KYNEX', hint: 'Sigue el marcador de la base en el mapa.', fact: 'Una base permite guardar equipos y proteger a la tripulación.', target: 'base' },
    habitat: { prompt: 'Conoce el hábitat', hint: 'Acércate al módulo principal y pulsa F.', fact: 'Un hábitat necesita conservar aire respirable para sus ocupantes.', target: 'habitat' },
    airlock: { prompt: 'Descubre la esclusa', hint: 'Busca la compuerta de entrada y pulsa E.', fact: 'La esclusa separa el aire del hábitat del vacío exterior.', target: 'outer-door' },
    solar: { prompt: 'Busca los paneles solares', hint: 'Acércate a los paneles y pulsa F.', fact: 'Los paneles solares pueden convertir la luz en electricidad.', target: 'solar' },
    battery: { prompt: 'Encuentra las baterías', hint: 'Sigue el lateral de la base y pulsa F junto a las baterías.', fact: 'Las baterías almacenan energía para cuando falta luz solar.', target: 'battery' },
    eclss: { prompt: 'Investiga el soporte vital', hint: 'Busca el módulo exterior ECLSS y pulsa F.', fact: 'El soporte vital ayuda a controlar el aire dentro del hábitat.', target: 'eclss' },
    antenna: { prompt: 'Localiza la antena', hint: 'Rodéa la base hasta encontrar la antena y pulsa F.', fact: 'Una antena puede enviar y recibir información de la misión.', target: 'antenna' },
    enter: { prompt: 'Entra al hábitat', hint: 'Usa E en la compuerta exterior; espera el ciclo y usa la interior.', fact: 'La esclusa permite pasar entre la superficie y el interior sin abrir ambas puertas a la vez.', target: 'outer-door' },
  },
  '02': {
    enter: { prompt: 'Entra al hábitat', hint: 'Pasa por la esclusa usando E en sus compuertas.', fact: 'El interior protegido permite trabajar con aire y presión.', target: 'outer-door' },
    console: { prompt: 'Encuentra el control ambiental', hint: 'Dentro del hábitat, acércate a la consola y pulsa E.', fact: 'La consola permite vigilar los sistemas que hacen habitable la base.' },
    pressure: { prompt: 'Comprueba la presión', hint: 'En la consola, pulsa VERIFICAR PRESIÓN.', fact: 'La presión ayuda a mantener una atmósfera utilizable dentro del hábitat.' },
    oxygen: { prompt: 'Revisa el oxígeno', hint: 'En la consola, pulsa INSPECCIONAR O₂.', fact: 'El oxígeno es necesario para que la tripulación respire.' },
    power: { prompt: 'Comprueba la energía', hint: 'En la consola, pulsa VERIFICAR ENERGÍA.', fact: 'Los equipos de soporte vital necesitan electricidad para funcionar.' },
    ventilation: { prompt: 'Activa la ventilación', hint: 'En EQUIPOS, enciende Ventilación.', fact: 'La ventilación mueve el aire por el interior del hábitat.' },
    scrubber: { prompt: 'Retira el CO₂ del aire', hint: 'En EQUIPOS, enciende Captura CO₂.', fact: 'La tripulación produce CO₂ al respirar; hay que retirarlo del aire.' },
    supply: { prompt: 'Verifica el suministro de O₂', hint: 'Enciende un equipo de suministro y pulsa VERIFICAR GENERACIÓN / SUMINISTRO O₂.', fact: 'La base debe reponer el oxígeno que se consume.' },
    climate: { prompt: 'Revisa el clima interior', hint: 'En la consola, pulsa REVISAR CLIMA.', fact: 'La temperatura y la humedad también afectan la habitabilidad.' },
    stable: { prompt: 'Mantén estable la base', hint: 'Deja los sistemas en condiciones seguras durante una hora simulada.', fact: 'Un sistema debe mantenerse estable con el paso del tiempo.' },
  },
  '03': {
    find: { prompt: 'Encuentra una roca', hint: 'Busca la roca de entrenamiento cerca de la base.', fact: 'Las muestras ayudan a estudiar de qué está formado un lugar.', target: 'sample-pickup' },
    collect: { prompt: 'Recoge la roca', hint: 'Acércate a la roca y pulsa E.', fact: 'Una muestra debe recogerse y transportarse con cuidado.', target: 'sample-pickup' },
    deliver: { prompt: 'Lleva la roca al laboratorio', hint: 'Entra a la base y busca el microscopio.', fact: 'Analizar una muestra en el laboratorio permite observar detalles.', target: 'sample-lab' },
    analyze: { prompt: 'Analiza los minerales', hint: 'Pulsa E en el laboratorio y compara las pistas del microscopio.', fact: 'Distintos minerales cuentan parte de la historia geológica de la Luna.' },
  },
  '04': {
    sample: { prompt: 'Analiza una muestra lunar', hint: 'Completa el reto de geología en el laboratorio.', fact: 'Registrar una muestra ayuda a comparar lo observado.' },
    garden: { prompt: 'Cuida una planta', hint: 'Busca el mini invernadero y pulsa E.', fact: 'Las plantas necesitarían agua, luz y aire en un ambiente protegido.' },
    observatory: { prompt: 'Observa la Tierra', hint: 'Busca el telescopio dentro de la base y pulsa E.', fact: 'Observar desde la Luna ofrece otra perspectiva de la Tierra.' },
  },
})

export function missionLesson(missionId, stepId) {
  return MISSION_LESSONS[missionId]?.[stepId] ?? null
}

export function missionWaypoint(lesson, base, position, heading) {
  if (!lesson?.target || !Number.isFinite(base?.x) || !Number.isFinite(base?.z)) return null
  const local = lesson.target === 'base' ? { x: 0, z: 0 }
    : BASE_TARGETS.find(target => target.id === lesson.target || target.infoId === lesson.target)
  if (!local || !Number.isFinite(position?.x) || !Number.isFinite(position?.z)) return null
  const dx = base.x + local.x - position.x
  const dz = base.z + local.z - position.z
  return {
    distance: Math.hypot(dx, dz),
    rotation: (Math.atan2(dx, -dz) + heading) * 180 / Math.PI,
  }
}
