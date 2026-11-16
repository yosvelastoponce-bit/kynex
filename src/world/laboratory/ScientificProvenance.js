export const EVIDENCE = Object.freeze({
  OBSERVED: 'OBSERVED · documentado', DERIVED: 'DERIVED · calculado',
  MODELLED: 'MODELLED · modelo', SCENARIO: 'SCENARIO · entrenamiento',
  UNAVAILABLE: 'UNAVAILABLE · dato no disponible',
})
export const LAB_SOURCES = Object.freeze({
  soil: { title: 'Meyer (2009), Lunar Sample Compendium 10084, tabla 2, p. 7; Korotev y Gillis (2001)', url: 'https://www.lpi.usra.edu/lunar/samples/atlas/compendium/10084.pdf#page=7' },
  basalt: { title: 'Meyer (2011), Lunar Sample Compendium 10003, petrografía y mineralogía', url: 'https://www.lpi.usra.edu/lunar/samples/atlas/compendium/10003.pdf' },
  anorthosite: { title: 'Meyer (2011), Lunar Sample Compendium 60025, petrografía y variación entre porciones', url: 'https://www.lpi.usra.edu/lunar/samples/atlas/compendium/60025.pdf' },
  mre: { title: 'NASA Kennedy (2025): ensayos de electrólisis de regolito fundido con simulante en vacío', url: 'https://www.nasa.gov/centers-and-facilities/kennedy/nasa-kennedy-breathes-life-into-moon-soil-testing/' },
  carbothermal: { title: 'NASA CaRD: demostración terrestre de reducción carbotérmica con simulante', url: 'https://www.nasa.gov/centers-and-facilities/johnson/sunlight-extracts-oxygen-from-regolith-using-solar-chemistry/' },
  energy: { title: 'Leger et al. (2025), Modeling energy requirements for oxygen production on the Moon', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11874342/' },
  shielding: { title: 'Barghouty (2007), Optimization of Crew Shielding Requirement in Reactor-Powered Lunar Surface Missions, NASA NTRS 20070032709', url: 'https://ntrs.nasa.gov/citations/20070032709' },
  m3: { title: 'PDS CH1-ORB-L-M3-4-L2-REFLECTANCE-V1.0: reflectancia orbital IMG + LBL + HDR', url: 'https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=CH1-ORB-L-M3-4-L2-REFLECTANCE-V1.0' },
  astromat: { title: 'Astromat: análisis de muestras lunares físicas', url: 'https://www.astromat.org/collections/lunar' },
})
