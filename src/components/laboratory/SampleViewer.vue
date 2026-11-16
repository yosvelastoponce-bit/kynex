<script setup>
import LunarRockViewer from '../LunarRockViewer.vue'
import { LAB_SOURCES } from '../../world/laboratory/ScientificProvenance.js'
defineProps({sample:Object,microscopy:Boolean})
</script>
<template>
  <div class="resource-viewer">
    <LunarRockViewer :key="sample.id" />
    <p><b>SCENARIO · representación 3D genérica.</b> {{ microscopy ? 'Microscopio virtual: gira y acerca la réplica para explorar la textura; no es una sección delgada real ni una imagen con escala calibrada.' : 'Gira la réplica con el ratón. El color y los granos del modelo no constituyen una medición de esta muestra.' }}</p>
    <p>{{ sample.appearance }}</p>
    <a v-if="sample.photo" :href="LAB_SOURCES[sample.photo.source].url.split('#')[0]" target="_blank" rel="noopener noreferrer">VER IMAGEN DOCUMENTADA · {{ sample.photo.id }} ↗</a>
    <p v-else>Fotografía real: dato no disponible para el objeto virtual.</p>
  </div>
</template>
