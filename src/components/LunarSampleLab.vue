<script setup>
import { ref } from 'vue'
import LunarRockViewer from './LunarRockViewer.vue'
import NasaPolarMineralMap from './NasaPolarMineralMap.vue'
import { SAMPLE_MINERALS } from '../world/LunarSampleMission.js'

defineEmits(['close', 'complete'])
const selected = ref([])
const hintLevel = ref(0)
const feedback = ref('')
const hints = [
  'Busca tres minerales que aparezcan como opciones en los mapas regionales de Kaguya.',
  'La mezcla educativa incluye plagioclasa, ortopiroxeno y olivino. ¡Compara con las capas!',
  'Pista final: plagioclasa + ortopiroxeno + olivino.',
]

function toggleMineral(id) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id]
  feedback.value = ''
}

function checkSample() {
  const target = ['plagioclase', 'orthopyroxene', 'olivine']
  const correct = target.every(id => selected.value.includes(id)) && selected.value.length === target.length
  if (correct) {
    emit('complete', selected.value)
    return
  }
  const hits = selected.value.filter(id => target.includes(id)).length
  feedback.value = selected.value.length > 3
    ? '¡Buen intento! Selecciona solo los tres minerales de la mezcla.'
    : `¡Sigue observando! Encontraste ${hits} de 3. Puedes pedir una pista.`
}
</script>

<template>
  <div class="sample-lab-backdrop" role="presentation" @click.self="$emit('close')">
    <section class="sample-lab-panel" role="dialog" aria-modal="true" aria-labelledby="sample-lab-title">
      <header class="sample-lab-header">
        <div><div class="sample-lab-eyebrow">MISIÓN DE GEOLOGÍA · LABORATORIO KYNEX</div><h2 id="sample-lab-title">¡Investiga la roca lunar!</h2></div>
        <button type="button" class="sample-lab-close" aria-label="Cerrar laboratorio" @click="$emit('close')">×</button>
      </header>
      <p class="sample-lab-intro">Gira la muestra, mira sus granos y compara la región con los mapas. Elige los tres minerales de nuestra mezcla educativa.</p>
      <div class="sample-lab-content">
        <div class="sample-lab-observation">
          <LunarRockViewer />
          <div class="sample-lab-source-note"><b>¿Qué estás viendo?</b> Un modelo 3D de entrenamiento, no una fotografía ni el escaneo de una roca real.</div>
          <NasaPolarMineralMap />
          <div class="sample-lab-reference">
            <b>Comparaciones reales Apollo</b>
            <span>Apollo 16, muestra 60025: anortosita rica en plagioclasa.</span>
            <span>Apollo 11, muestra 10003: basalto con piroxenos, plagioclasa e ilmenita.</span>
            <a href="https://www.lpi.usra.edu/lunar/samples/atlas/" target="_blank" rel="noreferrer">Lunar Sample Atlas (LPI) ↗</a>
          </div>
        </div>
        <div class="sample-lab-choices">
          <h3>¿Qué minerales elegirías?</h3>
          <p>Selecciona tres. Las pistas y el mapa te ayudan; no hace falta saberlo todo.</p>
          <label v-for="mineral in SAMPLE_MINERALS" :key="mineral.id" class="sample-mineral-choice">
            <input type="checkbox" :checked="selected.includes(mineral.id)" @change="toggleMineral(mineral.id)" />
            <span><b>{{ mineral.name }}</b><small>{{ mineral.clue }}</small></span>
          </label>
          <div class="sample-lab-actions">
            <button type="button" class="sample-hint-button" @click="hintLevel = Math.min(hintLevel + 1, hints.length)">💡 Pedir pista</button>
            <button type="button" class="sample-check-button" @click="checkSample">COMPROBAR MI IDEA</button>
          </div>
          <p v-if="hintLevel" class="sample-lab-hint" role="status">{{ hints[hintLevel - 1] }}</p>
          <p v-if="feedback" class="sample-lab-feedback" role="status">{{ feedback }}</p>
          <p class="sample-lab-science-note">Una capa orbital muestra minerales en una región grande: no puede identificar por sí sola esta roca pequeña. La composición de este reto es inferida y simplificada para aprender.</p>
        </div>
      </div>
      <footer class="sample-lab-footer">
        <span>Los mapas regionales Kaguya SP muestran información espectral, no una muestra bajo este microscopio.</span>
        <button type="button" @click="$emit('close')">VOLVER A EXPLORAR</button>
      </footer>
    </section>
  </div>
</template>
