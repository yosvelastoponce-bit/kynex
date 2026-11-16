import { heightAt } from './LunarTerrain.js'
import { OUTPOST, baseFloorHeight, localBasePosition } from './BasePlacement.js'
import { AirlockSystem } from './AirlockSystem.js'
import { BaseMission } from './BaseMission.js'
import { BASE_KNOWLEDGE, BASE_TARGETS } from './BaseKnowledge.js'
import { baseGroundHeight, baseZone, resolveBaseMovement } from './BaseCollisions.js'
import { createLunarBaseModel } from './LunarBaseModel.js'
import { LifeSupportSystem } from './LifeSupportSystem.js'
import { Mission02 } from './Mission02.js'
import { equalizeAtmospheres } from './AtmosphereModel.js'
import { LunarSampleMission } from './LunarSampleMission.js'
import { LaboratorySystem } from './laboratory/LaboratorySystem.js'
import { createLaboratoryVisual } from './laboratory/LaboratoryVisual.js'
import { LAB_LAYOUT, LAB_STATIONS, inLaboratory } from './laboratory/LaboratoryLayout.js'

export class LunarBaseSystem {
  constructor(scene, { sampleHeight = heightAt, origin = OUTPOST, bounds = null } = {}) {
    this.origin = origin
    this.sampleHeight = sampleHeight
    this.bounds = bounds
    this.floorY = baseFloorHeight(sampleHeight, origin)
    this.airlock = new AirlockSystem()
    this.mission = new BaseMission()
    this.sampleMission = new LunarSampleMission()
    this.eclss = new LifeSupportSystem({ batteryDischargeW: 5000, cabinVolumeM3: 100 + LAB_LAYOUT.volumeM3 })
    this.laboratory = new LaboratorySystem(this.eclss)
    this.mission02 = new Mission02()
    this.discoveries = { sample: false, garden: false, observatory: false }
    this.model = createLunarBaseModel(this.floorY, sampleHeight, origin)
    scene.add(this.model.root)
    this.labVisual = createLaboratoryVisual(scene,origin,this.floorY)
    this.ready = this.labVisual.ready
    this.message = 'Busque KYNEX OUTPOST 01 e inspeccione sus instalaciones.'
    this.lastZone = 'surface'
  }
  groundHeightAt(x, z) { return baseGroundHeight(x, z, this.floorY, this.sampleHeight, this.origin) }
  resolveMovement(previous, next) {
    const resolved = resolveBaseMovement(previous, next, this.airlock, this.origin)
    if (!this.bounds) return resolved
    return {
      x: Math.max(this.bounds.minX + 1, Math.min(this.bounds.maxX - 1, resolved.x)),
      z: Math.max(this.bounds.minZ + 1, Math.min(this.bounds.maxZ - 1, resolved.z)),
    }
  }
  zoneAt(x, z) { return baseZone(x, z, this.origin) }
  nearby(position, direction = null) {
    const p = localBasePosition(position.x, position.z, this.origin)
    if (inLaboratory(p.x,p.z)) {
      let best=null
      for (const station of LAB_STATIONS) {
        const d=Math.hypot(p.x-station.x,p.z-station.z)
        if(d>1.65)continue
        if(direction&&d>.1&&(direction.x*(station.x-p.x)+direction.z*(station.z-p.z))/(Math.hypot(direction.x,direction.z)*d||1)<.3)continue
        if(!best||d<best.distance)best={id:station.id,label:station.label,distance:d}
      }
      return best
    }
    if (['carried', 'delivered'].includes(this.sampleMission?.status)) {
      const lab = BASE_TARGETS.find(target => target.id === 'sample-lab')
      const distance = Math.hypot(p.x - lab.x, p.z - lab.z)
      if (distance < 3.1) return { id: lab.id, label: lab.label, distance }
    }
    let closest = null, distance = Infinity
    for (const target of BASE_TARGETS) {
      const d = Math.hypot(p.x - target.x, p.z - target.z)
      if (target.kind === 'eclss' && direction && d > 0.01) {
        const facing = (direction.x * (target.x - p.x) + direction.z * (target.z - p.z))
          / (Math.hypot(direction.x, direction.z) * d || 1)
        if (facing < 0.15) continue
      }
      const reach = target.kind === 'door' ? 1.4 : 3.1
      if (d < reach && d < distance) { closest = target; distance = d }
    }
    return closest ? { id: closest.id, label: closest.label, distance } : null
  }
  interact(position, direction = null) {
    const near = this.nearby(position, direction)
    if (!near) { this.message = 'Acérquese a una instalación para interactuar.'; return { message: this.message } }
    const station = LAB_STATIONS.find(item => item.id === near.id)
    if (station) return {message:`${station.label}: KYNEX RESOURCE LAB 01`,sampleLab:true,resourceTab:station.tab}
    const target = BASE_TARGETS.find(item => item.id === near.id)
    const p = localBasePosition(position.x, position.z, this.origin)
    if (target.kind === 'door') {
      const doorZ = target.side === 'interior' ? 1.96 : 5.14
      const open = target.side === 'interior' ? this.airlock.interiorOpen : this.airlock.exteriorOpen
      if (open && Math.abs(p.z - doorZ) < 0.5 && Math.abs(p.x) < 1.1) {
        this.message = 'Aléjese del umbral antes de cerrar la compuerta.'
        return { message: this.message }
      }
      if (target.side === 'interior' && !open && !this.eclss.canCycleToPressure()) {
        this.message = 'Presión de cabina insuficiente para abrir el acceso interior.'
        return { message: this.message }
      }
      if (target.side === 'interior' && this.airlock.state === 'sealed-pressurized'
        && Math.abs(this.eclss.cabin.pressurePa - this.eclss.lock.pressurePa) > 2000) {
        this.message = 'Diferencia de presión excesiva. Restablezca la presión de cabina antes de abrir.'
        return { message: this.message }
      }
      const before = this.airlock.state
      const result = this.airlock.request(target.side)
      if (result.accepted) this.eclss.onAirlockTransition(before, this.airlock.state)
      this.message = result.message
      if (result.accepted) this.mission.complete('airlock')
      return { message: result.message, discovery: result.accepted ? 'airlock' : null }
    }
    if (target.kind === 'eclss') {
      this.mission02.complete('console')
      this.message = 'Centro de control ambiental disponible.'
      return { message: this.message, control: true }
    }
    if (target.kind === 'sample-pickup') {
      if (!this.sampleMission.collect()) {
        this.message = 'La roca ya está en tu mochila. ¡Llévala al laboratorio!'
        return { message: this.message }
      }
      this.message = '¡Roca recogida! Llévala al laboratorio para estudiarla.'
      return { message: this.message }
    }
    if (target.id === 'sample-lab') {
      if (this.sampleMission.status === 'field') {
        this.message = 'Primero encuentra y recoge la roca de entrenamiento en la superficie.'
        return { message: this.message }
      }
      if (this.sampleMission.status === 'carried') this.sampleMission.deliver()
      if (this.sampleMission.status === 'analyzed') {
        this.message = '¡Misión de la roca completada! Puedes volver a observar el microscopio.'
        return { message: this.message }
      }
      this.message = 'Muestra entregada. ¡Abre el microscopio y descubre sus minerales!'
      return { message: this.message, sampleLab: true }
    }
    if (target.kind === 'discovery') {
      if (this.discoveries[target.discoveryId]) {
        this.message = 'Esta actividad ya está completa. ¡Prueba otra estación!'
        return { message: this.message }
      }
      this.discoveries[target.discoveryId] = true
      this.mission.complete(target.discoveryId)
      const badge = this.mission.snapshot().discoveries.badges.find(item => item.id === target.discoveryId)
      this.message = `¡Descubrimiento registrado! Ganaste la insignia «${badge.name}».`
      return { message: this.message }
    }
    this.message = `Para aprender sobre ${BASE_KNOWLEDGE[target.infoId].name}, acérquese y pulse F.`
    return { message: this.message }
  }
  inspect(position, direction = null) {
    const near = this.nearby(position, direction)
    if (!near) {
      this.message = 'Acérquese a una instalación y pulse F para conocerla.'
      return { message: this.message }
    }
    if (LAB_STATIONS.some(item=>item.id===near.id)) return {message:'Pulsa E para abrir el instrumento del laboratorio.'}
    const target = BASE_TARGETS.find(item => item.id === near.id)
    const info = BASE_KNOWLEDGE[target.infoId]
    this.mission.complete(target.infoId)
    this.message = `Inspección: ${info.name}.`
    return { message: this.message, info, infoId: target.infoId }
  }
  completeSampleAnalysis(selectedMinerals) {
    const result = this.sampleMission.analyze(selectedMinerals)
    if (result.complete) {
      this.discoveries.sample = true
      this.mission.complete('sample')
      this.message = '¡Análisis correcto! Ganaste la insignia «Geóloga lunar».'
    } else {
      this.message = result.reason === 'not-delivered'
        ? 'Lleva primero la roca al laboratorio para poder analizarla.'
        : '¡Buen intento! Revisa las pistas y vuelve a probar.'
    }
    return { ...result, sampleMission: this.sampleMission.snapshot() }
  }
  controlEclss(action, value) {
    if (action === 'toggle') this.eclss.toggleDevice(value)
    if (action === 'verify-pressure' && this.eclss.cabin.pressurePa > 0) this.mission02.complete('pressure')
    if (action === 'verify-oxygen' && this.eclss.storage.O2 >= 0) this.mission02.complete('oxygen')
    if (action === 'verify-power' && this.eclss.lastPower.availableW > 0) this.mission02.complete('power')
    if (action === 'verify-supply' && (this.eclss.operating.generator
      || (this.eclss.operating.regulator && this.eclss.storage.O2 > 0))) this.mission02.complete('supply')
    if (action === 'verify-climate') this.mission02.complete('climate')
    this.message = action === 'toggle' ? `Equipo ${value}: ${this.eclss.enabled[value] ? 'activado' : 'apagado'}.`
      : 'Verificación registrada en el control ambiental.'
    return this.snapshot(this.lastPosition ?? { x: this.origin.x, z: this.origin.z })
  }
  update(dt, solar, position, deltaDays = 0, exteriorCelsius = -150) {
    this.lastPosition = position
    this.eclss.update(deltaDays, solar, exteriorCelsius)
    this.laboratory?.update()
    const before = this.airlock.state
    const changed = this.airlock.update(deltaDays * 86_400)
    if (changed) { this.eclss.onAirlockTransition(before, this.airlock.state); this.message = changed.message }
    if (this.airlock.interiorOpen) equalizeAtmospheres(this.eclss.cabin, this.eclss.lock)
    const zone = this.zoneAt(position.x, position.z)
    const distance = Math.hypot(position.x - this.origin.x, position.z - this.origin.z)
    if (distance < 20) this.mission.complete('find')
    if (zone === 'habitat' && this.lastZone !== 'habitat') {
      this.mission.complete('enter')
      this.mission02.complete('enter')
      this.message = 'Entrada controlada completada. Interior conceptual del hábitat.'
    }
    if (this.eclss.operating.ventilation) this.mission02.complete('ventilation')
    if (this.eclss.operating.scrubber) this.mission02.complete('scrubber')
    this.mission02.observe(deltaDays, this.eclss)
    this.lastZone = zone
    return this.model.update(this.airlock, solar, dt, this.eclss, this.discoveries, this.sampleMission.snapshot())
  }
  snapshot(position, direction = null) {
    const mission = this.mission.snapshot()
    if (this.origin !== OUTPOST) {
      const findStep = mission.steps.find(step => step.id === 'find')
      if (findStep) findStep.label = 'Encontrar el punto de apoyo educativo'
    }
    return { name: this.origin.name, x: this.origin.x, z: this.origin.z,
      distance: Math.hypot(position.x - this.origin.x, position.z - this.origin.z),
      nearby: this.nearby(position, direction), zone: this.zoneAt(position.x, position.z),
      airlock: { state: this.airlock.state, pressure: `${this.eclss.lock.pressurePa / 1000 < 1 ? 'VACÍO' : `${(this.eclss.lock.pressurePa / 1000).toFixed(1)} kPa`}`,
        interiorOpen: this.airlock.interiorOpen, exteriorOpen: this.airlock.exteriorOpen,
        remaining: this.airlock.remaining },
      mission, mission02: this.mission02.snapshot(),
      discoveries: { ...this.discoveries }, sampleMission: this.sampleMission.snapshot(),
      laboratory: this.laboratory?.snapshot(),
      eclss: this.eclss.snapshot(), message: this.message }
  }
  dispose(scene) { this.labVisual?.dispose(); scene.remove(this.model.root); this.model.dispose() }
}
