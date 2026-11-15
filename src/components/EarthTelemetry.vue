<script setup>
import { ref } from 'vue'

defineProps({ earth: { type: Object, required: true } })
const minimized = ref(false)
</script>

<template>
  <aside class="earth-panel" aria-label="Información de la Tierra simulada">
    <div class="earth-panel-title"><span>TIERRA / MODELO ILUSTRATIVO</span><button type="button" :aria-label="minimized ? 'Expandir información terrestre' : 'Minimizar información terrestre'" @click="minimized = !minimized">{{ minimized ? '+' : '−' }}</button></div>
    <template v-if="!minimized">
      <div class="earth-panel-row"><span>AZIMUT</span><strong>{{ earth.azimuth.toFixed(1) }}°</strong></div>
      <div class="earth-panel-row"><span>ELEVACIÓN</span><strong>{{ earth.elevation.toFixed(2) }}°</strong></div>
      <div class="earth-panel-row"><span>FASE</span><strong>{{ earth.phase }}</strong></div>
      <div class="earth-panel-row"><span>ILUMINACIÓN</span><strong>{{ Math.round(earth.illuminatedFraction * 100) }}%</strong></div>
      <div class="earth-panel-status">{{ earth.visibility }}</div>
      <div class="earth-panel-time">TIEMPO COMPARTIDO · DÍA +{{ earth.days.toFixed(3) }}</div>
      <div class="site04-map-note">Posición, fase y horizonte pendientes de validación con efemérides y libración.</div>
    </template>
  </aside>
</template>
