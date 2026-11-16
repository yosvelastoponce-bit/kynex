export function shieldingComparison({thicknessM=0.5,densityKgM3=1500,environment='SEP'}={}) {
  if (!Number.isFinite(thicknessM)||thicknessM<0||thicknessM>3||!Number.isFinite(densityKgM3)||densityKgM3<500||densityKgM3>3000||!['SEP','GCR','SECONDARY'].includes(environment)) throw new RangeError('Escenario de blindaje inválido')
  return {material:'Regolito genérico de escenario, no densidad medida de Site04',thicknessM,densityKgM3,
    arealKgM2:densityKgM3*thicknessM,arealGcm2:densityKgM3*thicknessM/10,environment,
    evidence:'DERIVED',parameterEvidence:'SCENARIO',doseEvidence:'UNAVAILABLE',reductionPercent:null,
    interpretation:environment==='SEP'?'La cobertura puede contribuir a reducir la exposición a partículas solares. Se necesita el espectro del evento y la geometría del refugio para cuantificarla.'
      :environment==='GCR'?'Los rayos cósmicos galácticos son muy energéticos. Más espesor no implica una mejora proporcional de toda la dosis.'
      :'Las partículas primarias pueden generar neutrones y otros secundarios al interactuar con el suelo y las paredes. El blindaje debe estudiarse como conjunto.',
    limitation:'No se calcula dosis ni porcentaje: falta transporte radiológico validado para material, espectro, geometría y órgano. No modifica el dosímetro del jugador.'}
}
