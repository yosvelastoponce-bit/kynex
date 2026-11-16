const O = 15.999
// Conventional atomic masses, g/mol; not sample measurements.
export const OXIDES = Object.freeze({
  SiO2:{O:2,Si:28.085},TiO2:{O:2,Ti:47.867},Al2O3:{O:3,Al:2*26.9815385},
  FeO:{O:1,Fe:55.845},MnO:{O:1,Mn:54.938044},MgO:{O:1,Mg:24.305},
  CaO:{O:1,Ca:40.078},Na2O:{O:1,Na:2*22.98976928},K2O:{O:1,K:2*39.0983},P2O5:{O:5,P:2*30.973761998},
})
export function elementalContributions(sample) {
  const values = {}
  for (const row of sample?.chemistry ?? []) {
    const atoms=OXIDES[row.oxide]
    if (!atoms) continue
    const molar=Object.entries(atoms).reduce((sum,[key,mass])=>sum+(key==='O'?mass*O:mass),0)
    for (const [key,mass] of Object.entries(atoms)) values[key]=(values[key]??0)+row.value*(key==='O'?mass*O:mass)/molar
  }
  return Object.entries(values).map(([element,value])=>({element,value,unit:'% masa, aporte de los óxidos listados',evidence:'DERIVED'}))
}
export function oxygenEstimate(sample, {massKg=0.05,recovery=0.2,specificKWhKg=10}={}) {
  if (![massKg,recovery,specificKWhKg].every(Number.isFinite)||massKg<=0||massKg>1||recovery<0||recovery>1||specificKWhKg<=0||specificKWhKg>100) throw new RangeError('Parámetros fuera del rango educativo')
  if (sample?.evidence!=='OBSERVED'||!sample.chemistry.length) return {available:false,evidence:'UNAVAILABLE',reason:'Sin composición cuantitativa incorporada. No se inventa un rendimiento.'}
  const oxygenPercent=elementalContributions(sample).find(row=>row.element==='O')?.value??0
  const boundKg=massKg*oxygenPercent/100
  return {available:true,process:'mre',massKg,recovery,specificKWhKg,boundKg,estimatedKg:boundKg*recovery,
    energyKWh:massKg*specificKWhKg,evidence:'MODELLED',inventoryEvidence:'DERIVED',parameterEvidence:'SCENARIO',
    limitation:'La recuperación y el consumo específico son hipótesis del ejercicio, no prestaciones de un reactor NASA. No incluye planta, purificación, compresión ni licuefacción. El resultado no es gas respirable disponible.'}
}
