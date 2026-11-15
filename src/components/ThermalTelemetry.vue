<script setup>
import { ref } from 'vue'
defineProps({ thermal: { type: Object, required: true } })
const collapsed = ref(false)
function elapsed(days) {
  return days < 1 ? `${(days * 24).toFixed(1)} h` : `${days.toFixed(1)} d`
}
</script>

<template>
  <aside class="thermal-panel" aria-label="Telemetría térmica simulada">
    <div class="thermal-panel-title"><span>◈ TEMPERATURA / MODELO EDUCATIVO</span><button type="button" :aria-label="collapsed ? 'Expandir telemetría térmica' : 'Minimizar telemetría térmica'" @click="collapsed = !collapsed">{{ collapsed ? '+' : '−' }}</button></div>
    <div v-if="!collapsed">
      <div class="site04-map-note">Temperatura observada no disponible.</div>
      <div class="thermal-primary">{{ thermal.celsius.toFixed(1) }} <small>°C</small></div>
      <div class="thermal-row"><span>TEMPERATURA</span><strong>{{ thermal.kelvin.toFixed(1) }} K</strong></div>
      <div class="thermal-row"><span>ESTADO</span><strong>{{ thermal.visibleFraction > 0.95 ? 'ILUMINADO' : thermal.visibleFraction > 0.05 ? 'PENUMBRA' : 'SOMBRA' }}</strong></div>
      <div class="thermal-row"><span>TENDENCIA</span><strong>{{ thermal.trendKelvinPerDay > 0.05 ? '↑ CALENTANDO' : thermal.trendKelvinPerDay < -0.05 ? '↓ ENFRIANDO' : '→ ESTABLE' }}</strong></div>
      <div class="thermal-row"><span>EN ESTE ESTADO</span><strong>{{ elapsed(thermal.sinceChangeDays) }}</strong></div>
      <div class="thermal-extremes">SESIÓN {{ thermal.minimumCelsius.toFixed(0) }}° / {{ thermal.maximumCelsius.toFixed(0) }}°C</div>
      <div class="thermal-note">Estimación del modelo · sector 100 m</div>
    </div>
  </aside>
</template>
