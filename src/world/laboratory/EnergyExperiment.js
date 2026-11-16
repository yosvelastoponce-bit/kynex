export const LAB_POWER_W = 1000 // SCENARIO: electrical training bench, not an industrial MRE reactor.
export const BASE_RESERVE_KWH = 5 // SCENARIO: reserve policy for optional experiments.
export function energyBudget(eclss,energyKWh,powerW=LAB_POWER_W) {
  if (!Number.isFinite(energyKWh)||energyKWh<=0||!Number.isFinite(powerW)||powerW<=0) return {allowed:false,reason:'Energía solicitada inválida'}
  const p=eclss?.power
  if (!p) return {allowed:false,reason:'Esperando el sistema eléctrico de la base'}
  const hours=energyKWh/(powerW/1000)
  const essentialsW=p.demandW-(eclss.enabled?.laboratory?eclss.power.laboratoryPowerW??0:0)
  const batteryNeedKWh=Math.max(0,essentialsW+powerW-p.solarW)*hours/1000
  const powerFits=p.availableW-essentialsW>=powerW
  return {allowed:powerFits&&p.batteryKWh-batteryNeedKWh>=BASE_RESERVE_KWH,
    reason:!powerFits?'Potencia insuficiente junto a los equipos de la base':p.batteryKWh-batteryNeedKWh<BASE_RESERVE_KWH?'El ensayo comprometería la reserva educativa de 5 kWh':'Hay energía para el escenario con la iluminación actual',
    hours,batteryNeedKWh,solarW:p.solarW,batteryKWh:p.batteryKWh,demandW:essentialsW,powerW,energyKWh,
    evidence:'MODELLED',limitation:'Proyección a generación y cargas constantes; si cambia el Sol o el consumo, el ensayo puede pausarse.'}
}
