<script setup>
import { computed, ref } from 'vue'
import { oxygenEstimate } from '../../world/laboratory/OxygenExperiment.js'
import { energyBudget, LAB_POWER_W } from '../../world/laboratory/EnergyExperiment.js'
import { shieldingComparison } from '../../world/laboratory/ShieldingExperiment.js'
import { LAB_SOURCES } from '../../world/laboratory/ScientificProvenance.js'
const props=defineProps({area:String,sample:Object,record:Object,eclss:Object,system:Object})
const emit=defineEmits(['action'])
const massKg=ref(.05), recovery=ref(.2), specificKWhKg=ref(10), thicknessM=ref(.5), densityKgM3=ref(1500), environment=ref('SEP')
const params=computed(()=>({massKg:massKg.value,recovery:recovery.value,specificKWhKg:specificKWhKg.value}))
const estimate=computed(()=>oxygenEstimate(props.sample,params.value))
const budget=computed(()=>estimate.value.available?energyBudget(props.eclss,estimate.value.energyKWh):null)
const shield=computed(()=>shieldingComparison({thicknessM:thicknessM.value,densityKgM3:densityKgM3.value,environment:environment.value}))
const result=computed(()=>props.system.results.find(r=>r.kind==='oxygen'&&r.sampleId===props.sample.id&&r.status==='completed'))
function run(){emit('action',{action:'oxygen',payload:params.value})}
</script>
<template>
  <div>
    <template v-if="area==='life' || area==='energy'">
      <h3>{{ area==='life' ? 'Oxígeno dentro de los minerales' : 'Materiales que requieren energía' }}</h3>
      <p v-if="area==='life'">Respirar requiere O₂ acondicionado. El oxígeno ligado a los óxidos primero debe separarse mediante ingeniería.</p>
      <div v-if="area==='life' && eclss" class="resource-meters"><div><small>ECLSS · O₂ GENERADO</small><b>{{ eclss.flows.oxygenGeneratedKg.toFixed(3) }} kg</b></div><div><small>ECLSS · ALMACENADO</small><b>{{ eclss.storage.O2.toFixed(2) }} kg</b></div><div><small>TRIPULACIÓN · CONSUMIDO</small><b>{{ eclss.flows.metabolicO2Kg.toFixed(3) }} kg</b></div></div>
      <p v-else>La ilmenita puede ser relevante para investigar extracción; el silicio requiere separación, purificación y fabricación. Encontrar un mineral no produce paneles ni electricidad.</p>
      <details><summary>Proceso investigado y su alcance</summary><p>Electrólisis de regolito fundido (MRE): calentamiento y corriente eléctrica. NASA ha ensayado simulantes en vacío en la Tierra; no es una planta instalada en Site04.</p><a :href="LAB_SOURCES.mre.url" target="_blank" rel="noreferrer">Ensayos NASA MRE ↗</a><p>La reducción carbotérmica es otra vía investigada y tiene reactivos y balances distintos. Esta bancada calcula solo el escenario MRE.</p><a :href="LAB_SOURCES.carbothermal.url" target="_blank" rel="noreferrer">Demostración CaRD ↗</a></details>
      <div class="resource-meters" v-if="eclss"><div><small>PANELES · BASE</small><b>{{ (eclss.power.solarW/1000).toFixed(2) }} kW</b></div><div><small>BATERÍA · BASE</small><b>{{ eclss.power.batteryKWh.toFixed(2) }} kWh</b></div><div><small>DEMANDA ACTUAL</small><b>{{ (eclss.power.demandW/1000).toFixed(2) }} kW</b></div></div>
      <p v-if="!estimate.available" class="resource-warning">{{ estimate.reason }} Selecciona 10084 para usar la tabla química transcrita.</p>
      <template v-else>
        <p class="resource-evidence">SCENARIO · Parámetros asumidos, no rendimiento medido NASA.</p>
        <label>Material de referencia {{ sample.id }} · {{ (massKg*1000).toFixed(0) }} g<input type="range" min="0.01" max="0.1" step="0.01" v-model.number="massKg" /></label>
        <label>Fracción recuperada asumida · {{ (recovery*100).toFixed(0) }} %<input type="range" min="0" max="0.5" step="0.05" v-model.number="recovery" /></label>
        <label>Consumo supuesto · {{ specificKWhKg }} kWh/kg de material<input type="range" min="5" max="50" step="5" v-model.number="specificKWhKg" /></label>
        <div class="resource-meters"><div><small>DERIVED · O LIGADO*</small><b>{{ (estimate.boundKg*1000).toFixed(2) }} g</b></div><div><small>MODELLED · O₂ POTENCIAL</small><b>{{ (estimate.estimatedKg*1000).toFixed(2) }} g</b></div><div><small>ENERGÍA SUPUESTA</small><b>{{ estimate.energyKWh.toFixed(2) }} kWh</b></div></div>
        <p class="resource-small">*Aporte estequiométrico de los óxidos listados. No es una medición directa de oxígeno libre. No se renormalizan los análisis.</p>
        <p v-if="budget">Bancada eléctrica de entrenamiento: {{ LAB_POWER_W }} W durante {{ (budget.hours*60).toFixed(0) }} minutos simulados. {{ budget.reason }}.</p>
        <p class="resource-warning">{{ estimate.limitation }}</p>
        <button :disabled="!record?.elemental || !budget?.allowed || !!system.job" @click="run">INICIAR ENSAYO CON ENERGÍA DE LA BASE</button>
        <p v-if="!record?.elemental">Primero registra la muestra y consulta «Análisis».</p>
      </template>
      <div v-if="system.job" class="resource-job"><b>{{ system.job.status==='running'?'ENSAYO EN CURSO':'EN ESPERA DE ENERGÍA' }} · {{ system.job.sampleId }}</b><progress :value="system.job.spentKWh" :max="system.job.estimate.energyKWh" /><span>{{ system.job.spentKWh.toFixed(3) }} / {{ system.job.estimate.energyKWh.toFixed(3) }} kWh consumidos</span><button @click="emit('action',{action:'cancel'})">CANCELAR ENSAYO</button></div>
      <div v-if="result" class="resource-result"><b>RESULTADO DEL MODELO · {{ result.sampleId }}</b><p>Estimación {{ (result.estimate.estimatedKg*1000).toFixed(2) }} g de O₂ potencial · energía consumida {{ result.spentKWh.toFixed(3) }} kWh. No añadido a reservas.</p><p>Para suministrarlo harían falta separación y verificación de pureza, acondicionamiento, almacenamiento y conexión al regulador. Esa planta no está implementada.</p></div>
      <a :href="LAB_SOURCES.energy.url" target="_blank" rel="noreferrer">Estudio de reducción con hidrógeno: otra cadena, no una calibración de este escenario MRE ↗</a>
    </template>
    <template v-else>
      <h3>Diseña una cobertura; no una dosis</h3>
      <p>Compara una pared sin cobertura adicional con una capa genérica de regolito.</p>
      <label>Entorno radiológico<select v-model="environment"><option value="SEP">Partículas solares · SEP</option><option value="GCR">Rayos cósmicos galácticos · GCR</option><option value="SECONDARY">Radiación secundaria</option></select></label>
      <label>Espesor · {{ thicknessM.toFixed(2) }} m<input type="range" min="0" max="3" step="0.1" v-model.number="thicknessM" /></label>
      <label>Densidad asumida · {{ densityKgM3 }} kg/m³<input type="range" min="500" max="2500" step="100" v-model.number="densityKgM3" /></label>
      <p class="resource-evidence">SCENARIO · Espesor y densidad elegidos; no son propiedades medidas en Site04.</p>
      <div class="resource-meters"><div><small>SIN COBERTURA EXTRA</small><b>0 kg/m²</b></div><div><small>DERIVED · CAPA</small><b>{{ shield.arealKgM2.toFixed(0) }} kg/m²</b><small>{{ shield.arealGcm2.toFixed(1) }} g/cm²</small></div></div>
      <p>{{ shield.interpretation }}</p><p class="resource-warning">{{ shield.limitation }}</p>
      <button :disabled="!record" @click="emit('action',{action:'shielding',payload:{thicknessM,densityKgM3,environment}})">REGISTRAR COMPARACIÓN</button>
      <a :href="LAB_SOURCES.shielding.url" target="_blank" rel="noreferrer">NASA NTRS · geometría, componentes y requisitos de blindaje ↗</a>
    </template>
    <div class="resource-conclusion"><button :disabled="!record?.visual" @click="emit('action',{action:'conclude',payload:{area}})">GUARDAR CONCLUSIÓN EN BITÁCORA</button><small v-if="!record?.visual">Registra e inspecciona la muestra antes de concluir.</small></div>
  </div>
</template>
