<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { missionLesson, missionWaypoint } from '../world/MissionLearning.js'

const props = defineProps({
  base: { type: Object, required: true },
  telemetry: { type: Object, required: true },
})
const learnedFact = ref('')
let factTimer

const missions = computed(() => [
  { id: '01', title: 'INSPECCIÓN DEL PUESTO', description: 'Conoce la base KYNEX: identifica el hábitat, la esclusa y sus equipos antes de entrar.', data: props.base.mission },
  { id: '02', title: 'SOPORTE VITAL', description: 'Entra al hábitat y comprueba que el aire, la energía y el ambiente sean seguros.', data: props.base.mission02 },
  { id: '03', title: 'GEOLOGÍA LUNAR', description: 'Recoge una roca del terreno y analízala en el laboratorio para identificar sus minerales.', data: props.base.sampleMission },
  { id: '04', title: 'PEQUEÑOS CIENTÍFICOS', description: 'Completa actividades de investigación en la base y gana tus insignias de exploración.', data: props.base.mission?.discoveries },
].map(mission => ({
  ...mission,
  count: mission.data?.count ?? 0,
  total: mission.data?.total ?? 0,
  done: mission.data?.done ?? false,
  step: mission.data?.steps?.find(step => !step.done) ?? null,
})))
const activeIndex = computed(() => missions.value.findIndex(mission => !mission.done))
const activeMission = computed(() => missions.value[activeIndex.value] ?? null)
const lesson = computed(() => missionLesson(activeMission.value?.id, activeMission.value?.step?.id))
const waypoint = computed(() => {
  if (props.base.zone === 'habitat' || props.base.zone === 'airlock') return null
  return missionWaypoint(lesson.value, props.base, props.telemetry, props.telemetry.heading)
})
const completedSignature = computed(() => missions.value.flatMap(mission =>
  mission.data?.steps?.filter(step => step.done).map(step => `${mission.id}:${step.id}`) ?? [],
).join('|'))

watch(completedSignature, (current, previous) => {
  const before = new Set(previous ? previous.split('|') : [])
  const newlyCompleted = current.split('|').filter(key => key && !before.has(key))
  const last = newlyCompleted.at(-1)
  if (!last) return
  const [missionId, stepId] = last.split(':')
  learnedFact.value = missionLesson(missionId, stepId)?.fact ?? '¡Objetivo completado! Sigue explorando.'
  clearTimeout(factTimer)
  factTimer = setTimeout(() => { learnedFact.value = '' }, 6500)
})
onBeforeUnmount(() => clearTimeout(factTimer))
</script>

<template>
  <aside class="mission-tracker" aria-label="Progreso de las misiones" aria-live="polite" aria-atomic="false">
    <div class="mission-tracker-heading"><span>✦ TU MISIÓN</span><span>{{ activeMission ? `${activeIndex + 1} / ${missions.length}` : '4 / 4' }}</span></div>
    <div v-if="activeMission" :key="activeMission.id" class="mission-tracker-item">
      <div class="mission-tracker-row">
        <span class="mission-tracker-id">{{ activeMission.id }}</span>
        <span class="mission-tracker-title">{{ activeMission.title }}</span>
        <strong>{{ activeMission.count }}/{{ activeMission.total }}</strong>
      </div>
      <p class="mission-tracker-description">{{ activeMission.description }}</p>
      <div class="mission-tracker-next"><span>AHORA TE TOCA</span>{{ lesson?.prompt ?? activeMission.step?.label }}</div>
      <div v-if="lesson?.hint" class="mission-tracker-hint"><b>PISTA</b> {{ lesson.hint }}</div>
      <div v-if="waypoint && waypoint.distance > 2.5" class="mission-tracker-waypoint"><span class="mission-tracker-arrow" :style="{ transform: `rotate(${waypoint.rotation}deg)` }" aria-hidden="true">▲</span><span>HACIA EL OBJETIVO · {{ Math.round(waypoint.distance) }} m</span></div>
      <div class="mission-tracker-bar" :aria-label="`${activeMission.title}: ${activeMission.count} de ${activeMission.total} objetivos`"><span :style="{ width: `${activeMission.total ? 100 * activeMission.count / activeMission.total : 0}%` }" /></div>
    </div>
    <div v-else class="mission-tracker-finished">✓ TODAS LAS MISIONES COMPLETADAS</div>
    <div v-if="learnedFact" class="mission-tracker-learn" role="status"><b>¡BIEN HECHO! APRENDISTE:</b><span>{{ learnedFact }}</span></div>
  </aside>
</template>
