<script setup>
import { ref } from 'vue'

defineProps({
  radiation: { type: Object, required: true },
  inspected: { type: Object, default: null },
})
const emit = defineEmits(['start-scenario', 'end-scenario'])
const collapsed = ref(false)
const peak = ref('2')
const duration = ref('0.5')
const formatDays = days => days < 1 ? `${(days * 24).toFixed(1)} h` : `${days.toFixed(2)} d`
function start() { emit('start-scenario', { peakMsVPerDay: Number(peak.value), durationDays: Number(duration.value) }) }
</script>

<template>
  <aside class="radiation-panel" aria-label="Dosímetro educativo lunar">
    <div class="radiation-title"><span>◈ RADIACIÓN / MODELO EDUCATIVO</span><button type="button" :aria-label="collapsed ? 'Expandir panel de radiación' : 'Minimizar panel de radiación'" @click="collapsed = !collapsed">{{ collapsed ? '+' : '−' }}</button></div>
    <div v-if="!collapsed">
      <div class="site04-map-note">Dosis observada local no disponible.</div>
      <div class="radiation-primary">{{ radiation.total.toFixed(3) }} <small>mSv/día</small></div>
      <div class="radiation-row"><span>DOSIS ACUMULADA</span><strong>{{ radiation.doseMsV.toFixed(3) }} mSv</strong></div>
      <div class="radiation-row"><span>GCR · FONDO</span><strong>{{ radiation.gcr.toFixed(3) }} mSv/día</strong></div>
      <div class="radiation-row"><span>SEP · ESCENARIO</span><strong>{{ radiation.sep.toFixed(3) }} mSv/día</strong></div>
      <div class="radiation-row"><span>EXPOSICIÓN</span><strong>{{ formatDays(radiation.exposureDays) }}</strong></div>
      <div class="radiation-row"><span>CIELO VISIBLE</span><strong>{{ (radiation.skyView * 100).toFixed(0) }} %</strong></div>
      <div class="radiation-status" :class="{ active: radiation.sepActive }">{{ radiation.sepActive ? '◆ EVENTO SEP HIPOTÉTICO ACTIVO' : '○ SIN EVENTO SEP SIMULADO' }}</div>
      <div class="radiation-scenario">
        <span>PRUEBA SEP · VALORES HIPOTÉTICOS</span>
        <div class="radiation-scenario-controls">
          <label>Máx. <select v-model="peak" aria-label="Aporte máximo SEP hipotético"><option value="0.5">0,5</option><option value="2">2</option><option value="5">5</option></select> mSv/día</label>
          <label>Dur. <select v-model="duration" aria-label="Duración del evento SEP"><option value="0.25">6 h</option><option value="0.5">12 h</option><option value="1">1 d</option></select></label>
        </div>
        <button v-if="!radiation.sepActive" type="button" @click="start">INICIAR ESCENARIO</button>
        <button v-else type="button" @click="emit('end-scenario')">FINALIZAR ESCENARIO</button>
      </div>
      <div v-if="inspected" class="radiation-inspect">
        <b>SECTOR APUNTADO · {{ inspected.x.toFixed(0) }}, {{ inspected.z.toFixed(0) }} m</b>
        <span>{{ inspected.total.toFixed(3) }} mSv/día · cielo {{ (inspected.skyView * 100).toFixed(0) }} %</span>
        <span>GCR {{ inspected.gcr.toFixed(3) }} · SEP {{ inspected.sep.toFixed(3) }}</span>
        <span>Geometría {{ inspected.geometricShelter > 0.1 ? 'parcialmente resguardada' : 'abierta' }}</span>
      </div>
      <div class="radiation-note">MODELO EDUCATIVO · NO CALIBRADO · Q inspecciona suelo</div>
    </div>
  </aside>
</template>
