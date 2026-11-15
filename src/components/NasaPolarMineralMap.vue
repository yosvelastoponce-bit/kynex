<script setup>
import { computed, ref, watch } from 'vue'

const layers = Object.freeze([
  { id: 'sp_plg_mlemelin_031417', mineral: 'Plagioclasa', name: 'PLAGIOCLASA' },
  { id: 'sp_opx_mlemelin_031417', mineral: 'Ortopiroxeno', name: 'ORTOPIROXENO' },
  { id: 'sp_cpx_mlemelin_031417', mineral: 'Clinopiroxeno', name: 'CLINOPIROXENO' },
  { id: 'sp_olivine_mlemelin_031417', mineral: 'Olivino', name: 'OLIVINO' },
  { id: 'sp_feo_mlemelin_031417', mineral: 'Óxido de hierro (FeO)', name: 'FeO' },
])
const tiles = Object.freeze([
  { row: 1, col: 3 }, { row: 1, col: 4 },
  { row: 2, col: 3 }, { row: 2, col: 4 },
])
const selectedLayer = ref(layers[0].id)
const failed = ref(false)
const layer = computed(() => layers.find(item => item.id === selectedLayer.value))
const tileUrl = tile => `https://trek.nasa.gov/tiles/Moon/SP/${selectedLayer.value}/1.0.0/default/default028mm/2/${tile.row}/${tile.col}.png`
watch(selectedLayer, () => { failed.value = false })
</script>

<template>
  <section class="nasa-mineral-map" aria-label="Mapa regional de minerales lunares">
    <label class="nasa-mineral-map-label" for="nasa-mineral-layer">CAPA NASA TREK</label>
    <select id="nasa-mineral-layer" v-model="selectedLayer">
      <option v-for="item in layers" :key="item.id" :value="item.id">{{ item.name }}</option>
    </select>
    <div class="nasa-mineral-tile-grid" :aria-label="`Mapa Kaguya SP de ${layer.mineral}`">
      <img v-for="tile in tiles" :key="`${selectedLayer}-${tile.row}-${tile.col}`"
        :src="tileUrl(tile)" alt="" aria-hidden="true" @error="failed = true" />
      <span class="nasa-map-center" aria-hidden="true">⊕</span>
      <span class="nasa-map-marker">POLO SUR SIMULADO</span>
      <div v-if="failed" class="nasa-map-error" role="status">No se pudo cargar el mapa. Comprueba tu conexión e inténtalo de nuevo.</div>
    </div>
    <p class="nasa-mineral-caption">{{ layer.mineral }} · mapa regional Kaguya SP · aprox. 1 km/píxel.</p>
    <p class="nasa-mineral-caveat">La marca señala la región ilustrativa, no una coordenada medida. La escala del mapa es mucho mayor que una roca.</p>
    <a href="https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon" target="_blank" rel="noreferrer">NASA Trek: datos y capas lunares ↗</a>
  </section>
</template>
