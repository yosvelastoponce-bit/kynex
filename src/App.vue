<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { LunarScene } from './world/LunarScene.js'
import { createSite04Terrain } from './world/Site04Terrain.js'
import PolarMap from './components/PolarMap.vue'
import MoonGlobe from './components/MoonGlobe.vue'
import SolarControls from './components/SolarControls.vue'
import { solarState } from './world/SolarSystem.js'
import { earthState } from './world/EarthSystem.js'
import EarthTelemetry from './components/EarthTelemetry.vue'
import OrbitalDiagram from './components/OrbitalDiagram.vue'
import ThermalTelemetry from './components/ThermalTelemetry.vue'
import RadiationTelemetry from './components/RadiationTelemetry.vue'
import BaseMissionPanel from './components/BaseMissionPanel.vue'
import MissionTracker from './components/MissionTracker.vue'
import BaseInfoPanel from './components/BaseInfoPanel.vue'
import ECLSSTelemetry from './components/ECLSSTelemetry.vue'
import ECLSSControlPanel from './components/ECLSSControlPanel.vue'
import LunarSampleLab from './components/LunarSampleLab.vue'
import MissionGuide from './components/MissionGuide.vue'
import { DATA_PROVENANCE } from './world/DataProvenance.js'

const viewport = ref(null)
const running = ref(false)
const started = ref(false)
const dragMode = ref(false)
const telemetry = reactive({ x: 0, z: 0, heading: 0, altitude: 0, fps: 0 })
const solar = reactive(solarState(0))
const earth = reactive({ ...earthState(0, solarState(0)), visibility: 'CALCULANDO VISIBILIDAD' })
const thermal = reactive({ celsius: -161.15, kelvin: 112, illuminated: false, visibleFraction: 0, trendKelvinPerDay: 0, sinceChangeDays: 0, minimumCelsius: -161.15, maximumCelsius: -161.15 })
const thermalSystem = shallowRef(null)
const radiation = reactive({ total: 1.369, doseMsV: 0, gcr: 1.369, sep: 0,
  exposureDays: 0, sepDays: 0, skyView: 1, geometricShelter: 0, sepActive: false })
const radiationSystem = shallowRef(null)
const siteTerrain = shallowRef(null)
const inspectedRadiation = shallowRef(null)
const base = reactive({ distance: 0, nearby: null, zone: 'surface', message: '', airlock: null, mission: null })
const baseInfo = shallowRef(null)
const interactionNotice = ref('')
const eclssControlOpen = ref(false)
const sampleLabOpen = ref(false)
const loadingSite = ref(true)
const siteLoadError = ref('')
const infoMenuOpen = ref(false)
const guideOpen = ref(false)
const activeInfoSection = ref('mission')
const solarSpeed = ref('realtime')
let previousSolarSpeed = 'realtime'
let lunarScene
let interactionNoticeTimer

async function begin() {
  if (loadingSite.value || !lunarScene) return
  siteLoadError.value = ''
  siteTerrain.value = lunarScene?.siteTerrain ?? null
  thermalSystem.value = lunarScene?.thermal ?? null
  radiationSystem.value = lunarScene?.radiation ?? null
  const firstEntry = !started.value
  started.value = true
  infoMenuOpen.value = false
  if (firstEntry) {
    guideOpen.value = true
    lunarScene?.setSolarSpeed('pause')
    return
  }
  lunarScene?.setSolarSpeed(solarSpeed.value)
  lunarScene?.start()
}
function closeGuide() {
  guideOpen.value = false
  infoMenuOpen.value = false
  lunarScene?.setSolarSpeed(solarSpeed.value)
  resumeExploration()
}
function showGuideTopic(index) {
  const section = { 4: 'sun', 5: 'earth', 6: 'temperature', 7: 'radiation', 8: 'mission', 9: 'mission', 10: 'sources' }[index]
  infoMenuOpen.value = !!section
  if (section) activeInfoSection.value = section
}
function reopenGuide() {
  if (!started.value) return
  infoMenuOpen.value = false
  lunarScene?.releaseControls()
  lunarScene?.setSolarSpeed('pause')
  guideOpen.value = true
}
function exitToWelcome() {
  lunarScene?.releaseControls()
  lunarScene?.setSolarSpeed('pause')
  baseInfo.value = null
  eclssControlOpen.value = false
  sampleLabOpen.value = false
  infoMenuOpen.value = false
  guideOpen.value = false
  started.value = false
}
function toggleInfoMenu() {
  if (!started.value || guideOpen.value || eclssControlOpen.value || sampleLabOpen.value || baseInfo.value) return
  if (infoMenuOpen.value) {
    infoMenuOpen.value = false
    resumeExploration()
    return
  }
  infoMenuOpen.value = true
  lunarScene?.releaseControls()
}
function resumeExploration() {
  if (started.value && !guideOpen.value && !infoMenuOpen.value && !baseInfo.value && !eclssControlOpen.value && !sampleLabOpen.value) lunarScene?.start()
}
function closeBaseInfo() {
  baseInfo.value = null
  resumeExploration()
}
function closeSampleLab() {
  sampleLabOpen.value = false
  lunarScene?.closeSampleLab()
  resumeExploration()
}
function completeSampleAnalysis(minerals) {
  const result = lunarScene?.completeSampleAnalysis(minerals)
  if (result?.complete) closeSampleLab()
}
function toggleInfoSection(section) {
  activeInfoSection.value = activeInfoSection.value === section ? null : section
}
function setSolarSpeed(speed) {
  solarSpeed.value = speed
  if (speed !== 'pause') previousSolarSpeed = speed
  lunarScene?.setSolarSpeed(speed)
}
function toggleSolarTime() { setSolarSpeed(solarSpeed.value === 'pause' ? previousSolarSpeed : 'pause') }
onMounted(async () => {
  document.addEventListener('keydown', handleBaseInfoKey)
  try {
    const terrain = await createSite04Terrain()
    siteTerrain.value = terrain
    lunarScene = new LunarScene(viewport.value, terrain, {
    onLockChange: (locked) => { running.value = locked },
    onControlMode: (mode) => { dragMode.value = mode === 'drag' },
    onTelemetry: (sample) => Object.assign(telemetry, sample),
    onSolarState: (sample) => Object.assign(solar, sample),
    onEarthState: (sample) => Object.assign(earth, sample),
    onThermalState: (sample) => Object.assign(thermal, sample),
    onRadiationState: (sample) => Object.assign(radiation, sample),
    onRadiationInspect: (sample) => { inspectedRadiation.value = sample },
    onBaseState: (sample) => Object.assign(base, sample),
    onBaseInfo: (info) => { baseInfo.value = info },
    onBaseMessage: (message) => {
      interactionNotice.value = message
      window.clearTimeout(interactionNoticeTimer)
      interactionNoticeTimer = window.setTimeout(() => { interactionNotice.value = '' }, 2800)
    },
    onEclssControl: (open) => { eclssControlOpen.value = open; baseInfo.value = null },
    onSampleLab: (open) => { sampleLabOpen.value = open },
      onBoundary: () => {
        interactionNotice.value = 'Límite de la zona cartografiada con datos NASA'
        window.clearTimeout(interactionNoticeTimer)
        interactionNoticeTimer = window.setTimeout(() => { interactionNotice.value = '' }, 2800)
      },
    })
    thermalSystem.value = lunarScene.thermal
    radiationSystem.value = lunarScene.radiation
  } catch (error) {
    siteLoadError.value = error instanceof Error ? error.message : 'No se pudo cargar el DEM Site04.'
  } finally { loadingSite.value = false }
})
function handleBaseInfoKey(event) {
  if (guideOpen.value) return
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)
    || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
  if (sampleLabOpen.value) {
    if (event.code === 'Escape' || event.code === 'KeyX') {
      closeSampleLab()
      event.preventDefault()
    }
    return
  }
  if (event.code === 'Escape' && started.value && running.value
    && !eclssControlOpen.value && !baseInfo.value && !infoMenuOpen.value) {
    lunarScene?.setSolarSpeed('pause')
    return
  }
  if (event.code === 'KeyR' && started.value && !eclssControlOpen.value && !baseInfo.value) {
    toggleInfoMenu()
    event.preventDefault()
    return
  }
  if (event.code === 'KeyF' && started.value && !eclssControlOpen.value && !infoMenuOpen.value) {
    if (baseInfo.value) closeBaseInfo()
    else lunarScene?.inspectBaseInfo()
    event.preventDefault()
    return
  }
  if (event.code === 'KeyX') {
    if (baseInfo.value) closeBaseInfo()
    else closeEclssPanel()
  }
}
function controlEclss(event) { lunarScene?.controlEclss(event.action, event.value) }
function closeEclssPanel() {
  eclssControlOpen.value = false
  lunarScene?.closeEclssControl()
  resumeExploration()
}
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleBaseInfoKey)
  window.clearTimeout(interactionNoticeTimer)
  lunarScene?.dispose()
})
</script>

<template>
  <main class="mission" :class="{ 'info-menu-open': infoMenuOpen }">
    <div ref="viewport" class="viewport" aria-label="Paisaje lunar tridimensional" />
    <template v-if="started">
    <header class="topbar">
      <div class="brand"><span class="brand-mark">✦</span> KYNEX <span class="brand-sub">/ LUNAR LAB</span></div>
      <div class="phase"><span class="phase-dot" /> SHACKLETON RIM / SITE04 · NASA LRO-LOLA</div>
      <div class="top-right">
        <span class="live">EXPLORACIÓN EN VIVO</span>
        <button type="button" class="info-menu-toggle" :aria-expanded="infoMenuOpen" :aria-label="infoMenuOpen ? 'Cerrar información (R)' : 'Abrir información (R)'" aria-controls="mission-info" @click="toggleInfoMenu">
          <span aria-hidden="true">{{ infoMenuOpen ? '×' : '☰' }}</span>
          {{ infoMenuOpen ? 'Cerrar' : 'Información' }} <kbd>R</kbd>
        </button>
      </div>
    </header>
    <MissionTracker :base="base" :telemetry="telemetry" />
    <div v-if="radiation.sepActive" class="sep-alert" role="status">◆ EVENTO SEP HIPOTÉTICO · TASA {{ radiation.total.toFixed(3) }} mSv/día</div>
    <div class="reticle" :class="{ hidden: !running }"><span /></div>
    <PolarMap :x="telemetry.x" :z="telemetry.z" :heading="telemetry.heading" :sun-azimuth="solar.azimuth" :sun-elevation="solar.elevation" :days="solar.days" :thermal-system="thermalSystem" :radiation-system="radiationSystem" :base-x="base.x ?? -45" :base-z="base.z ?? 220" :site-terrain="siteTerrain" @inspect-sector="lunarScene?.inspectRadiationSector($event.x, $event.z)" />
    <aside v-if="infoMenuOpen" id="mission-info" class="info-drawer" aria-label="Información de la exploración">
      <header class="info-drawer-header">
        <div><span class="info-eyebrow">CENTRO DE EXPLORACIÓN</span><h2>¿Qué quieres descubrir?</h2></div>
        <button type="button" aria-label="Cerrar información" @click="infoMenuOpen = false">×</button>
      </header>
      <nav class="info-accordion" aria-label="Temas de la misión">
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'mission'" aria-controls="info-mission" @click="toggleInfoSection('mission')">
            <span class="info-section-icon" aria-hidden="true">01</span><span>Mi misión y la base</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'mission' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'mission'" id="info-mission" class="info-section-content">
            <p>Explora KYNEX Lunar Outpost 01, infraestructura simulada para entrenamiento sobre relieve NASA Site04. Acércate a sus equipos y pulsa <kbd>E</kbd> para usarlos o <kbd>F</kbd> para leer su información.</p>
            <details class="info-details"><summary>Ver mi avance y los datos</summary>
              <div class="info-panel-stack">
                <BaseMissionPanel :base="base" />
                <ECLSSTelemetry v-if="base.eclss" :system="base.eclss" :zone="base.zone" />
              </div>
            </details>
          </div>
        </section>
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'position'" aria-controls="info-position" @click="toggleInfoSection('position')">
            <span class="info-section-icon" aria-hidden="true">02</span><span>Mi posición en la Luna</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'position' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'position'" id="info-position" class="info-section-content">
            <p>El relieve usa un recorte exacto del DEM NASA LOLA de 5 m/celda. En el mapa puedes ver fotografía orbital LROC NAC del mismo sector, además de elevación y pendiente. La imagen incluye sombras de sus capturas; el suelo gris 3D sigue siendo un material provisional. La base y sus marcadores son simulados.</p>
            <details class="info-details"><summary>Ver posición y la Luna</summary>
              <div class="info-panel-stack">
                <aside class="telemetry info-telemetry" aria-label="Posición actual del astronauta">
                  <div class="kicker">DÓNDE ESTÁS</div>
                  <div class="telemetry-row"><span>ESTE / OESTE</span><strong>{{ telemetry.x.toFixed(1) }} <small>m</small></strong></div>
                  <div class="telemetry-row"><span>NORTE / SUR</span><strong>{{ telemetry.z.toFixed(1) }} <small>m</small></strong></div>
                  <div class="telemetry-row"><span>ALTURA</span><strong>{{ telemetry.altitude.toFixed(1) }} <small>m</small></strong></div>
                  <div class="telemetry-row"><span>RENDIMIENTO</span><strong>{{ telemetry.fps }} <small>FPS</small></strong></div>
                </aside>
                <div class="info-globe"><MoonGlobe :sun-direction="solar.direction" /></div>
              </div>
            </details>
          </div>
        </section>
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'sun'" aria-controls="info-sun" @click="toggleInfoSection('sun')">
            <span class="info-section-icon" aria-hidden="true">03</span><span>El Sol y el paso del tiempo</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'sun' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'sun'" id="info-sun" class="info-section-content">
            <p>La iluminación local y el Sol son un modelo educativo pendiente de validación astronómica para Site04. Cambia la velocidad del reloj para explorar escenarios de luz; sus ángulos no son observaciones certificadas.</p>
            <details class="info-details"><summary>Ver el reloj y cambiar el tiempo</summary>
              <div class="info-panel-stack">
                <SolarControls :days="solar.days" :azimuth="solar.azimuth" :elevation="solar.elevation" :above-horizon="solar.aboveHorizon" :speed="solarSpeed" @speed-change="setSolarSpeed" @toggle-time="toggleSolarTime" @reset-time="lunarScene?.resetSolarTime()" />
              </div>
            </details>
          </div>
        </section>
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'temperature'" aria-controls="info-temperature" @click="toggleInfoSection('temperature')">
            <span class="info-section-icon" aria-hidden="true">04</span><span>¿Qué tan fría está la Luna?</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'temperature' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'temperature'" id="info-temperature" class="info-section-content">
            <p>Temperatura observada no disponible para este lugar e instante. Diviner mide emisión térmica desde la órbita; los valores siguientes son una simulación educativa separada.</p>
            <details class="info-details"><summary>Ver temperatura y cambios</summary>
              <div class="info-panel-stack"><ThermalTelemetry :thermal="thermal" /></div>
            </details>
          </div>
        </section>
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'radiation'" aria-controls="info-radiation" @click="toggleInfoSection('radiation')">
            <span class="info-section-icon" aria-hidden="true">05</span><span>Radiación del espacio</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'radiation' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'radiation'" id="info-radiation" class="info-section-content">
            <p>Dosis observada local no disponible. CRaTER mide el entorno de radiación en órbita lunar; el dosímetro siguiente es un modelo educativo, no una medición en Shackleton.</p>
            <details class="info-details"><summary>Ver el dosímetro y probar un escenario</summary>
              <div class="info-panel-stack"><RadiationTelemetry :radiation="radiation" :inspected="inspectedRadiation" @start-scenario="lunarScene?.startRadiationScenario($event)" @end-scenario="lunarScene?.endRadiationScenario()" /></div>
            </details>
          </div>
        </section>
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'earth'" aria-controls="info-earth" @click="toggleInfoSection('earth')">
            <span class="info-section-icon" aria-hidden="true">06</span><span>La Tierra y sus órbitas</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'earth' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'earth'" id="info-earth" class="info-section-content">
            <p>La posición aparente y fase de la Tierra son ilustrativas y pendientes de validación con efemérides, libración y horizonte local del Site04.</p>
            <details class="info-details"><summary>Ver datos de la Tierra</summary>
              <div class="info-panel-stack">
                <EarthTelemetry :earth="earth" />
                <OrbitalDiagram :days="solar.days" />
              </div>
            </details>
          </div>
        </section>
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'controls'" aria-controls="info-controls" @click="toggleInfoSection('controls')">
            <span class="info-section-icon" aria-hidden="true">07</span><span>Más controles del juego</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'controls' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'controls'" id="info-controls" class="info-section-content">
            <p>También puedes usar estas teclas durante la exploración:</p>
            <ul class="info-key-list">
              <li><kbd>R</kbd> abrir o cerrar información; la misión sigue avanzando</li>
              <li><kbd>F</kbd> leer o cerrar la ficha de un objeto cercano</li>
              <li>En el mapa puedes alternar entre imagen LROC, elevación y pendiente del DEM.</li>
              <li><kbd>Q</kbd> inspeccionar el suelo en el modelo educativo de radiación</li>
            </ul>
            <button type="button" class="guide-reopen" @click="reopenGuide">VOLVER A VER LA GUÍA ↗</button>
          </div>
        </section>
        <section>
          <button type="button" class="info-section-button" :aria-expanded="activeInfoSection === 'sources'" aria-controls="info-sources" @click="toggleInfoSection('sources')">
            <span class="info-section-icon" aria-hidden="true">08</span><span>Fuentes y metodología</span><span class="info-chevron" aria-hidden="true">{{ activeInfoSection === 'sources' ? '−' : '+' }}</span>
          </button>
          <div v-if="activeInfoSection === 'sources'" id="info-sources" class="info-section-content">
            <p>OBSERVED: raster instrumental. DERIVED: cálculo KYNEX desde el DEM. MODELLED: estimación educativa. SCENARIO: infraestructura ficticia. UNAVAILABLE: medición no integrada.</p>
            <ul><li v-for="(record, key) in DATA_PROVENANCE" :key="key"><b>{{ record.name }} · {{ record.status }}</b><br />{{ record.source }} · {{ record.instrument }}<br />{{ record.location }}<template v-if="record.resolution"> · {{ record.resolution }}</template></li></ul>
            <p>El archivo de método y límites está en KYNEX-DATOS-REALES-NASA.md.</p>
          </div>
        </section>
      </nav>
    </aside>
    <div v-if="base.nearby && !baseInfo && !eclssControlOpen && !sampleLabOpen && !infoMenuOpen && !guideOpen" class="interaction-hint" role="status">
      <span><kbd>E</kbd> USAR</span><span><kbd>F</kbd> INFORMACIÓN</span><span>{{ base.nearby.label }}</span>
    </div>
    <div v-if="interactionNotice && !baseInfo && !eclssControlOpen && !sampleLabOpen" class="interaction-toast" role="status">{{ interactionNotice }}</div>
    <BaseInfoPanel v-if="baseInfo" :info="baseInfo" @close="closeBaseInfo" />
    <ECLSSControlPanel v-if="eclssControlOpen && base.eclss" :system="base.eclss" :mission="base.mission02" @control="controlEclss" @close="closeEclssPanel" />
    <LunarSampleLab v-if="sampleLabOpen" @close="closeSampleLab" @complete="completeSampleAnalysis" />
    <footer class="controls">
      <div><b>W A S D</b> caminar <span class="separator">/</span> <b>{{ dragMode ? 'ARRASTRAR' : 'RATÓN' }}</b> mirar <span class="separator">/</span> <b>ESPACIO</b> saltar <span class="separator">/</span> <b>E</b> usar base</div>
      <div><b>ESC</b> pausar</div>
    </footer>
    <MissionGuide v-if="guideOpen" @close="closeGuide" @step-change="showGuideTopic" />
    <div v-if="!running && !eclssControlOpen && !sampleLabOpen && !infoMenuOpen && !baseInfo && !guideOpen" class="pause-overlay">
      <div class="pause-card">
        <div class="welcome-overline">MISIÓN EN PAUSA</div>
        <h2>¿Listo para continuar?</h2>
        <p>Tu exploración lunar te espera.</p>
        <button type="button" @click="begin">CONTINUAR EXPLORACIÓN <span>↗</span></button>
        <button type="button" class="pause-exit" @click="exitToWelcome">SALIR AL MENÚ PRINCIPAL <span>⌂</span></button>
      </div>
    </div>
    </template>
    <section v-else class="welcome-screen" aria-labelledby="welcome-title">
      <header class="welcome-header">
        <div class="welcome-brand"><span class="brand-mark">✦</span> KYNEX <span>/ LUNAR LAB</span></div>
        <div class="welcome-location"><span /> POLO SUR LUNAR</div>
      </header>
      <div class="welcome-content">
        <div class="welcome-overline">MISIÓN DE ENTRENAMIENTO · EXPLORACIÓN LUNAR</div>
        <h1 id="welcome-title">La Luna<br /><em>te espera.</em></h1>
        <p>Explora una región del polo sur lunar reconstruida con datos topográficos de NASA. La base KYNEX y los sistemas ambientales son simulaciones educativas.</p>
        <p v-if="siteLoadError" class="site-load-error" role="alert">{{ siteLoadError }} Recarga la página para volver a intentarlo.</p>
        <button type="button" class="welcome-start" :disabled="loadingSite || !!siteLoadError" @click="begin"><span class="welcome-start-label"><span class="welcome-start-symbol" aria-hidden="true">✦</span>{{ loadingSite ? 'CARGANDO DEM SITE04…' : 'INICIAR MISIÓN' }}</span><span class="welcome-start-arrow" aria-hidden="true">↗</span></button>
        <div class="welcome-tip"><kbd>W A S D</kbd> caminar <span>·</span> <kbd>RATÓN</kbd> mirar <span>·</span> <kbd>R</kbd> información</div>
      </div>
      <div class="welcome-footer"><span>SIMULACIÓN EDUCATIVA · SITE04 ES CANDIDATO, NO VALIDACIÓN</span><span>DESCUBRE · APRENDE · EXPLORA</span></div>
    </section>
  </main>
</template>
