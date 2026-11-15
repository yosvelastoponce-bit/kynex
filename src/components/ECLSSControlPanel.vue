<script setup>
const props = defineProps({ system: { type: Object, required: true }, mission: { type: Object, required: true } })
const emit = defineEmits(['close', 'control'])
const equipment = [
  ['ventilation', 'Ventilación'], ['scrubber', 'Captura CO₂'], ['generator', 'Generador O₂'],
  ['regulator', 'Regulador'], ['condenser', 'Condensador'], ['thermal', 'Control térmico'],
]
function verify(action) { emit('control', { action }) }
function toggle(name) { emit('control', { action: 'toggle', value: name }) }
</script>

<template>
  <section class="eclss-console" aria-label="KYNEX control ambiental">
    <header class="eclss-console-head"><div><small>CENTRO DE CONTROL / HÁBITAT 01</small><h2>KYNEX — CONTROL AMBIENTAL</h2></div><button type="button" @click="emit('close')" aria-label="Cerrar control ambiental">×</button></header>
    <div class="eclss-console-grid">
      <div class="eclss-card">
        <h3>ATMÓSFERA</h3>
        <div class="eclss-reading"><span>Presión total</span><strong>{{ system.cabin.pressureKPa.toFixed(2) }} kPa</strong></div>
        <div class="eclss-reading"><span>O₂ parcial · {{ (system.cabin.fractions.O2 * 100).toFixed(1) }} %</span><strong>{{ system.cabin.partialKPa.O2.toFixed(2) }} kPa</strong></div>
        <div class="eclss-reading"><span>N₂ parcial · {{ (system.cabin.fractions.N2 * 100).toFixed(1) }} %</span><strong>{{ system.cabin.partialKPa.N2.toFixed(2) }} kPa</strong></div>
        <div class="eclss-reading"><span>CO₂ parcial</span><strong>{{ (system.cabin.partialKPa.CO2 * 1000).toFixed(0) }} Pa</strong></div>
        <div class="eclss-reading"><span>Vapor de agua</span><strong>{{ (system.cabin.partialKPa.H2O * 1000).toFixed(0) }} Pa</strong></div>
        <button type="button" @click="verify('verify-pressure')">VERIFICAR PRESIÓN</button>
      </div>
      <div class="eclss-card">
        <h3>AMBIENTE Y RESERVAS</h3>
        <div class="eclss-reading"><span>Temperatura aire</span><strong>{{ system.cabin.temperatureC.toFixed(1) }} °C</strong></div>
        <div class="eclss-reading"><span>Humedad relativa</span><strong>{{ system.cabin.relativeHumidity.toFixed(0) }} %</strong></div>
        <div class="eclss-reading"><span>Oxígeno almacenado</span><strong>{{ system.storage.O2.toFixed(2) }} kg</strong></div>
        <div class="eclss-reading"><span>Agua disponible</span><strong>{{ system.storage.water.toFixed(2) }} kg</strong></div>
        <div class="eclss-reading"><span>N₂ almacenado</span><strong>{{ system.storage.N2.toFixed(2) }} kg</strong></div>
        <div class="eclss-actions"><button type="button" @click="verify('verify-oxygen')">INSPECCIONAR O₂</button><button type="button" @click="verify('verify-climate')">REVISAR CLIMA</button></div>
      </div>
      <div class="eclss-card">
        <h3>ENERGÍA</h3>
        <div class="eclss-reading"><span>Disponible</span><strong>{{ system.power.availableW.toFixed(0) }} W</strong></div>
        <div class="eclss-reading"><span>Demanda / uso</span><strong>{{ system.power.demandW.toFixed(0) }} / {{ system.power.usedW.toFixed(0) }} W</strong></div>
        <div class="eclss-reading"><span>Batería</span><strong>{{ system.power.batteryKWh.toFixed(1) }} kWh</strong></div>
        <div class="eclss-reading"><span>Consumo acumulado</span><strong>{{ system.power.energyUsedKWh.toFixed(2) }} kWh</strong></div>
        <button type="button" @click="verify('verify-power')">VERIFICAR ENERGÍA</button>
      </div>
      <div class="eclss-card">
        <h3>EQUIPOS</h3>
        <div v-for="[key, label] in equipment" :key="key" class="eclss-equipment"><span>{{ label }}</span><b :class="{ active: system.operating[key] }">{{ system.failed[key] ? 'FALLO' : system.blocked[key] ? system.blocked[key] : system.operating[key] ? 'OPERATIVO' : system.enabled[key] ? 'SIN ENERGÍA' : 'APAGADO' }}</b><button type="button" :aria-label="`${system.enabled[key] ? 'Apagar' : 'Encender'} ${label}`" @click="toggle(key)">{{ system.enabled[key] ? 'APAGAR' : 'ENCENDER' }}</button></div>
        <button type="button" @click="verify('verify-supply')">VERIFICAR GENERACIÓN / SUMINISTRO O₂</button>
      </div>
    </div>
    <div class="eclss-console-bottom"><div><h3>FLUJOS ACUMULADOS</h3>O₂ consumido {{ system.flows.metabolicO2Kg.toFixed(3) }} kg · generado {{ system.flows.oxygenGeneratedKg.toFixed(3) }} kg · CO₂ capturado {{ system.flows.co2CapturedKg.toFixed(3) }} kg · H₂ almacenado {{ system.storage.hydrogen.toFixed(3) }} kg</div><div><h3>ALERTAS EDUCATIVAS</h3><span v-if="!system.alerts.length">Sin alertas operativas.</span><span v-for="(alert, index) in system.alerts" :key="index" class="eclss-alert">{{ alert.level.toUpperCase() }} · {{ alert.message }}</span></div></div>
    <div class="eclss-console-note">MODELO EDUCATIVO · BANDAS OPERATIVAS KYNEX · NO CERTIFICADO PARA SEGURIDAD HUMANA · MISIÓN 02 {{ mission.count }}/{{ mission.total }}</div>
  </section>
</template>
