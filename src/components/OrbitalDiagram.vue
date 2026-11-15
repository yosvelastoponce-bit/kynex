<script setup>
import { computed } from 'vue'
import { earthOrbitPath, MOON_ORBIT_ENLARGEMENT, orbitalState } from '../world/OrbitalSystem.js'

const props = defineProps({ days: { type: Number, required: true } })
const state = computed(() => orbitalState(props.days))
const sun = { x: 91, y: 86 }
const orbitPixelsPerAu = 62
const screen = (point, scale = 1) => ({
  x: sun.x + point.x * orbitPixelsPerAu * scale,
  y: sun.y - point.y * orbitPixelsPerAu * scale,
})
const earth = computed(() => screen(state.value.earth))
const moon = computed(() => ({
  x: earth.value.x + state.value.moon.x * orbitPixelsPerAu * MOON_ORBIT_ENLARGEMENT,
  y: earth.value.y - state.value.moon.y * orbitPixelsPerAu * MOON_ORBIT_ENLARGEMENT,
}))
const earthOrbit = earthOrbitPath.map((p) => screen(p)).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
const dateLabel = computed(() => state.value.utc.slice(0, 16).replace('T', ' '))
</script>

<template>
  <aside class="orbital-diagram" aria-label="Diagrama orbital calculado del Sol, la Tierra y la Luna">
    <div class="orbital-heading"><span class="orbital-led" /> SISTEMA SOL · TIERRA · LUNA</div>
    <svg class="orbital-plot" viewBox="0 0 280 170" role="img" aria-label="Posiciones heliocéntricas calculadas y órbita lunar ampliada">
      <defs>
        <radialGradient id="diagram-sun"><stop stop-color="#fff6c8"/><stop offset=".55" stop-color="#f4bd63"/><stop offset="1" stop-color="#aa6928"/></radialGradient>
        <radialGradient id="diagram-earth" cx="30%" cy="28%"><stop stop-color="#d0f1f2"/><stop offset=".46" stop-color="#6ab8d6"/><stop offset="1" stop-color="#1d517c"/></radialGradient>
        <radialGradient id="diagram-moon" cx="35%" cy="25%"><stop stop-color="#f2f1e7"/><stop offset="1" stop-color="#8c938e"/></radialGradient>
      </defs>
      <path class="orbital-axis" d="M 18 86 H 170 M 91 12 V 158" />
      <polyline class="orbital-earth-path" :points="earthOrbit" />
      <circle :cx="earth.x" :cy="earth.y" r="11" class="orbital-moon-guide" />
      <line class="orbital-connector" :x1="earth.x" :y1="earth.y" :x2="moon.x" :y2="moon.y" />
      <circle :cx="sun.x" :cy="sun.y" r="10" class="orbital-sun-glow" />
      <circle :cx="sun.x" :cy="sun.y" r="5.5" fill="url(#diagram-sun)" />
      <circle :cx="earth.x" :cy="earth.y" r="5" fill="url(#diagram-earth)" stroke="#98d8ed" stroke-width=".5" />
      <circle :cx="moon.x" :cy="moon.y" r="2.8" fill="url(#diagram-moon)" stroke="#e8ede8" stroke-width=".4" />
      <g class="orbital-legend">
        <circle cx="188" cy="43" r="3" fill="#eabe70"/><text x="198" y="46">SOL</text>
        <circle cx="188" cy="66" r="3" fill="#85cce4"/><text x="198" y="69">TIERRA</text>
        <circle cx="188" cy="89" r="3" fill="#dbe1dc"/><text x="198" y="92">LUNA</text>
        <text x="184" y="124">LUNA ×{{ MOON_ORBIT_ENLARGEMENT }}</text>
        <text x="184" y="139">DIÁMETROS</text>
        <text x="184" y="152">NO A ESCALA</text>
      </g>
    </svg>
    <div class="orbital-readout"><span>{{ dateLabel }} UTC</span><span>{{ state.earthMoonDistanceKm.toFixed(0) }} km</span></div>
    <div class="orbital-note">EFEMÉRIDES CALCULADAS · VISTA ECLÍPTICA</div>
  </aside>
</template>
