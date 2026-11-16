import { availableSamples, sampleById } from './SampleCatalog.js'
import { oxygenEstimate } from './OxygenExperiment.js'
import { energyBudget, LAB_POWER_W } from './EnergyExperiment.js'
import { shieldingComparison } from './ShieldingExperiment.js'

const cleanState=()=>({selectedId:'10084',records:{},job:null,results:[],journal:[],serial:0})
export class LaboratorySystem {
  constructor(eclss) { this.eclss=eclss; this.state=cleanState(); this.message='Selecciona y registra una muestra antes de investigar.' }
  record() { return this.state.records[this.state.selectedId] }
  action(action,payload={},sampleStatus='field') {
    const sample=sampleById(this.state.selectedId)
    if(action==='select') {
      if(!availableSamples(sampleStatus).some(s=>s.id===payload.id)) return this.fail('Entrega primero tu roca en la mesa del hábitat.')
      this.state.selectedId=payload.id; this.message='Muestra seleccionada. Consulta su procedencia.'; return true
    }
    if(action==='cancel') {
      if(!this.state.job) return this.fail('No hay ensayo activo.')
      this.state.results.unshift({...this.state.job,status:'cancelled',energySpentKWh:this.state.job.spentKWh})
      this.state.job=null; this.eclss.setLaboratoryPower(0); this.message='Ensayo cancelado. La energía consumida no se devuelve.'; return true
    }
    if(action==='register') {
      if(!this.record()) this.state.records[sample.id]={id:sample.id,evidence:sample.evidence,registeredDay:this.eclss.days,visual:false,microscopy:false,elemental:false,mineralogy:false}
      this.message=`${sample.id} registrada. Su identificación y origen se conservan.`; return true
    }
    const record=this.record()
    if(!record) return this.fail('Registra primero la muestra.')
    if(['visual','microscopy','elemental','mineralogy'].includes(action)) {
      record[action]=true
      this.message=action==='elemental'&&!sample.chemistry.length?'Dato no disponible en el catálogo: no se ha generado un análisis ficticio.':'Consulta registrada. La imagen por sí sola no identifica la composición.'
      return true
    }
    if(action==='oxygen') {
      if(!record.elemental) return this.fail('Consulta primero el análisis elemental documentado.')
      if(this.state.job) return this.fail('Ya hay un ensayo en curso. Espera o cancélalo.')
      let estimate
      try{estimate=oxygenEstimate(sample,payload)}catch{return this.fail('Revisa los parámetros del experimento.')}
      if(!estimate.available) return this.fail(estimate.reason)
      const budget=energyBudget(this.eclss.snapshot(),estimate.energyKWh)
      if(!budget.allowed) return this.fail(budget.reason)
      this.state.job={id:++this.state.serial,sampleId:sample.id,estimate,budget,spentKWh:0,startCounter:this.eclss.laboratoryEnergyKWh,startedDay:this.eclss.days,status:'running'}
      this.eclss.setLaboratoryPower(LAB_POWER_W)
      this.message='Bancada de entrenamiento iniciada. Consume electricidad real de la base; la producción de O₂ es solo un cálculo.'
      return true
    }
    if(action==='shielding') {
      try{this.state.results.unshift({id:++this.state.serial,sampleId:sample.id,kind:'shielding',...shieldingComparison(payload)})}catch{return this.fail('Revisa el escenario de blindaje.')}
      this.state.results=this.state.results.slice(0,20); this.message='Comparación guardada: masa por superficie, sin inventar una dosis.'; return true
    }
    if(action==='conclude') {
      if(!record.visual || !['life','energy','shielding'].includes(payload.area)) return this.fail('Inspecciona la muestra y selecciona un área de aplicación.')
      const existing=this.state.journal.find(e=>e.sampleId===sample.id&&e.area===payload.area)
      const entry={sampleId:sample.id,area:payload.area,day:this.eclss.days,evidence:sample.evidence,
        observed:{visual:record.visual,appearance:record.visual?sample.appearance:'',microscopy:record.microscopy,chemistry:record.elemental?structuredClone(sample.chemistry):[],minerals:record.mineralogy?[...sample.minerals]:[]},
        results:structuredClone(this.state.results.filter(r=>r.sampleId===sample.id).slice(0,5)),
        conclusion:payload.area==='life'?'El oxígeno ligado requiere un proceso, energía y acondicionamiento antes de suministrarse.'
          :payload.area==='energy'?'La composición orienta investigaciones industriales; la electricidad disponible procede de paneles y baterías de la base.'
          :'La masa de cobertura ayuda a describir un diseño, pero no demuestra por sí sola una dosis segura.',
        limitations:[sample.chemistryMethod,'Referencia Apollo o escenario virtual; no medición química local de Site04.','Los experimentos no suministran oxígeno ni conceden blindaje.'],sources:[...sample.sources,'mre','energy','shielding']}
      if(existing) Object.assign(existing,entry); else this.state.journal.unshift(entry)
      this.message='Conclusión registrada en la bitácora del laboratorio.'; return true
    }
    return this.fail('Acción desconocida.')
  }
  fail(message) { this.message=message; return false }
  update() {
    const job=this.state.job
    if(!job) return
    job.spentKWh=Math.max(0,this.eclss.laboratoryEnergyKWh-job.startCounter)
    job.status=this.eclss.operating.laboratory?'running':'paused'
    if(job.spentKWh+1e-8>=job.estimate.energyKWh) {
      this.state.results.unshift({...structuredClone(job),kind:'oxygen',status:'completed',completedDay:this.eclss.days})
      this.state.results=this.state.results.slice(0,20)
      this.state.job=null; this.eclss.setLaboratoryPower(0)
      this.message='Ensayo terminado. Estimación guardada; el depósito respirable permanece separado.'
    }
  }
  snapshot() { return {...structuredClone(this.state),message:this.message} }
  serialize() { return {version:1,state:structuredClone(this.state)} }
  restore(saved) {
    // Saved world enters from a Vue reactive object. Keep the domain state plain JSON.
    try { saved=JSON.parse(JSON.stringify(saved)) } catch { return false }
    if(saved?.version!==1 || !sampleById(saved.state?.selectedId)) return false
    const s=saved.state; this.state=cleanState(); this.state.selectedId=s.selectedId
    for(const [id,record] of Object.entries(s.records??{})) if(sampleById(id)&&record?.id===id) this.state.records[id]={...record}
    this.state.journal=Array.isArray(s.journal)?s.journal.filter(e=>sampleById(e.sampleId)).slice(0,30):[]
    this.state.results=Array.isArray(s.results)?s.results.filter(e=>sampleById(e.sampleId)).slice(0,20):[]
    this.state.serial=Math.max(0,Number(s.serial)||0)
    const job=s.job
    if(job&&sampleById(job.sampleId)&&Number.isFinite(job.spentKWh)&&job.spentKWh>=0&&Number.isFinite(job.estimate?.energyKWh)&&job.estimate.energyKWh>0) {
      this.state.job=structuredClone(job)
      this.state.job.startCounter=this.eclss.laboratoryEnergyKWh-job.spentKWh
      this.eclss.setLaboratoryPower(LAB_POWER_W)
    } else this.eclss.setLaboratoryPower(0)
    return true
  }
}
