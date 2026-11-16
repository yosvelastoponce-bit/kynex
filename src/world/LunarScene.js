import * as THREE from 'three'
import { createLighting } from './Lighting.js'
import { PlayerController } from '../player/PlayerController.js'
import { solarState } from './SolarSystem.js'
import { SimulationClock } from './SimulationClock.js'
import { createSunVisual } from './SunVisual.js'
import { earthState } from './EarthSystem.js'
import { createEarthVisual } from './EarthVisual.js'
import { earthVisibility } from './EarthVisibility.js'
import { ThermalSystem } from './ThermalSystem.js'
import { RadiationSystem } from './RadiationSystem.js'
import { LunarBaseSystem } from './LunarBaseSystem.js'
import { createStars } from './StarField.js'
import { SITE04_OUTPOST } from './BasePlacement.js'

export class LunarScene {
  constructor(container, terrain, { onLockChange, onControlMode, onTelemetry, onSolarState, onEarthState, onThermalState, onRadiationState, onRadiationInspect, onBaseState, onBaseInfo, onBaseMessage, onBaseInteraction, onEclssControl, onSampleLab, onBoundary, onJump, onMissionTick }) {
    this.container = container
    this.onTelemetry = onTelemetry
    this.onSolarState = onSolarState
    this.onEarthState = onEarthState
    this.onThermalState = onThermalState
    this.onRadiationState = onRadiationState
    this.onRadiationInspect = onRadiationInspect
    this.onBaseState = onBaseState
    this.onBaseInfo = onBaseInfo
    this.onBaseMessage = onBaseMessage
    this.onBaseInteraction = onBaseInteraction
    this.onMissionTick = onMissionTick
    this.missionActive = false
    this.onEclssControl = onEclssControl
    this.onSampleLab = onSampleLab
    this.onBoundary = onBoundary
    this.siteTerrain = terrain
    this.scene = new THREE.Scene()
    const targetOptions = [[0, 11], [2, 10], [-2, 10]]
    const [markerX, markerZ] = targetOptions.find(([x, z]) => terrain.slopeAt(x, z) < 10) ?? targetOptions[0]
    this.trainingTarget = { x: markerX, z: markerZ }
    const marker = new THREE.Group()
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.045, 6, 36),
      new THREE.MeshBasicMaterial({ color: 0x9df0c6 }))
    ring.rotation.x = Math.PI / 2
    ring.position.y = 0.12
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6),
      new THREE.MeshBasicMaterial({ color: 0x9df0c6 }))
    mast.position.y = 0.9
    marker.add(ring, mast)
    marker.position.set(markerX, terrain.heightAt(markerX, markerZ), markerZ)
    this.trainingMarker = marker
    this.scene.add(marker)
    this.controlPanelOpen = false
    this.sampleLabOpen = false
    this.scene.background = new THREE.Color(0x030609)
    this.camera = new THREE.PerspectiveCamera(74, 1, 0.05, 16_000)
    this.scene.add(this.camera)
    this.sampleCarrier = new THREE.Group()
    const sampleBox = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.1, 0.17),
      new THREE.MeshStandardMaterial({ color: 0x879a91, roughness: 0.45, metalness: 0.22 }))
    const carriedRock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.075, 1),
      new THREE.MeshStandardMaterial({ color: 0xc3b692, roughness: 0.95, flatShading: true }))
    carriedRock.position.set(0, 0.065, 0)
    this.sampleCarrier.add(sampleBox, carriedRock)
    this.sampleCarrier.position.set(0.39, -0.32, -0.7)
    this.sampleCarrier.visible = false
    this.camera.add(this.sampleCarrier)
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.55
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.renderer.domElement)

    this.terrain = terrain
    this.stars = createStars()
    this.scene.add(this.terrain.mesh, this.stars.points)
    this.lighting = createLighting(this.scene, terrain.heightAt)
    this.base = new LunarBaseSystem(this.scene, {
      sampleHeight: terrain.heightAt, origin: SITE04_OUTPOST, bounds: terrain.bounds,
    })
    this.clock = new SimulationClock()
    this.clock.setRate('pause')
    this.thermal = new ThermalSystem({ sampleHeight: terrain.heightAt })
    this.surfaceTemperatureC = this.thermal.telemetryAt(this.camera.position.x, this.camera.position.z, this.clock.days).celsius
    this.radiation = new RadiationSystem({ sampleHeight: terrain.heightAt })
    this.sunVisual = createSunVisual(this.scene)
    this.solar = solarState(this.clock.days)
    this.earthVisual = createEarthVisual(this.scene)
    this.earth = earthState(this.clock.days, this.solar)
    this.onSolarState(this.solar)
    this.controller = new PlayerController(this.camera, this.renderer.domElement, onLockChange, onControlMode, this.base, onBoundary, onJump)
    this.controller.setStartPosition(0, 0, (x, z) => this.base.groundHeightAt(x, z), 0)
    this.onBaseState(this.base.snapshot(this.camera.position))
    this.onEarthState({ ...this.earth, visibility: earthVisibility(this.camera.position, this.earth, terrain.heightAt, terrain.bounds) })
    this.onThermalState(this.thermal.telemetryAt(this.camera.position.x, this.camera.position.z, this.clock.days))
    this.onRadiationState(this.radiation.telemetry(this.clock.days, this.camera.position.x, this.camera.position.z))
    this.raycaster = new THREE.Raycaster()
    this.handleRadiationKey = (event) => {
      if (event.code !== 'KeyQ' || event.repeat || event.altKey || event.ctrlKey || event.metaKey
        || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)) return
      this.inspectGround()
      event.preventDefault()
    }
    document.addEventListener('keydown', this.handleRadiationKey)
    this.handleBaseKey = (event) => {
      if (this.controlPanelOpen || this.sampleLabOpen || event.code !== 'KeyE' || event.repeat || event.altKey || event.ctrlKey || event.metaKey
        || ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target?.tagName)) return
      const direction = this.camera.getWorldDirection(new THREE.Vector3())
      const result = this.base.interact(this.camera.position, direction)
      this.onBaseMessage?.(result.message)
      this.onBaseInteraction?.(result)
      if (result.control) {
        this.controlPanelOpen = true
        this.releaseControls()
        this.onEclssControl(true)
      }
      if (result.sampleLab) {
        this.sampleLabOpen = true
        this.releaseControls()
        this.onSampleLab(true, result.resourceTab ?? 'register')
      }
      this.onBaseState(this.base.snapshot(this.camera.position, direction))
      event.preventDefault()
    }
    document.addEventListener('keydown', this.handleBaseKey)
    this.handleCanvasClick = () => { if (!this.controlPanelOpen && !this.sampleLabOpen && !this.controller.locked && !this.controller.fallback) this.start() }
    this.renderer.domElement.addEventListener('click', this.handleCanvasClick)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.lastTime = performance.now()
    this.lastSample = this.lastTime
    this.lastSolarSample = this.lastTime
    this.lastEarthSample = this.lastTime
    this.lastRadiationSample = this.lastTime
    this.frames = 0
    this.missionHoursBuffer = 0
    this.frame = this.frame.bind(this)
    this.frameId = requestAnimationFrame(this.frame)
  }

  start() { this.controller.start() }
  setTrainingMarkerVisible(visible) { this.trainingMarker.visible = visible }
  releaseControls() { this.controller.release() }
  setSolarSpeed(key) { this.clock.setRate(this.missionActive && key !== 'pause' ? 'mission' : key) }
  startMission() { this.missionActive = true; this.clock.setRate('mission') }
  setIncidentLoad(active) {
    this.base.eclss.setScienceFault(active ? 1600 : 0)
    if (active) this.base.eclss.setDevice('science', true)
    this.onBaseState(this.base.snapshot(this.camera.position))
  }
  serializeMissionWorld() {
    return { clockDays: this.clock.days, eclss: this.base.eclss.serialize(),
      laboratory: this.base.laboratory.serialize(),
      sampleStatus: this.base.sampleMission.status, discoveries: { ...this.base.discoveries },
      airlock: { state: this.base.airlock.state, remaining: this.base.airlock.remaining },
      position: { x: this.camera.position.x, z: this.camera.position.z, yaw: this.controller.yaw } }
  }
  restoreMissionWorld(saved) {
    if (!saved || !Number.isFinite(saved.clockDays) || !this.base.eclss.restore(saved.eclss)) return false
    this.clock.days = Math.max(0, saved.clockDays)
    if (!this.base.laboratory.restore(saved.laboratory)) this.base.eclss.setLaboratoryPower(0)
    if (['field', 'carried', 'delivered', 'analyzed'].includes(saved.sampleStatus)) this.base.sampleMission.status = saved.sampleStatus
    for (const key of Object.keys(this.base.discoveries)) this.base.discoveries[key] = saved.discoveries?.[key] === true
    const allowed = ['sealed-pressurized', 'sealed-vacuum', 'interior-open', 'exterior-open', 'cycling-to-pressure', 'cycling-to-vacuum']
    if (allowed.includes(saved.airlock?.state)) {
      this.base.airlock.state = saved.airlock.state
      this.base.airlock.remaining = Math.max(0, Number(saved.airlock.remaining) || 0)
    }
    const { x, z, yaw } = saved.position ?? {}
    if (Number.isFinite(x) && Number.isFinite(z) && x > this.terrain.bounds.minX && x < this.terrain.bounds.maxX
      && z > this.terrain.bounds.minZ && z < this.terrain.bounds.maxZ) {
      this.controller.setStartPosition(x, z, (px, pz) => this.base.groundHeightAt(px, pz), Number.isFinite(yaw) ? yaw : 0)
    }
    this.onBaseState(this.base.snapshot(this.camera.position))
    return true
  }
  controlEclss(action, value) { this.onBaseState(this.base.controlEclss(action, value)) }
  closeEclssControl() { this.controlPanelOpen = false }
  closeSampleLab() { this.sampleLabOpen = false }
  laboratoryAction(action,payload) {
    if(!this.sampleLabOpen)return false
    const result=this.base.laboratory.action(action,payload,this.base.sampleMission.status)
    this.onBaseState(this.base.snapshot(this.camera.position))
    return result
  }
  completeSampleAnalysis(minerals) {
    const result = this.base.completeSampleAnalysis(minerals)
    const direction = this.camera.getWorldDirection(new THREE.Vector3())
    this.onBaseState(this.base.snapshot(this.camera.position, direction))
    this.onBaseMessage?.(this.base.message)
    if (result.complete) this.closeSampleLab()
    return result
  }
  inspectBaseInfo() {
    const direction = this.camera.getWorldDirection(new THREE.Vector3())
    const result = this.base.inspect(this.camera.position, direction)
    this.onBaseState(this.base.snapshot(this.camera.position, direction))
    this.onBaseMessage?.(result.message)
    if (!result.info) return false
    this.onBaseInfo(result.info, result.infoId)
    this.releaseControls()
    return true
  }
  startRadiationScenario(settings) {
    const event = this.radiation.startScenario(this.clock.days, {
      ...settings, azimuth: (this.solar.azimuth + 25) % 360, elevation: 20,
    })
    this.onRadiationState(event)
  }
  endRadiationScenario() { this.onRadiationState(this.radiation.endScenario(this.clock.days)) }
  inspectGround() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    this.raycaster.far = 1200
    const hit = this.raycaster.intersectObject(this.terrain.mesh)[0]
    if (hit) this.onRadiationInspect(this.radiation.ratesAt(hit.point.x, hit.point.z, this.clock.days))
  }
  inspectRadiationSector(x, z) {
    this.onRadiationInspect(this.radiation.ratesAt(x, z, this.clock.days))
  }
  resetSolarTime() {
    this.radiation.update(this.clock.days, this.camera.position.x, this.camera.position.z)
    this.clock.reset()
    this.thermal.reset()
    this.onRadiationState(this.radiation.rebaseClock(0))
    this.solar = solarState(0)
    this.stars.update(this.camera.position, 0)
    this.earth = earthState(0, this.solar)
    this.onSolarState(this.solar)
    this.onEarthState({ ...this.earth, visibility: earthVisibility(this.camera.position, this.earth, this.terrain.heightAt, this.terrain.bounds) })
    this.onThermalState(this.thermal.telemetryAt(this.camera.position.x, this.camera.position.z, 0))
    this.lighting.updateAround(this.camera.position.x, this.camera.position.z, this.solar, true)
    this.renderer.shadowMap.needsUpdate = true
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth)
    const height = Math.max(1, this.container.clientHeight)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  frame(time) {
    const elapsed = Math.max(0, (time - this.lastTime) / 1000)
    const dt = Math.min(elapsed, 0.05)
    this.lastTime = time
    const previousDays = this.clock.days
    this.clock.update(this.missionActive ? Math.min(elapsed, 0.1) : elapsed)
    const deltaDays = this.clock.days - previousDays
    this.solar = solarState(this.clock.days)
    this.earth = earthState(this.clock.days, this.solar)
    this.controller.update(dt)
    const position = this.camera.position
    const baseChanged = this.base.update(dt, this.solar, position, deltaDays, this.surfaceTemperatureC)
    if (this.missionActive) this.missionHoursBuffer += deltaDays * 24
    this.sampleCarrier.visible = this.base.sampleMission.status === 'carried'
    this.radiation.update(this.clock.days, position.x, position.z)
    const terrainChanged = this.terrain.updateAround(position.x, position.z)
    const lightChanged = this.lighting.updateAround(position.x, position.z, this.solar)
    if (terrainChanged || lightChanged || baseChanged) this.renderer.shadowMap.needsUpdate = true
    this.sunVisual.update(position, this.solar.direction)
    this.earthVisual.update(position, this.earth, this.solar.direction)
    this.stars.update(position, this.clock.days)
    this.renderer.render(this.scene, this.camera)
    this.frames++
    if (time - this.lastSolarSample > 250) {
      this.onSolarState(this.solar)
      const baseSnapshot = this.base.snapshot(position, this.camera.getWorldDirection(new THREE.Vector3()))
      this.onBaseState(baseSnapshot)
      if (this.missionActive && this.missionHoursBuffer > 0) {
        this.onMissionTick?.(this.missionHoursBuffer, baseSnapshot, this.serializeMissionWorld())
        this.missionHoursBuffer = 0
      }
      this.lastSolarSample = time
    }
    if (time - this.lastEarthSample > 500) {
      this.onEarthState({ ...this.earth, visibility: earthVisibility(position, this.earth, this.terrain.heightAt, this.terrain.bounds) })
      this.lastEarthSample = time
    }
    if (time - this.lastRadiationSample > (this.radiation.weather.active(this.clock.days) ? 100 : 500)) {
      this.onRadiationState(this.radiation.telemetry(this.clock.days, position.x, position.z))
      this.lastRadiationSample = time
    }
    if (time - this.lastSample > 500) {
      const thermalSample = this.thermal.telemetryAt(position.x, position.z, this.clock.days)
      this.surfaceTemperatureC = thermalSample.celsius
      this.onThermalState(thermalSample)
      this.onTelemetry({ x: position.x, z: position.z, heading: this.controller.yaw,
        altitude: position.y - this.base.groundHeightAt(position.x, position.z),
        fps: Math.round(this.frames * 1000 / (time - this.lastSample)) })
      this.lastSample = time
      this.frames = 0
    }
    this.frameId = requestAnimationFrame(this.frame)
  }

  dispose() {
    cancelAnimationFrame(this.frameId)
    this.resizeObserver.disconnect()
    this.controller.dispose()
    document.removeEventListener('keydown', this.handleRadiationKey)
    document.removeEventListener('keydown', this.handleBaseKey)
    this.base.dispose(this.scene)
    this.scene.remove(this.trainingMarker)
    this.trainingMarker.traverse(object => { object.geometry?.dispose(); object.material?.dispose() })
    this.camera.remove(this.sampleCarrier)
    this.sampleCarrier.traverse(object => {
      object.geometry?.dispose()
      object.material?.dispose()
    })
    this.renderer.domElement.removeEventListener('click', this.handleCanvasClick)
    this.terrain.dispose()
    this.stars.dispose()
    this.sunVisual.dispose()
    this.earthVisual.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
