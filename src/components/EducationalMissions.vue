<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { inspectDem } from '../world/EducationalMissions.js'
import { MISSION_OBJECTIVES, recordMissionAction, restoreExplorationMissionState, saveExplorationMissionState } from '../world/ExplorationMissionFlow.js'

const props = defineProps({ telemetry: { type: Object, required: true }, site: { type: Object, required: true }, target: { type: Object, required: true }, open: Boolean })
const emit = defineEmits(['open-change', 'marker-change', 'points-change'])
const state = reactive(restoreExplorationMissionState())
const titles = { 1: 'Primeros pasos en la Luna', 2: 'El misterio de las sombras' }
const introductions = {
  1: 'Bienvenido a la Luna. Aprende a moverte cerca de KYNEX Lunar Outpost 01 y descubre cómo se siente la gravedad lunar.',
  2: 'Explora el relieve de Shackleton con el mapa NASA. Las elevaciones y depresiones influyen en las sombras del polo sur.',
}
const currentObjective = computed(() => MISSION_OBJECTIVES[state.mission]?.[state.stage])
const title = computed(() => titles[state.mission] ?? 'Exploración libre')
const completedNotice = ref('')
let noticeTimer
watch(state, () => { saveExplorationMissionState(state); emit('marker-change', state.mission === 1 && state.stage === 0) }, { deep: true, immediate: true })
watch(() => state.mission, (mission, previous) => {
  if (mission <= previous) return
  completedNotice.value = previous === 1 ? 'MISIÓN 01 COMPLETADA · Ya conoces los movimientos básicos.' : 'MISIÓN 02 COMPLETADA · Has explorado el relieve de Shackleton.'
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { completedNotice.value = '' }, 5500)
  if (mission === 2) emit('open-change', true)
})
watch(() => [props.telemetry.x, props.telemetry.z], ([x, z]) => {
  if (state.mission === 1 && state.stage === 0 && Math.hypot(x - props.target.x, z - props.target.z) <= 2) recordMissionAction(state, 'marker')
  if (state.mission === 1 && state.stage === 2 && Math.hypot(x - props.target.x, z - props.target.z) >= 16) recordMissionAction(state, 'explore')
  if (state.mission === 2 && state.stage === 2 && Math.hypot(x, z - 18) >= 45) recordMissionAction(state, 'sector')
})
function recordJump(event) {
  if (state.mission === 1 && state.stage === 1 && event.type === 'landing' && props.site.slopeAt(props.telemetry.x, props.telemetry.z) < 10) recordMissionAction(state, 'jump')
}
function inspectPoint({ x, z }) { if (state.mission === 2 && state.stage === 1 && inspectDem(props.site, x, z)) recordMissionAction(state, 'dem') }
function layerChange(layer) { if (state.mission === 2 && state.stage === 0 && ['elevation', 'slope'].includes(layer)) recordMissionAction(state, 'map') }
function close() { emit('open-change', false) }
defineExpose({ recordJump, inspectPoint, layerChange, isMarkerVisible: () => state.mission === 1 && state.stage === 0 })
onBeforeUnmount(() => { clearTimeout(noticeTimer) })
</script>

<template>
  <aside class="edu-tracker" aria-label="Misión actual" aria-live="polite">
    <div class="edu-eyebrow">✦ KYNEX MISSION CONTROL · {{ state.mission > 2 ? 'COMPLETO' : `MISIÓN 0${state.mission}` }}</div>
    <strong>{{ title }}</strong>
    <span class="edu-stage">{{ currentObjective ?? 'Sigue explorando y descubre el entorno' }}</span>
    <p class="edu-caption">{{ state.mission > 2 ? 'Misiones 01 y 02 completadas. Puedes investigar los descubrimientos pendientes.' : `Objetivo ${state.stage + 1} de 3 · Avanza con tus propias acciones.` }}</p>
    <button type="button" @click="emit('open-change', true)">VER MISIÓN <kbd>M</kbd></button>
  </aside>
  <div v-if="completedNotice" class="edu-complete-toast" role="status">{{ completedNotice }}</div>
  <div v-if="open" class="edu-modal" role="dialog" aria-modal="true" aria-label="Misión educativa">
    <div class="edu-activity">
      <div class="edu-activity-top"><div><span>✦ KYNEX · {{ state.mission > 2 ? 'EXPLORACIÓN LIBRE' : `MISIÓN 0${state.mission}` }}</span><h2>{{ title }}</h2></div><button type="button" class="edu-modal-close" aria-label="Cerrar misión" @click="close">×</button></div>
      <p class="edu-modal-intro">{{ introductions[state.mission] ?? 'Has completado las misiones iniciales. Explora libremente y abre tu bitácora cuando quieras.' }}</p>
      <p v-if="currentObjective" class="edu-result">Ahora: {{ currentObjective }}.</p>
      <div class="edu-activity-footer"><button type="button" @click="close">CONTINUAR EXPLORANDO ↗</button></div>
    </div>
  </div>
</template>
