export const DATA_STATUS = Object.freeze({
  OBSERVED: 'OBSERVED', DERIVED: 'DERIVED', MODELLED: 'MODELLED',
  SCENARIO: 'SCENARIO', UNAVAILABLE: 'UNAVAILABLE',
})

export const DATA_PROVENANCE = Object.freeze({
  elevation: { name: 'Elevación del DEM', unit: 'm', status: DATA_STATUS.OBSERVED,
    source: 'NASA PGDA · Site04_final_adj_5mpp_surf.tif', instrument: 'LRO LOLA',
    period: 'Producto Barker et al. 2020', location: 'Shackleton rim, Site04', resolution: '5 m/celda',
    uncertainty: 'No incluida en este recorte; consultar producto de incertidumbre' },
  localHeight: { name: 'Altura local interpolada', unit: 'm', status: DATA_STATUS.DERIVED,
    source: 'DEM Site04 LOLA', instrument: 'Interpolación triangular KYNEX',
    period: 'Producto Barker et al. 2020', location: 'Site04', resolution: '5 m/celda',
    uncertainty: 'Hereda la incertidumbre del DEM; no cuantificada aquí' },
  slope: { name: 'Pendiente', unit: '°', status: DATA_STATUS.DERIVED,
    source: 'DEM Site04 LOLA', instrument: 'Gradiente central KYNEX',
    period: 'Producto Barker et al. 2020', location: 'Site04', resolution: '5 m/celda',
    uncertainty: 'No cuantificada' },
  surfaceImage: { name: 'Imagen orbital del suelo', unit: 'DN de visualización', status: DATA_STATUS.OBSERVED,
    source: 'NASA Moon Trek · LRO_NAC_AvgMosaic_SPole855_1mp', instrument: 'LRO LROC NAC; mosaico USGS/LMMP',
    period: 'Imágenes 2009–2011; producto 2011', location: 'Shackleton rim Site04',
    resolution: 'Mosaico 1 m/píxel; vista WMTS 4,18 m/píxel y recorte 5 m/celda',
    uncertainty: 'Metadatos del mosaico: hasta 20 m RMS horizontal absoluto; no mide iluminación actual' },
  mapShadows: { name: 'Sombras variables del mapa', status: DATA_STATUS.MODELLED,
    source: 'DEM Site04 LOLA y modelo solar educativo KYNEX', instrument: 'Trazado de rayos sobre alturas DEM',
    period: 'Tiempo simulado; sin fecha UTC validada', location: 'Site04', resolution: '20 m/celda de máscara',
    uncertainty: 'Horizonte limitado al recorte; sombras originales de LROC permanecen' },
  solarPosition: { name: 'Posición del Sol', unit: '°', status: DATA_STATUS.MODELLED,
    source: 'Modelo educativo KYNEX pendiente de validación', instrument: 'Ciclo angular simplificado',
    period: 'Reloj simulado, sin fecha UTC validada', location: 'Site04', resolution: null,
    uncertainty: 'No cuantificada; no usar como efeméride' },
  earthPosition: { name: 'Posición y fase de la Tierra', unit: '°', status: DATA_STATUS.MODELLED,
    source: 'Modelo educativo KYNEX pendiente de validación', instrument: 'Libración sinusoidal simplificada',
    period: 'Reloj simulado, sin fecha UTC validada', location: 'Site04', resolution: null,
    uncertainty: 'No cuantificada; no usar como efeméride' },
  observedTemperature: { name: 'Temperatura observada', value: null, unit: 'K', status: DATA_STATUS.UNAVAILABLE,
    source: 'Diviner LRO; producto local y tiempo no integrado', instrument: 'Diviner, observación orbital',
    period: null, location: 'Site04', resolution: null, uncertainty: null },
  observedRadiation: { name: 'Dosis observada local', value: null, unit: 'mSv/día', status: DATA_STATUS.UNAVAILABLE,
    source: 'CRaTER LRO no es dosímetro de superficie Site04', instrument: 'CRaTER, observación orbital',
    period: null, location: 'Site04', resolution: null, uncertainty: null },
  thermalModel: { name: 'Temperatura simulada', unit: 'K', status: DATA_STATUS.MODELLED,
    source: 'Modelo térmico educativo KYNEX', instrument: 'Balance energético simplificado',
    period: 'Tiempo simulado', location: 'Site04', resolution: 'Sectores de 100 m', uncertainty: 'No cuantificada' },
  radiationModel: { name: 'Dosis simulada', unit: 'mSv/día', status: DATA_STATUS.MODELLED,
    source: 'Modelo de dosímetro KYNEX', instrument: 'Parámetros de escenario',
    period: 'Tiempo simulado', location: 'Site04', resolution: 'Muestreo local', uncertainty: 'No cuantificada' },
  outpost: { name: 'KYNEX Lunar Outpost 01', status: DATA_STATUS.SCENARIO,
    source: 'Diseño educativo KYNEX', instrument: 'Escenario 3D', period: 'Ficticio', location: 'Site04',
    resolution: null, uncertainty: null },
  power: { name: 'Potencia y batería del puesto', unit: 'W / kWh', status: DATA_STATUS.SCENARIO,
    source: 'Parámetros ECLSS_CONFIG de KYNEX', instrument: 'Balance energético simplificado',
    period: 'Tiempo simulado', location: 'Base ficticia Site04', resolution: null,
    uncertainty: 'No validada; depende del Sol ilustrativo' },
  eclss: { name: 'Atmósfera y soporte vital', status: DATA_STATUS.SCENARIO,
    source: 'Diseño educativo ECLSS_CONFIG de KYNEX', instrument: 'Modelo de gases ideales',
    period: 'Tiempo simulado', location: 'Base ficticia Site04', resolution: null,
    uncertainty: 'No validada como sistema de vuelo' },
})

export function validateProvenance(record) {
  if (!Object.values(DATA_STATUS).includes(record?.status)) return false
  if (!record.name || !record.source || !record.instrument || !record.location) return false
  if (record.status === DATA_STATUS.OBSERVED && (!record.period || !record.resolution)) return false
  if (record.status === DATA_STATUS.UNAVAILABLE && record.value !== null) return false
  return true
}
