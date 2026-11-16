<script setup>
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { LunarScene } from './world/LunarScene.js'
import { createSite04Terrain } from './world/Site04Terrain.js'
import PolarMap from './components/PolarMap.vue'
import MoonGlobe from './components/MoonGlobe.vue'
import { solarState } from './world/SolarSystem.js'
import { earthState } from './world/EarthSystem.js'
import EarthTelemetry from './components/EarthTelemetry.vue'
import OrbitalDiagram from './components/OrbitalDiagram.vue'
import ThermalTelemetry from './components/ThermalTelemetry.vue'
import RadiationTelemetry from './components/RadiationTelemetry.vue'
import LunarMissionHUD from './components/LunarMissionHUD.vue'
import SurvivalHUD from './components/SurvivalHUD.vue'
import { createSurvivalState, restoreSurvivalState, saveSurvivalState, clearSurvivalState, startSurvival, recordSurvivalAction, advanceSurvival } from './world/SurvivalMission.js'
import KynexDiscoveries from './components/KynexDiscoveries.vue'
import BaseInfoPanel from './components/BaseInfoPanel.vue'
import ECLSSTelemetry from './components/ECLSSTelemetry.vue'
import ECLSSControlPanel from './components/ECLSSControlPanel.vue'
import LaboratoryPanel from './components/laboratory/LaboratoryPanel.vue'
import MissionGuide from './components/MissionGuide.vue'
import MarsExperience from './components/MarsExperience.vue'
import { DATA_PROVENANCE } from './world/DataProvenance.js'
import { inspectDem } from './world/Site04Inspection.js'
import { restoreExploration, saveExploration, clearExploration, recordExplorationAction, updateExploration } from './world/LunarExplorationMissions.js'

const viewport = ref(null)
const running = ref(false)
const started = ref(false)
const selectedWorld = ref('moon')
const marsLoaded = ref(false)
const marsOpen = ref(false)
function openMars() {
  lunarScene?.releaseControls()
  lunarScene?.setSolarSpeed('pause')
  marsLoaded.value = true
  marsOpen.value = true
}
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
const sampleLabTab = ref('catalog')
const loadingSite = ref(true)
const siteLoadError = ref('')
const infoMenuOpen = ref(false)
const guideOpen = ref(false)
const missionPanelOpen = ref(false)
const missionMode = ref((() => { try { return localStorage.getItem('kynex-lunar-mode') === 'survival' ? 'survival' : 'exploration' } catch { return 'exploration' } })())
const survival = reactive(missionMode.value === 'survival' ? restoreSurvivalState() : restoreExploration())
function saveCurrentMission() { (missionMode.value === 'survival' ? saveSurvivalState : saveExploration)(survival) }
function selectMoonMode(mode) {
  if (mode === missionMode.value) return
  if (lunarScene && sceneReady) persistExploration()
  try { localStorage.setItem('kynex-lunar-mode', mode) } catch { return }
  window.location.reload()
}
const missionNotice = ref('')
const discoveriesRef = ref(null)
const discoveryPanelOpen = ref(false)
const activeInfoSection = ref('mission')
let lunarScene
let sceneReady = false
let interactionNoticeTimer
let missionNoticeTimer

function announceMission(message) {
  missionNotice.value = message
  clearTimeout(missionNoticeTimer)
  missionNoticeTimer = setTimeout(() => { missionNotice.value = '' }, 5500)

}
function persistExploration() {
  survival.world = lunarScene?.serializeMissionWorld() ?? survival.world
  saveCurrentMission()
}
function checkMission(deltaHours = 0, snapshot = base) {
  if (!started.value) return
  if (missionMode.value === 'survival') {
    if (survival.incident === 'active' && eclssControlOpen.value) recordSurvivalAction(survival,'incident-panel')
    for (const event of advanceSurvival(survival, deltaHours, snapshot)) {
      if (event.type === 'incident:detected') { lunarScene?.setIncidentLoad(true); announceMission('Consumo anormal del equipo científico. Revísalo en control ambiental.') }
      if (event.type === 'incident:resolved') { lunarScene?.setIncidentLoad(false); announceMission('Consumo estabilizado.') }
      if (event.type === 'mission:failed') { lunarScene?.setSolarSpeed('pause'); lunarScene?.releaseControls() }
    }
    persistExploration()
    return
  }
  const completed = updateExploration(survival, base)
  if (completed) announceMission(`✓ Misión 0${completed.index + 1}: ${completed.result}`)
  persistExploration()
}
function recordAction(action) {
  if (missionMode.value === 'survival') {
    const changed=recordSurvivalAction(survival, action, { zone: base.zone, eclss: base.eclss })
    if (changed && ['confirm-initial','confirm-power'].includes(action)) {
      survival.checkpoint={elapsedHours:survival.elapsedHours,checks:{...survival.checks},incident:survival.incident,world:lunarScene?.serializeMissionWorld()}
      missionPanelOpen.value = false; resumeExploration()
    }
    if (survival.status === 'won') { lunarScene?.setSolarSpeed('pause'); lunarScene?.releaseControls() }
    persistExploration()
    return
  }
  recordExplorationAction(survival, action)
  checkMission()
}
function retryCheckpoint() {
  const checkpoint=survival.checkpoint
  if(!checkpoint || missionMode.value!=='survival')return
  Object.assign(survival,createSurvivalState(),{status:'active',elapsedHours:checkpoint.elapsedHours,checks:{...checkpoint.checks},incident:checkpoint.incident,world:checkpoint.world,checkpoint})
  saveCurrentMission();window.location.reload()
}

async function begin() {
  if (selectedWorld.value !== 'moon' || loadingSite.value || !lunarScene) return
  siteLoadError.value = ''
  siteTerrain.value = lunarScene?.siteTerrain ?? null
  thermalSystem.value = lunarScene?.thermal ?? null
  radiationSystem.value = lunarScene?.radiation ?? null
  started.value = true
  infoMenuOpen.value = false
  if (survival.status === 'ready') {
    if (missionMode.value === 'survival') { startSurvival(survival); announceMission('Mantén la base habitable durante 24 horas simuladas. El laboratorio es opcional.') }
    else { survival.status = 'active'; announceMission('Tu primera misión: abre la consola y prepara el aire de tu refugio.') }
  }
  if (survival.status === 'failed' || (survival.status === 'won' && missionMode.value === 'survival')) { missionPanelOpen.value = true; return }
  lunarScene?.startMission()
  saveCurrentMission()
  lunarScene?.start()
}
function closeGuide() {
  guideOpen.value = false
  infoMenuOpen.value = false
  lunarScene?.setSolarSpeed('mission')
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
  missionPanelOpen.value = false
  discoveriesRef.value?.closePanel()
  survival.world = lunarScene?.serializeMissionWorld() ?? survival.world
  saveCurrentMission()
  started.value = false
}
function restartSimulation() {
  lunarScene?.releaseControls()
  ;(missionMode.value === 'survival' ? clearSurvivalState : clearExploration)()
  window.location.reload()
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
  if (started.value && !guideOpen.value && !infoMenuOpen.value && !baseInfo.value && !eclssControlOpen.value && !sampleLabOpen.value && !missionPanelOpen.value && !discoveryPanelOpen.value) lunarScene?.start()
}
function setMissionPanelOpen(value) {
  missionPanelOpen.value = value
  if (value) lunarScene?.releaseControls()
  else resumeExploration()
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
function laboratoryAction(event) {
  lunarScene?.laboratoryAction(event.action,event.payload)
  persistExploration()
}
function completeSampleAnalysis(minerals) {
  const result = lunarScene?.completeSampleAnalysis(minerals)
  if (result?.complete) closeSampleLab()
}
function toggleInfoSection(section) {
  activeInfoSection.value = activeInfoSection.value === section ? null : section
}
function handleMapPoint(point) { if (inspectDem(siteTerrain.value, point.x, point.z)) discoveriesRef.value?.discover('shadows') }
onMounted(async () => {
  document.addEventListener('keydown', handleBaseInfoKey)
  try {
    const terrain = await createSite04Terrain()
    siteTerrain.value = terrain
    lunarScene = new LunarScene(viewport.value, terrain, {
    onLockChange: (locked) => { running.value = locked },
    onControlMode: (mode) => { dragMode.value = mode === 'drag' },
    onTelemetry: (sample) => Object.assign(telemetry, sample),
    onJump: (event) => { if (event.type === 'landing' && siteTerrain.value?.slopeAt(telemetry.x, telemetry.z) < 10) discoveriesRef.value?.discover('gravity') },
    onSolarState: (sample) => Object.assign(solar, sample),
    onEarthState: (sample) => Object.assign(earth, sample),
    onThermalState: (sample) => Object.assign(thermal, sample),
    onRadiationState: (sample) => Object.assign(radiation, sample),
    onRadiationInspect: (sample) => { inspectedRadiation.value = sample },
    onBaseState: (sample) => { Object.assign(base, sample); if (sceneReady) { recordAction('zone'); checkMission() } },
    onBaseInfo: (info, id) => {
      baseInfo.value = info
      if (id === 'solar') recordAction('inspect-solar')
      if (id === 'battery') recordAction('inspect-battery')
      if (id === 'sampleRock') recordAction('inspect-eva-point')
      if (id === 'solar' || id === 'eclss') discoveriesRef.value?.discover(id)
    },
    onBaseInteraction: (result) => {
      if (result.discovery) discoveriesRef.value?.discover(result.discovery)
      if (result.control) discoveriesRef.value?.discover('eclss')
      if (result.control) { recordAction('control-opened'); recordAction('incident-panel') }
      if (result.sampleLab && !result.resourceTab) discoveriesRef.value?.discover('regolith')
    },
    onMissionTick: (hours,snapshot) => checkMission(hours,snapshot),
    onBaseMessage: (message) => {
      interactionNotice.value = message
      window.clearTimeout(interactionNoticeTimer)
      interactionNoticeTimer = window.setTimeout(() => { interactionNotice.value = '' }, 2800)
    },
    onEclssControl: (open) => { eclssControlOpen.value = open; baseInfo.value = null },
    onSampleLab: (open,tab) => { sampleLabOpen.value = open; sampleLabTab.value = tab ?? 'catalog' },
      onBoundary: () => {
        interactionNotice.value = 'Límite de la zona cartografiada con datos NASA'
        window.clearTimeout(interactionNoticeTimer)
        interactionNoticeTimer = window.setTimeout(() => { interactionNotice.value = '' }, 2800)
      },
    })
    await lunarScene.base.ready
    lunarScene.renderer.shadowMap.needsUpdate = true
    thermalSystem.value = lunarScene.thermal
    radiationSystem.value = lunarScene.radiation
    lunarScene.setTrainingMarkerVisible(false)
    if (survival.world) lunarScene.restoreMissionWorld(survival.world)
    sceneReady = true

  } catch (error) {
    siteLoadError.value = error instanceof Error ? error.message : 'No se pudo cargar el DEM Site04.'
  } finally { loadingSite.value = false }
})
function handleBaseInfoKey(event) {
  if (guideOpen.value) return
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)
    || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return
  if (event.code === 'KeyM' && started.value && !guideOpen.value && !baseInfo.value && !eclssControlOpen.value && !sampleLabOpen.value && !infoMenuOpen.value && !discoveryPanelOpen.value) {
    setMissionPanelOpen(!missionPanelOpen.value)
    event.preventDefault()
    return
  }
  if (event.code === 'KeyB' && started.value && !missionPanelOpen.value && !baseInfo.value && !eclssControlOpen.value && !sampleLabOpen.value && !infoMenuOpen.value) {
    discoveriesRef.value?.toggleLog(); lunarScene?.releaseControls(); event.preventDefault(); return
  }
  if (discoveryPanelOpen.value) {
    if (event.code === 'Escape' || event.code === 'KeyF' || event.code === 'KeyX') { discoveriesRef.value?.closePanel(); event.preventDefault() }
    return
  }
  if (missionPanelOpen.value) {
    if (event.code === 'Escape') { setMissionPanelOpen(false); event.preventDefault() }
    return
  }
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
    else if (discoveriesRef.value?.pending && !base.nearby) { discoveriesRef.value?.inspectPending(); lunarScene?.releaseControls() }
    else lunarScene?.inspectBaseInfo()
    event.preventDefault()
    return
  }
  if (event.code === 'KeyX') {
    if (baseInfo.value) closeBaseInfo()
    else closeEclssPanel()
  }
}
function controlEclss(event) {
  lunarScene?.controlEclss(event.action, event.value)
  if (['verify-oxygen','verify-pressure','verify-power'].includes(event.action)) recordAction(event.action)
  if (['verify-oxygen', 'verify-pressure', 'verify-power'].includes(event.action)) recordAction(event.action)
}
function closeEclssPanel() {
  eclssControlOpen.value = false
  lunarScene?.closeEclssControl()
  resumeExploration()
}
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleBaseInfoKey)
  window.clearTimeout(interactionNoticeTimer)
  window.clearTimeout(missionNoticeTimer)
  lunarScene?.dispose()
})
</script>

<template>
  <main v-show="!marsOpen" class="mission" :class="{ 'info-menu-open': infoMenuOpen }">
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
    <SurvivalHUD v-if="missionMode === 'survival'" :mission="survival" :base="base" :open="missionPanelOpen" :notice="missionNotice" @open-change="setMissionPanelOpen" @confirm="recordAction" @restart="restartSimulation" @retry="retryCheckpoint" />
    <LunarMissionHUD v-else :mission="survival" :base="base" :open="missionPanelOpen" :notice="missionNotice" @open-change="setMissionPanelOpen" @restart="restartSimulation" />
    <KynexDiscoveries v-if="siteTerrain" ref="discoveriesRef" :telemetry="telemetry" :base="base" @panel-change="discoveryPanelOpen = $event; if ($event) lunarScene?.releaseControls(); else resumeExploration()" />
    <div v-if="radiation.sepActive" class="sep-alert" role="status">◆ EVENTO SEP HIPOTÉTICO · TASA {{ radiation.total.toFixed(3) }} mSv/día</div>
    <div class="reticle" :class="{ hidden: !running }"><span /></div>
    <PolarMap :x="telemetry.x" :z="telemetry.z" :heading="telemetry.heading" :sun-azimuth="solar.azimuth" :sun-elevation="solar.elevation" :days="solar.days" :thermal-system="thermalSystem" :radiation-system="radiationSystem" :base-x="base.x ?? -45" :base-z="base.z ?? 220" :site-terrain="siteTerrain" @inspect-sector="lunarScene?.inspectRadiationSector($event.x, $event.z)" @inspect-point="handleMapPoint" />
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
            <p><b>RESOURCE LAB 01.</b> Desde el centro del hábitat, camina al extremo izquierdo: un pasillo interior conecta con el laboratorio. Mira un instrumento de cerca y pulsa E. Puedes consultar muestras Apollo, investigar recursos y guardar conclusiones; son actividades opcionales en ambos recorridos.</p>
            <p>Completa cuatro misiones cortas: prepara el refugio, recoge una roca, entrégala al laboratorio y revisa la energía. Acércate a los equipos y pulsa <kbd>E</kbd> para usarlos o <kbd>F</kbd> para inspeccionarlos.</p>
            <details class="info-details"><summary>Ver mi avance y los datos</summary>
              <div class="info-panel-stack">
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
            <p>La iluminación local y el Sol son un modelo educativo pendiente de validación astronómica para Site04. Durante la misión el reloj avanza a 72×; sus ángulos no son observaciones certificadas.</p>
            <details class="info-details"><summary>Ver la relación entre misión y Sol</summary>
              <div class="info-panel-stack">
                <p>Durante la misión, el reloj astronómico avanza junto con las 24 horas de operaciones a 72×. El ciclo solar lunar no se reinicia cada turno.</p>
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
    <ECLSSControlPanel v-if="eclssControlOpen && base.eclss" :system="base.eclss" @control="controlEclss" @close="closeEclssPanel" />
    <LaboratoryPanel v-if="sampleLabOpen && base.laboratory" :system="base.laboratory" :eclss="base.eclss" :sample-status="base.sampleMission?.status" :initial-tab="sampleLabTab" @close="closeSampleLab" @action="laboratoryAction" />
    <footer class="controls">
      <div><b>W A S D</b> caminar <span class="separator">/</span> <b>{{ dragMode ? 'ARRASTRAR' : 'RATÓN' }}</b> mirar <span class="separator">/</span> <b>ESPACIO</b> saltar <span class="separator">/</span> <b>E</b> usar base <span class="separator">/</span> <b>M</b> misiones</div>
      <div><b>ESC</b> pausar</div>
    </footer>
    <MissionGuide v-if="guideOpen" @close="closeGuide" @step-change="showGuideTopic" />
    <div v-if="!running && !eclssControlOpen && !sampleLabOpen && !infoMenuOpen && !baseInfo && !guideOpen && !missionPanelOpen && !discoveryPanelOpen && survival.status !== 'ready'" class="pause-overlay">
      <div class="pause-card">
        <div class="welcome-overline">MISIÓN EN PAUSA</div>
        <h2>¿Listo para continuar?</h2>
        <p>Tu exploración lunar te espera.</p>
        <button type="button" @click="begin">CONTINUAR EXPLORACIÓN <span>↗</span></button>
        <button type="button" class="pause-restart" @click="restartSimulation">REINICIAR MISIÓN <span>↺</span></button>
        <button type="button" class="pause-exit" @click="exitToWelcome">SALIR AL MENÚ PRINCIPAL <span>⌂</span></button>
      </div>
    </div>
    </template>
    <section v-else class="welcome-screen" :class="{ 'welcome-mars': selectedWorld === 'mars' }" aria-labelledby="welcome-title">
      <header class="welcome-header">
        <div class="welcome-brand"><span class="brand-mark">✦</span> KYNEX <span>/ {{ selectedWorld === 'moon' ? 'LUNAR LAB' : 'MARS LAB' }}</span></div>
        <div class="welcome-location"><span /> {{ selectedWorld === 'moon' ? 'POLO SUR LUNAR' : 'MARTE · ARCADIA PLANITIA' }}</div>
      </header>
      <div class="welcome-content">
        <div v-if="selectedWorld === 'moon'" class="moon-mode-selector" aria-label="Recorrido lunar"><button :aria-pressed="missionMode === 'exploration'" @click="selectMoonMode('exploration')">EXPLORACIÓN GUIADA</button><button :aria-pressed="missionMode === 'survival'" @click="selectMoonMode('survival')">SOBREVIVE 24 HORAS</button></div>
        <div class="welcome-overline">{{ selectedWorld === 'moon' ? (missionMode === 'survival' ? 'MISIÓN · SOBREVIVE 24 HORAS' : 'CUATRO MISIONES · TU PRIMERA EXPLORACIÓN LUNAR') : 'MISIÓN DE ENTRENAMIENTO · EXPLORACIÓN MARCIANA' }}</div>
        <h1 v-if="selectedWorld === 'moon'" id="welcome-title">La Luna<br /><em>te espera.</em></h1>
        <h1 v-else id="welcome-title">Marte<br /><em>te espera.</em></h1>
        <p v-if="selectedWorld === 'moon'">{{ missionMode === 'survival' ? 'Mantén el hábitat estable durante 24 horas simuladas. El laboratorio de recursos ofrece investigaciones opcionales sobre soporte vital, energía y blindaje.' : 'Prepara tu refugio, explora la superficie y recoge tu primera roca lunar. Cuatro misiones cortas te acompañan, paso a paso.' }}</p>
        <p v-if="selectedWorld === 'moon'" class="welcome-survival-conditions">EXPLORA · RECOLECTA · DESCUBRE</p>
        <p v-else>Explora Arcadia Planitia, descubre la base AP-1, recolecta muestras geológicas y conduce el rover. El laboratorio y las investigaciones de MARS FRONTIER te esperan.</p>
        <p v-if="selectedWorld === 'moon' && siteLoadError" class="site-load-error" role="alert">{{ siteLoadError }} Recarga la página para volver a intentarlo.</p>
        <button v-if="selectedWorld === 'moon'" type="button" class="welcome-start" :disabled="loadingSite || !!siteLoadError" @click="begin"><span class="welcome-start-label"><span class="welcome-start-symbol" aria-hidden="true">✦</span>{{ loadingSite ? 'CARGANDO DEM SITE04…' : survival.status === 'active' ? 'CONTINUAR MISIÓN' : survival.status === 'ready' ? 'INICIAR MISIÓN' : 'SEGUIR EXPLORANDO' }}</span><span class="welcome-start-arrow" aria-hidden="true">↗</span></button>
        <button v-else type="button" class="welcome-start" @click="openMars"><span class="welcome-start-label"><span class="welcome-start-symbol" aria-hidden="true">✦</span>{{ marsLoaded ? 'VOLVER A MARTE' : 'INICIAR MISIÓN' }}</span><span class="welcome-start-arrow" aria-hidden="true">↗</span></button>
        <div v-if="selectedWorld === 'moon'" class="welcome-tip"><kbd>W A S D</kbd> caminar <span>·</span> <kbd>RATÓN</kbd> mirar <span>·</span> <kbd>R</kbd> información</div>
      </div>
      <nav class="world-navigation" aria-label="Cambiar de mundo">
        <button type="button" class="world-arrow world-arrow-left" :disabled="selectedWorld === 'moon'" aria-label="Ir a la Luna" @click="selectedWorld = 'moon'"><span aria-hidden="true">←</span><small>LUNA</small></button>
        <button type="button" class="world-arrow world-arrow-right" :disabled="selectedWorld === 'mars'" aria-label="Ir a Marte" @click="selectedWorld = 'mars'"><small>MARTE</small><span aria-hidden="true">→</span></button>
      </nav>
      <div class="welcome-footer"><span>{{ selectedWorld === 'moon' ? 'SIMULACIÓN EDUCATIVA · SITE04 ES CANDIDATO, NO VALIDACIÓN' : 'MARS FRONTIER · SIMULACIÓN EDUCATIVA · ARCADIA PLANITIA' }}</span><span>DESCUBRE · APRENDE · EXPLORA</span></div>
    </section>
  </main>
  <MarsExperience v-if="marsLoaded" v-show="marsOpen" @menu="marsOpen = false" />
</template>

<style scoped>
.moon-mode-selector{display:flex;gap:7px;margin-bottom:18px;flex-wrap:wrap}.moon-mode-selector button{border:1px solid #b1dac56a;border-radius:7px;background:#07252566;padding:9px 11px;color:#d8eddf;font:10px monospace;cursor:pointer}.moon-mode-selector button[aria-pressed=true]{background:#b4e5c6;color:#0b2420}
.welcome-mars .welcome-start{border-color:#ffc18b;background:linear-gradient(120deg,rgba(226,116,52,.38),rgba(91,40,22,.42));color:#fff0e0;backdrop-filter:blur(22px) saturate(160%);-webkit-backdrop-filter:blur(22px) saturate(160%);box-shadow:inset 0 1px 1px #ffe7cb70,inset 0 0 25px #ffbd7c20,0 12px 36px #2a0d0960,0 0 24px #ee8b3726}
.welcome-mars .welcome-start::after{background:#ffc38c;box-shadow:0 0 12px #ffb16b}
.welcome-mars .welcome-start .welcome-start-symbol{color:#ffd0a2}
.welcome-mars .welcome-start .welcome-start-arrow{color:#ffe1bc;border-left-color:#ffd2aa65;background:#f6b37822}
.welcome-mars .welcome-start:hover{background:linear-gradient(120deg,rgba(245,146,67,.55),rgba(139,65,31,.48));box-shadow:inset 0 1px #fff1d98c,0 0 34px #ffad5040}
.welcome-mars .welcome-start:focus-visible{outline:2px solid #ffe2bf;outline-offset:5px}
</style>
