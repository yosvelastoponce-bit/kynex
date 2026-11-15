<script setup>
defineProps({
  days: { type: Number, required: true },
  azimuth: { type: Number, required: true },
  elevation: { type: Number, required: true },
  aboveHorizon: { type: Boolean, required: true },
  speed: { type: String, required: true },
})
defineEmits(['speed-change', 'toggle-time', 'reset-time'])
</script>

<template>
  <aside class="solar-panel" aria-label="Controles del Sol y tiempo lunar simulado">
    <div class="solar-panel-title"><span class="solar-panel-dot" /> SOL / MODELO ILUSTRATIVO</div>
    <div class="solar-panel-row"><span>DÍA TERRESTRE</span><strong>+{{ days.toFixed(3) }}</strong></div>
    <div class="solar-panel-row"><span>AZIMUT SOLAR</span><strong>{{ azimuth.toFixed(1) }}°</strong></div>
    <div class="solar-panel-row"><span>ELEVACIÓN</span><strong>{{ elevation.toFixed(2) }}°</strong></div>
    <div class="solar-panel-status" :class="{ dark: !aboveHorizon }">{{ aboveHorizon ? 'SOL SOBRE HORIZONTE ASTRONÓMICO' : 'SOL BAJO HORIZONTE ASTRONÓMICO' }}</div>
    <div class="site04-map-note">Ángulos pendientes de validación con efemérides lunares. Día +0 no representa una fecha UTC verificada.</div>
    <div class="solar-panel-actions">
      <button type="button" @click="$emit('toggle-time')">{{ speed === 'pause' ? 'REANUDAR' : 'PAUSAR' }}</button>
      <select :value="speed" aria-label="Velocidad del tiempo simulado" @change="$emit('speed-change', $event.target.value)">
        <option value="pause">PAUSA</option>
        <option value="realtime">TIEMPO REAL</option>
        <option value="hour">1 H / S</option>
        <option value="day">1 DÍA / S</option>
      </select>
    </div>
    <button type="button" class="solar-panel-reset" @click="$emit('reset-time')">RESTABLECER TIEMPO ↺</button>
  </aside>
</template>
