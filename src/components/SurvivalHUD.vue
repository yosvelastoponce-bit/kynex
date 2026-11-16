<script setup>
import { computed } from 'vue'
import { survivalStage, SURVIVAL_HOURS } from '../world/SurvivalMission.js'

const props = defineProps({ mission: { type: Object, required: true }, base: { type: Object, required: true }, open: Boolean, notice: String })
const emit = defineEmits(['open-change', 'confirm', 'retry', 'restart'])
const eclss = computed(() => props.base.eclss)
const stage = computed(() => survivalStage(props.mission))
const goals = {
  1: 'Revisa el aire y la energía desde el interior.',
  2: 'Inspecciona paneles y baterías; verifica el suministro.',
  3: 'Sal por la esclusa, inspecciona la roca y regresa.',
  4: 'Detecta el consumo extra y aísla el equipo científico.',
  5: 'Mantén la base estable hasta las 24:00 y cierra el turno.',
}
const titles = { 1: 'Revisión inicial', 2: 'Inspección energética', 3: 'Operación exterior EVA', 4: 'Incidente eléctrico', 5: 'Cierre del turno' }
const clock = computed(() => { const h = Math.floor(props.mission.elapsedHours); const m = Math.floor((props.mission.elapsedHours - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` })
const habitat = computed(() => !eclss.value ? 'CALCULANDO' : eclss.value.stable ? 'NORMAL' : eclss.value.alerts?.some(a => a.level === 'critica') ? 'CRÍTICO' : 'ATENCIÓN')
const checks = computed(() => props.mission.checks)
const canInitial = computed(() => props.base.zone === 'habitat' && checks.value.controlOpened && checks.value.oxygen && checks.value.pressure && checks.value.power && eclss.value?.stable)
const canPower = computed(() => checks.value.initial && checks.value.solar && checks.value.battery && checks.value.power && eclss.value?.power.usedW >= eclss.value?.power.demandW)
const canFinal = computed(() => props.mission.elapsedHours >= SURVIVAL_HOURS && checks.value.initial && checks.value.supply && checks.value.evaReturned && props.mission.incident === 'resolved' && props.base.zone === 'habitat' && eclss.value?.stable)
</script>

<template>
  <aside class="survival-hud" aria-label="Estado de la misión" aria-live="polite">
    <small>✦ MISIÓN 01 · SOBREVIVE 24 HORAS</small>
    <div class="survival-hud-head"><strong>{{ clock }} <span>/ 24:00</span></strong><b :class="habitat.toLowerCase()">{{ habitat }}</b></div>
    <div v-if="eclss" class="survival-readings"><span>ENERGÍA {{ (eclss.power.usedW / 1000).toFixed(2) }} kW · {{ eclss.power.batteryKWh.toFixed(1) }} kWh</span><span>O₂ {{ eclss.cabin.partialKPa.O2.toFixed(1) }} kPa · CO₂ {{ (eclss.cabin.partialKPa.CO2 * 1000).toFixed(0) }} Pa</span><span>INTERIOR {{ eclss.cabin.temperatureC.toFixed(1) }} °C</span></div>
    <p>{{ titles[stage] }}: {{ goals[stage] }}</p>
    <button type="button" @click="emit('open-change', true)">PANEL DE MISIÓN <kbd>M</kbd> ↗</button>
  </aside>
  <div v-if="notice" class="survival-notice" role="status">{{ notice }}</div>
  <div v-if="open || mission.status === 'won' || mission.status === 'failed'" class="survival-modal" role="dialog" aria-modal="true" aria-label="Panel de supervivencia">
    <section class="survival-card">
      <header><div><small>✦ KYNEX MISSION CONTROL · ESCENARIO</small><h2>{{ mission.status === 'won' ? 'MISIÓN COMPLETADA' : mission.status === 'failed' ? 'MISIÓN INTERRUMPIDA' : titles[stage] }}</h2></div><button v-if="mission.status === 'active'" type="button" aria-label="Cerrar panel" @click="emit('open-change', false)">×</button></header>
      <template v-if="mission.status === 'active'">
        <p>{{ goals[stage] }}</p>
        <div class="survival-detail-grid">
          <div><small>TIEMPO OPERATIVO</small><strong>{{ clock }} / 24:00</strong><span>El Sol y la Tierra siguen el reloj astronómico compartido; 24 h terrestres no son un día lunar.</span></div>
          <div><small>ENERGÍA</small><strong>{{ (eclss?.power.solarW / 1000).toFixed(2) }} kW solar · {{ eclss?.power.batteryKWh.toFixed(1) }} kWh</strong><span>Demanda {{ (eclss?.power.demandW / 1000).toFixed(2) }} kW · uso {{ (eclss?.power.usedW / 1000).toFixed(2) }} kW</span></div>
          <div><small>AIRE Y TEMPERATURA</small><strong>O₂ {{ eclss?.cabin.partialKPa.O2.toFixed(1) }} kPa · CO₂ {{ (eclss?.cabin.partialKPa.CO2 * 1000).toFixed(0) }} Pa</strong><span>Presión {{ eclss?.cabin.pressureKPa.toFixed(1) }} kPa · interior {{ eclss?.cabin.temperatureC.toFixed(1) }} °C</span></div>
          <div><small>SISTEMAS ESENCIALES</small><strong>{{ eclss?.stable ? 'OPERATIVOS' : 'REQUIEREN ATENCIÓN' }}</strong><span>Ventilación {{ eclss?.operating.ventilation ? 'sí' : 'no' }} · CO₂ {{ eclss?.operating.scrubber ? 'sí' : 'no' }} · regulador {{ eclss?.operating.regulator ? 'sí' : 'no' }}</span></div>
        </div>
        <div class="survival-checklist">
          <strong>OPERACIONES</strong>
          <span>{{ checks.initial ? '✓' : '○' }} Revisión inicial: entra, abre control ambiental (E), verifica O₂, presión y energía; activa equipos esenciales.</span>
          <span>{{ checks.supply ? '✓' : '○' }} Energía: inspecciona paneles y baterías (F), luego verifica suministro.</span>
          <span>{{ checks.evaReturned ? '✓' : '○' }} EVA: usa la esclusa, inspecciona la roca de entrenamiento (F) y vuelve al interior.</span>
          <span>{{ mission.incident === 'resolved' ? '✓' : '○' }} Incidente: apaga el equipo científico no esencial y verifica la energía.</span>
        </div>
        <p v-if="mission.incident === 'active'" class="survival-alert">ALERTA DE ESCENARIO: consumo anormal del equipo científico. Abre el control ambiental junto a la consola y apaga «Equipo científico». Después verifica la energía.</p>
        <details class="survival-help"><summary>¿Qué significan estas medidas?</summary>
          <p><b>kW y kWh.</b> El kW indica potencia en este momento; el kWh indica energía almacenada o usada. Si el consumo supera la generación solar, la diferencia sale de la batería.</p>
          <p><b>ECLSS.</b> El soporte vital regula el aire del hábitat. El oxígeno se consume al respirar y el CO₂ debe retirarse; la presión parcial indica cuánto aporta cada gas a la presión total.</p>
          <p><b>Temperatura.</b> El control térmico usa energía para mantener el interior cerca de su consigna. Todos los valores y bandas de la base son un modelo de entrenamiento KYNEX.</p>
        </details>
        <div class="survival-actions"><button v-if="stage === 1" type="button" :disabled="!canInitial" @click="emit('confirm', 'confirm-initial')">CONFIRMAR REVISIÓN</button><button v-if="stage === 2" type="button" :disabled="!canPower" @click="emit('confirm', 'confirm-power')">CONFIRMAR SUMINISTRO</button><button v-if="stage === 5" type="button" :disabled="!canFinal" @click="emit('confirm', 'confirm-final')">FINALIZAR TURNO</button><button type="button" @click="emit('open-change', false)">VOLVER A LA BASE</button></div>
        <small class="survival-provenance">BANDAS Y EQUIPOS: MODELO EDUCATIVO KYNEX · TERRENO: NASA LRO/LOLA SITE04</small>
      </template>
      <template v-else>
        <p>{{ mission.status === 'won' ? 'Has mantenido el hábitat operativo durante el turno.' : mission.reason }}</p>
        <div class="survival-detail-grid"><div><small>TIEMPO</small><strong>{{ clock }}</strong></div><div><small>BATERÍA FINAL</small><strong>{{ eclss?.power.batteryKWh.toFixed(1) }} kWh</strong></div><div><small>ECLSS</small><strong>{{ habitat }}</strong></div><div><small>INCIDENTE</small><strong>{{ mission.incident === 'resolved' ? 'RESUELTO' : 'PENDIENTE' }}</strong></div></div>
        <div class="survival-actions"><button v-if="mission.status === 'failed' && mission.checkpoint" type="button" @click="emit('retry')">REINTENTAR DESDE CONTROL</button><button type="button" @click="emit('restart')">REINICIAR MISIÓN</button></div>
      </template>
    </section>
  </div>
</template>
