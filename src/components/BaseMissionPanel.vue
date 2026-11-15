<script setup>
import { computed } from 'vue'
const props = defineProps({ base: { type: Object, required: true } })
const current = computed(() => props.base.mission?.steps?.find(step => !step.done))
const current02 = computed(() => props.base.mission02?.steps?.find(step => !step.done))
const currentDiscovery = computed(() => props.base.mission?.discoveries?.steps?.find(step => !step.done))
const currentSample = computed(() => props.base.sampleMission?.steps?.find(step => !step.done))
</script>

<template>
  <aside class="base-mission" aria-label="Misión de inspección del puesto lunar">
    <div class="base-mission-heading">MISIÓN 01 / INSPECCIÓN DEL PUESTO</div>
    <div class="base-mission-progress">{{ base.mission?.count ?? 0 }} / {{ base.mission?.total ?? 8 }} <span>{{ base.mission?.done ? 'COMPLETADA' : 'EN CURSO' }}</span></div>
    <ol class="base-mission-steps">
      <li v-for="step in base.mission?.steps ?? []" :key="step.id" :class="{ done: step.done, current: current?.id === step.id }"><span>{{ step.done ? '✓' : '◇' }}</span>{{ step.label }}</li>
    </ol>
    <div class="base-mission-distance">{{ base.name ?? 'OUTPOST 01' }} · {{ base.distance?.toFixed(0) ?? '—' }} m</div>
    <div v-if="base.nearby" class="base-interact-hint"><b>E</b> USAR · <b>F</b> INFORMACIÓN · {{ base.nearby.label }}</div>
    <div v-if="base.message" class="base-mission-message">{{ base.message }}</div>
    <div class="base-mission-status">ESCLUSA {{ base.airlock?.pressure ?? '—' }} · {{ base.zone === 'habitat' ? 'INTERIOR' : base.zone === 'airlock' ? 'CÁMARA' : 'SUPERFICIE' }}</div>
    <div v-if="base.sampleMission" class="base-sample-mission">
      <div class="base-mission-heading">RETO ESPECIAL · GEOLOGÍA LUNAR</div>
      <div class="base-mission-progress">{{ base.sampleMission.count }} / {{ base.sampleMission.total }} <span>{{ base.sampleMission.done ? 'COMPLETADO' : 'EN CURSO' }}</span></div>
      <ol class="base-sample-steps">
        <li v-for="step in base.sampleMission.steps" :key="step.id" :class="{ done: step.done, current: currentSample?.id === step.id }"><span>{{ step.done ? '✓' : '◇' }}</span>{{ step.label }}</li>
      </ol>
      <div v-if="base.sampleMission.status === 'carried'" class="base-sample-carry">ROCA EN TU MOCHILA · VE AL LABORATORIO</div>
    </div>
    <div v-if="base.mission?.discoveries" class="base-discovery">
      <div class="base-mission-heading">MISIÓN 03 / PEQUEÑOS CIENTÍFICOS</div>
      <div class="base-mission-progress">{{ base.mission.discoveries.count }} / {{ base.mission.discoveries.total }} <span>{{ base.mission.discoveries.done ? 'COMPLETADA' : 'EN CURSO' }}</span></div>
      <ol class="base-discovery-steps">
        <li v-for="step in base.mission.discoveries.steps" :key="step.id" :class="{ done: step.done, current: currentDiscovery?.id === step.id }"><span>{{ step.done ? '✓' : '◇' }}</span>{{ step.label }}</li>
      </ol>
      <div class="base-badges-title">INSIGNIAS DE EXPLORADOR</div>
      <div class="base-badges">
        <span v-for="badge in base.mission.discoveries.badges" :key="badge.id" :class="{ earned: badge.earned }"><b>{{ badge.earned ? '★' : '☆' }}</b>{{ badge.name }}</span>
      </div>
    </div>
    <div v-if="base.mission02" class="base-mission-two"><div class="base-mission-heading">MISIÓN 02 / SOPORTE VITAL</div><div class="base-mission-progress">{{ base.mission02.count }} / {{ base.mission02.total }} <span>{{ base.mission02.done ? 'COMPLETADA' : base.mission02.count ? 'EN CURSO' : 'PENDIENTE' }}</span></div><div class="base-mission-two-current">{{ current02?.label ?? 'Condiciones verificadas' }}</div><div v-if="base.mission02.stableMinutes > 0 && !base.mission02.done" class="base-mission-two-current">ESTABILIDAD {{ base.mission02.stableMinutes.toFixed(0) }} / 60 min simulados</div></div>
  </aside>
</template>
