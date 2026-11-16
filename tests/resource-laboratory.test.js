import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { sampleById, availableSamples } from '../src/world/laboratory/SampleCatalog.js'
import { LAB_SOURCES } from '../src/world/laboratory/ScientificProvenance.js'
import { elementalContributions, oxygenEstimate } from '../src/world/laboratory/OxygenExperiment.js'
import { energyBudget } from '../src/world/laboratory/EnergyExperiment.js'
import { shieldingComparison } from '../src/world/laboratory/ShieldingExperiment.js'
import { LaboratorySystem } from '../src/world/laboratory/LaboratorySystem.js'
import { LifeSupportSystem } from '../src/world/LifeSupportSystem.js'
import { baseZone, baseGroundHeight, resolveBaseMovement } from '../src/world/BaseCollisions.js'
import { LAB_STATIONS } from '../src/world/laboratory/LaboratoryLayout.js'
import { LunarBaseSystem } from '../src/world/LunarBaseSystem.js'
import { AirlockSystem } from '../src/world/AirlockSystem.js'
import { SITE04_OUTPOST } from '../src/world/BasePlacement.js'
import { reactive } from 'vue'

test('catalog preserves Apollo identifiers, one source column, units and unavailable virtual data',()=>{
  assert.deepEqual(availableSamples('field').map(s=>s.id),['10084','10003','60025'])
  assert.equal(availableSamples('delivered').length,4)
  const sample=sampleById('10084')
  assert.equal(sample.chemistry.find(r=>r.oxide==='FeO').value,15.81)
  assert.equal(sample.chemistry.find(r=>r.oxide==='SiO2').uncertainty,.2)
  for(const row of sample.chemistry){assert.ok(LAB_SOURCES[row.source]);assert.equal(row.unit,'% masa de óxido')}
  assert.equal(oxygenEstimate(sampleById('KYNEX-S04-001')).available,false)
  assert.equal(sampleById('KYNEX-S04-001').minerals.length,0)
})
test('stoichiometry conserves listed oxide mass and separates bound O from an assumed extraction',()=>{
  const silica={evidence:'OBSERVED',chemistry:[{oxide:'SiO2',value:100}]}
  const elements=elementalContributions(silica)
  assert.ok(Math.abs(elements.reduce((s,e)=>s+e.value,0)-100)<1e-10)
  assert.ok(Math.abs(elements.find(e=>e.element==='O').value-53.256)<.01)
  const q=oxygenEstimate(silica,{massKg:.1,recovery:.2,specificKWhKg:10})
  assert.ok(q.estimatedKg<q.boundKg);assert.equal(q.energyKWh,1)
  assert.equal(q.parameterEvidence,'SCENARIO');assert.equal(q.evidence,'MODELLED')
  assert.throws(()=>oxygenEstimate(silica,{massKg:-1}),RangeError)
})
test('energy assessment uses kW, kWh and both essential loads and reserve',()=>{
  const snapshot={power:{availableW:5000,demandW:2000,solarW:0,batteryKWh:10},enabled:{}}
  const budget=energyBudget(snapshot,.5)
  assert.equal(budget.hours,.5);assert.equal(budget.batteryNeedKWh,1.5);assert.equal(budget.allowed,true)
  snapshot.power.batteryKWh=6;assert.equal(energyBudget(snapshot,.5).allowed,false)
  snapshot.power.availableW=2200;assert.equal(energyBudget(snapshot,.1).allowed,false)
  assert.equal(energyBudget(snapshot,NaN).allowed,false)
})
test('shielding reports areal density correctly without arbitrary radiation attenuation',()=>{
  const result=shieldingComparison({thicknessM:1,densityKgM3:1500,environment:'GCR'})
  assert.equal(result.arealKgM2,1500);assert.equal(result.arealGcm2,150)
  assert.equal(result.reductionPercent,null);assert.equal(result.doseEvidence,'UNAVAILABLE')
  assert.equal(shieldingComparison({thicknessM:0}).arealKgM2,0)
  assert.throws(()=>shieldingComparison({thicknessM:Infinity}),RangeError)
})
function setup(){
  const eclss=new LifeSupportSystem({batteryDischargeW:5000,occupied:false})
  for(const key of Object.keys(eclss.enabled)) eclss.setDevice(key,false)
  eclss.update(1/86400,{aboveHorizon:false})
  return {eclss,lab:new LaboratorySystem(eclss)}
}
test('processing consumes the existing battery over time; never credits O2, and resumes without free output',()=>{
  let {eclss,lab}=setup()
  assert.equal(lab.action('oxygen'),false)
  lab.action('register');lab.action('elemental')
  const oxygenBefore=eclss.storage.O2,batteryBefore=eclss.batteryKWh
  assert.equal(lab.action('oxygen'),true)
  assert.equal(lab.state.results.length,0)
  assert.equal(lab.action('oxygen'),false)
  eclss.update(.005,{aboveHorizon:false});lab.update()
  assert.ok(lab.state.job.spentKWh>0)
  assert.equal(eclss.storage.O2,oxygenBefore)
  const es=eclss.serialize(),ls=lab.serialize()
  const restored=setup();restored.eclss.restore(es);restored.lab.restore(reactive(ls))
  assert.doesNotThrow(()=>restored.lab.snapshot())
  eclss=restored.eclss;lab=restored.lab
  assert.equal(lab.state.job.spentKWh,ls.state.job.spentKWh)
  for(let i=0;i<10&&lab.state.job;i++){eclss.update(.005,{aboveHorizon:false});lab.update()}
  assert.equal(lab.state.job,null);assert.equal(eclss.enabled.laboratory,false)
  assert.equal(lab.state.results.length,1);assert.ok(batteryBefore-eclss.batteryKWh>=.5)
  assert.equal(eclss.storage.O2,oxygenBefore)
  for(let i=0;i<3;i++)lab.update()
  assert.equal(lab.state.results.length,1)
})
test('a power loss pauses processing; cancelling keeps spent energy; conclusions retain evidence and references',()=>{
  const {eclss,lab}=setup();lab.action('register');lab.action('elemental');lab.action('visual');lab.action('oxygen')
  eclss.setPowerLimit(0);eclss.update(.01,{aboveHorizon:false});lab.update()
  assert.equal(lab.state.job.spentKWh,0);assert.equal(lab.state.job.status,'paused')
  eclss.setPowerLimit(Infinity);eclss.update(.001,{aboveHorizon:false});lab.update()
  const before=eclss.batteryKWh;assert.equal(lab.action('cancel'),true);assert.equal(eclss.batteryKWh,before)
  lab.action('shielding',{thicknessM:1,densityKgM3:1500,environment:'SEP'})
  lab.action('conclude',{area:'shielding'});lab.action('conclude',{area:'shielding'})
  assert.equal(lab.state.journal.length,1);assert.equal(lab.state.journal[0].observed.chemistry.length,10)
  assert.ok(lab.state.journal[0].sources.includes('soil'))
  assert.equal(lab.action('select',{id:'KYNEX-S04-001'},'field'),false)
})
test('habitat-to-lab corridor is passable, walls block movement and stations require proximity and facing',()=>{
  const origin=SITE04_OUTPOST,airlock=new AirlockSystem()
  let p={x:0,z:0}
  for(let i=0;i<40;i++)p=resolveBaseMovement(p,{x:p.x-.2,z:p.z},airlock,origin)
  assert.ok(p.x< -7.9)
  assert.equal(baseZone(p.x,0,origin),'habitat')
  assert.equal(baseGroundHeight(-8,0,5,()=>-100,origin),5)
  const block=resolveBaseMovement({x:-8,z:2},{x:-8,z:3.2},airlock,origin)
  assert.ok(block.z<3)
  const base=Object.create(LunarBaseSystem.prototype);base.origin=origin
  assert.equal(base.nearby({x:-8.5,z:0},{x:-1,z:0}).id,'resource-microscope')
  assert.notEqual(base.nearby({x:-8.5,z:0},{x:1,z:0})?.id,'resource-microscope')
  for(const station of LAB_STATIONS){
    const positions=[{x:station.x+.8,z:station.z},{x:station.x,z:station.z+.8},{x:station.x,z:station.z-.8}]
    assert.ok(positions.some(pos=>base.nearby(pos,{x:station.x-pos.x,z:station.z-pos.z})?.id===station.id),station.id)
  }
})
test('Blender GLB loads with Three.js, contains instruments and fits the collision layout',async()=>{
  const bytes=readFileSync(new URL('../public/models/resource-lab-01.glb',import.meta.url))
  const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
  const bounds=new THREE.Box3().setFromObject(gltf.scene)
  assert.ok(bounds.min.x>=-10.2&&bounds.max.x<=-4.8)
  assert.ok(bounds.max.y>2.7&&bounds.max.y<3.1)
  assert.ok(gltf.scene.getObjectByName('microscope_objective'))
  assert.ok(readFileSync(new URL('../assets-source/laboratory/resource-lab-01.blend',import.meta.url)).length>10000)
})
test('save migration fits initial module atmosphere once and preserves pressure on reload',()=>{
  const old=new LifeSupportSystem(),newSystem=new LifeSupportSystem({cabinVolumeM3:170})
  newSystem.restore(old.serialize())
  assert.ok(Math.abs(newSystem.cabin.pressurePa-old.cabin.pressurePa)<1e-7)
  const moles={...newSystem.cabin.moles},saved=newSystem.serialize()
  newSystem.restore(saved);assert.deepEqual(newSystem.cabin.moles,moles)
})
