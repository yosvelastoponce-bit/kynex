<script setup>
import Site04Map from './Site04Map.vue'
defineProps({
  x: { type: Number, required: true }, z: { type: Number, required: true },
  heading: { type: Number, required: true },
  sunAzimuth: { type: Number, required: true }, sunElevation: { type: Number, required: true },
  baseX: { type: Number, required: true }, baseZ: { type: Number, required: true },
  siteTerrain: { type: Object, default: null },
})
</script>
<template>
  <aside v-if="siteTerrain" class="polar-map polar-map-site04" aria-label="Mapa científico NASA LOLA Site04">
    <div class="polar-map-heading"><span>SHACKLETON RIM / SITE04</span><span class="polar-map-live">● NASA LOLA · 5 M</span></div>
    <Site04Map :site="siteTerrain" :x="x" :z="z" :heading="heading" :sun-azimuth="sunAzimuth" :sun-elevation="sunElevation" :base-x="baseX" :base-z="baseZ" />
    <div class="polar-map-footer"><span>DEM NASA / DERIVADO KYNEX</span><span>↔ 2,4 KM</span></div>
  </aside>
</template>
