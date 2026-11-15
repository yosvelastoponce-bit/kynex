<script setup>
defineProps({ system: { type: Object, required: true }, zone: { type: String, required: true } })
</script>

<template>
  <aside v-if="zone === 'habitat' || zone === 'airlock'" class="eclss-telemetry" aria-label="Condiciones interiores del hábitat">
    <div class="eclss-mini-title">◆ INTERIOR / {{ zone === 'airlock' ? 'ESCLUSA' : 'HÁBITAT' }}</div>
    <template v-if="system.cabin">
      <div class="eclss-mini-row"><span>PRESIÓN CABINA</span><b>{{ system.cabin.pressureKPa.toFixed(2) }} kPa</b></div>
      <div class="eclss-mini-row"><span>O₂ PARCIAL</span><b>{{ system.cabin.partialKPa.O2.toFixed(2) }} kPa</b></div>
      <div class="eclss-mini-row"><span>CO₂ PARCIAL</span><b>{{ (system.cabin.partialKPa.CO2 * 1000).toFixed(0) }} Pa</b></div>
      <div class="eclss-mini-row"><span>AIRE / HUMEDAD</span><b>{{ system.cabin.temperatureC.toFixed(1) }} °C / {{ system.cabin.relativeHumidity.toFixed(0) }} %</b></div>
      <div v-if="zone === 'airlock'" class="eclss-mini-row"><span>ESCLUSA</span><b>{{ system.lock.pressureKPa.toFixed(2) }} kPa</b></div>
      <div class="eclss-mini-foot">SOPORTE VITAL · {{ system.stable ? 'ESTABLE' : 'VERIFICACIÓN PENDIENTE' }}</div>
    </template>
  </aside>
</template>
