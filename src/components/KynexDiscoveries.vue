<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { DISCOVERIES, findDiscovery, readDiscovery, restoreDiscoveryState, saveDiscoveryState } from '../world/Discoveries.js'

const props = defineProps({ telemetry: { type: Object, required: true }, base: { type: Object, required: true } })
const emit = defineEmits(['panel-change'])
const state = reactive(restoreDiscoveryState())
const pending = ref(null)
const selected = ref(null)
const logOpen = ref(false)
const list = computed(() => DISCOVERIES.map(item => ({ ...item, foundAt: state.found[item.id], read: !!state.read[item.id] })))
const count = computed(() => Object.keys(state.found).length)
let promptTimer
watch(state, () => saveDiscoveryState(state), { deep: true })
watch(() => [props.telemetry.x, props.telemetry.z, props.base.x, props.base.z], ([x, z, baseX, baseZ]) => {
  if (!Number.isFinite(baseX) || !Number.isFinite(baseZ)) return
  if (Math.hypot(x - baseX - 4, z - baseZ - 11.5) <= 4) discover('regolith')
  else if (pending.value === 'regolith') pending.value = null
})
watch(() => [selected.value, logOpen.value], () => emit('panel-change', !!selected.value || logOpen.value))
function discover(id) {
  if (!findDiscovery(state, id)) return false
  pending.value = id
  clearTimeout(promptTimer)
  promptTimer = setTimeout(() => { if (pending.value === id) pending.value = null }, 12000)
  return true
}
function investigate(id = pending.value) {
  if (!id || !state.found[id]) return false
  selected.value = DISCOVERIES.find(item => item.id === id) ?? null
  if (!selected.value) return false
  readDiscovery(state, id)
  pending.value = null
  return true
}
function closePanel() { selected.value = null; logOpen.value = false }
function toggleLog() { selected.value = null; logOpen.value = !logOpen.value }
defineExpose({ discover, inspectPending: () => investigate(), toggleLog, closePanel, get pending() { return pending.value }, get panelOpen() { return !!selected.value || logOpen.value } })
onBeforeUnmount(() => { clearTimeout(promptTimer) })
</script>

<template>
  <div class="discovery-status"><button type="button" @click="toggleLog">BITÁCORA KYNEX · {{ count }}/{{ DISCOVERIES.length }} <kbd>B</kbd></button></div>
  <div v-if="pending && !selected && !logOpen" class="discovery-prompt" role="status">
    <small>✦ NUEVO DESCUBRIMIENTO</small><strong>{{ DISCOVERIES.find(item => item.id === pending)?.name }}</strong>
    <button type="button" @click="investigate()"><kbd>F</kbd> INVESTIGAR</button>
  </div>
  <div v-if="selected || logOpen" class="discovery-modal" role="dialog" aria-modal="true" :aria-label="selected ? selected.name : 'Bitácora KYNEX'">
    <article class="discovery-card">
      <header><div><small>✦ {{ selected ? selected.category : 'BITÁCORA KYNEX' }}</small><h2>{{ selected?.name ?? 'Tus descubrimientos' }}</h2></div><button type="button" class="discovery-close" aria-label="Cerrar" @click="closePanel">×</button></header>
      <template v-if="selected">
        <div class="discovery-visual" aria-hidden="true"><span v-if="selected.id === 'gravity'">TIERRA · 9,81 m/s²<br />LUNA · 1,62 m/s²</span><span v-else-if="selected.id === 'airlock'">VACÍO → ESCLUSA → HÁBITAT</span><span v-else>✦ {{ selected.category.toUpperCase() }}</span></div>
        <p>{{ selected.explanation }}</p><p class="discovery-fact">{{ selected.fact }}</p>
        <small class="discovery-source">{{ selected.type }} · {{ selected.entity ?? selected.trigger }}</small>
        <a :href="selected.source" target="_blank" rel="noopener noreferrer">CONSULTAR FUENTE ↗</a>
        <div class="discovery-actions"><button type="button" @click="closePanel">VOLVER A EXPLORAR</button></div>
      </template>
      <template v-else>
        <p>Encontrados {{ count }} de {{ DISCOVERIES.length }}. Investigar es opcional.</p>
        <ul class="discovery-list"><li v-for="item in list" :key="item.id"><div><strong>{{ item.foundAt ? item.name : item.type === 'UNAVAILABLE' ? 'Cráter por verificar' : 'Por descubrir' }}</strong><small>{{ item.category }} · {{ item.foundAt ? item.read ? 'LEÍDO' : 'SIN LEER' : item.type === 'UNAVAILABLE' ? 'SIN UBICACIÓN VALIDADA' : 'PENDIENTE' }}</small></div><button v-if="item.foundAt" type="button" @click="logOpen = false; investigate(item.id)">ABRIR</button></li></ul>
      </template>
    </article>
  </div>
</template>
