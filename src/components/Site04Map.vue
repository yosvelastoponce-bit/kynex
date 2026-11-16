<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { SITE04_GRID_WIDTH, SITE04_HALF_SIZE_METERS } from '../world/Site04Data.js'
import { site04ShadowMask } from '../world/Site04MapShadows.js'

const props = defineProps({
  site: { type: Object, required: true },
  x: { type: Number, required: true },
  z: { type: Number, required: true },
  heading: { type: Number, required: true },
  sunAzimuth: { type: Number, required: true },
  sunElevation: { type: Number, required: true },
  baseX: { type: Number, required: true },
  baseZ: { type: Number, required: true },
  trainingPoints: { type: Array, default: () => [] },
})
const emit = defineEmits(['inspect-point', 'layer-change'])
const canvas = ref(null)
const shadowCanvas = ref(null)
const layer = ref('image')
const SHADOW_SIZE = 120
function selectLayer(value) { layer.value = value; emit('layer-change', value) }
function inspectPoint(event) {
  if (layer.value === 'image') return
  const rect = event.currentTarget.getBoundingClientRect()
  const x = -SITE04_HALF_SIZE_METERS + (event.clientX - rect.left) / rect.width * SITE04_HALF_SIZE_METERS * 2
  const z = -SITE04_HALF_SIZE_METERS + (event.clientY - rect.top) / rect.height * SITE04_HALF_SIZE_METERS * 2
  emit('inspect-point', { x, z })
}
function markerStyle(point) {
  return { left: `${50 + point.x / (SITE04_HALF_SIZE_METERS * 2) * 100}%`,
    top: `${50 + point.z / (SITE04_HALF_SIZE_METERS * 2) * 100}%` }
}
let lastSun = null
const playerStyle = computed(() => ({
  left: `${50 + props.x / (SITE04_HALF_SIZE_METERS * 2) * 100}%`,
  top: `${50 + props.z / (SITE04_HALF_SIZE_METERS * 2) * 100}%`,
}))
const directionStyle = computed(() => ({ transform: `rotate(${-props.heading}rad)` }))
const baseStyle = computed(() => ({
  left: `${50 + props.baseX / (SITE04_HALF_SIZE_METERS * 2) * 100}%`,
  top: `${50 + props.baseZ / (SITE04_HALF_SIZE_METERS * 2) * 100}%`,
}))
const sampleStyle = computed(() => ({
  left: `${50 + (props.baseX + 4) / (SITE04_HALF_SIZE_METERS * 2) * 100}%`,
  top: `${50 + (props.baseZ + 11.5) / (SITE04_HALF_SIZE_METERS * 2) * 100}%`,
}))

function elevationColor(value, min, max) {
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)))
  const stops = [[36, 77, 145], [40, 169, 132], [228, 207, 105], [154, 115, 84]]
  const p = t * (stops.length - 1), index = Math.min(stops.length - 2, Math.floor(p)), fraction = p - index
  return stops[index].map((component, i) => Math.round(component * (1 - fraction) + stops[index + 1][i] * fraction))
}

function drawMap() {
  const context = canvas.value?.getContext('2d')
  if (!context) return
  const image = context.createImageData(SITE04_GRID_WIDTH, SITE04_GRID_WIDTH)
  const { data: elevations, slopes, elevationRange } = props.site
  for (let i = 0; i < elevations.length; i++) {
    let rgb
    if (layer.value === 'slope') {
      const slope = slopes[i]
      rgb = slope < 10 ? [55, 144, 96] : slope < 15 ? [218, 174, 76] : [188, 88, 68]
      const relief = Math.max(0.7, Math.min(1.08, 0.88 + (elevations[i] - elevationRange.minimum) / (elevationRange.maximum - elevationRange.minimum) * 0.2))
      rgb = rgb.map(value => Math.round(value * relief))
    } else rgb = elevationColor(elevations[i], elevationRange.minimum, elevationRange.maximum)
    image.data[i * 4] = rgb[0]
    image.data[i * 4 + 1] = rgb[1]
    image.data[i * 4 + 2] = rgb[2]
    image.data[i * 4 + 3] = 255
  }
  context.putImageData(image, 0, 0)
}

function drawShadows(force = false) {
  if (layer.value !== 'image') return
  const context = shadowCanvas.value?.getContext('2d')
  if (!context) return
  const azimuth = props.sunAzimuth, elevation = props.sunElevation
  const azimuthDelta = lastSun ? Math.abs(((azimuth - lastSun.azimuth + 540) % 360) - 180) : Infinity
  if (!force && lastSun && azimuthDelta < 0.08 && Math.abs(elevation - lastSun.elevation) < 0.02) return
  const pixels = site04ShadowMask(props.site.data, { azimuth, elevation, outputSize: SHADOW_SIZE })
  let shadowCells = 0, signature = 0
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] > 0) shadowCells++
    signature = (Math.imul(signature, 31) + pixels[i]) >>> 0
  }
  const image = context.createImageData(SHADOW_SIZE, SHADOW_SIZE)
  image.data.set(pixels)
  context.putImageData(image, 0, 0)
  shadowCanvas.value.dataset.sunAzimuth = azimuth.toFixed(2)
  shadowCanvas.value.dataset.shadowCells = String(shadowCells)
  shadowCanvas.value.dataset.shadowSignature = String(signature)
  lastSun = { azimuth, elevation }
}

onMounted(() => { drawMap(); drawShadows(true) })
watch(layer, () => { drawMap(); drawShadows(true) })
watch(() => [props.sunAzimuth, props.sunElevation], () => drawShadows())
</script>

<template>
  <div class="site04-map-panel" aria-label="Mapa del sector candidato Site04">
    <div class="site04-map-controls">
      <button type="button" :class="{ active: layer === 'image' }" :aria-pressed="layer === 'image'" @click="selectLayer('image')">SUELO REAL</button>
      <button type="button" :class="{ active: layer === 'slope' }" :aria-pressed="layer === 'slope'" @click="selectLayer('slope')">PENDIENTE</button>
      <button type="button" :class="{ active: layer === 'elevation' }" :aria-pressed="layer === 'elevation'" @click="selectLayer('elevation')">ALTURA</button>
    </div>
    <div class="site04-map-canvas" :class="{ 'site04-map-inspectable': layer !== 'image' }" @click="inspectPoint">
      <img v-show="layer === 'image'" class="site04-photo" src="/assets/site04-lroc-nac.png" alt="Vista orbital real LROC NAC del suelo de Site04, alineada con el sector del DEM" />
      <canvas v-show="layer !== 'image'" ref="canvas" :width="SITE04_GRID_WIDTH" :height="SITE04_GRID_WIDTH" :aria-label="layer === 'slope' ? 'Mapa de pendiente: verde menor de 10 grados, ámbar 10 a 15, rojo mayor de 15' : 'Mapa de elevación del sector Site04'" />
      <canvas v-show="layer === 'image'" ref="shadowCanvas" class="site04-shadow-overlay" :width="SHADOW_SIZE" :height="SHADOW_SIZE" aria-label="Sombras simuladas del relieve según la posición solar educativa" />
      <div class="site04-map-grid" aria-hidden="true" />
      <span class="site04-base-marker" :style="baseStyle" title="Puesto educativo ilustrativo" aria-label="Puesto educativo ilustrativo">◆</span>
      <span class="site04-sample-marker" :style="sampleStyle" title="Muestra de entrenamiento" aria-label="Muestra de entrenamiento">●</span>
      <span class="site04-player-marker" :style="playerStyle" title="Tu posición y dirección" aria-label="Tu posición y dirección"><i class="polar-map-direction" :style="directionStyle" /></span>
      <span v-for="(point, index) in trainingPoints" :key="index" class="site04-training-point" :style="markerStyle(point)" :aria-label="`Punto ${index ? 'B' : 'A'}`">{{ index ? 'B' : 'A' }}</span>
    </div>
    <div v-if="layer === 'image'" class="site04-legend"><span>LROC NAC · 2011</span><span>SOMBRA DEM · SOL {{ sunAzimuth.toFixed(1) }}°</span></div>
    <div v-else-if="layer === 'slope'" class="site04-legend"><span><i class="site04-legend-green" />0–10°</span><span><i class="site04-legend-amber" />10–15°</span><span><i class="site04-legend-red" />15–{{ site.metrics.maximumSlopeDegrees.toFixed(0) }}°</span></div>
    <div v-else class="site04-legend site04-elevation-legend"><span>{{ site.elevationRange.minimum.toFixed(0) }} m</span><span>Elevación LOLA</span><span>{{ site.elevationRange.maximum.toFixed(0) }} m</span></div>
    <div class="site04-metrics">SECTOR NASA LOLA 2,4 × 2,4 KM · 5 M/CELDA<br />{{ site.metrics.slopeBelowTenPercent }}% &lt; 10° · MEDIANA {{ site.metrics.medianSlopeDegrees }}°</div>
    <div class="site04-map-note">{{ layer === 'image' ? 'Fotografía orbital LROC NAC · USGS/NASA Moon Trek. La sombra superpuesta cambia con el Sol simulado y el DEM; las sombras originales de la foto permanecen. No se conocen obstáculos fuera del recorte.' : 'Calculado por KYNEX a partir del DEM LOLA.' }} X: −5000…−2605 m; Y: −11600…−13995 m. Material 3D gris provisional. No usar para navegación.</div>
  </div>
</template>
