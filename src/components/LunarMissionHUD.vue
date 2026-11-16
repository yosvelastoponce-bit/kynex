<script setup>
import { computed, ref } from 'vue'
import { LUNAR_MISSIONS } from '../world/LunarExplorationMissions.js'
const props = defineProps({ mission: Object, base: Object, open: Boolean, notice: String })
const emit = defineEmits(['open-change', 'restart'])
const hint = ref(false)
const current = computed(() => LUNAR_MISSIONS[Math.min(props.mission.completed, 3)])
const checklist = computed(() => props.mission.completed === 0
  ? [['Consola abierta', props.mission.checks.console], ['Ventilación', props.base.eclss?.operating?.ventilation], ['Captura CO₂', props.base.eclss?.operating?.scrubber], ['Regulador', props.base.eclss?.operating?.regulator]]
  : props.mission.completed === 3 ? [['Paneles inspeccionados', props.mission.checks.solar], ['Baterías inspeccionadas', props.mission.checks.battery], ['Regreso al hábitat', props.base.zone === 'habitat']] : [])
</script>
<template>
  <aside class="survival-hud lunar-mission-hud" aria-label="Misión lunar actual" aria-live="polite">
    <small>✦ {{ mission.status === 'won' ? 'EXPLORACIÓN COMPLETADA' : `MISIÓN 0${mission.completed + 1} · EXPLORACIÓN LUNAR` }}</small>
    <h2>{{ mission.status === 'won' ? '¡Buen trabajo, astronauta!' : current.title }}</h2>
    <p>{{ mission.status === 'won' ? 'Has completado las cuatro misiones. Puedes seguir explorando y usar el laboratorio.' : current.description }}</p>
    <div class="lunar-mission-progress" :aria-label="`${mission.completed} de 4 misiones completadas`"><span v-for="n in 4" :key="n" :class="{ done: mission.completed >= n }" /></div>
    <small>{{ mission.completed }} / 4 COMPLETADAS</small>
    <button type="button" @click="hint = false; emit('open-change', true)">VER MISIÓN <kbd>M</kbd> ↗</button>
  </aside>
  <div v-if="notice" class="survival-notice" role="status">{{ notice }}</div>
  <div v-if="open" class="survival-modal" role="dialog" aria-modal="true" aria-label="Misión lunar">
    <section class="survival-card lunar-mission-card">
      <header><div><small>✦ KYNEX · {{ mission.status === 'won' ? 'RESULTADOS' : `MISIÓN 0${mission.completed + 1}` }}</small><h2>{{ mission.status === 'won' ? '¡Exploración completada!' : current.title }}</h2></div><button type="button" aria-label="Cerrar misión" @click="emit('open-change', false)">×</button></header>
      <template v-if="mission.status !== 'won'">
        <p>{{ current.description }}</p>
        <div v-if="checklist.length" class="survival-checklist"><span v-for="[label, done] in checklist" :key="label">{{ done ? '✓' : '○' }} {{ label }}</span></div>
        <p v-if="hint">{{ current.hint }}</p>
        <div class="survival-actions"><button type="button" @click="hint = !hint">{{ hint ? 'OCULTAR PISTA' : 'PISTA' }}</button><button type="button" @click="emit('open-change', false)">SEGUIR EXPLORANDO →</button></div>
      </template>
      <template v-else><p>Preparaste el refugio, recogiste y entregaste una roca, revisaste la energía y regresaste a salvo.</p><div class="survival-actions"><button type="button" @click="emit('open-change', false)">SEGUIR EXPLORANDO →</button><button type="button" @click="emit('restart')">REINICIAR MISIONES</button></div></template>
    </section>
  </div>
</template>
<style scoped>
.lunar-mission-hud{background:linear-gradient(135deg,#102d2cba,#06161cc2);border-radius:14px;backdrop-filter:blur(20px) saturate(140%)}
.lunar-mission-hud h2{font:600 23px/1.15 'DM Sans',sans-serif;margin:10px 0}
.lunar-mission-hud p{font-size:12px;line-height:1.6}
.lunar-mission-hud>button{display:block;margin-top:12px}
.lunar-mission-progress{display:flex;gap:5px;margin:12px 0 6px}
.lunar-mission-progress span{height:3px;flex:1;background:#b5e9d028;border-radius:4px}
.lunar-mission-progress .done{background:#a5e5bf;box-shadow:0 0 9px #a5e5bf60}
.lunar-mission-card{width:min(510px,calc(100vw - 28px));background:linear-gradient(135deg,#163e3db3,#071b21c2)}
</style>
