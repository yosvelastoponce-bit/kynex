const threeUrl = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
const startupStatus = document.getElementById('startupStatus');
const loadError = document.getElementById('loadError');
let THREE;

try {
  THREE = await import(threeUrl);
} catch (error) {
  console.error('No se pudo cargar Three.js desde jsDelivr.', error);
  loadError.textContent =
    'No se pudo cargar el motor 3D. Comprueba tu conexión a internet y vuelve a cargar la página.';
  loadError.classList.remove('hidden');
  startupStatus.textContent = 'No se pudo preparar el entorno 3D.';
  throw error;
}

const elements = {
  world: document.getElementById('world'),
  intro: document.getElementById('intro'),
  startButton: document.getElementById('startButton'),
  hud: document.getElementById('hud'),
  missionKicker: document.getElementById('missionKicker'),
  missionTitle: document.getElementById('missionTitle'),
  missionObjective: document.getElementById('missionObjective'),
  resourceObjective: document.getElementById('resourceObjective'),
  interactionPrompt: document.getElementById('interactionPrompt'),
  toast: document.getElementById('toast'),
  stormRescue: document.getElementById('stormRescue'),
  helmetOverlay: document.getElementById('helmetOverlay'),
  laserScan: document.getElementById('laserScan'),
  weatherHud: document.getElementById('weatherHud'),
  roverHud: document.getElementById('roverHud'),
  roverSpeed: document.getElementById('roverSpeed'),
  roverBatteryBar: document.getElementById('roverBatteryBar'),
  roverBatteryValue: document.getElementById('roverBatteryValue'),
  roverDistance: document.getElementById('roverDistance'),
  roverAlert: document.getElementById('roverAlert'),
  distanceValue: document.getElementById('distanceValue'),
  oxygenBar: document.getElementById('oxygenBar'),
  oxygenValue: document.getElementById('oxygenValue'),
  batteryBar: document.getElementById('batteryBar'),
  batteryValue: document.getElementById('batteryValue'),
  suitState: document.getElementById('suitState'),
  mapCanvas: document.getElementById('mapCanvas'),
  minimapCoordinates: document.getElementById('minimapCoordinates'),
  fullMapCanvas: document.getElementById('fullMapCanvas'),
  mapView: document.querySelector('.map-view'),
  mapTooltip: document.getElementById('mapTooltip'),
  mapTooltipCoordinates: document.getElementById('mapTooltipCoordinates'),
  mapLayerLegend: document.getElementById('mapLayerLegend'),
  mapScreen: document.getElementById('mapScreen'),
  mapDataStatus: document.getElementById('mapDataStatus'),
  mapCoordinates: document.getElementById('mapCoordinates'),
  openMapButton: document.getElementById('openMapButton'),
  closeMapButton: document.getElementById('closeMapButton'),
  mapZoomIn: document.getElementById('mapZoomIn'),
  mapZoomOut: document.getElementById('mapZoomOut'),
  mapCenterButton: document.getElementById('mapCenterButton'),
  environmentScreen: document.getElementById('environmentScreen'),
  closeEnvironmentButton: document.getElementById('closeEnvironmentButton'),
  environmentDoneButton: document.getElementById('environmentDoneButton'),
  environmentSol: document.getElementById('environmentSol'),
  environmentCoordinates: document.getElementById('environmentCoordinates'),
  environmentAltitude: document.getElementById('environmentAltitude'),
  environmentTemperature: document.getElementById('environmentTemperature'),
  environmentPressure: document.getElementById('environmentPressure'),
  environmentElapsed: document.getElementById('environmentElapsed'),
  environmentBaseDistance: document.getElementById('environmentBaseDistance'),
  environmentSuit: document.getElementById('environmentSuit'),
  environmentOxygen: document.getElementById('environmentOxygen'),
  environmentBattery: document.getElementById('environmentBattery'),
  weatherCondition: document.getElementById('weatherCondition'),
  weatherWind: document.getElementById('weatherWind'),
  weatherVisibility: document.getElementById('weatherVisibility'),
  weatherDust: document.getElementById('weatherDust'),
  weatherAlert: document.getElementById('weatherAlert'),
  weatherCountdown: document.getElementById('weatherCountdown'),
  weatherIntensity: document.getElementById('weatherIntensity'),
  weatherRecommendation: document.getElementById('weatherRecommendation'),
  pauseScreen: document.getElementById('pauseScreen'),
  resumeButton: document.getElementById('resumeButton'),
  returnHomeButton: document.getElementById('returnHomeButton'),
  terminalScreen: document.getElementById('terminalScreen'),
  closeTerminalButton: document.getElementById('closeTerminalButton'),
  leaveTerminalButton: document.getElementById('leaveTerminalButton'),
  journalButton: document.getElementById('journalButton'),
  journalScreen: document.getElementById('journalScreen'),
  journalEntries: document.getElementById('journalEntries'),
  journalSampleCount: document.getElementById('journalSampleCount'),
  journalAnalysisCount: document.getElementById('journalAnalysisCount'),
  journalMissionStatus: document.getElementById('journalMissionStatus'),
  weatherHistory: document.getElementById('weatherHistory'),
  terminalWeather: document.getElementById('terminalWeather'),
  closeJournalButton: document.getElementById('closeJournalButton'),
  closeJournalFooter: document.getElementById('closeJournalFooter'),
  labScreen: document.getElementById('labScreen'),
  closeLabButton: document.getElementById('closeLabButton'),
  sampleInventory: document.getElementById('sampleInventory'),
  sampleCount: document.getElementById('sampleCount'),
  emptyInventory: document.getElementById('emptyInventory'),
  sampleCanvas: document.getElementById('sampleCanvas'),
  sampleTerrainTag: document.getElementById('sampleTerrainTag'),
  viewerPlaceholder: document.getElementById('viewerPlaceholder'),
  instrumentControls: document.getElementById('instrumentControls'),
  analyzeButton: document.getElementById('analyzeButton'),
  analysisResult: document.getElementById('analysisResult'),
  pointerStatus: document.getElementById('pointerStatus'),
  viewerLightButton: document.getElementById('viewerLightButton'),
  viewerMarkerButton: document.getElementById('viewerMarkerButton'),
};

const WEATHER_TIMING = {
  firstForecastAt: 18,
  buildupSeconds: 12,
  forecastLeadSeconds: 240,
  stormDurationSeconds: 100,
  recoveryDurationSeconds: 100,
  nextForecastDelaySeconds: 180,
};
const STORM_EXPOSURE_LIMIT = 60;
const RESCUE_FADE_SECONDS = 1.5;
const RESCUE_HOLD_SECONDS = 0.5;
const MARS_GRAVITY = 3.71;
const MISSION_DAY_SECONDS = 480;
const SURFACE_MARK_LIFETIME = 42;
const ANALYSIS_SCAN_MS = 1150;

function createWeatherState() {
  return {
    elapsed: 0,
    phase: 'calm',
    phaseElapsed: 0,
    uiUpdateAt: 0,
    nextForecastAt: WEATHER_TIMING.firstForecastAt,
    cycle: 0,
    countdown: 0,
    windSpeed: 8,
    visibilityKm: 18,
    dustLevel: 0.04,
    alertLevel: 'informativo',
    intensityForecast: 'Alta',
    peakWind: 68,
    maxWind: 0,
    minVisibilityKm: 18,
    stormRecord: null,
    events: [],
    roverDust: 0,
    structureDust: 0,
    exposureAlerted: false,
  };
}

const sampleProfiles = {
  basalt: {
    name: 'Basalto vesicular',
    terrainLabel: 'Muestra de terreno volcánico · Arcadia Planitia',
    hydratedMinerals: [],
    scienceValue: 'La mineralogía basáltica aporta una referencia de los materiales volcánicos y ayuda a comparar posibles recursos con la composición primaria de la corteza.',
    color: 0x745d50,
    roughness: 0.94,
    hardness: 6,
    appearance: 'Roca oscura, de grano fino, con pequeñas cavidades y fracturas irregulares.',
    minerals: [
      { name: 'Piroxeno', status: 'confirmado', meaning: 'Mineral común en rocas volcánicas; contiene silicio, oxígeno y metales.' },
      { name: 'Plagioclasa', status: 'probable', meaning: 'Familia de minerales claros que aparece en muchas rocas ígneas.' },
      { name: 'Olivino', status: 'no concluyente', meaning: 'Mineral verdoso rico en magnesio y hierro, frecuente en algunas lavas.' },
    ],
    elements: [
      { name: 'Oxígeno', percent: 43.1 },
      { name: 'Silicio', percent: 21.8 },
      { name: 'Hierro', percent: 14.2 },
      { name: 'Magnesio', percent: 8.7 },
      { name: 'Aluminio', percent: 6.1 },
      { name: 'Calcio', percent: 6.1 },
    ],
    visual: 'La superficie es oscura y rugosa, con cavidades que pueden formarse cuando burbujas de gas quedan atrapadas en lava enfriada. La apariencia sola no confirma su composición.',
    xrf: 'El espectrómetro simulado detecta una señal rica en hierro, silicio y magnesio; el patrón es compatible con una roca volcánica basáltica.',
    raman: 'Las bandas Raman del perfil de esta muestra son compatibles con piroxeno. La señal de plagioclasa es probable; la de olivino es débil.',
    infrared: 'La respuesta infrarroja coincide con enlaces de silicatos y una superficie oxidada. Es evidencia complementaria, no una identificación visual.',
  },
  breccia: {
    name: 'Brecha basáltica',
    terrainLabel: 'Muestra de terreno volcánico · Arcadia Planitia',
    hydratedMinerals: [],
    scienceValue: 'La brecha registra fragmentación y mezcla de materiales; su composición ayuda a reconstruir procesos de impacto y transporte superficial.',
    color: 0x9a7051,
    roughness: 0.96,
    hardness: 5.5,
    appearance: 'Fragmentos angulosos de tonos ocres y oscuros unidos en una matriz más fina.',
    minerals: [
      { name: 'Piroxeno', status: 'probable', meaning: 'Mineral común en rocas volcánicas; contiene silicio, oxígeno y metales.' },
      { name: 'Plagioclasa', status: 'confirmado', meaning: 'Familia de minerales claros que aparece en muchas rocas ígneas.' },
      { name: 'Óxidos de hierro', status: 'no concluyente', meaning: 'Minerales con hierro y oxígeno que pueden contribuir al color rojizo del suelo.' },
    ],
    elements: [
      { name: 'Oxígeno', percent: 45.4 },
      { name: 'Silicio', percent: 20.2 },
      { name: 'Hierro', percent: 13.1 },
      { name: 'Aluminio', percent: 8.3 },
      { name: 'Calcio', percent: 7.2 },
      { name: 'Magnesio', percent: 3.4 },
      { name: 'Otros', percent: 2.4 },
    ],
    visual: 'Se distinguen fragmentos angulosos de distinto color dentro de una matriz fina. Esto sugiere una roca fragmentada y vuelta a consolidar, pero la vista no basta para confirmarlo.',
    xrf: 'La lectura simulada muestra silicio y oxígeno como componentes principales, con hierro y aluminio destacados. El perfil es compatible con una brecha de origen basáltico.',
    raman: 'Las bandas del perfil son compatibles con plagioclasa y muestran una señal probable de piroxeno. Algunas zonas no ofrecen una lectura concluyente.',
    infrared: 'El espectro simulado muestra una respuesta de silicatos y óxidos. Se requiere combinarlo con Raman y fluorescencia para afinar la interpretación.',
  },
  olivine: {
    name: 'Roca rica en olivino',
    terrainLabel: 'Muestra de terreno volcánico · Arcadia Planitia',
    hydratedMinerals: [],
    scienceValue: 'Los minerales máficos permiten caracterizar materiales volcánicos y establecer una línea de base para comparar alteración por agua.',
    color: 0x78654b,
    roughness: 0.92,
    hardness: 6.5,
    appearance: 'Superficie oscura con pequeños puntos verdosos y vetas brillantes dispersas.',
    minerals: [
      { name: 'Olivino', status: 'confirmado', meaning: 'Mineral verdoso rico en magnesio y hierro, frecuente en algunas lavas.' },
      { name: 'Piroxeno', status: 'probable', meaning: 'Mineral común en rocas volcánicas; contiene silicio, oxígeno y metales.' },
      { name: 'Plagioclasa', status: 'no concluyente', meaning: 'Familia de minerales claros que aparece en muchas rocas ígneas.' },
    ],
    elements: [
      { name: 'Oxígeno', percent: 41.8 },
      { name: 'Silicio', percent: 20.4 },
      { name: 'Hierro', percent: 17.1 },
      { name: 'Magnesio', percent: 14.7 },
      { name: 'Calcio', percent: 2.4 },
      { name: 'Aluminio', percent: 2.1 },
      { name: 'Otros', percent: 1.5 },
    ],
    visual: 'Se aprecian pequeños puntos verdosos y una textura cristalina. Son pistas para elegir instrumentos, no una confirmación del mineral.',
    xrf: 'El perfil simulado presenta hierro, magnesio y silicio en proporciones compatibles con una roca rica en olivino.',
    raman: 'Las bandas Raman de esta muestra son compatibles con olivino y muestran una señal secundaria probable de piroxeno.',
    infrared: 'La respuesta infrarroja es compatible con silicatos ricos en magnesio. El instrumento complementa, pero no sustituye, la lectura Raman.',
  },
  sedimentary: {
    name: 'Sedimento estratificado',
    terrainLabel: 'Muestra de llanura sedimentaria · Arcadia Planitia',
    hydratedMinerals: ['Smectita', 'Yeso'],
    scienceValue: 'Las capas finas y los minerales hidratados ayudan a reconstruir la interacción pasada con agua y a priorizar zonas para estudiar recursos.',
    color: 0xa8895d,
    roughness: 0.97,
    hardness: 4.5,
    appearance: 'Fragmento ocre de grano fino con bandas sedimentarias y pequeñas vetas claras.',
    minerals: [
      { name: 'Smectita', status: 'probable', meaning: 'Filosilicato hidratado que puede registrar alteración de rocas por agua.' },
      { name: 'Yeso', status: 'probable', meaning: 'Sulfato cálcico hidratado; su presencia sería compatible con evaporación de agua salina.' },
      { name: 'Plagioclasa', status: 'no concluyente', meaning: 'Mineral silicatado común en materiales ígneos y sedimentos derivados.' },
    ],
    elements: [
      { name: 'Oxígeno', percent: 46.5 },
      { name: 'Silicio', percent: 20.2 },
      { name: 'Hierro', percent: 8.0 },
      { name: 'Aluminio', percent: 8.5 },
      { name: 'Azufre', percent: 8.0 },
      { name: 'Calcio', percent: 8.8 },
    ],
    visual: 'Las bandas finas sugieren deposición en capas, aunque la textura por sí sola no determina el origen ni confirma minerales hidratados.',
    xrf: 'La lectura elemental simulada muestra silicio, aluminio, azufre y calcio, una combinación útil para seleccionar fases que deben verificarse con Raman e infrarrojo.',
    raman: 'El perfil Raman simulado es compatible con smectita y yeso probables; las señales apoyarían una historia de alteración o deposición en presencia de agua.',
    infrared: 'La respuesta infrarroja simulada presenta bandas compatibles con grupos OH y minerales hidratados, una pista para estudiar agua ligada en el sedimento.',
  },
  periglacial: {
    name: 'Fragmento periglaciar',
    terrainLabel: 'Fragmento de depósito periglaciar · Arcadia Planitia',
    hydratedMinerals: ['Yeso', 'Filosilicatos'],
    scienceValue: 'Los fragmentos de depósitos periglaciares ayudan a evaluar cómo se distribuyen los materiales alterados por agua y dónde conviene investigar hielo enterrado.',
    color: 0x9a927a,
    roughness: 0.9,
    hardness: 4,
    appearance: 'Fragmento claro, anguloso y poroso, con matriz fina y vetas minerales pálidas.',
    minerals: [
      { name: 'Yeso', status: 'probable', meaning: 'Sulfato hidratado que puede formarse en ambientes con agua salina.' },
      { name: 'Filosilicatos', status: 'probable', meaning: 'Grupo de minerales arcillosos cuya estructura puede incorporar agua u OH.' },
      { name: 'Percloratos', status: 'no concluyente', meaning: 'Sales detectadas en Marte que pueden modificar el comportamiento del agua y las salmueras.' },
    ],
    elements: [
      { name: 'Oxígeno', percent: 47.0 },
      { name: 'Silicio', percent: 18.0 },
      { name: 'Hierro', percent: 7.0 },
      { name: 'Aluminio', percent: 8.0 },
      { name: 'Calcio', percent: 10.0 },
      { name: 'Azufre', percent: 7.0 },
      { name: 'Cloro', percent: 2.0 },
      { name: 'Magnesio', percent: 1.0 },
    ],
    visual: 'La matriz clara y las vetas sugieren alteración y depósito superficial, pero la apariencia no permite confirmar hielo ni agua.',
    xrf: 'El perfil elemental simulado destaca calcio, azufre y silicio; sirve para priorizar análisis de sulfatos, pero XRF no mide directamente hidrógeno ni hielo.',
    raman: 'Las bandas Raman simuladas son compatibles con sulfatos hidratados y filosilicatos probables, indicios de alteración acuosa que requieren confirmación.',
    infrared: 'La respuesta infrarroja simulada presenta señales compatibles con grupos OH/H₂O en fases minerales; no demuestra una reserva de agua explotable.',
  },
};

const sampleProfileDistribution = [
  { profileId: 'basalt', weight: 0.3 },
  { profileId: 'breccia', weight: 0.12 },
  { profileId: 'olivine', weight: 0.08 },
  { profileId: 'sedimentary', weight: 0.28 },
  { profileId: 'periglacial', weight: 0.22 },
];

function chooseSampleProfile(seed) {
  let roll = ((Math.abs(seed) * 9301 + 49297) % 233280) / 233280;
  for (const entry of sampleProfileDistribution) {
    roll -= entry.weight;
    if (roll < 0) return entry.profileId;
  }
  return sampleProfileDistribution[sampleProfileDistribution.length - 1].profileId;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x93867d);
scene.fog = new THREE.FogExp2(0x8f7b6f, 0.0014);
const calmSkyColor = new THREE.Color(0x93867d);
const stormSkyColor = new THREE.Color(0x754126);
const calmFogColor = new THREE.Color(0x8f7b6f);
const stormFogColor = new THREE.Color(0x825033);
const calmSkyTint = new THREE.Color(0xffffff);
const stormSkyTint = new THREE.Color(0xb6754c);
const daySkyColor = new THREE.Color(0xd0b27d);
const duskSkyColor = new THREE.Color(0x354968);
const nightSkyColor = new THREE.Color(0x17223d);
const dayFogColor = new THREE.Color(0xb29a78);
const duskFogColor = new THREE.Color(0x354967);
const nightFogColor = new THREE.Color(0x1c2943);
const daySkyTint = new THREE.Color(0xffedc4);
const duskSkyTint = new THREE.Color(0x8da3c8);
const nightSkyTint = new THREE.Color(0x576b9c);
const mixedSkyColor = new THREE.Color();
const mixedFogColor = new THREE.Color();
const mixedSkyTint = new THREE.Color();
const roverBasePaint = new THREE.Color(0xc4b49e);
const roverWheelBasePaint = new THREE.Color(0x343838);
const roverDustPaint = new THREE.Color(0x92755e);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 900);
camera.rotation.order = 'YXZ';
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.18;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.setAttribute('aria-label', 'Mundo 3D de Marte. Haz clic para activar la cámara.');
elements.world.appendChild(renderer.domElement);

const state = {
  started: false,
  paused: false,
  inside: false,
  terminalOpen: false,
  labOpen: false,
  journalOpen: false,
  mapOpen: false,
  environmentOpen: false,
  driving: false,
  missionComplete: false,
  firstStormSurvived: false,
  roverUsed: false,
  pointerLockActive: false,
  dragging: false,
  oxygen: 100,
  headbobPhase: 0,
  headbobAmount: 0,
  footprintDistance: 0,
  roverTrackDistance: 0,
  leftFootNext: false,
  roverCameraBouncePitch: 0,
  roverCameraBounceRoll: 0,
  roverPreviousSpeed: 0,
  analysisInProgress: false,
  analysisTimer: null,
  battery: 100,
  roverBattery: 100,
  roverSpeed: 0,
  roverYaw: -0.26,
  suitEmergency: false,
  stormExposure: 0,
  rescuePhase: null,
  rescueElapsed: 0,
  yaw: 0,
  pitch: -0.035,
  feetY: 0,
  verticalVelocity: 0,
  jumping: false,
  lastToast: 0,
  keys: new Set(),
  currentTarget: null,
  collectedSamples: [],
  selectedSampleId: null,
  selectedInstrument: 'visual',
  analysisCount: 0,
  waterResourceLocated: false,
  weather: createWeatherState(),
  missionStartedAt: 0,
  lastEnvironmentUpdate: 0,
  mapZoom: 1,
  mapPanX: 0,
  mapPanZ: 0,
  mapLayer: 'topography',
  mapDragging: false,
  mapDragMoved: false,
  mapPointer: null,
  mapSelection: null,
  mapNasaInset: null,
  lastMapUpdate: 0,
  visitedLocations: [{ x: 0, z: 22 }],
  journal: [
    { title: 'Llegada a Arcadia Planitia', detail: 'Punto de misión AP-1 · coordenadas estudiadas mediante observaciones orbitales.' },
  ],
};

const investigationStages = [
  {
    numeral: 'I',
    title: 'Conocer Marte',
    range: 'Investigaciones 01–03',
    summary: 'Entorno físico, cartografía y ubicación de la base.',
    unlockHint: 'Se desbloquea al llegar a AP-1.',
    investigations: [
      ['01', 'Entorno físico marciano'],
      ['02', 'Cartografía de Arcadia Planitia'],
      ['03', 'Ubicación y contexto de AP-1'],
    ],
  },
  {
    numeral: 'II',
    title: 'Diseñar la base',
    range: 'Investigaciones 04–07',
    summary: 'Hábitat, soporte vital, energía y recursos.',
    unlockHint: 'Se desbloquea al recolectar y analizar 3 muestras.',
    investigations: [
      ['04', 'Diseño del hábitat'],
      ['05', 'Soporte vital y protección'],
      ['06', 'Energía y paneles solares'],
      ['07', 'Recursos para la misión'],
    ],
  },
  {
    numeral: 'III',
    title: 'Garantizar la supervivencia',
    range: 'Investigaciones 08–10',
    summary: 'Radiación, actividades exteriores y comunicaciones.',
    unlockHint: 'Se desbloquea al sobrevivir a la primera tormenta.',
    investigations: [
      ['08', 'Riesgos de radiación'],
      ['09', 'Protocolos de actividad exterior'],
      ['10', 'Comunicaciones en Marte'],
    ],
  },
  {
    numeral: 'IV',
    title: 'Crear la experiencia educativa',
    range: 'Investigaciones 11–12',
    summary: 'Operaciones, emergencias y misiones interactivas.',
    unlockHint: 'Se desbloquea al usar el rover por primera vez.',
    investigations: [
      ['11', 'Operaciones de exploración'],
      ['12', 'Emergencias y misiones interactivas'],
    ],
  },
];

const MAX_SAMPLE_CAPACITY = 12;
let rockSequence = 0;
const basePosition = new THREE.Vector3(0, 0, -54);
const baseElevationKm = -1.5;
const entryPosition = new THREE.Vector3(0, 0, -46.7);
const playerPosition = new THREE.Vector3(0, 0, 22);
const collisionObjects = [];
const interiorCollisionObjects = [];
const interactiveObjects = [];
const scanRings = [];
const dustParticles = [];
const clock = new THREE.Clock();
let baseExterior;
let baseInterior;
let consolePosition;
let analyzerPosition;
let roverPosition;
let roverGroup;
let roverWheels = [];
let roverBogieLinks = [];
let roverBodyMaterial;
let roverWheelMaterial;
let roverCollision;
let roverCameraYawOffset = 0;
let roverCameraPitch = 0.18;
let solarPosition;
let sunlight;
let hemisphereLight;
let dustAmbientLight;
let skyMaterial;
let sunMaterial;
let sunGlowMaterial;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const dustSensitiveMaterials = [];
const surfaceMarkPools = { footprints: null, tracks: null };
const audio = {
  context: null,
  windFilter: null,
  windGain: null,
  motorOscillator: null,
  motorFilter: null,
  motorGain: null,
  masterGain: null,
  footstepBuffer: null,
};
let viewerRenderer;
let viewerScene;
let viewerCamera;
let viewerRockGroup;
let viewerMarker;
let viewerYaw = -0.5;
let viewerPitch = 0.2;
let viewerZoom = 4;
let viewerDragging = false;
let viewerPreviousPointer = null;
let viewerLighting;
let rockBumpMap;
const raycaster = new THREE.Raycaster();
const marsMapLayer = 'Mars_MGS_MOLA_ClrShade_merge_global_463m';
const marsMapZoom = 7;
const marsTileSize = 256;
const marsRadius = 3390000;
const marsLatitude = 47.2;
const marsLongitude = 184.3;
const nasaMapTile = new Image();
let nasaMapTileLoaded = false;
let nasaMapTileError = false;
const nasaTileMatrixWidth = 2 ** (marsMapZoom + 1);
const nasaTileMatrixHeight = 2 ** marsMapZoom;
const nasaTileColumn = Math.floor((marsLongitude / 360) * nasaTileMatrixWidth);
const nasaTileRow = Math.floor(((90 - marsLatitude) / 180) * nasaTileMatrixHeight);
const nasaTileLongitudeSpan = 360 / nasaTileMatrixWidth;
const nasaTileLatitudeSpan = 180 / nasaTileMatrixHeight;
const nasaTileWest = nasaTileColumn * nasaTileLongitudeSpan;
const nasaTileNorth = 90 - nasaTileRow * nasaTileLatitudeSpan;
nasaMapTile.onload = () => {
  nasaMapTileLoaded = true;
  elements.mapDataStatus.textContent = 'NASA MOLA cargado · el relieve local superpuesto es simulación.';
};
nasaMapTile.onerror = () => {
  nasaMapTileError = true;
  elements.mapDataStatus.textContent = 'NASA MOLA no respondió; se muestra el mapa topográfico local de respaldo.';
  console.error('No se pudo cargar el mosaico MOLA de NASA para Arcadia Planitia.');
};
nasaMapTile.src =
  `https://trek.nasa.gov/tiles/Mars/EQ/${marsMapLayer}/1.0.0/default/default028mm/${marsMapZoom}/${nasaTileRow}/${nasaTileColumn}.jpg`;

const terrainCraters = [
  { x: -24, z: 8, radius: 11, depth: 1.6 },
  { x: 25, z: -13, radius: 8, depth: 1.2 },
  { x: -42, z: -48, radius: 13, depth: 1.8 },
  { x: 37, z: 36, radius: 10, depth: 1.4 },
  { x: 51, z: -70, radius: 17, depth: 2 },
  { x: -68, z: 53, radius: 18, depth: 2.3 },
  { x: 4, z: -103, radius: 16, depth: 1.8 },
  { x: -11, z: 18, radius: 2.6, depth: 0.48 },
  { x: 9, z: 4, radius: 2.1, depth: 0.4 },
  { x: 17, z: -25, radius: 3.2, depth: 0.55 },
  { x: -29, z: -31, radius: 2.4, depth: 0.44 },
  { x: 39, z: 7, radius: 3.6, depth: 0.62 },
  { x: -55, z: -6, radius: 2.8, depth: 0.47 },
  { x: 62, z: 41, radius: 3.4, depth: 0.58 },
  { x: -3, z: -82, radius: 2.5, depth: 0.4 },
  { x: 44, z: -92, radius: 3.1, depth: 0.52 },
];

function terrainNoise(x, z) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx0 = x - x0;
  const tz0 = z - z0;
  const tx = tx0 * tx0 * (3 - 2 * tx0);
  const tz = tz0 * tz0 * (3 - 2 * tz0);
  const hash = (ix, iz) => {
    const value = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
  };
  const top = THREE.MathUtils.lerp(hash(x0, z0), hash(x0 + 1, z0), tx);
  const bottom = THREE.MathUtils.lerp(hash(x0, z0 + 1), hash(x0 + 1, z0 + 1), tx);
  return THREE.MathUtils.lerp(top, bottom, tz);
}

function terrainHeight(x, z) {
  let height =
    Math.sin(x * 0.026) * 0.92 +
    Math.cos(z * 0.031) * 0.98 +
    Math.sin((x + z) * 0.014) * 1.25 +
    Math.cos((x - z) * 0.019) * 0.52 +
    Math.sin(x * 0.11 + Math.cos(z * 0.07)) * 0.15 +
    Math.cos(z * 0.14 - Math.sin(x * 0.09)) * 0.1 +
    Math.sin(x * 0.43 + z * 0.17) * 0.035 +
    Math.cos(z * 0.39 - x * 0.21) * 0.025 +
    terrainNoise(x * 0.065, z * 0.065) * 0.58 +
    terrainNoise(x * 0.19, z * 0.19) * 0.16;

  for (const crater of terrainCraters) {
    const offsetX = x - crater.x;
    const offsetZ = z - crater.z;
    if (Math.abs(offsetX) > crater.radius * 1.2 || Math.abs(offsetZ) > crater.radius * 1.2) continue;
    const distance = Math.hypot(offsetX, offsetZ);
    const normalized = distance / crater.radius;
    if (normalized < 1.2) {
      const bowl = Math.max(0, 1 - normalized * normalized);
      const rim = Math.exp(-Math.pow((normalized - 0.96) / 0.085, 2));
      const terrace = Math.exp(-Math.pow((normalized - 0.72) / 0.12, 2));
      height += -crater.depth * bowl * 0.72 + crater.depth * 0.2 * rim - crater.depth * 0.045 * terrace;
    }
  }

  return height * 1.25;
}

function makeGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 768;
  const context = canvas.getContext('2d');
  context.fillStyle = '#715744';
  context.fillRect(0, 0, 768, 768);

  const groundPatches = ['#927355', '#665348', '#846449', '#594c45', '#aa7750', '#77746a', '#55483e'];
  for (let index = 0; index < 1400; index += 1) {
    context.globalAlpha = 0.04 + Math.random() * 0.12;
    context.fillStyle = groundPatches[Math.floor(Math.random() * groundPatches.length)];
    const size = 7 + Math.random() * 42;
    context.beginPath();
    context.ellipse(
      Math.random() * 768,
      Math.random() * 768,
      size * (1.1 + Math.random() * 1.8),
      size * (0.35 + Math.random() * 0.6),
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.globalAlpha = 1;
  for (let index = 0; index < 26000; index += 1) {
    const brightness = Math.floor(78 + Math.random() * 76);
    const alpha = 0.035 + Math.random() * 0.12;
    context.fillStyle = `rgba(${brightness}, ${Math.floor(brightness * 0.78)}, ${Math.floor(brightness * 0.66)}, ${alpha})`;
    const size = 0.35 + Math.random() * 2.8;
    context.beginPath();
    context.ellipse(Math.random() * 768, Math.random() * 768, size * (1.3 + Math.random()), size * 0.55, Math.random() * Math.PI, 0, Math.PI * 2);
    context.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const bump = document.createElement('canvas');
  bump.width = canvas.width;
  bump.height = canvas.height;
  const bumpContext = bump.getContext('2d');
  bumpContext.fillStyle = '#808080';
  bumpContext.fillRect(0, 0, bump.width, bump.height);
  for (let index = 0; index < 22000; index += 1) {
    const shade = Math.floor(70 + Math.random() * 115);
    const size = 0.3 + Math.random() * 2.4;
    bumpContext.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${0.1 + Math.random() * 0.45})`;
    bumpContext.beginPath();
    bumpContext.ellipse(Math.random() * bump.width, Math.random() * bump.height, size * 1.5, size * 0.65, Math.random() * Math.PI, 0, Math.PI * 2);
    bumpContext.fill();
  }
  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(34, 34);
  bumpMap.anisotropy = texture.anisotropy;
  return { texture, bumpMap };
}

function buildSky() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#343a43');
  gradient.addColorStop(0.35, '#6b6660');
  gradient.addColorStop(0.7, '#aa9179');
  gradient.addColorStop(1, '#c2a184');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 1024, 512);
  for (let index = 0; index < 9000; index += 1) {
    const alpha = Math.random() * 0.055;
    context.fillStyle = `rgba(219, ${Math.floor(192 + Math.random() * 36)}, ${Math.floor(168 + Math.random() * 38)}, ${alpha})`;
    context.fillRect(Math.random() * 1024, Math.random() * 512, 1 + Math.random() * 4, 1 + Math.random() * 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(480, 40, 24),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false }),
  );
  skyMaterial = sky.material;
  sky.renderOrder = -10;
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.65, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd69a, toneMapped: false }),
  );
  sunMaterial = sun.material;
  sun.position.set(-74, 62, -165);
  scene.add(sun);
  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(1.9, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffc984, transparent: true, opacity: 0.07, depthWrite: false }),
  );
  sunGlowMaterial = sunGlow.material;
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);
}

function buildLighting() {
  hemisphereLight = new THREE.HemisphereLight(0xffe6c1, 0x40342e, 1.2);
  scene.add(hemisphereLight);
  dustAmbientLight = new THREE.AmbientLight(0xc87a40, 0);
  scene.add(dustAmbientLight);
  sunlight = new THREE.DirectionalLight(0xffe1c0, 2.6);
  sunlight.position.set(-48, 72, -62);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -110;
  sunlight.shadow.camera.right = 110;
  sunlight.shadow.camera.top = 110;
  sunlight.shadow.camera.bottom = -110;
  sunlight.shadow.camera.near = 0.5;
  sunlight.shadow.camera.far = 300;
  sunlight.shadow.camera.updateProjectionMatrix();
  sunlight.shadow.bias = -0.0001;
  sunlight.shadow.normalBias = 0.02;
  scene.add(sunlight);
}

function makeSurfaceMarkTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (kind === 'footprint') {
    const gradient = context.createRadialGradient(32, 32, 5, 32, 32, 29);
    gradient.addColorStop(0, 'rgba(27, 21, 17, 0.68)');
    gradient.addColorStop(0.56, 'rgba(36, 27, 21, 0.43)');
    gradient.addColorStop(1, 'rgba(36, 27, 21, 0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(32, 32, 14, 25, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = 'rgba(22, 18, 15, 0.28)';
    context.beginPath();
    context.ellipse(32, 16, 8, 5, 0, 0, Math.PI * 2);
    context.fill();
  } else {
    context.translate(32, 32);
    context.rotate(Math.PI / 2);
    const gradient = context.createLinearGradient(-30, 0, 30, 0);
    gradient.addColorStop(0, 'rgba(33, 25, 19, 0)');
    gradient.addColorStop(0.18, 'rgba(33, 25, 19, 0.45)');
    gradient.addColorStop(0.5, 'rgba(33, 25, 19, 0.6)');
    gradient.addColorStop(0.82, 'rgba(33, 25, 19, 0.45)');
    gradient.addColorStop(1, 'rgba(33, 25, 19, 0)');
    context.fillStyle = gradient;
    context.fillRect(-28, -10, 56, 20);
    context.fillStyle = 'rgba(22, 18, 15, 0.36)';
    for (let y = -7; y <= 7; y += 7) {
      context.fillRect(-24, y, 48, 1.5);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSurfaceMarkPool(kind, capacity) {
  const texture = makeSurfaceMarkTexture(kind);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0xffffff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), material, capacity);
  const hiddenMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
  const baseColor = new THREE.Color(0x735743);
  for (let index = 0; index < capacity; index += 1) {
    mesh.setMatrixAt(index, hiddenMatrix);
    mesh.setColorAt(index, baseColor);
  }
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.renderOrder = 2;
  mesh.frustumCulled = false;
  scene.add(mesh);
  return {
    kind,
    mesh,
    capacity,
    cursor: 0,
    records: Array.from({ length: capacity }, () => ({ active: false, age: SURFACE_MARK_LIFETIME })),
    color: new THREE.Color(),
    markColor: new THREE.Color(0x49392e),
    baseColor,
    flatten: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
    yawRotation: new THREE.Quaternion(),
    position: new THREE.Vector3(),
    scale: new THREE.Vector3(),
    matrix: new THREE.Matrix4(),
    zeroScale: new THREE.Vector3(0, 0, 0),
    unitScale: new THREE.Vector3(1, 1, 1),
    up: new THREE.Vector3(0, 1, 0),
  };
}

function createSurfaceMarkPools() {
  surfaceMarkPools.footprints = createSurfaceMarkPool('footprint', 220);
  surfaceMarkPools.tracks = createSurfaceMarkPool('track', 440);
}

function spawnSurfaceMark(pool, x, z, yaw, width, length) {
  if (!pool) return;
  const index = pool.cursor;
  pool.cursor = (pool.cursor + 1) % pool.capacity;
  const record = pool.records[index];
  record.active = true;
  record.age = 0;
  record.x = x;
  record.y = terrainHeight(x, z) + 0.018;
  record.z = z;
  record.yaw = yaw;
  record.width = width;
  record.length = length;
  pool.position.set(x, record.y, z);
  pool.yawRotation.setFromAxisAngle(pool.up, yaw);
  const rotation = pool.yawRotation.clone().multiply(pool.flatten);
  pool.scale.set(width, length, 1);
  pool.matrix.compose(pool.position, rotation, pool.scale);
  pool.mesh.setMatrixAt(index, pool.matrix);
  pool.mesh.setColorAt(index, pool.markColor);
  pool.mesh.instanceMatrix.needsUpdate = true;
  pool.mesh.instanceColor.needsUpdate = true;
}

function updateSurfaceMarks(delta) {
  for (const pool of Object.values(surfaceMarkPools)) {
    if (!pool) continue;
    let colorsChanged = false;
    for (let index = 0; index < pool.capacity; index += 1) {
      const record = pool.records[index];
      if (!record.active) continue;
      record.age += delta;
      if (record.age >= SURFACE_MARK_LIFETIME) {
        record.active = false;
        pool.matrix.compose(pool.position.set(record.x, record.y, record.z), pool.flatten, pool.zeroScale);
        pool.mesh.setMatrixAt(index, pool.matrix);
        pool.mesh.setColorAt(index, pool.baseColor);
        pool.mesh.instanceMatrix.needsUpdate = true;
        colorsChanged = true;
        continue;
      }
      const progress = record.age / SURFACE_MARK_LIFETIME;
      const fade = 1 - THREE.MathUtils.smoothstep(progress, 0.34, 1);
      pool.color.copy(pool.baseColor).lerp(pool.markColor, fade);
      pool.mesh.setColorAt(index, pool.color);
      colorsChanged = true;
    }
    if (colorsChanged) pool.mesh.instanceColor.needsUpdate = true;
  }
}

function clearSurfaceMarks() {
  for (const pool of Object.values(surfaceMarkPools)) {
    if (!pool) continue;
    for (let index = 0; index < pool.capacity; index += 1) {
      pool.records[index].active = false;
      pool.records[index].age = SURFACE_MARK_LIFETIME;
      pool.mesh.setMatrixAt(index, pool.matrix.makeScale(0, 0, 0));
      pool.mesh.setColorAt(index, pool.baseColor);
    }
    pool.mesh.instanceMatrix.needsUpdate = true;
    pool.mesh.instanceColor.needsUpdate = true;
    pool.cursor = 0;
  }
}

function initAudio() {
  if (audio.context) {
    if (audio.context.state === 'suspended') {
      audio.context.resume().catch((error) => {
        console.warn('No se pudo reanudar el audio de la misión.', error);
      });
    }
    return;
  }
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    console.warn('Web Audio API no está disponible en este navegador.');
    return;
  }
  const context = new AudioContextConstructor();
  const master = context.createGain();
  master.gain.value = 0.72;
  master.connect(context.destination);
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const noise = buffer.getChannelData(0);
  for (let index = 0; index < noise.length; index += 1) {
    noise[index] = (Math.random() * 2 - 1) * (0.65 + Math.random() * 0.35);
  }
  const wind = context.createBufferSource();
  wind.buffer = buffer;
  wind.loop = true;
  const windFilter = context.createBiquadFilter();
  windFilter.type = 'lowpass';
  windFilter.frequency.value = 720;
  const windGain = context.createGain();
  windGain.gain.value = 0.045;
  wind.connect(windFilter);
  windFilter.connect(windGain);
  windGain.connect(master);
  wind.start();

  const motor = context.createOscillator();
  motor.type = 'sawtooth';
  motor.frequency.value = 48;
  const motorFilter = context.createBiquadFilter();
  motorFilter.type = 'lowpass';
  motorFilter.frequency.value = 190;
  const motorGain = context.createGain();
  motorGain.gain.value = 0;
  motor.connect(motorFilter);
  motorFilter.connect(motorGain);
  motorGain.connect(master);
  motor.start();

  audio.context = context;
  audio.windFilter = windFilter;
  audio.windGain = windGain;
  audio.motorOscillator = motor;
  audio.motorFilter = motorFilter;
  audio.motorGain = motorGain;
  audio.masterGain = master;
  audio.footstepBuffer = buffer;
}

function playUiBeep(frequency = 680, duration = 0.075) {
  if (!audio.context || audio.context.state !== 'running') return;
  const oscillator = audio.context.createOscillator();
  const gain = audio.context.createGain();
  const now = audio.context.currentTime;
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.075, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audio.masterGain);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

function playFootstep() {
  if (!audio.context || audio.context.state !== 'running') return;
  const source = audio.context.createBufferSource();
  const filter = audio.context.createBiquadFilter();
  const gain = audio.context.createGain();
  const now = audio.context.currentTime;
  source.buffer = audio.footstepBuffer;
  source.playbackRate.value = 14;
  filter.type = 'lowpass';
  filter.frequency.value = 115;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audio.masterGain);
  source.start(now);
  source.stop(now + 0.14);
}

function updateAudio() {
  if (!audio.context || audio.context.state !== 'running') return;
  const now = audio.context.currentTime;
  const storm = state.started && !state.inside ? getWeatherIntensity() : 0;
  const windLevel = state.started && !state.paused ? 0.025 + state.weather.dustLevel * 0.12 + storm * 0.06 : 0;
  audio.windGain.gain.setTargetAtTime(windLevel, now, 0.18);
  audio.windFilter.frequency.setTargetAtTime(state.inside ? 230 : 520 + state.weather.windSpeed * 3, now, 0.2);
  const roverSpeed = state.driving && !state.paused ? Math.abs(state.roverSpeed) : 0;
  audio.motorGain.gain.setTargetAtTime(Math.min(0.055, roverSpeed * 0.016), now, 0.1);
  audio.motorOscillator.frequency.setTargetAtTime(44 + roverSpeed * 22, now, 0.12);
  audio.motorFilter.frequency.setTargetAtTime(120 + roverSpeed * 50, now, 0.12);
}

function buildTerrain() {
  const geometry = new THREE.PlaneGeometry(560, 560, 300, 300);
  const positions = geometry.attributes.position;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const z = -positions.getY(index);
    positions.setZ(index, terrainHeight(x, z));
  }
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();

  const groundMaps = makeGroundTexture();
  rockBumpMap = groundMaps.bumpMap;
  const ground = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: groundMaps.texture,
      bumpMap: groundMaps.bumpMap,
      bumpScale: 0.15,
      color: 0xd3c0aa,
      roughness: 1,
      metalness: 0,
    }),
  );
  ground.receiveShadow = true;
  scene.add(ground);
}

function buildMountains() {
  const palette = [0x55443c, 0x695247, 0x72594a, 0x51433d, 0x80624f];
  for (let index = 0; index < 16; index += 1) {
    const angle = ((index + Math.random() * 0.4) / 16) * Math.PI * 2;
    const distance = 178 + Math.random() * 55;
    const radius = 5 + Math.random() * 9;
    const height = 2.5 + Math.random() * 5.5;
    const mountain = new THREE.Mesh(
      createRockGeometry(800 + index, 2),
      new THREE.MeshStandardMaterial({ color: palette[index % palette.length], roughness: 1, vertexColors: true }),
    );
    const x = Math.sin(angle) * distance;
    const z = Math.cos(angle) * distance - 40;
    mountain.position.set(x, terrainHeight(x, z) + height * 0.55, z);
    mountain.rotation.y = Math.random() * Math.PI;
    mountain.scale.set(radius, height, radius * (0.55 + Math.random() * 0.3));
    mountain.castShadow = true;
    mountain.receiveShadow = true;
    scene.add(mountain);
  }
}

function createRockGeometry(seed, detail = 1) {
  const geometry = new THREE.IcosahedronGeometry(1, detail);
  const sourcePositions = geometry.attributes.position;
  const vertices = [];
  const colors = [];
  const indices = [];
  const weldedVertices = new Map();

  for (let index = 0; index < sourcePositions.count; index += 1) {
    const x = sourcePositions.getX(index);
    const y = sourcePositions.getY(index);
    const z = sourcePositions.getZ(index);
    const key = `${Math.round(x * 100000)},${Math.round(y * 100000)},${Math.round(z * 100000)}`;
    let vertexIndex = weldedVertices.get(key);
    if (vertexIndex === undefined) {
      const random = Math.sin(seed * 12.9898 + x * 78.233 + y * 37.719 + z * 23.173) * 43758.5453;
      const noise = random - Math.floor(random);
      const radius = 0.84 + noise * 0.28;
      vertexIndex = vertices.length / 3;
      weldedVertices.set(key, vertexIndex);
      vertices.push(x * radius, y * radius, z * radius);
      const tone = 0.78 + noise * 0.3;
      colors.push(tone, tone * (0.9 + noise * 0.08), tone * (0.82 + noise * 0.1));
    }
    indices.push(vertexIndex);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function addRock(x, z, scale, color, addCollision = true, options = {}) {
  const seed = options.seed || Math.floor(Math.random() * 100000);
  rockSequence += 1;
  const profileId = options.profileId || chooseSampleProfile(seed);
  const profile = sampleProfiles[profileId];
  const sourceColor = color instanceof THREE.Color ? color.clone() : new THREE.Color(color);
  const materialColor = options.profileId ? sourceColor : sourceColor.lerp(new THREE.Color(profile.color), 0.58);
  const rock = new THREE.Mesh(
    createRockGeometry(seed, options.detail || 2),
    new THREE.MeshStandardMaterial({
      color: materialColor,
      roughness: options.roughness || profile.roughness,
      metalness: 0,
      bumpMap: rockBumpMap,
      bumpScale: 0.035,
      vertexColors: true,
    }),
  );
  const y = terrainHeight(x, z);
  rock.position.set(x, y + scale.y * 0.6, z);
  rock.scale.set(scale.x, scale.y, scale.z);
  rock.rotation.set(Math.random() * 0.5, (seed % 1000) / 1000 * Math.PI * 2, Math.random() * 0.35);
  rock.castShadow = scale.x > 0.8;
  rock.receiveShadow = true;
  scene.add(rock);

  const collision = addCollision && scale.x > 0.72
    ? { x, z, radius: Math.max(scale.x, scale.z) * 0.72 }
    : null;
  if (collision) collisionObjects.push(collision);

  const sampleId = options.sampleId || `MAR-P${String(rockSequence).padStart(4, '0')}`;
  interactiveObjects.push({
    object: rock,
    type: 'rock',
    label: `Muestra ${sampleId}`,
    data: {
      sampleId,
      profileId,
      x,
      z,
      seed,
      scale: { ...scale },
      color: materialColor.getHex(),
      collision,
      collected: false,
    },
  });
  return rock;
}

function buildRocks() {
  const sampleSpots = [
    { x: 4.5, z: 8, id: 'MAR-001', profileId: 'basalt', color: 0x765d4f, seed: 1041 },
    { x: -5.5, z: -13.5, id: 'MAR-002', profileId: 'breccia', color: 0x9a7051, seed: 2057 },
    { x: 1.5, z: -22, id: 'MAR-003', profileId: 'olivine', color: 0x78654b, seed: 3091 },
  ];

  const rockPalette = [0x66544a, 0x76604d, 0x85694f, 0x514a44, 0x967455, 0x61524a];
  let placed = 0;
  let attempts = 0;
  while (placed < 220 && attempts < 1400) {
    attempts += 1;
    const x = (Math.random() - 0.5) * 220;
    const z = (Math.random() - 0.5) * 220;
    if (
      Math.hypot(x, z - basePosition.z) < 14 ||
      Math.hypot(x, z - 22) < 7 ||
      Math.hypot(x - 13.6, z + 50.2) < 5.5 ||
      Math.hypot(x - 11.5, z + 40) < 4.5 ||
      sampleSpots.some((spot) => Math.hypot(x - spot.x, z - spot.z) < 4)
    ) continue;
    const sizeRoll = Math.random();
    const size = sizeRoll < 0.58
      ? 0.12 + Math.random() * 0.27
      : sizeRoll < 0.88
        ? 0.38 + Math.random() * 0.48
        : sizeRoll < 0.985
          ? 0.88 + Math.random() * 0.58
          : 1.5 + Math.random() * 0.55;
    if (collisionObjects.some((rock) => Math.hypot(x - rock.x, z - rock.z) < Math.max(size * 0.75, 0.55) + rock.radius)) continue;
    const color = rockPalette[Math.floor(Math.random() * rockPalette.length)];
    addRock(
      x,
      z,
      { x: size, y: size * (0.52 + Math.random() * 0.43), z: size * (0.72 + Math.random() * 0.55) },
      color,
      true,
      { seed: attempts + 10, detail: size < 0.2 ? 1 : 2 },
    );
    placed += 1;
  }

  for (const spot of sampleSpots) {
    addRock(
      spot.x,
      spot.z,
      { x: 0.9, y: 0.78, z: 0.95 },
      spot.color,
      true,
      { seed: spot.seed, sampleId: spot.id, profileId: spot.profileId, detail: 2 },
    );
  }

  const nearbyRocks = [
    [-7, 7, 0.58], [8, 10, 0.74], [12, -9, 0.52], [-13, -17, 0.68],
    [6, -29, 0.76], [-8, -32, 0.53], [15, -40, 0.9], [-15, -51, 0.74],
    [11, -66, 0.62], [-19, -71, 0.92], [25, -78, 0.68],
  ];
  for (const [x, z, size] of nearbyRocks) {
    addRock(x, z, { x: size, y: size * 0.72, z: size * 0.85 }, 0xa85e3e, true, { seed: Math.round(Math.abs(x * 29 + z * 17)) });
  }
}

function buildRockFragments() {
  const fragmentCount = 540;
  const clusterCenters = [
    { x: 0, z: 15 }, { x: -8, z: 9 }, { x: 8, z: 11 },
    { x: -18, z: 8 }, { x: 16, z: 5 }, { x: -24, z: -16 },
    { x: 20, z: -28 }, { x: -34, z: -48 }, { x: 24, z: -64 },
    { x: 48, z: 14 }, { x: -52, z: 42 }, { x: 56, z: -48 },
  ];
  const palette = [0x514943, 0x6c5749, 0x826550, 0x867665, 0x45413c, 0x917456];
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  for (let variant = 0; variant < 3; variant += 1) {
    const count = Math.ceil(fragmentCount / 3);
    const geometry = createRockGeometry(7000 + variant * 47, 1);
    const material = new THREE.MeshStandardMaterial({
      roughness: 0.98,
      bumpMap: rockBumpMap,
      bumpScale: 0.025,
      vertexColors: true,
    });
    const fragments = new THREE.InstancedMesh(geometry, material, count);
    let placed = 0;
    while (placed < count) {
      let x;
      let z;
      if (Math.random() < 0.84) {
        const cluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * 14;
        x = cluster.x + Math.cos(angle) * distance;
        z = cluster.z + Math.sin(angle) * distance;
      } else {
        x = (Math.random() - 0.5) * 220;
        z = (Math.random() - 0.5) * 220;
      }
      if (Math.hypot(x, z - basePosition.z) < 11) continue;

      const size = 0.11 + Math.random() * 0.3;
      dummy.position.set(x, terrainHeight(x, z) + size * 0.2, z);
      dummy.rotation.set(Math.random() * 0.6, Math.random() * Math.PI * 2, Math.random() * 0.6);
      dummy.scale.set(size, size * (0.32 + Math.random() * 0.38), size * (0.7 + Math.random() * 0.6));
      dummy.updateMatrix();
      fragments.setMatrixAt(placed, dummy.matrix);
      color.setHex(palette[Math.floor(Math.random() * palette.length)]);
      fragments.setColorAt(placed, color);
      placed += 1;
    }
    fragments.instanceMatrix.needsUpdate = true;
    if (fragments.instanceColor) fragments.instanceColor.needsUpdate = true;
    fragments.computeBoundingSphere();
    fragments.castShadow = false;
    fragments.receiveShadow = true;
    scene.add(fragments);
  }
}

function addBox(parent, size, position, material, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.set(position.x, position.y, position.z);
  mesh.castShadow = options.castShadow !== false;
  mesh.receiveShadow = options.receiveShadow !== false;
  parent.add(mesh);
  return mesh;
}

function makeSolarArray(parent, x, z, width = 8, rows = 2, columns = 4) {
  const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x777a79, metalness: 0.75, roughness: 0.42 });
  const legHeight = 1.1;
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, legHeight, 8), supportMaterial);
    leg.position.set(x + side * width * 0.44, terrainHeight(x, z) + legHeight / 2, z);
    leg.castShadow = true;
    parent.add(leg);
  }

  const panelGroup = new THREE.Group();
  panelGroup.position.set(x, terrainHeight(x, z) + legHeight + 0.08, z);
  panelGroup.rotation.x = -0.17;
  parent.add(panelGroup);
  collisionObjects.push({ x, z, radius: width * 0.5 });
  interactiveObjects.push({
    object: panelGroup,
    type: 'solar',
    label: 'Panel solar',
    data: { x, z, width },
  });
  if (!solarPosition) solarPosition = new THREE.Vector3(x, 0, z);

  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x183a50,
    metalness: 0.42,
    roughness: 0.35,
    emissive: 0x091522,
  });
  const panelWidth = width / columns;
  const panelDepth = 1.25;
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(panelWidth - 0.12, 0.09, panelDepth - 0.1),
        panelMaterial,
      );
      panel.position.set(
        (column - (columns - 1) / 2) * panelWidth,
        0,
        (row - (rows - 1) / 2) * panelDepth,
      );
      panel.castShadow = true;
      panelGroup.add(panel);

      const gridMaterial = new THREE.LineBasicMaterial({ color: 0x7bb5c6, transparent: true, opacity: 0.5 });
      const points = [
        new THREE.Vector3(-panelWidth / 2 + 0.04, 0.05, 0),
        new THREE.Vector3(panelWidth / 2 - 0.04, 0.05, 0),
        new THREE.Vector3(0, 0.05, -panelDepth / 2 + 0.05),
        new THREE.Vector3(0, 0.05, panelDepth / 2 - 0.05),
      ];
      const lines = new THREE.BufferGeometry().setFromPoints(points);
      panel.add(new THREE.LineSegments(lines, gridMaterial));
    }
  }
}

function makePod(parent, x, z, radius, length, color) {
  const group = new THREE.Group();
  const groundY = terrainHeight(x, z);
  group.position.set(x, groundY + radius, z);
  parent.add(group);

  const shellMaterial = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.32,
    roughness: 0.42,
  });
  dustSensitiveMaterials.push({ material: shellMaterial, baseColor: new THREE.Color(color) });
  const shell = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 8, 18), shellMaterial);
  shell.rotation.x = Math.PI / 2;
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xa6a7a3, metalness: 0.76, roughness: 0.35 });
  const halfLength = length / 2;
  for (const offset of [-halfLength * 0.56, 0, halfLength * 0.56]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.97, 0.085, 8, 28), ringMaterial);
    ring.position.z = offset;
    group.add(ring);
  }

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x132e37,
    emissive: 0x245d65,
    emissiveIntensity: 0.5,
    metalness: 0.2,
    roughness: 0.2,
  });
  const window = new THREE.Mesh(new THREE.CircleGeometry(0.44, 24), windowMaterial);
  window.position.set(0, 0.24, length / 2 + radius * 0.78);
  group.add(window);
  const windowFrame = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.065, 8, 24), ringMaterial);
  windowFrame.position.copy(window.position);
  group.add(windowFrame);

  return group;
}

function buildBase() {
  baseExterior = new THREE.Group();
  scene.add(baseExterior);

  const habitat = makePod(baseExterior, 0, basePosition.z, 2.7, 8.4, 0xd8d7ce);
  habitat.rotation.y = 0;
  const lab = makePod(baseExterior, 7.6, -54, 2.05, 5.2, 0xcacbc4);
  lab.rotation.y = 0.12;
  const storage = makePod(baseExterior, 13.6, -50.2, 1.7, 4.2, 0xbfc4c1);
  storage.rotation.y = -0.14;

  const hatchZ = basePosition.z + 7.4;
  const hatchY = terrainHeight(0, hatchZ) + 2.0;
  const hatchMaterial = new THREE.MeshStandardMaterial({ color: 0x52636a, metalness: 0.68, roughness: 0.34 });
  const hatch = new THREE.Mesh(new THREE.CircleGeometry(0.9, 28), hatchMaterial);
  hatch.position.set(0, hatchY, hatchZ);
  baseExterior.add(hatch);
  interactiveObjects.push({ object: hatch, type: 'door', label: 'Esclusa del hábitat', data: { x: 0, z: hatchZ } });
  const hatchFrame = new THREE.Mesh(
    new THREE.TorusGeometry(1.04, 0.18, 12, 32),
    new THREE.MeshStandardMaterial({ color: 0xe4a763, metalness: 0.6, roughness: 0.35 }),
  );
  hatchFrame.position.copy(hatch.position);
  baseExterior.add(hatchFrame);
  for (let index = 0; index < 4; index += 1) {
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x95eadb, toneMapped: false }),
    );
    const angle = (index / 4) * Math.PI * 2;
    lamp.position.set(Math.cos(angle) * 1.35, hatchY + Math.sin(angle) * 1.35, hatchZ);
    baseExterior.add(lamp);
  }

  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x727674, metalness: 0.74, roughness: 0.42 });
  for (const x of [-2, 2]) {
    for (const zOffset of [-4, 4]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.19, 1.55, 8), legMaterial);
      leg.position.set(x, terrainHeight(x, basePosition.z + zOffset) + 0.76, basePosition.z + zOffset);
      leg.castShadow = true;
      baseExterior.add(leg);
    }
  }

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xa5dfd1,
    transparent: true,
    opacity: 0.22,
    roughness: 0.2,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  const greenhouseX = -8.7;
  const greenhouseZ = -52;
  const greenhouse = new THREE.Mesh(new THREE.SphereGeometry(2.9, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), glassMaterial);
  greenhouse.position.set(greenhouseX, terrainHeight(greenhouseX, greenhouseZ) + 0.2, greenhouseZ);
  greenhouse.castShadow = true;
  baseExterior.add(greenhouse);
  const greenhouseRim = new THREE.Mesh(
    new THREE.TorusGeometry(2.88, 0.1, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x8a9b91, metalness: 0.72, roughness: 0.42 }),
  );
  greenhouseRim.rotation.x = Math.PI / 2;
  greenhouseRim.position.set(greenhouseX, terrainHeight(greenhouseX, greenhouseZ) + 0.13, greenhouseZ);
  baseExterior.add(greenhouseRim);
  for (let row = 0; row < 3; row += 1) {
    const plant = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 0.12, 0.17),
      new THREE.MeshStandardMaterial({ color: 0x497e4e, emissive: 0x173b23, emissiveIntensity: 0.25 }),
    );
    plant.position.set(greenhouseX, terrainHeight(greenhouseX, greenhouseZ) + 0.45 + row * 0.35, greenhouseZ + (row - 1) * 0.75);
    baseExterior.add(plant);
  }

  makeSolarArray(baseExterior, -15.7, -39.5, 8.6, 2, 4);
  makeSolarArray(baseExterior, 14, -63, 7.4, 2, 4);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.16, 8.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x8d8a7f, metalness: 0.7, roughness: 0.4 }),
  );
  pole.position.set(19, terrainHeight(19, -51) + 4.25, -51);
  baseExterior.add(pole);
  const antennaDish = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xd6d0bf, metalness: 0.67, roughness: 0.36, side: THREE.DoubleSide }),
  );
  antennaDish.position.set(19, terrainHeight(19, -51) + 8.1, -51);
  antennaDish.rotation.x = -0.65;
  baseExterior.add(antennaDish);

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.65, 13, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x8de6da, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }),
  );
  beacon.position.set(0, hatchY + 6.8, hatchZ - 0.25);
  baseExterior.add(beacon);
  const beaconLight = new THREE.PointLight(0x9ce8df, 9, 24, 2);
  beaconLight.position.set(0, hatchY + 1.4, hatchZ);
  baseExterior.add(beaconLight);

  makeRover(baseExterior);
  collisionObjects.push(
    { x: 0, z: basePosition.z, radius: 4.8 },
    { x: 7.6, z: -54, radius: 3.8 },
    { x: 13.6, z: -50.2, radius: 3 },
    { x: -8.7, z: -52, radius: 3.2 },
    { x: 19, z: -51, radius: 1.2 },
  );

  buildInterior();
}

function addRoverLink(parent, start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const link = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.78, radius, length, 10),
    material,
  );
  link.position.copy(start).add(end).multiplyScalar(0.5);
  link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  link.userData.baseLength = length;
  link.castShadow = true;
  link.receiveShadow = true;
  parent.add(link);
  return link;
}

function updateRoverLink(link, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  link.position.copy(start).add(end).multiplyScalar(0.5);
  link.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  link.scale.y = direction.length() / link.userData.baseLength;
}

function makeRover(parent) {
  const rover = new THREE.Group();
  rover.position.set(11.5, terrainHeight(11.5, -40), -40);
  rover.rotation.y = state.roverYaw;
  parent.add(rover);
  roverGroup = rover;
  roverPosition = new THREE.Vector3(11.5, 0, -40);
  roverCollision = { x: roverPosition.x, z: roverPosition.z, radius: 2.1, rover: true };
  collisionObjects.push(roverCollision);
  interactiveObjects.push({ object: rover, type: 'rover', label: 'Rover científico', data: { x: roverPosition.x, z: roverPosition.z } });

  roverBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xc4b49e, metalness: 0.42, roughness: 0.58 });
  const chassisShape = new THREE.Shape();
  chassisShape.moveTo(-1.02, 0);
  chassisShape.lineTo(-1.14, 0.12);
  chassisShape.lineTo(-0.91, 0.67);
  chassisShape.lineTo(0.58, 0.74);
  chassisShape.lineTo(1.04, 0.45);
  chassisShape.lineTo(1.04, 0.13);
  chassisShape.lineTo(0.84, 0);
  chassisShape.closePath();
  const chassisGeometry = new THREE.ExtrudeGeometry(chassisShape, {
    depth: 1.8,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.055,
    bevelThickness: 0.055,
  });
  chassisGeometry.translate(0, 0, -0.9);
  chassisGeometry.rotateY(Math.PI / 2);
  const chassis = new THREE.Mesh(chassisGeometry, roverBodyMaterial);
  chassis.position.y = 0.52;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  rover.add(chassis);

  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x6f7776, metalness: 0.74, roughness: 0.38 });
  const suspensionMaterial = new THREE.MeshStandardMaterial({ color: 0x858982, metalness: 0.76, roughness: 0.4 });
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x303638, metalness: 0.28, roughness: 0.68 });
  const thermalMaterial = new THREE.MeshStandardMaterial({ color: 0x64594e, metalness: 0.14, roughness: 0.9 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.1, 1.66), frameMaterial);
  deck.position.set(0, 1.33, 0);
  deck.castShadow = true;
  rover.add(deck);
  const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.18, 1.82), darkMaterial);
  bellyPan.position.set(0, 0.51, 0);
  bellyPan.castShadow = true;
  rover.add(bellyPan);
  const instrumentHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.33, 0.43, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0xa9997f, metalness: 0.3, roughness: 0.56 }),
  );
  instrumentHousing.position.set(-0.23, 1.58, -0.06);
  instrumentHousing.rotation.y = Math.PI / 8;
  instrumentHousing.castShadow = true;
  rover.add(instrumentHousing);
  const instrumentGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.025, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x839d9d, metalness: 0.35, roughness: 0.18, clearcoat: 0.8 }),
  );
  instrumentGlass.position.set(-0.23, 1.76, -0.06);
  rover.add(instrumentGlass);

  roverWheelMaterial = new THREE.MeshStandardMaterial({ color: roverWheelBasePaint, roughness: 0.9, metalness: 0.12 });
  const wheelRimMaterial = new THREE.MeshStandardMaterial({ color: 0x9b9b8d, metalness: 0.82, roughness: 0.32 });
  const treadGeometry = new THREE.BoxGeometry(0.26, 0.045, 0.065);
  roverWheels = [];
  roverBogieLinks = [];
  const roverWheelRadius = 0.28;
  for (const side of [-1, 1]) {
    const x = side * 1.29;
    const chassisPivot = new THREE.Vector3(side * 0.72, 0.94, 0.22);
    const rockerPivot = new THREE.Vector3(side * 1.02, 0.45, 0.3);
    const frontHub = new THREE.Vector3(x, roverWheelRadius, -1.02);
    const middleHub = new THREE.Vector3(x, roverWheelRadius, 0);
    const rearHub = new THREE.Vector3(x, roverWheelRadius, 1.02);
    const frontRocker = addRoverLink(rover, chassisPivot, frontHub, 0.075, suspensionMaterial);
    addRoverLink(rover, chassisPivot, rockerPivot, 0.065, frameMaterial);
    const middleBogie = addRoverLink(rover, rockerPivot, middleHub, 0.075, suspensionMaterial);
    const rearBogie = addRoverLink(rover, rockerPivot, rearHub, 0.075, suspensionMaterial);
    roverBogieLinks.push({ side, chassisPivot, rockerPivot, frontRocker, middleBogie, rearBogie });

    for (const joint of [chassisPivot, rockerPivot, frontHub, middleHub, rearHub]) {
      const bearing = new THREE.Mesh(new THREE.SphereGeometry(joint === rockerPivot ? 0.12 : 0.095, 12, 10), frameMaterial);
      bearing.position.copy(joint);
      bearing.castShadow = true;
      rover.add(bearing);
    }

    for (const axle of [-1, 0, 1]) {
      const z = axle * 1.02;
      const suspension = new THREE.Group();
      suspension.position.set(x, roverWheelRadius, z);
      rover.add(suspension);
      const steeringPivot = new THREE.Group();
      suspension.add(steeringPivot);
      const wheel = new THREE.Group();
      steeringPivot.add(wheel);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(roverWheelRadius, roverWheelRadius, 0.22, 32, 1), roverWheelMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      tire.receiveShadow = true;
      wheel.add(tire);

      const treadLugs = new THREE.InstancedMesh(treadGeometry, roverWheelMaterial, 24);
      const lugTransform = new THREE.Object3D();
      for (let lug = 0; lug < 24; lug += 1) {
        const angle = (lug / 24) * Math.PI * 2;
        lugTransform.position.set(0, Math.cos(angle) * (roverWheelRadius + 0.012), Math.sin(angle) * (roverWheelRadius + 0.012));
        lugTransform.rotation.set(angle, 0, 0);
        lugTransform.updateMatrix();
        treadLugs.setMatrixAt(lug, lugTransform.matrix);
      }
      treadLugs.instanceMatrix.needsUpdate = true;
      treadLugs.castShadow = true;
      wheel.add(treadLugs);

      for (const direction of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.018, 8, 24), wheelRimMaterial);
        rim.rotation.y = Math.PI / 2;
        rim.position.x = direction * 0.12;
        wheel.add(rim);
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.26, 16), wheelRimMaterial);
        hub.rotation.z = Math.PI / 2;
        wheel.add(hub);
      }
      roverWheels.push({ suspension, steeringPivot, wheel, radius: roverWheelRadius, side, offset: x, axle: z });
    }
  }

  const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.76, 20), thermalMaterial);
  rtg.rotation.z = Math.PI / 2;
  rtg.position.set(0, 0.98, 0.86);
  rtg.castShadow = true;
  rover.add(rtg);
  for (let fin = 0; fin < 7; fin += 1) {
    const angle = (fin / 7) * Math.PI * 2;
    const finMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.27, 0.04), frameMaterial);
    finMesh.position.set(0, 0.98 + Math.cos(angle) * 0.21, 0.86 + Math.sin(angle) * 0.21);
    finMesh.rotation.x = angle;
    rover.add(finMesh);
  }

  const mastMaterial = new THREE.MeshStandardMaterial({ color: 0x898c86, metalness: 0.78, roughness: 0.34 });
  const mastBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.22, 12), frameMaterial);
  mastBase.position.set(0.28, 1.47, -0.28);
  rover.add(mastBase);
  addRoverLink(rover, new THREE.Vector3(0.28, 1.52, -0.28), new THREE.Vector3(0.28, 2.08, -0.28), 0.045, mastMaterial);
  const cameraHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.28, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x454b49, metalness: 0.68, roughness: 0.31 }),
  );
  cameraHead.position.set(0.28, 2.15, -0.28);
  cameraHead.castShadow = true;
  rover.add(cameraHead);
  for (const x of [0.09, 0.28, 0.47]) {
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(x === 0.28 ? 0.07 : 0.045, 12, 10),
      new THREE.MeshPhysicalMaterial({ color: 0x70c9d0, emissive: 0x164c52, emissiveIntensity: 0.45, metalness: 0.42, roughness: 0.18, clearcoat: 1 }),
    );
    lens.position.set(x, 2.15, -0.445);
    rover.add(lens);
  }
  const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.72, 10), mastMaterial);
  antennaStem.position.set(-0.64, 1.75, 0.48);
  rover.add(antennaStem);
  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: 0xc8b99c, metalness: 0.64, roughness: 0.34, side: THREE.DoubleSide }),
  );
  dish.position.set(-0.64, 2.12, 0.48);
  dish.rotation.x = Math.PI;
  rover.add(dish);

  const scienceArmMaterial = new THREE.MeshStandardMaterial({ color: 0x9d9788, metalness: 0.7, roughness: 0.4 });
  addRoverLink(rover, new THREE.Vector3(-0.8, 1.26, -0.58), new THREE.Vector3(-1.2, 0.83, -0.82), 0.06, scienceArmMaterial);
  addRoverLink(rover, new THREE.Vector3(-1.2, 0.83, -0.82), new THREE.Vector3(-1.2, 0.59, -1.02), 0.045, scienceArmMaterial);
  const turret = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.2, 12), darkMaterial);
  turret.position.set(-1.2, 0.52, -1.02);
  turret.rotation.x = Math.PI / 2;
  rover.add(turret);

  const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x393e3d, metalness: 0.24, roughness: 0.72 });
  for (const x of [-0.62, 0.62]) {
    const instrument = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.28, 12), cableMaterial);
    instrument.position.set(x, 1.48, 0.47);
    rover.add(instrument);
  }

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xe9dfca,
    emissive: 0xffdca2,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });
  for (const x of [-0.72, 0.72]) {
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), headlightMaterial);
    headlight.position.set(x, 0.68, -1.01);
    rover.add(headlight);
  }
}

function buildInterior() {
  baseInterior = new THREE.Group();
  baseInterior.visible = false;
  scene.add(baseInterior);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x737b7b, metalness: 0.28, roughness: 0.64 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444b4c, metalness: 0.24, roughness: 0.72 });
  const lightMaterial = new THREE.MeshStandardMaterial({
    color: 0xc4ebd7,
    emissive: 0x70c7a6,
    emissiveIntensity: 0.68,
    roughness: 0.3,
  });

  addBox(baseInterior, new THREE.Vector3(9.2, 0.25, 16), new THREE.Vector3(0, -0.12, -53.6), floorMaterial);
  addBox(baseInterior, new THREE.Vector3(0.24, 5, 16), new THREE.Vector3(-4.6, 2.5, -53.6), wallMaterial);
  addBox(baseInterior, new THREE.Vector3(0.24, 5, 16), new THREE.Vector3(4.6, 2.5, -53.6), wallMaterial);
  addBox(baseInterior, new THREE.Vector3(9.2, 5, 0.24), new THREE.Vector3(0, 2.5, -61.5), wallMaterial);
  addBox(baseInterior, new THREE.Vector3(2.8, 5, 0.24), new THREE.Vector3(-3.2, 2.5, -45.7), wallMaterial);
  addBox(baseInterior, new THREE.Vector3(2.8, 5, 0.24), new THREE.Vector3(3.2, 2.5, -45.7), wallMaterial);
  addBox(baseInterior, new THREE.Vector3(3.6, 1.1, 0.24), new THREE.Vector3(0, 4.45, -45.7), wallMaterial);
  addBox(baseInterior, new THREE.Vector3(9.2, 0.2, 16), new THREE.Vector3(0, 5.05, -53.6), wallMaterial);

  for (const x of [-2.4, 0, 2.4]) {
    const ceilingLight = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.18), lightMaterial);
    ceilingLight.position.set(x, 4.86, -53.5);
    baseInterior.add(ceilingLight);
  }
  const interiorLight = new THREE.PointLight(0xa6e8d2, 16, 18, 2);
  interiorLight.position.set(0, 3.8, -53.7);
  baseInterior.add(interiorLight);

  const consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x3e4c4e, metalness: 0.5, roughness: 0.42 });
  addBox(baseInterior, new THREE.Vector3(2.3, 1.1, 0.8), new THREE.Vector3(0, 0.62, -59), consoleMaterial);
  const consoleScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.65, 0.72),
    new THREE.MeshBasicMaterial({ color: 0x6dcdbd, transparent: true, opacity: 0.86, side: THREE.DoubleSide }),
  );
  consoleScreen.position.set(0, 1.48, -58.55);
  consoleScreen.rotation.x = -0.24;
  baseInterior.add(consoleScreen);
  consolePosition = new THREE.Vector3(0, 0, -58.45);
  interactiveObjects.push({
    type: 'console',
    label: 'Terminal de misión',
    data: { x: consolePosition.x, z: consolePosition.z },
  });
  interiorCollisionObjects.push({ x: 0, z: -59, radius: 1.55 });

  analyzerPosition = new THREE.Vector3(-2.2, 0, -54.8);
  const analyzer = new THREE.Group();
  analyzer.position.set(analyzerPosition.x, 0, analyzerPosition.z);
  baseInterior.add(analyzer);
  const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x7d8580, metalness: 0.44, roughness: 0.48 });
  addBox(analyzer, new THREE.Vector3(2.45, 0.18, 1.45), new THREE.Vector3(0, 1.02, 0), benchMaterial);
  for (const x of [-1, 1]) {
    for (const z of [-0.48, 0.48]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.08, 1.02, 8),
        new THREE.MeshStandardMaterial({ color: 0x636e6c, metalness: 0.72, roughness: 0.4 }),
      );
      leg.position.set(x, 0.51, z);
      analyzer.add(leg);
    }
  }
  const analyzerBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.88, 0.78),
    new THREE.MeshStandardMaterial({ color: 0x4e5e5e, metalness: 0.52, roughness: 0.39 }),
  );
  analyzerBody.position.set(-0.2, 1.53, -0.05);
  analyzerBody.castShadow = true;
  analyzer.add(analyzerBody);
  const analyzerTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.8, 12),
    new THREE.MeshStandardMaterial({ color: 0xa5afa5, metalness: 0.7, roughness: 0.31 }),
  );
  analyzerTube.position.set(0.3, 2.28, 0);
  analyzer.add(analyzerTube);
  const analyzerLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.13, 0.18, 12),
    new THREE.MeshStandardMaterial({ color: 0x58a99e, emissive: 0x236b60, emissiveIntensity: 0.55, metalness: 0.25, roughness: 0.25 }),
  );
  analyzerLens.position.set(0.3, 1.78, 0);
  analyzer.add(analyzerLens);
  const statusScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.32),
    new THREE.MeshBasicMaterial({ color: 0x70d7c3, side: THREE.DoubleSide }),
  );
  statusScreen.position.set(-0.2, 1.69, 0.351);
  analyzer.add(statusScreen);
  interactiveObjects.push({
    object: analyzer,
    type: 'analyzer',
    label: 'Analizador geológico',
    data: { x: analyzerPosition.x, z: analyzerPosition.z },
  });
  interiorCollisionObjects.push({ x: analyzerPosition.x, z: analyzerPosition.z, radius: 1.5 });

  for (const x of [-3.6, 3.6]) {
    const storage = addBox(
      baseInterior,
      new THREE.Vector3(0.62, 1.5, 1.2),
      new THREE.Vector3(x, 0.76, -53),
      new THREE.MeshStandardMaterial({ color: 0xa3a398, metalness: 0.35, roughness: 0.58 }),
    );
    storage.castShadow = true;
    interiorCollisionObjects.push({ x, z: -53, radius: 0.8 });
  }
}

function buildDust() {
  const count = 5400;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    velocities[index] = 0.75 + Math.random() * 0.5;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setDrawRange(0, 0);
  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0xd5a17c,
      map: texture,
      size: 0.18,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  particles.frustumCulled = false;
  scene.add(particles);
  dustParticles.push({ mesh: particles, velocities, count, activeCount: 0 });
}

function createScene() {
  buildSky();
  buildLighting();
  buildTerrain();
  createSurfaceMarkPools();
  buildMountains();
  buildRocks();
  buildRockFragments();
  buildBase();
  buildDust();
  scene.add(camera);

  camera.position.set(0, 8, 24);
  camera.lookAt(0, 3, -54);
}

function createSampleViewer() {
  viewerScene = new THREE.Scene();
  viewerScene.background = new THREE.Color(0x172023);
  viewerScene.add(new THREE.HemisphereLight(0xdce9dc, 0x33231d, 2.1));

  const keyLight = new THREE.DirectionalLight(0xffdfb5, 3.2);
  keyLight.position.set(-3, 5, 5);
  viewerScene.add(keyLight);

  viewerLighting = new THREE.PointLight(0x92e8e7, 0, 12, 2);
  viewerLighting.position.set(3, 1.5, 3);
  viewerScene.add(viewerLighting);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.1, 0.14, 48),
    new THREE.MeshStandardMaterial({ color: 0x485354, metalness: 0.4, roughness: 0.52 }),
  );
  table.position.y = -1.08;
  table.receiveShadow = true;
  viewerScene.add(table);

  viewerCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  viewerCamera.position.set(0, 0.1, viewerZoom);
  viewerCamera.lookAt(0, 0, 0);

  viewerRenderer = new THREE.WebGLRenderer({
    canvas: elements.sampleCanvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power',
  });
  viewerRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  viewerRenderer.outputColorSpace = THREE.SRGBColorSpace;
  viewerRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  viewerRenderer.toneMappingExposure = 1.15;
  resizeSampleViewer();
}

function resizeSampleViewer() {
  if (!viewerRenderer || !viewerCamera) return;
  const width = Math.max(1, elements.sampleCanvas.clientWidth);
  const height = Math.max(1, elements.sampleCanvas.clientHeight);
  viewerRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  viewerRenderer.setSize(width, height, false);
  viewerCamera.aspect = width / height;
  viewerCamera.updateProjectionMatrix();
}

function disposeViewerRock() {
  elements.sampleTerrainTag.classList.add('hidden');
  if (!viewerRockGroup) return;
  viewerScene.remove(viewerRockGroup);
  viewerRockGroup.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
      else object.material.dispose();
    }
  });
  viewerRockGroup = null;
  viewerMarker = null;
}

function showSampleInViewer(sample) {
  if (!sample || !viewerScene) return;
  disposeViewerRock();

  const profile = sampleProfiles[sample.profileId];
  viewerRockGroup = new THREE.Group();
  const rock = new THREE.Mesh(
    createRockGeometry(sample.seed, 3),
    new THREE.MeshStandardMaterial({
      color: sample.color ?? profile.color,
      roughness: profile.roughness,
      metalness: 0.025,
      flatShading: true,
      vertexColors: true,
    }),
  );
  const dimensions = sample.dimensions || { x: 1.18, y: 0.92, z: 0.95 };
  const maximumDimension = Math.max(dimensions.x, dimensions.y, dimensions.z);
  rock.scale.set(
    (dimensions.x / maximumDimension) * 1.25,
    (dimensions.y / maximumDimension) * 1.25,
    (dimensions.z / maximumDimension) * 1.25,
  );
  rock.castShadow = true;
  rock.receiveShadow = true;
  viewerRockGroup.add(rock);

  viewerMarker = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xffc36f, toneMapped: false }),
  );
  viewerMarker.position.set(0.43, 0.73, 0.15);
  viewerMarker.visible = false;
  viewerRockGroup.add(viewerMarker);
  viewerScene.add(viewerRockGroup);
  viewerYaw = -0.5;
  viewerPitch = 0.2;
  viewerZoom = 4;
  viewerRockGroup.rotation.set(0, 0, 0);
  elements.viewerMarkerButton.classList.remove('active');
  elements.viewerLightButton.classList.remove('active');
  viewerLighting.intensity = 0;
  elements.viewerPlaceholder.classList.add('hidden');
  elements.sampleTerrainTag.textContent = profile.terrainLabel;
  elements.sampleTerrainTag.classList.remove('hidden');
  elements.analysisResult.innerHTML =
    '<span class="result-placeholder">Muestra colocada en la mesa. Elige un instrumento para iniciar el análisis.</span>';
  elements.analyzeButton.disabled = false;
  updateViewerCamera();
}

function updateViewerCamera() {
  if (!viewerCamera) return;
  viewerCamera.position.set(
    Math.sin(viewerYaw) * viewerZoom,
    Math.sin(viewerPitch) * viewerZoom,
    Math.cos(viewerYaw) * viewerZoom,
  );
  viewerCamera.lookAt(0, 0, 0);
}

function renderInventory() {
  const samples = state.collectedSamples;
  elements.sampleCount.textContent = `${samples.length} / ${MAX_SAMPLE_CAPACITY} muestras`;
  elements.emptyInventory.classList.toggle('hidden', samples.length > 0);
  elements.sampleInventory.innerHTML = samples
    .map((sample) => {
      const profile = sampleProfiles[sample.profileId];
      const selected = sample.id === state.selectedSampleId;
      const collectedDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(sample.collectedAt));
      const mineralNames = sample.composition.map((mineral) => mineral.name).join(', ');
      const hydratedMineralNames = profile.hydratedMinerals.length
        ? `<span>Fases hidratadas del perfil: ${profile.hydratedMinerals.join(', ')}</span>`
        : '';
      return `<button type="button" class="sample-item ${selected ? 'active' : ''}" data-sample-id="${sample.id}">
        <strong>${sample.id}</strong>
        <span>${profile.name} · ${sample.size.toFixed(2)} m · ${sample.mass.toFixed(2)} kg</span>
        <span>${profile.terrainLabel}</span>
        <span>Dureza ${sample.hardness}/10 · color #${sample.color.toString(16).padStart(6, '0')}</span>
        <span>${mineralNames}</span>
        ${hydratedMineralNames}
        <span>${sample.sol} · ${collectedDate}</span>
        <span>${sample.location}</span>
        <em>${sample.analyses.length ? `Analizada · ${sample.analyses.length}` : 'Sin analizar'}</em>
      </button>`;
    })
    .join('');

  elements.sampleInventory.querySelectorAll('[data-sample-id]').forEach((button) => {
    button.disabled = state.analysisInProgress;
    button.addEventListener('click', () => {
      if (state.analysisInProgress) return;
      const sample = samples.find((item) => item.id === button.dataset.sampleId);
      if (!sample) return;
      state.selectedSampleId = sample.id;
      renderInventory();
      showSampleInViewer(sample);
    });
  });
}

function renderJournal() {
  const analyzedSamples = state.collectedSamples.filter((sample) => sample.analyses.length > 0).length;
  const unlockedStages = [
    state.missionComplete,
    state.collectedSamples.length >= 3 && analyzedSamples >= 3,
    state.firstStormSurvived,
    state.roverUsed,
  ];
  elements.journalSampleCount.textContent = state.collectedSamples.length;
  elements.journalAnalysisCount.textContent = state.analysisCount;
  elements.journalMissionStatus.textContent = `${unlockedStages.filter(Boolean).length}/4`;
  elements.journalEntries.innerHTML = investigationStages
    .map((stage, index) => {
      const unlocked = unlockedStages[index];
      const progress = index === 1 ? `${analyzedSamples}/3 muestras analizadas` : stage.unlockHint;
      return `<article class="investigation-stage ${unlocked ? 'unlocked' : 'locked'}">
        <header class="investigation-stage-heading">
          <div><span>ETAPA ${stage.numeral}</span><h3>${stage.title}</h3></div>
          <strong class="investigation-stage-status">${unlocked ? 'DESBLOQUEADA' : 'BLOQUEADA'}</strong>
        </header>
        <p class="investigation-stage-summary"><strong>${stage.range}</strong> · ${stage.summary}</p>
        <p class="investigation-unlock-hint">${unlocked ? 'Acceso disponible' : progress}</p>
        <ol>${stage.investigations
          .map(([number, title]) => `<li><span>INV. ${number}</span><strong>${title}</strong></li>`)
          .join('')}</ol>
      </article>`;
    })
    .join('');
  elements.weatherHistory.innerHTML = state.weather.events.length
    ? state.weather.events
        .map((event) => `<article><strong>${event.time} · ${event.title}</strong><span>${event.detail}</span></article>`)
        .join('')
    : '<p>Sin eventos meteorológicos registrados.</p>';
}

function addJournalEntry(title, detail) {
  state.journal.unshift({ title, detail });
}

function getMissionPosition() {
  return state.driving ? roverPosition : playerPosition;
}

function formatMissionClock(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function recordWeatherEvent(title, detail) {
  const event = { title, detail, time: formatMissionClock(state.weather.elapsed) };
  state.weather.events.unshift(event);
  state.weather.events = state.weather.events.slice(0, 40);
  addJournalEntry(`METEO · ${title}`, detail);
  if (state.journalOpen) renderJournal();
}

function getWeatherIntensity() {
  const weather = state.weather;
  if (state.inside) return 0;
  if (weather.phase === 'storm') return 1;
  if (weather.phase === 'forecast') return 0.12 + (weather.phaseElapsed / WEATHER_TIMING.forecastLeadSeconds) * 0.2;
  if (weather.phase === 'buildup') return 0.08;
  if (weather.phase === 'recovery') return Math.max(0, 1 - weather.phaseElapsed / WEATHER_TIMING.recoveryDurationSeconds);
  return 0;
}

function weatherRecommendation() {
  const distance = Math.hypot(getMissionPosition().x - basePosition.x, getMissionPosition().z - basePosition.z);
  if (state.inside) return 'Refugio presurizado: exposición exterior mitigada; la telemetría sigue activa.';
  if (state.weather.phase === 'storm') {
    return state.driving
      ? 'Conduce despacio hacia AP-1; el rover conserva control y el marcador muestra la base.'
      : 'Regresa a la esclusa. Si estás lejos, utiliza el rover; evita nuevas recolecciones.';
  }
  if (state.weather.phase === 'forecast' && distance > 30) {
    return state.driving
      ? 'Regresa ahora al hábitat y asegura el vehículo.'
      : 'Vuelve caminando o utiliza el rover antes de que llegue la tormenta.';
  }
  if (state.weather.phase === 'forecast') return 'Finaliza solo tareas cercanas y entra al refugio antes del pronóstico.';
  if (state.weather.phase === 'buildup') return 'Revisa la ruta a AP-1 y confirma que el rover esté disponible.';
  return 'Condiciones estables en el modelo de misión; continúa explorando con precaución.';
}

function updateWeatherPanel() {
  const weather = state.weather;
  const phaseLabels = {
    calm: 'Viento leve · condiciones estables',
    buildup: 'Aumento gradual de polvo y viento',
    forecast: 'Tormenta de polvo detectada · en aproximación',
    storm: 'Tormenta intensa de polvo en curso',
    recovery: 'Tormenta en disipación progresiva',
  };
  const alertLabels = {
    calm: 'INFORMATIVO',
    buildup: 'PRECAUCIÓN',
    forecast: 'ADVERTENCIA',
    storm: 'EMERGENCIA',
    recovery: 'INFORMATIVO',
  };
  const position = getMissionPosition();
  const countdown = weather.phase === 'forecast'
    ? formatMissionClock(Math.max(0, WEATHER_TIMING.forecastLeadSeconds - weather.phaseElapsed))
    : weather.phase === 'buildup'
      ? 'Ventana de pronóstico próxima'
      : weather.phase === 'storm'
        ? 'Tormenta activa'
        : weather.phase === 'recovery'
          ? 'Sin nueva tormenta prevista'
          : `Próximo pronóstico simulado en ${formatMissionClock(Math.max(0, weather.nextForecastAt - weather.elapsed))}`;

  elements.weatherCondition.textContent = phaseLabels[weather.phase];
  elements.weatherWind.textContent = `${Math.round(weather.windSpeed)} km/h · parámetro simulado`;
  elements.weatherVisibility.textContent = `${weather.visibilityKm.toFixed(1).replace('.', ',')} km · estimación del juego`;
  elements.weatherDust.textContent = `${Math.round(weather.dustLevel * 100)}% · índice simulado`;
  elements.weatherAlert.textContent = alertLabels[weather.phase];
  elements.weatherCountdown.textContent = countdown;
  elements.weatherIntensity.textContent = weather.phase === 'forecast' || weather.phase === 'storm'
    ? `${weather.intensityForecast} · evento ficticio`
    : 'Sin tormenta prevista';
  elements.weatherRecommendation.textContent = weatherRecommendation();
  elements.environmentBaseDistance.textContent = state.inside
    ? '0 m · interior de AP-1'
    : `${Math.round(Math.hypot(position.x - basePosition.x, position.z - basePosition.z))} m`;

  const hudVisible = ['buildup', 'forecast', 'storm', 'recovery'].includes(weather.phase);
  elements.weatherHud.className = `weather-hud alert-${weather.phase === 'storm' ? 'emergency' : weather.phase === 'forecast' ? 'warning' : 'precaution'}`;
  elements.weatherHud.classList.toggle('hidden', !state.started || !hudVisible);
  elements.hud.classList.toggle('storm-glitch', state.started && !state.inside && weather.phase === 'storm');
  elements.helmetOverlay.classList.toggle('active', state.started && !state.inside);
  elements.helmetOverlay.classList.toggle('storm-dust', state.started && !state.inside && weather.phase === 'storm');
  if (weather.phase === 'forecast') {
    elements.weatherHud.textContent = `ADVERTENCIA · Tormenta ${weather.intensityForecast.toLowerCase()} en ${formatMissionClock(Math.max(0, WEATHER_TIMING.forecastLeadSeconds - weather.phaseElapsed))} · viento previsto ${weather.peakWind} km/h. Regresa a AP-1 o asegura el rover.`;
  } else if (weather.phase === 'storm') {
    elements.weatherHud.textContent = `EMERGENCIA · Tormenta activa · ${Math.round(weather.windSpeed)} km/h · visibilidad simulada ${weather.visibilityKm.toFixed(1)} km · ${state.inside ? 'refugio seguro' : 'regresa a AP-1 · niebla visual intensificada'}.`;
  } else if (weather.phase === 'recovery') {
    elements.weatherHud.textContent = `INFORMATIVO · Polvo en disipación · visibilidad ${weather.visibilityKm.toFixed(1)} km.`;
  } else if (weather.phase === 'buildup') {
    elements.weatherHud.textContent = 'PRECAUCIÓN · Aumentan el viento y el polvo; consulta R para el pronóstico.';
  }

  elements.roverHud.classList.toggle('hidden', !state.driving);
  if (state.driving) {
    elements.roverSpeed.textContent = `${Math.abs(state.roverSpeed).toFixed(1).replace('.', ',')} m/s`;
    elements.roverBatteryBar.style.width = `${state.roverBattery}%`;
    elements.roverBatteryValue.textContent = `${Math.ceil(state.roverBattery)}%`;
    elements.roverDistance.textContent = `${Math.round(Math.hypot(roverPosition.x - basePosition.x, roverPosition.z - basePosition.z))} m`;
    elements.roverAlert.textContent = weather.phase === 'storm'
      ? 'Tormenta activa · niebla visual intensificada · W avanzar · S retroceder · A izquierda · D derecha · ESPACIO frenar · E entrar/salir · F especificaciones.'
      : weather.phase === 'forecast'
        ? `Aviso meteorológico · ${formatMissionClock(Math.max(0, WEATHER_TIMING.forecastLeadSeconds - weather.phaseElapsed))} hasta la tormenta · sigue la ruta a AP-1.`
        : 'W avanzar · S retroceder · A izquierda · D derecha · ESPACIO frenar · E entrar/salir · F especificaciones';
  }
}

function updateTerminalWeather() {
  const weather = state.weather;
  const summary = `${weather.windSpeed.toFixed(0)} km/h · visibilidad ${weather.visibilityKm.toFixed(1)} km · ${weather.phase === 'forecast'
    ? `tormenta ${weather.intensityForecast.toLowerCase()} en ${formatMissionClock(Math.max(0, WEATHER_TIMING.forecastLeadSeconds - weather.phaseElapsed))}`
    : weather.phase === 'storm'
      ? 'tormenta activa; refugio interior seguro'
      : weather.phase === 'recovery'
        ? 'tormenta en disipación'
        : 'sin tormenta inminente'}. Parámetros meteorológicos simulados, no observaciones NASA.`;
  elements.terminalWeather.textContent = summary;
}

function beginWeatherForecast() {
  const weather = state.weather;
  weather.cycle += 1;
  weather.phase = 'forecast';
  weather.phaseElapsed = 0;
  weather.countdown = WEATHER_TIMING.forecastLeadSeconds;
  weather.intensityForecast = weather.cycle % 2 === 1 ? 'Alta' : 'Moderada';
  weather.peakWind = weather.intensityForecast === 'Alta' ? 68 : 52;
  weather.exposureAlerted = false;
  recordWeatherEvent(
    'Pronóstico anticipado',
    `Tormenta regional simulada de intensidad ${weather.intensityForecast.toLowerCase()} detectada; llegada estimada en 04:00 min. Viento previsto hasta ${weather.peakWind} km/h. Evento del videojuego, no predicción NASA.`,
  );
  showToast(`ADVERTENCIA METEOROLÓGICA · Posible tormenta ${weather.intensityForecast.toLowerCase()} en 04:00. Regresa a AP-1 o asegura el rover.`, 6500);
}

function beginDustStorm() {
  const weather = state.weather;
  weather.phase = 'storm';
  weather.phaseElapsed = 0;
  weather.countdown = 0;
  weather.maxWind = 0;
  weather.minVisibilityKm = 18;
  weather.stormRecord = {
    startedAt: weather.elapsed,
    maxWind: 0,
    minVisibilityKm: 18,
    roverDustAtStart: weather.roverDust,
    suitBatteryAtStart: state.battery,
    roverBatteryAtStart: state.roverBattery,
  };
  recordWeatherEvent(
    'Inicio de tormenta',
    `Tormenta ${weather.intensityForecast.toLowerCase()} iniciada según el cronograma simulado; duración prevista ${Math.round(WEATHER_TIMING.stormDurationSeconds / 60)} min.`,
  );
  showToast('EMERGENCIA · Tormenta de polvo en curso. La base protege del viento; el rover conserva movilidad.', 7000);
}

function finishDustStorm() {
  const weather = state.weather;
  const record = weather.stormRecord;
  const duration = record ? weather.elapsed - record.startedAt : WEATHER_TIMING.stormDurationSeconds;
  const suitEnergyChange = record ? Math.round(record.suitBatteryAtStart - state.battery) : 0;
  const roverEnergyChange = record ? Math.round(record.roverBatteryAtStart - state.roverBattery) : 0;
  const stormDust = record ? Math.round((weather.roverDust - record.roverDustAtStart) * 100) : Math.round(weather.roverDust * 100);
  const equipmentImpact = `traje ${suitEnergyChange >= 0 ? `consumió ${suitEnergyChange}%` : `recargó ${Math.abs(suitEnergyChange)}%`} · rover ${roverEnergyChange >= 0 ? `consumió ${roverEnergyChange}%` : `recargó ${Math.abs(roverEnergyChange)}%`}`;
  state.firstStormSurvived = true;
  recordWeatherEvent(
    'Fin de tormenta',
    `Duración ${formatMissionClock(duration)} · viento máximo ${Math.round(weather.maxWind)} km/h · visibilidad mínima ${weather.minVisibilityKm.toFixed(1)} km · ${equipmentImpact} · polvo acumulado en rover durante el evento ${stormDust}%.`,
  );
  weather.phase = 'recovery';
  weather.phaseElapsed = 0;
  weather.stormRecord = null;
  showToast('La tormenta pierde intensidad. La visibilidad y las condiciones exteriores se recuperarán gradualmente.');
}

function updateWeather(delta) {
  if (!state.started || state.paused) return;
  const weather = state.weather;
  weather.elapsed += delta;
  weather.phaseElapsed += delta;

  if (weather.phase === 'calm' && weather.elapsed >= weather.nextForecastAt - WEATHER_TIMING.buildupSeconds) {
    weather.phase = 'buildup';
    weather.phaseElapsed = 0;
    recordWeatherEvent('Precaución meteorológica', 'Viento y polvo en aumento; se prepara un pronóstico anticipado simulado.');
  } else if (weather.phase === 'buildup' && weather.elapsed >= weather.nextForecastAt) {
    beginWeatherForecast();
  } else if (weather.phase === 'forecast') {
    weather.countdown = Math.max(0, WEATHER_TIMING.forecastLeadSeconds - weather.phaseElapsed);
    if (weather.phaseElapsed >= WEATHER_TIMING.forecastLeadSeconds) beginDustStorm();
  } else if (weather.phase === 'storm' && weather.phaseElapsed >= WEATHER_TIMING.stormDurationSeconds) {
    finishDustStorm();
  } else if (weather.phase === 'recovery' && weather.phaseElapsed >= WEATHER_TIMING.recoveryDurationSeconds) {
    weather.phase = 'calm';
    weather.phaseElapsed = 0;
    weather.nextForecastAt = weather.elapsed + WEATHER_TIMING.nextForecastDelaySeconds;
    recordWeatherEvent('Condiciones normalizadas', 'La visibilidad volvió al rango estable; el siguiente ciclo meteorológico seguirá el cronograma de la simulación.');
  }

  if (weather.phase === 'buildup') {
    const progress = Math.min(1, weather.phaseElapsed / WEATHER_TIMING.buildupSeconds);
    weather.windSpeed = 10 + progress * 10 + Math.sin(weather.elapsed * 0.18) * 2;
    weather.visibilityKm = 18 - progress * 3;
    weather.dustLevel = 0.06 + progress * 0.12;
  } else if (weather.phase === 'forecast') {
    const progress = Math.min(1, weather.phaseElapsed / WEATHER_TIMING.forecastLeadSeconds);
    weather.windSpeed = 18 + progress * 18 + Math.sin(weather.elapsed * 0.12) * 2;
    weather.visibilityKm = 15 - progress * 5.5;
    weather.dustLevel = 0.16 + progress * 0.25;
  } else if (weather.phase === 'storm') {
    const progress = Math.min(1, weather.phaseElapsed / WEATHER_TIMING.stormDurationSeconds);
    const gust = Math.sin(progress * Math.PI);
    weather.windSpeed = weather.peakWind * (0.78 + gust * 0.22);
    weather.visibilityKm = 1.35 - gust * 0.65;
    weather.dustLevel = 0.78 + gust * 0.16;
    weather.maxWind = Math.max(weather.maxWind, weather.windSpeed);
    weather.minVisibilityKm = Math.min(weather.minVisibilityKm, weather.visibilityKm);
    if (weather.stormRecord) {
      weather.stormRecord.maxWind = weather.maxWind;
      weather.stormRecord.minVisibilityKm = weather.minVisibilityKm;
    }
    weather.roverDust = Math.min(1, weather.roverDust + delta * 0.0018);
    weather.structureDust = Math.min(0.55, weather.structureDust + delta * 0.0007);
    if (!state.inside && !weather.exposureAlerted) {
      weather.exposureAlerted = true;
      showToast('Exposición al polvo y al viento: el traje consume más energía. Busca refugio en AP-1.', 7000);
    }
  } else if (weather.phase === 'recovery') {
    const progress = Math.min(1, weather.phaseElapsed / WEATHER_TIMING.recoveryDurationSeconds);
    weather.windSpeed = 8 + weather.peakWind * 0.28 * (1 - progress);
    weather.visibilityKm = 0.7 + progress * 17.3;
    weather.dustLevel = 0.8 * (1 - progress) + 0.04;
    weather.roverDust = Math.max(0, weather.roverDust - delta * 0.0007);
    weather.structureDust = Math.max(0, weather.structureDust - delta * 0.00035);
  } else {
    weather.windSpeed = 8 + Math.sin(weather.elapsed * 0.08) * 2.5;
    weather.visibilityKm = 18;
    weather.dustLevel = 0.04;
  }

  applyWeatherEffects();
  if (weather.elapsed - weather.uiUpdateAt >= 0.25) {
    weather.uiUpdateAt = weather.elapsed;
    updateWeatherPanel();
    updateTerminalWeather();
  }
}

function getSolarConditions(elapsed) {
  const phase = ((elapsed % MISSION_DAY_SECONDS) + MISSION_DAY_SECONDS) % MISSION_DAY_SECONDS / MISSION_DAY_SECONDS;
  let daylight = 0;
  let dusk = 0;
  let night = 0;
  if (phase < 0.4) {
    daylight = 1;
  } else if (phase < 0.52) {
    const progress = (phase - 0.4) / 0.12;
    daylight = 1 - progress;
    dusk = Math.sin(progress * Math.PI);
    night = progress;
  } else if (phase < 0.88) {
    night = 1;
  } else {
    const progress = (phase - 0.88) / 0.12;
    daylight = progress;
    dusk = Math.sin(progress * Math.PI);
    night = 1 - progress;
  }
  const total = daylight + dusk + night || 1;
  return { daylight: daylight / total, dusk: dusk / total, night: night / total };
}

function mixSolarColors(dayColor, duskColor, nightColor, solar, target) {
  target.copy(dayColor).multiplyScalar(solar.daylight);
  target.r += duskColor.r * solar.dusk + nightColor.r * solar.night;
  target.g += duskColor.g * solar.dusk + nightColor.g * solar.night;
  target.b += duskColor.b * solar.dusk + nightColor.b * solar.night;
  return target;
}

function applyWeatherEffects() {
  if (!scene || !state.weather) return;
  const intensity = getWeatherIntensity();
  const solar = getSolarConditions(state.weather.elapsed);
  mixSolarColors(daySkyColor, duskSkyColor, nightSkyColor, solar, mixedSkyColor);
  mixSolarColors(dayFogColor, duskFogColor, nightFogColor, solar, mixedFogColor);
  mixSolarColors(daySkyTint, duskSkyTint, nightSkyTint, solar, mixedSkyTint);
  scene.background.copy(mixedSkyColor).lerp(stormSkyColor, intensity);
  scene.fog.color.copy(mixedFogColor).lerp(stormFogColor, intensity);
  const ambientDensity = 0.00125 + solar.night * 0.0007;
  scene.fog.density = THREE.MathUtils.lerp(ambientDensity, 0.045, intensity);
  if (skyMaterial) skyMaterial.color.copy(mixedSkyTint).lerp(stormSkyTint, intensity);
  if (sunlight) {
    sunlight.intensity = THREE.MathUtils.lerp(0.12 + solar.daylight * 2.48 + solar.dusk * 0.48, 0.12, intensity);
    sunlight.color.set(0xffdfb8).lerp(duskSkyTint, solar.dusk + solar.night * 0.7);
  }
  if (sunMaterial) sunMaterial.color.set(0xffd69a).lerp(nightSkyColor, solar.night);
  if (sunGlowMaterial) sunGlowMaterial.opacity = 0.07 * (solar.daylight + solar.dusk * 0.4);
  if (hemisphereLight) {
    hemisphereLight.intensity = 0.44 + solar.daylight * 0.76 + solar.dusk * 0.16;
    hemisphereLight.color.copy(mixedSkyTint);
  }
  if (dustAmbientLight) dustAmbientLight.intensity = intensity * 0.8;
  elements.hud.classList.toggle('storm-glitch', state.started && !state.inside && state.weather.phase === 'storm');
  elements.helmetOverlay.classList.toggle('active', state.started && !state.inside);
  elements.helmetOverlay.classList.toggle('storm-dust', state.started && !state.inside && state.weather.phase === 'storm');
  if (dustAmbientLight) dustAmbientLight.intensity = intensity * 0.8;
  if (roverBodyMaterial) {
    roverBodyMaterial.color.lerpColors(roverBasePaint, roverDustPaint, state.weather.roverDust);
  }
  if (roverWheelMaterial) {
    roverWheelMaterial.color.lerpColors(roverWheelBasePaint, roverDustPaint, state.weather.roverDust * 0.55);
  }
  for (const surface of dustSensitiveMaterials) {
    surface.material.color.lerpColors(surface.baseColor, roverDustPaint, state.weather.structureDust);
  }
}

function resetWeather() {
  state.weather = createWeatherState();
  applyWeatherEffects();
  updateWeatherPanel();
  updateTerminalWeather();
}

function getSelectedSample() {
  return state.collectedSamples.find((sample) => sample.id === state.selectedSampleId) || null;
}

function statusLabel(status) {
  if (status === 'confirmado') return 'Confirmado en la simulación';
  if (status === 'probable') return 'Probable';
  return 'No concluyente';
}

function countHydratedAnalyzedSamples() {
  return state.collectedSamples.filter(
    (sample) =>
      Array.isArray(sample.hydratedMinerals) &&
      sample.hydratedMinerals.length > 0 &&
      sample.analyses.some((analysis) => ['xrf', 'raman', 'infrared'].includes(analysis.instrument)),
  ).length;
}

function updateHydratedResourceObjective() {
  const count = countHydratedAnalyzedSamples();
  const complete = count >= 5;
  elements.resourceObjective.textContent = `Recolecta muestras para localizar recursos hídricos (${Math.min(count, 5)}/5)`;
  elements.resourceObjective.classList.toggle('completed', complete);
  if (!complete || state.waterResourceLocated) return false;
  state.waterResourceLocated = true;
  showToast('¡Recurso crítico localizado! Agua subterránea viable para soporte vital.', 8000);
  return true;
}

function getAnalysisScienceValue(profile, instrument) {
  const hasHydratedMinerals = profile.hydratedMinerals.length > 0;
  const hydratedMineralNames = profile.hydratedMinerals.join(' y ');
  const instrumentInterpretations = {
    xrf: hasHydratedMinerals
      ? `La composición elemental es compatible con ${hydratedMineralNames}; XRF no mide hidrógeno ni confirma agua directamente, así que conviene contrastarlo con Raman o infrarrojo.`
      : 'La composición elemental sirve como referencia de materiales no hidratados; XRF no detecta agua directamente.',
    raman: hasHydratedMinerals
      ? `Las fases del perfil son compatibles con ${hydratedMineralNames}, una señal para priorizar zonas de posible alteración acuosa; no confirma una reserva explotable.`
      : 'El perfil mineralógico sirve como referencia para comparar rocas alteradas por agua en futuras expediciones.',
    infrared: hasHydratedMinerals
      ? `Las bandas simuladas compatibles con OH/H₂O apoyan la presencia de ${hydratedMineralNames}; es una pista mineralógica, no una medición de agua disponible.`
      : 'La respuesta de silicatos aporta una línea de base para detectar posibles bandas de hidratación en otras muestras.',
  };
  return `${profile.scienceValue} ${instrumentInterpretations[instrument]}`;
}

function renderAnalysisResult(sample, instrument) {
  if (!sample) return;
  const profile = sampleProfiles[sample.profileId];
  const labels = {
    visual: 'Inspección visual',
    xrf: 'Fluorescencia de rayos X',
    raman: 'Espectrómetro Raman',
    infrared: 'Espectrómetro infrarrojo',
  };
  let summary = '';
  let tags = [];
  let mineralResults = [];

  if (instrument === 'visual') {
    summary = profile.visual;
    tags = ['color y textura', 'fracturas', 'sin identificación mineralógica'];
  } else if (instrument === 'xrf') {
    summary = profile.xrf;
    tags = profile.elements.map((element) => `${element.name} ${element.percent.toFixed(1)}%`);
    mineralResults = profile.minerals.map((mineral) => ({
      ...mineral,
      status: mineral.status === 'confirmado' ? 'probable' : mineral.status,
    }));
  } else if (instrument === 'raman') {
    summary = profile.raman;
    mineralResults = profile.minerals;
    tags = mineralResults.map((mineral) => `${mineral.name} · ${statusLabel(mineral.status)}`);
  } else {
    summary = profile.infrared;
    mineralResults = profile.minerals.map((mineral) => ({
      ...mineral,
      status: mineral.status === 'confirmado' ? 'probable' : 'no concluyente',
    }));
    tags = ['enlaces de silicatos', 'señal superficial', 'resultado complementario'];
  }

  const prior = sample.analyses.find((item) => item.instrument === instrument);
  if (!prior) state.analysisCount += 1;
  sample.analyses = sample.analyses.filter((item) => item.instrument !== instrument);
  sample.analyses.push({ instrument, instrumentLabel: labels[instrument], summary });
  updateHydratedResourceObjective();
  const mineralList = mineralResults.length
    ? `<div class="mineral-results">${mineralResults
        .map((mineral) => `<div class="mineral-result"><strong>${mineral.name}</strong><span>${statusLabel(mineral.status)}</span><p>${mineral.meaning}</p></div>`)
        .join('')}</div>`
    : '';
  const scienceValue = ['xrf', 'raman', 'infrared'].includes(instrument)
    ? `<div class="result-science-value"><strong>VALOR CIENTÍFICO PARA AP-1</strong><p>${getAnalysisScienceValue(profile, instrument)}</p></div>`
    : '';
  const resourceSuccess = state.waterResourceLocated
    ? '<p class="resource-success-message" role="status">¡Recurso crítico localizado! Agua subterránea viable para soporte vital.</p>'
    : '';
  elements.analysisResult.innerHTML = `
    <h3 class="result-title">${sample.id} · ${labels[instrument]}<span>PERFIL SIMULADO</span></h3>
    <p class="result-copy">${summary}</p>
    ${scienceValue}
    ${tags.length ? `<div class="result-tags">${tags.map((tag) => `<span>${tag}</span>`).join('')}</div>` : ''}
    ${mineralList}
    ${resourceSuccess}
  `;
  addJournalEntry(`${sample.id} · ${labels[instrument]}`, summary);
  renderInventory();
  renderJournal();
}

function performAnalysis() {
  const sample = getSelectedSample();
  if (!sample || state.analysisInProgress) return;
  state.analysisInProgress = true;
  const sampleId = sample.id;
  const instrument = state.selectedInstrument;
  elements.analyzeButton.disabled = true;
  elements.instrumentControls.querySelectorAll('[data-instrument]').forEach((button) => {
    button.disabled = true;
  });
  elements.sampleInventory.querySelectorAll('[data-sample-id]').forEach((button) => {
    button.disabled = true;
  });
  elements.laserScan.classList.remove('hidden');
  elements.laserScan.style.setProperty('--laser-travel', `${elements.sampleCanvas.clientHeight}px`);
  state.analysisTimer = window.setTimeout(() => {
    state.analysisTimer = null;
    state.analysisInProgress = false;
    elements.laserScan.classList.add('hidden');
    elements.instrumentControls.querySelectorAll('[data-instrument]').forEach((button) => {
      button.disabled = false;
    });
    if (!state.labOpen || state.selectedSampleId !== sampleId) return;
    renderAnalysisResult(sample, instrument);
    elements.analyzeButton.disabled = false;
  }, ANALYSIS_SCAN_MS);
}

function openLab() {
  state.labOpen = true;
  elements.labScreen.classList.remove('hidden');
  renderInventory();
  resizeSampleViewer();
  const selectedSample = getSelectedSample();
  if (selectedSample) {
    showSampleInViewer(selectedSample);
  } else {
    elements.viewerPlaceholder.classList.remove('hidden');
    elements.analyzeButton.disabled = true;
  }
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}

function closeLab() {
  state.labOpen = false;
  if (state.analysisTimer !== null) {
    window.clearTimeout(state.analysisTimer);
    state.analysisTimer = null;
  }
  state.analysisInProgress = false;
  elements.laserScan.classList.add('hidden');
  elements.instrumentControls.querySelectorAll('[data-instrument]').forEach((button) => {
    button.disabled = false;
  });
  elements.labScreen.classList.add('hidden');
  if (state.started && !state.paused) requestPointerLock();
}

function openJournal() {
  state.journalOpen = true;
  renderJournal();
  elements.journalScreen.classList.remove('hidden');
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}

function closeJournal() {
  state.journalOpen = false;
  elements.journalScreen.classList.add('hidden');
  if (state.started && !state.paused) requestPointerLock();
}

function getMarsCoordinates(x = getMissionPosition().x, z = getMissionPosition().z) {
  const latitude = marsLatitude + ((z - basePosition.z) / marsRadius) * (180 / Math.PI);
  const longitude =
    ((marsLongitude +
      ((x - basePosition.x) / (marsRadius * Math.cos(marsLatitude * Math.PI / 180))) * (180 / Math.PI)) %
      360 +
      360) %
    360;
  return { latitude, longitude };
}

function formatCoordinates(x, z) {
  const { latitude, longitude } = getMarsCoordinates(x, z);
  return `${Math.abs(latitude).toFixed(4).replace('.', ',')}° ${latitude >= 0 ? 'N' : 'S'} · ${longitude.toFixed(4).replace('.', ',')}° E`;
}

function getMarsElevationKm(x, z) {
  const localRelief = terrainHeight(x, z) - terrainHeight(basePosition.x, basePosition.z);
  return baseElevationKm + localRelief / 1000;
}

function formatElevation(x, z) {
  return `${getMarsElevationKm(x, z).toFixed(1).replace('.', ',')} km`;
}

function updateEnvironmentPanel() {
  const position = getMissionPosition();
  const { latitude } = getMarsCoordinates(position.x, position.z);
  const relativeRelief = terrainHeight(position.x, position.z) - terrainHeight(basePosition.x, basePosition.z);
  const elevationKm = getMarsElevationKm(position.x, position.z);
  const elapsed = state.weather.elapsed;
  const solSeconds = 88775;
  const sol = Math.floor(elapsed / solSeconds) + 1;
  const solFraction = (elapsed % solSeconds) / solSeconds;
  const temperature = -63 + 12 * Math.sin(solFraction * Math.PI * 2) - Math.abs(latitude - marsLatitude) * 0.45 - relativeRelief * 0.006;
  const pressure = 610 * Math.exp(-(elevationKm * 1000) / 10800);
  const missionMinutes = Math.floor(elapsed / 60);
  const missionSeconds = Math.floor(elapsed % 60);

  elements.environmentSol.textContent = String(sol).padStart(3, '0');
  elements.environmentCoordinates.textContent = formatCoordinates(position.x, position.z);
  elements.environmentAltitude.textContent = `${elevationKm.toFixed(1).replace('.', ',')} km · estimación regional`;
  elements.environmentTemperature.textContent = `${temperature.toFixed(1).replace('.', ',')} °C · estimación`;
  elements.environmentPressure.textContent = `${pressure.toFixed(0)} Pa · estimación; atmósfera extremadamente tenue`;
  elements.environmentElapsed.textContent = `${String(missionMinutes).padStart(2, '0')}:${String(missionSeconds).padStart(2, '0')}`;
  elements.environmentSuit.textContent = state.oxygen === 0 ? 'OXÍGENO AGOTADO' : state.oxygen < 20 || state.battery < 15 ? 'RESERVA BAJA' : 'ESTABLE';
  elements.environmentOxygen.textContent = `${Math.ceil(state.oxygen)}%`;
  elements.environmentBattery.textContent = `${Math.ceil(state.battery)}%`;
  updateWeatherPanel();
}

function openEnvironment() {
  if (!state.started || state.paused || state.terminalOpen || state.labOpen || state.journalOpen || state.mapOpen) return;
  state.environmentOpen = true;
  elements.environmentScreen.classList.remove('hidden');
  elements.interactionPrompt.classList.add('hidden');
  updateEnvironmentPanel();
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}

function closeEnvironment() {
  state.environmentOpen = false;
  elements.environmentScreen.classList.add('hidden');
  if (state.started && !state.paused) requestPointerLock();
}

function openMap() {
  if (!state.started || state.paused || state.terminalOpen || state.labOpen || state.journalOpen || state.environmentOpen) return;
  state.mapOpen = true;
  playUiBeep(760);
  state.mapPanX = 0;
  state.mapPanZ = 0;
  state.mapSelection = null;
  elements.mapScreen.classList.remove('hidden');
  elements.interactionPrompt.classList.add('hidden');
  paintMap();
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}

function closeMap() {
  state.mapOpen = false;
  state.mapDragging = false;
  elements.mapScreen.classList.add('hidden');
  if (state.started && !state.paused) requestPointerLock();
}

function drawNasaTileInset(context, width, height) {
  const tileHeight = Math.min(260, height * 0.42);
  const tileWidth = tileHeight * Math.cos(marsLatitude * Math.PI / 180);
  const panelWidth = tileWidth + 18;
  const panelHeight = tileHeight + 44;
  const panelX = width - panelWidth - 14;
  const panelY = 14;
  const imageX = panelX + 9;
  const imageY = panelY + 27;
  const imageWidth = tileWidth;
  const imageHeight = tileHeight;

  context.fillStyle = 'rgba(12, 16, 16, 0.94)';
  context.fillRect(panelX, panelY, panelWidth, panelHeight);
  context.strokeStyle = 'rgba(219, 231, 216, 0.3)';
  context.strokeRect(panelX + 0.5, panelY + 0.5, panelWidth - 1, panelHeight - 1);
  context.drawImage(nasaMapTile, imageX, imageY, imageWidth, imageHeight);
  context.fillStyle = '#d9e8dc';
  context.font = 'bold 10px sans-serif';
  context.fillText('NASA MOLA · CONTEXTO', panelX + 9, panelY + 17);
  context.fillStyle = '#f2c07d';
  context.strokeStyle = '#35251a';
  context.lineWidth = 2;
  const markerX = imageX + ((marsLongitude - nasaTileWest) / nasaTileLongitudeSpan) * imageWidth;
  const markerY = imageY + ((nasaTileNorth - marsLatitude) / nasaTileLatitudeSpan) * imageHeight;
  context.beginPath();
  context.arc(markerX, markerY, 5, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#fff1c8';
  context.font = 'bold 10px sans-serif';
  context.fillText('AP-1', markerX + 7, markerY - 5);
  context.lineWidth = 1;
  return { x: panelX, y: panelY, width: panelWidth, height: panelHeight };
}

const terrainMapCanvas = document.createElement('canvas');
terrainMapCanvas.width = 48;
terrainMapCanvas.height = 30;

function drawTerrainRaster(context, width, height, scale, centerX, centerZ, alpha = 1) {
  const rasterContext = terrainMapCanvas.getContext('2d');
  const image = rasterContext.createImageData(terrainMapCanvas.width, terrainMapCanvas.height);
  const worldWidth = width / scale;
  const worldHeight = height / scale;
  const sampleStep = Math.max(worldWidth / terrainMapCanvas.width, worldHeight / terrainMapCanvas.height);
  const pixels = image.data;
  const elevations = new Float32Array(terrainMapCanvas.width * terrainMapCanvas.height);

  for (let y = 0; y < terrainMapCanvas.height; y += 1) {
    for (let x = 0; x < terrainMapCanvas.width; x += 1) {
      const worldX = centerX + ((x + 0.5) / terrainMapCanvas.width - 0.5) * worldWidth;
      const worldZ = centerZ + (0.5 - (y + 0.5) / terrainMapCanvas.height) * worldHeight;
      const elevation = terrainHeight(worldX, worldZ);
      elevations[y * terrainMapCanvas.width + x] = elevation;
      const slopeX = terrainHeight(worldX + sampleStep, worldZ) - terrainHeight(worldX - sampleStep, worldZ);
      const slopeZ = terrainHeight(worldX, worldZ + sampleStep) - terrainHeight(worldX, worldZ - sampleStep);
      const shade = THREE.MathUtils.clamp(1.05 - (Math.abs(slopeX) + Math.abs(slopeZ)) * 0.12, 0.62, 1.24);
      const heightTone = THREE.MathUtils.clamp((elevation + 3) / 8, 0, 1);
      const offset = (y * terrainMapCanvas.width + x) * 4;
      pixels[offset] = Math.round((65 + heightTone * 48) * shade);
      pixels[offset + 1] = Math.round((55 + heightTone * 37) * shade);
      pixels[offset + 2] = Math.round((48 + heightTone * 29) * shade);
      pixels[offset + 3] = 255;
    }
  }
  rasterContext.putImageData(image, 0, 0);
  context.globalAlpha = alpha;
  context.imageSmoothingEnabled = true;
  context.drawImage(terrainMapCanvas, 0, 0, width, height);
  context.globalAlpha = 1;
  if (width > 400) drawTerrainContours(context, width, height, elevations);
}

function drawGeologicalRaster(context, width, height, centerX, centerZ, worldWidth, worldHeight) {
  const rasterContext = terrainMapCanvas.getContext('2d');
  const image = rasterContext.createImageData(terrainMapCanvas.width, terrainMapCanvas.height);
  const pixels = image.data;
  const colors = {
    plains: [153, 143, 111],
    deposits: [179, 145, 105],
    volcanic: [105, 104, 72],
    glacial: [102, 143, 143],
  };

  for (let y = 0; y < terrainMapCanvas.height; y += 1) {
    for (let x = 0; x < terrainMapCanvas.width; x += 1) {
      const worldX = centerX + ((x + 0.5) / terrainMapCanvas.width - 0.5) * worldWidth;
      const worldZ = centerZ + (0.5 - (y + 0.5) / terrainMapCanvas.height) * worldHeight;
      const dx = worldX - basePosition.x;
      const dz = worldZ - basePosition.z;
      const glacierUnit = ((dx - 34) / 58) ** 2 + ((dz - 28) / 36) ** 2 < 1;
      const volcanicUnit =
        ((dx + 67) / 50) ** 2 + ((dz + 8) / 74) ** 2 < 1 ||
        Math.sin(dx * 0.035 + dz * 0.018) + Math.cos(dz * 0.028 - dx * 0.012) > 1.65;
      const surfaceDeposits = (dx / 112) ** 2 + (dz / 92) ** 2 < 1;
      const color = glacierUnit
        ? colors.glacial
        : volcanicUnit
          ? colors.volcanic
          : surfaceDeposits
            ? colors.deposits
            : colors.plains;
      const variation = 0.92 + 0.08 * Math.sin(dx * 0.06 + dz * 0.035);
      const offset = (y * terrainMapCanvas.width + x) * 4;
      pixels[offset] = Math.round(color[0] * variation);
      pixels[offset + 1] = Math.round(color[1] * variation);
      pixels[offset + 2] = Math.round(color[2] * variation);
      pixels[offset + 3] = 255;
    }
  }

  rasterContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = true;
  context.drawImage(terrainMapCanvas, 0, 0, width, height);
}

function drawSubsurfaceIceRaster(context, width, height, centerX, centerZ, worldWidth, worldHeight) {
  const rasterContext = terrainMapCanvas.getContext('2d');
  const image = rasterContext.createImageData(terrainMapCanvas.width, terrainMapCanvas.height);
  const pixels = image.data;

  for (let y = 0; y < terrainMapCanvas.height; y += 1) {
    for (let x = 0; x < terrainMapCanvas.width; x += 1) {
      const worldX = centerX + ((x + 0.5) / terrainMapCanvas.width - 0.5) * worldWidth;
      const worldZ = centerZ + (0.5 - (y + 0.5) / terrainMapCanvas.height) * worldHeight;
      const dx = worldX - basePosition.x;
      const dz = worldZ - basePosition.z;
      const northernLobe = Math.exp(-(((dx - 34) / 52) ** 2 + ((dz - 28) / 38) ** 2) * 1.25);
      const westernLobe = Math.exp(-(((dx + 68) / 55) ** 2 + ((dz + 14) / 72) ** 2) * 1.1);
      const potential = Math.min(1, Math.max(northernLobe, westernLobe) * 0.92 + 0.08);
      const color =
        potential > 0.66
          ? [105, 190, 204]
          : potential > 0.38
            ? [69, 130, 154]
            : [60, 67, 68];
      const offset = (y * terrainMapCanvas.width + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }

  rasterContext.putImageData(image, 0, 0);
  context.imageSmoothingEnabled = true;
  context.drawImage(terrainMapCanvas, 0, 0, width, height);
}

function drawTerrainContours(context, width, height, elevations) {
  const columns = terrainMapCanvas.width;
  const rows = terrainMapCanvas.height;
  const minimum = Math.min(...elevations);
  const maximum = Math.max(...elevations);
  const contourStep = 0.35;
  context.beginPath();

  for (let level = Math.ceil(minimum / contourStep) * contourStep; level <= maximum; level += contourStep) {
    for (let y = 0; y < rows - 1; y += 1) {
      for (let x = 0; x < columns - 1; x += 1) {
        const corners = [
          { x, y, value: elevations[y * columns + x] },
          { x: x + 1, y, value: elevations[y * columns + x + 1] },
          { x: x + 1, y: y + 1, value: elevations[(y + 1) * columns + x + 1] },
          { x, y: y + 1, value: elevations[(y + 1) * columns + x] },
        ];
        const intersections = [];
        for (let edge = 0; edge < 4; edge += 1) {
          const first = corners[edge];
          const second = corners[(edge + 1) % 4];
          if (!((first.value < level && second.value >= level) || (second.value < level && first.value >= level))) continue;
          const fraction = (level - first.value) / (second.value - first.value);
          intersections.push({
            x: ((first.x + (second.x - first.x) * fraction) / columns) * width,
            y: ((first.y + (second.y - first.y) * fraction) / rows) * height,
          });
        }
        for (let index = 0; index + 1 < intersections.length; index += 2) {
          context.moveTo(intersections[index].x, intersections[index].y);
          context.lineTo(intersections[index + 1].x, intersections[index + 1].y);
        }
      }
    }
  }
  context.strokeStyle = 'rgba(238, 219, 183, 0.25)';
  context.lineWidth = 1;
  context.stroke();
}

function showToast(message, duration = 3400) {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  state.lastToast = performance.now() + duration;
}

function updateMissionUI() {
  if (state.missionComplete) {
    elements.missionKicker.textContent = 'MISIÓN 01 · COMPLETADA';
    elements.missionTitle.textContent = 'La base científica te da la bienvenida';
    elements.missionObjective.textContent = 'Explora el módulo y consulta la terminal para revisar tu misión.';
  } else {
    elements.missionKicker.textContent = 'MISIÓN 01 · PRIMEROS PASOS EN MARTE';
    elements.missionTitle.textContent = 'Encuentra la base científica';
    elements.missionObjective.textContent =
      'Misión 01: Llegar a AP-1 y evaluar la estabilidad del terreno para el despliegue de paneles solares.';
  }
}

function updatePrompt() {
  if (state.mapOpen || state.environmentOpen) {
    elements.interactionPrompt.classList.add('hidden');
    return;
  }
  if (state.driving) {
    state.currentTarget = { type: 'rover', label: 'Rover científico' };
    elements.interactionPrompt.innerHTML = '<kbd>E</kbd> SALIR DEL ROVER &nbsp; <kbd>F</kbd> ESPECIFICACIONES';
    elements.interactionPrompt.classList.remove('hidden');
    return;
  }
  let target = null;
  if (state.inside) {
    const hatchDistance = Math.hypot(playerPosition.x - entryPosition.x, playerPosition.z - entryPosition.z);
    if (hatchDistance < 2.8) target = { type: 'exit', label: 'Esclusa exterior', distance: hatchDistance };
  }

  const forward = new THREE.Vector3(-Math.sin(state.yaw), 0, -Math.cos(state.yaw));
  let bestScore = target ? -1 : -Infinity;
  for (const item of interactiveObjects) {
    if (item.type === 'rock' && (!item.object.visible || !item.data.profileId && !item.data.sampleId && item.data.collected)) continue;
    if (state.inside && !['analyzer', 'console'].includes(item.type)) continue;
    if (!state.inside && ['analyzer', 'console'].includes(item.type)) continue;

    const x = item.data.x;
    const z = item.data.z;
    const distance = Math.hypot(playerPosition.x - x, playerPosition.z - z);
    const range = item.type === 'solar' ? 4.1 : item.type === 'door' ? 3.7 : item.type === 'rock' ? 3.2 : 3.5;
    if (distance > range) continue;

    const toward = new THREE.Vector3(x - playerPosition.x, 0, z - playerPosition.z);
    const dot = toward.lengthSq() > 0 ? toward.normalize().dot(forward) : 1;
    if (dot < -0.15 && distance > 1.4) continue;
    const score = dot - distance * 0.035 + (item.type === 'door' ? 0.12 : 0) + (item.type === 'rock' && item.data.sampleId ? 0.2 : 0);
    if (score > bestScore) {
      bestScore = score;
      target = { ...item, distance };
    }
  }

  state.currentTarget = target;
  elements.interactionPrompt.classList.toggle('hidden', !target);
  if (!target) return;

  let prompt = '<kbd>E</kbd> INTERACTUAR';
  if (target.type === 'exit') {
    prompt = '<kbd>E</kbd> SALIR DE LA BASE';
  } else if (target.type === 'door') {
    prompt = '<kbd>E</kbd> ABRIR ESCLUSA';
  } else if (target.type === 'rock') {
    prompt = `<strong>ROCA MARCIANA · ${target.data.sampleId}</strong><br><kbd>E</kbd> RECOGER MUESTRA &nbsp; <kbd>F</kbd> CONSULTAR INFORMACIÓN`;
  } else if (target.type === 'solar') {
    prompt = '<kbd>E</kbd> INSPECCIONAR PANELES &nbsp; <kbd>F</kbd> ESPECIFICACIONES';
  } else if (target.type === 'rover') {
    prompt = '<kbd>E</kbd> ENTRAR AL ROVER &nbsp; <kbd>F</kbd> ESPECIFICACIONES';
  } else if (target.type === 'analyzer') {
    prompt = '<kbd>E</kbd> USAR ANALIZADOR &nbsp; <kbd>F</kbd> ESPECIFICACIONES';
  } else if (target.type === 'console') {
    prompt = '<kbd>E</kbd> TERMINAL DE MISIÓN &nbsp; <kbd>F</kbd> INFORMACIÓN';
  }
  elements.interactionPrompt.innerHTML = prompt;
}

function collectSample(target) {
  const { sampleId, profileId, x, z, seed, scale, color } = target.data;
  if (state.collectedSamples.some((sample) => sample.id === sampleId)) return;
  if (state.collectedSamples.length >= MAX_SAMPLE_CAPACITY) {
    showToast(`Inventario científico lleno (${MAX_SAMPLE_CAPACITY}/${MAX_SAMPLE_CAPACITY}). No se puede recoger otra muestra.`);
    return;
  }
  const profile = sampleProfiles[profileId];
  const size = Math.max(scale.x, scale.y, scale.z);
  const mass = Math.max(0.05, 0.08 + scale.x * scale.y * scale.z * 0.18);
  const localX = `${x >= 0 ? 'E' : 'O'} ${Math.abs(x).toFixed(1)} m`;
  const localZ = `${z >= 0 ? 'N' : 'S'} ${Math.abs(z).toFixed(1)} m`;
  const elapsed = Math.max(0, state.weather.elapsed / 88775);
  const sol = `Sol ${String(Math.floor(elapsed) + 1).padStart(3, '0')}`;
  const sample = {
    id: sampleId,
    profileId,
    seed,
    terrainLabel: profile.terrainLabel,
    hydratedMinerals: [...profile.hydratedMinerals],
    type: profile.name,
    size,
    mass,
    color,
    dimensions: { ...scale },
    hardness: profile.hardness,
    texture: profile.appearance,
    composition: profile.minerals.map((mineral) => ({ ...mineral })),
    location: `AP-1 · ${localX}, ${localZ} · ${formatCoordinates(x, z)}`,
    x,
    z,
    sol,
    collectedAt: new Date().toISOString(),
    analyses: [],
  };
  state.collectedSamples.push(sample);
  playUiBeep(980);
  if (!state.selectedSampleId) state.selectedSampleId = sample.id;
  target.data.collected = true;
  target.object.visible = false;
  const collisionIndex = collisionObjects.indexOf(target.data.collision);
  if (collisionIndex >= 0) collisionObjects.splice(collisionIndex, 1);
  createScanPulse(x, z);
  renderJournal();
  renderInventory();
  showToast(`${sample.id} · ${sample.type} · ${mass.toFixed(2)} kg. Muestra registrada y guardada en el inventario.`);
}

function interact() {
  if (state.driving) {
    exitRover();
    return;
  }
  const target = state.currentTarget;
  if (!target) {
    showToast('Acércate y mira hacia un objeto para interactuar.');
    return;
  }

  if (target.type === 'exit') {
    exitBase();
  } else if (target.type === 'door') {
    enterBase();
  } else if (target.type === 'rock') {
    if (target.data.sampleId && !target.data.collected) {
      collectSample(target);
    } else {
      showToast('Roca examinada. Usa F para consultar sus características.');
    }
  } else if (target.type === 'solar') {
    showToast('Paneles solares inspeccionados: convierten luz solar en electricidad; el polvo puede reducir su producción.');
  } else if (target.type === 'rover') {
    enterRover();
  } else if (target.type === 'analyzer') {
    openLab();
  } else if (target.type === 'console') {
    openTerminal();
  }
}

function inspectTarget() {
  const target = state.currentTarget;
  if (!target) {
    showToast('Mira hacia una roca o equipo cercano para consultar sus datos.');
    return;
  }

  if (target.type === 'rock') {
    const profile = sampleProfiles[target.data.profileId];
    const scale = target.data.scale;
    const size = Math.max(scale.x, scale.y, scale.z);
    const mass = Math.max(0.05, 0.08 + scale.x * scale.y * scale.z * 0.18);
    const mineralNames = profile.minerals.map((mineral) => mineral.name).join(', ');
    showToast(
      `${target.data.sampleId} · ${profile.name} · ${size.toFixed(2)} m · ${mass.toFixed(2)} kg · dureza ${profile.hardness}/10. ${profile.appearance} Minerales previstos: ${mineralNames}. Perfil geológico simulado.`,
      5200,
    );
  } else if (target.type === 'solar') {
    showToast(`Panel fotovoltaico · matriz ${target.data.width.toFixed(1)} m. Potencia de diseño de la instalación: 10 kW; la salida real depende de la luz y el polvo.`);
  } else if (target.type === 'rover') {
    showToast(`Rover científico · seis ruedas articuladas · batería ${Math.ceil(state.roverBattery)}% · posición ${formatCoordinates(roverPosition.x, roverPosition.z)} · velocidad máxima limitada a 3,2 m/s.`);
  } else if (target.type === 'analyzer') {
    showToast('Analizador geológico de mesa · admite inspección visual, fluorescencia X, Raman e infrarrojo simulado.');
  } else if (target.type === 'console') {
    showToast('Terminal de misión · consulta el estado de la expedición y los registros científicos.');
  } else if (target.type === 'door') {
    showToast('Esclusa presurizada · protege el interior de la base de la baja presión exterior.');
  } else {
    showToast('Esclusa exterior del hábitat principal.');
  }
}

function enterBase() {
  if (state.driving) return;
  state.inside = true;
  state.stormExposure = 0;
  const firstArrival = !state.missionComplete;
  state.missionComplete = true;
  baseExterior.visible = false;
  baseInterior.visible = true;
  playerPosition.set(0, 0, -49);
  state.feetY = 0;
  state.yaw = 0;
  state.pitch = -0.025;
  camera.position.set(playerPosition.x, 1.68, playerPosition.z);
  camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
  updateMissionUI();
  if (firstArrival) addJournalEntry('Misión 01 completada', 'Llegada física al hábitat principal de AP-1.');
  renderJournal();
  showToast('MISIÓN COMPLETADA · Has llegado a la base científica de AP-1.', 4700);
}

function exitBase() {
  state.inside = false;
  baseExterior.visible = true;
  baseInterior.visible = false;
  playerPosition.set(0, 0, entryPosition.z + 2.6);
  state.feetY = terrainHeight(playerPosition.x, playerPosition.z);
  camera.position.set(playerPosition.x, state.feetY + 1.68, playerPosition.z);
  state.yaw = Math.PI;
  state.pitch = -0.03;
  camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
  showToast('Estás de vuelta en la superficie. La base está detrás de ti.');
}

function beginStormRescue() {
  state.rescuePhase = 'fade-out';
  state.rescueElapsed = 0;
  state.headbobPhase = 0;
  state.analysisInProgress = false;
  state.keys.clear();
  state.dragging = false;
  state.roverSpeed = 0;
  state.currentTarget = null;
  state.mapOpen = false;
  state.mapDragging = false;
  state.mapPointer = null;
  state.environmentOpen = false;
  state.journalOpen = false;
  elements.mapScreen.classList.add('hidden');
  elements.environmentScreen.classList.add('hidden');
  elements.journalScreen.classList.add('hidden');
  elements.interactionPrompt.classList.add('hidden');
  elements.stormRescue.style.opacity = '0';
  elements.stormRescue.classList.remove('hidden');
}

function moveRescuedPlayerToLab() {
  state.driving = false;
  elements.hud.classList.remove('driving');
  elements.pointerStatus.textContent = document.pointerLockElement === renderer.domElement
    ? 'RATÓN CAPTURADO · ESC PARA LIBERAR'
    : 'RATÓN LIBRE · ARRASTRA';
  roverWheels.forEach((wheel) => {
    wheel.steeringPivot.rotation.y = 0;
  });
  enterBase();
  playerPosition.set(0, 0, -53);
  state.feetY = 0;
  state.verticalVelocity = 0;
  state.jumping = false;
  state.yaw = Math.atan2(playerPosition.x - analyzerPosition.x, playerPosition.z - analyzerPosition.z);
  state.pitch = -0.025;
  camera.position.set(playerPosition.x, 1.68, playerPosition.z);
  camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
  applyWeatherEffects();
  updateWeatherPanel();
  recordWeatherEvent('Rescate en la tormenta', 'Tras 60 segundos de exposición continua, el explorador fue rescatado y trasladado al laboratorio de AP-1.');
}

function updateStormRescue(delta) {
  if (!state.started || state.paused) return;
  if (!state.rescuePhase) {
    if (state.inside || state.weather.phase !== 'storm') {
      state.stormExposure = 0;
      return;
    }
    state.stormExposure += delta;
    if (state.stormExposure >= STORM_EXPOSURE_LIMIT) beginStormRescue();
    return;
  }

  state.rescueElapsed += delta;
  if (state.rescuePhase === 'fade-out') {
    elements.stormRescue.style.opacity = String(Math.min(1, state.rescueElapsed / RESCUE_FADE_SECONDS));
    if (state.rescueElapsed >= RESCUE_FADE_SECONDS) {
      state.rescuePhase = 'hold';
      state.rescueElapsed = 0;
      moveRescuedPlayerToLab();
    }
  } else if (state.rescuePhase === 'hold') {
    if (state.rescueElapsed >= RESCUE_HOLD_SECONDS) {
      state.rescuePhase = 'fade-in';
      state.rescueElapsed = 0;
    }
  } else {
    elements.stormRescue.style.opacity = String(1 - Math.min(1, state.rescueElapsed / RESCUE_FADE_SECONDS));
    if (state.rescueElapsed >= RESCUE_FADE_SECONDS) {
      state.rescuePhase = null;
      state.rescueElapsed = 0;
      state.stormExposure = 0;
      elements.stormRescue.classList.add('hidden');
      elements.pointerStatus.textContent = document.pointerLockElement === renderer.domElement
        ? 'RATÓN CAPTURADO · ESC PARA LIBERAR'
        : 'RATÓN LIBRE · ARRASTRA';
      showToast('Has sido rescatado y trasladado al laboratorio de AP-1.', 6000);
    }
  }
}

function updateRoverCamera(delta = 0.5) {
  if (!roverGroup) return;
  const yaw = state.roverYaw + roverCameraYawOffset;
  const cameraPosition = new THREE.Vector3(
    roverPosition.x + Math.sin(yaw) * 7.1,
    roverGroup.position.y + 3.2 + roverCameraPitch * 2,
    roverPosition.z + Math.cos(yaw) * 7.1,
  );
  cameraPosition.y = Math.max(cameraPosition.y, terrainHeight(cameraPosition.x, cameraPosition.z) + 2.2);
  camera.position.lerp(cameraPosition, 1 - Math.exp(-5 * delta));
  camera.lookAt(roverPosition.x, roverGroup.position.y + 1.05, roverPosition.z);
  camera.rotateX(state.roverCameraBouncePitch);
  camera.rotateZ(state.roverCameraBounceRoll);
}

function enterRover() {
  if (state.inside || state.driving || !roverGroup) return;
  state.driving = true;
  state.roverUsed = true;
  elements.hud.classList.add('driving');
  state.roverSpeed = 0;
  state.roverYaw = roverGroup.rotation.y;
  roverCameraYawOffset = 0;
  roverCameraPitch = 0.18;
  state.currentTarget = null;
  elements.pointerStatus.textContent = 'ROVER · WASD CONDUCIR';
  updateRoverCamera(1);
  updateWeatherPanel();
  renderJournal();
  showToast('Rover operativo · W avanzar · S retroceder · A izquierda · D derecha · ESPACIO frenar · E entrar/salir · F especificaciones.');
}

function exitRover() {
  if (!state.driving || !roverGroup) return;
  state.driving = false;
  state.roverSpeed = 0;
  const rightX = Math.cos(state.roverYaw);
  const rightZ = -Math.sin(state.roverYaw);
  let exitPosition = null;
  for (const offset of [2.8, -2.8]) {
    const candidateX = roverPosition.x + rightX * offset;
    const candidateZ = roverPosition.z + rightZ * offset;
    if (!isBlocked(candidateX, candidateZ)) {
      exitPosition = { x: candidateX, z: candidateZ };
      break;
    }
  }
  if (!exitPosition) {
    state.driving = true;
    showToast('No hay espacio seguro para bajar del rover. Muévelo unos metros e inténtalo de nuevo.');
    return;
  }
  elements.hud.classList.remove('driving');
  playerPosition.set(exitPosition.x, 0, exitPosition.z);
  state.feetY = terrainHeight(playerPosition.x, playerPosition.z);
  state.yaw = state.roverYaw;
  camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
  camera.position.set(playerPosition.x, state.feetY + 1.68, playerPosition.z);
  elements.pointerStatus.textContent = 'RATÓN LIBRE · ARRASTRA';
  updateWeatherPanel();
  showToast('Aterrizaje del rover completado. Estás de pie junto al vehículo.');
}

function openTerminal() {
  state.terminalOpen = true;
  updateTerminalWeather();
  elements.terminalScreen.classList.remove('hidden');
  elements.interactionPrompt.classList.add('hidden');
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}

function closeTerminal() {
  state.terminalOpen = false;
  elements.terminalScreen.classList.add('hidden');
  if (state.started && !state.paused) requestPointerLock();
}

function paintMap() {
  const activePosition = getMissionPosition();
  const baseCoordinates = formatCoordinates(basePosition.x, basePosition.z);
  elements.minimapCoordinates.textContent =
    `EXPLORADOR · ${formatCoordinates(activePosition.x, activePosition.z)} · ${formatElevation(activePosition.x, activePosition.z)}`;
  const canvases = [
    { canvas: elements.mapCanvas, isFull: false },
    ...(state.mapOpen ? [{ canvas: elements.fullMapCanvas, isFull: true }] : []),
  ];
  for (const { canvas, isFull } of canvases) {
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const worldSpan = isFull ? 300 / state.mapZoom : 160;
    const scale = width / worldSpan;
    const centerX = isFull ? activePosition.x + state.mapPanX : (activePosition.x + basePosition.x) / 2;
    const centerZ = isFull ? activePosition.z + state.mapPanZ : (activePosition.z + basePosition.z) / 2;
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#252521';
    context.fillRect(0, 0, width, height);

    const worldWidth = width / scale;
    const worldHeight = height / scale;
    if (state.mapLayer === 'topography') {
      drawTerrainRaster(context, width, height, scale, centerX, centerZ);
    } else if (state.mapLayer === 'geology') {
      drawGeologicalRaster(context, width, height, centerX, centerZ, worldWidth, worldHeight);
    } else {
      drawSubsurfaceIceRaster(context, width, height, centerX, centerZ, worldWidth, worldHeight);
    }
    state.mapNasaInset = isFull && state.mapLayer === 'topography' && nasaMapTileLoaded
      ? drawNasaTileInset(context, width, height)
      : null;

    context.strokeStyle = 'rgba(221, 213, 192, 0.12)';
    context.lineWidth = 1;
    const gridSpacing = isFull ? Math.max(24, Math.round(100 * scale)) : 22;
    for (let x = (width / 2) % gridSpacing; x <= width; x += gridSpacing) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = (height / 2) % gridSpacing; y <= height; y += gridSpacing) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    const screenPoint = (x, z) => ({
      x: width / 2 + (x - centerX) * scale,
      y: height / 2 - (z - centerZ) * scale,
    });
    const player = screenPoint(activePosition.x, activePosition.z);
    const base = screenPoint(basePosition.x, basePosition.z);

    context.fillStyle = 'rgba(206, 194, 169, 0.72)';
    for (const visit of state.visitedLocations) {
      const point = screenPoint(visit.x, visit.z);
      context.beginPath();
      context.arc(point.x, point.y, isFull ? 3.2 : 1.7, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = '#f2c07d';
    for (const item of interactiveObjects) {
      if (item.type !== 'rock' || !item.data.sampleId || item.data.collected) continue;
      const point = screenPoint(item.data.x, item.data.z);
      context.beginPath();
      context.arc(point.x, point.y, isFull ? 3 : 2, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = '#8fe8d8';
    for (const sample of state.collectedSamples) {
      const point = screenPoint(sample.x, sample.z);
      context.beginPath();
      context.arc(point.x, point.y, isFull ? 4 : 2.6, 0, Math.PI * 2);
      context.fill();
    }
    for (const item of interactiveObjects) {
      if (!['rover', 'solar', 'console'].includes(item.type)) continue;
      const point = screenPoint(item.data.x, item.data.z);
      context.fillStyle = '#c9d8d1';
      const markerSize = isFull ? 4 : 2.3;
      context.fillRect(point.x - markerSize / 2, point.y - markerSize / 2, markerSize, markerSize);
    }

    context.strokeStyle = 'rgba(143, 232, 216, 0.7)';
    context.setLineDash([4, 5]);
    context.beginPath();
    context.moveTo(player.x, player.y);
    context.lineTo(base.x, base.y);
    context.stroke();
    context.setLineDash([]);

    if (base.x > 3 && base.x < width - 3 && base.y > 3 && base.y < height - 3) {
      context.fillStyle = '#73e5d6';
      context.shadowColor = '#73e5d6';
      context.shadowBlur = isFull ? 14 : 8;
      context.beginPath();
      context.arc(base.x, base.y, isFull ? 6 : 4.2, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      if (isFull) {
        context.fillStyle = '#eff8e9';
        context.font = '12px sans-serif';
        context.fillText('AP-1', base.x + 10, base.y - 8);
      }
    }

    context.save();
    context.translate(player.x, player.y);
    context.rotate(-(state.driving ? state.roverYaw : state.yaw));
    context.fillStyle = state.driving ? '#8fe8d8' : '#fff1c8';
    context.beginPath();
    context.moveTo(0, isFull ? -10 : -7);
    context.lineTo(isFull ? -7 : -4.5, isFull ? 8 : 5);
    context.lineTo(0, isFull ? 4 : 2.5);
    context.lineTo(isFull ? 7 : 4.5, isFull ? 8 : 5);
    context.closePath();
    context.fill();
    if (state.driving && isFull) {
      context.fillStyle = '#eff8e9';
      context.font = 'bold 12px sans-serif';
      context.fillText('ROVER', player.x + 10, player.y - 8);
    }
    context.restore();
  }

  if (state.mapOpen) {
    const layerStatus = state.mapLayer === 'topography'
      ? nasaMapTileLoaded
        ? 'Relieve local modelado; recuadro regional NASA MOLA real (~463 m/px), sin detalle de sitio.'
        : nasaMapTileError
          ? 'NASA MOLA no respondió; topografía local de respaldo simulada.'
          : 'Cargando mosaico NASA MOLA regional; relieve local simulado mientras tanto.'
      : state.mapLayer === 'geology'
        ? 'Unidades geológicas esquemáticas: llanuras, depósitos, terrenos volcánicos y zonas glaciares.'
        : 'Distribución potencial de hielo ilustrativa; no representa detección ni medición local.';
    elements.mapDataStatus.textContent = layerStatus;
    const layerLegends = {
      topography: '<span><i class="map-swatch swatch-topography"></i>Relieve local modelado</span><span><i class="map-swatch swatch-mola"></i>Contexto NASA MOLA</span>',
      geology:
        '<span><i class="map-swatch swatch-plains"></i>Llanuras</span><span><i class="map-swatch swatch-deposits"></i>Depósitos superficiales</span><span><i class="map-swatch swatch-volcanic"></i>Terreno volcánico</span><span><i class="map-swatch swatch-glacial"></i>Zonas glaciares</span>',
      ice: '<span><i class="map-swatch swatch-low-ice"></i>Potencial bajo</span><span><i class="map-swatch swatch-medium-ice"></i>Potencial medio</span><span><i class="map-swatch swatch-high-ice"></i>Potencial alto</span>',
    };
    elements.mapLayerLegend.innerHTML = layerLegends[state.mapLayer];
    elements.mapCoordinates.textContent =
      `AP-1 · ${baseCoordinates} · ${formatElevation(basePosition.x, basePosition.z)} | ` +
      `${state.driving ? 'ROVER' : 'EXPLORADOR'} · ${formatCoordinates(activePosition.x, activePosition.z)} · ` +
      `${formatElevation(activePosition.x, activePosition.z)}`;
    if (state.mapSelection) {
      if (state.mapSelection.nasaInset) {
        elements.mapTooltip.classList.add('hidden');
        elements.mapDataStatus.textContent = 'Recuadro NASA MOLA: mosaico orbital regional centrado en Arcadia Planitia; ~463 m/px.';
      } else {
        elements.mapDataStatus.textContent =
          `Coordenadas consultadas: ${formatCoordinates(state.mapSelection.x, state.mapSelection.z)} · ${layerStatus}`;
        elements.mapTooltip.classList.remove('hidden');
        elements.mapTooltipCoordinates.textContent =
          `${formatCoordinates(state.mapSelection.x, state.mapSelection.z)} · ` +
          `${formatElevation(state.mapSelection.x, state.mapSelection.z)}`;
        const viewBounds = elements.mapView.getBoundingClientRect();
        const tooltipWidth = elements.mapTooltip.offsetWidth;
        const tooltipHeight = elements.mapTooltip.offsetHeight;
        const pointerX = (state.mapSelection.canvasX / elements.fullMapCanvas.width) * viewBounds.width;
        const pointerY = (state.mapSelection.canvasY / elements.fullMapCanvas.height) * viewBounds.height;
        elements.mapTooltip.style.left = `${Math.max(8, Math.min(pointerX + 12, viewBounds.width - tooltipWidth - 8))}px`;
        elements.mapTooltip.style.top = `${Math.max(8, Math.min(pointerY + 12, viewBounds.height - tooltipHeight - 8))}px`;
      }
    } else {
      elements.mapTooltip.classList.add('hidden');
    }
  }

  const distance = state.inside
    ? 0
    : Math.round(Math.hypot(activePosition.x - basePosition.x, activePosition.z - basePosition.z));
  elements.distanceValue.textContent = state.inside ? 'BASE · INTERIOR' : `BASE · ${distance} m`;
}

function changeMapZoom(factor) {
  state.mapZoom = THREE.MathUtils.clamp(state.mapZoom * factor, 0.02, 12);
  state.mapSelection = null;
  paintMap();
}

function onMapPointerDown(event) {
  if (!state.mapOpen) return;
  const canvas = elements.fullMapCanvas;
  state.mapDragging = true;
  state.mapDragMoved = false;
  state.mapPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
}

function onMapPointerMove(event) {
  if (!state.mapDragging || !state.mapPointer) return;
  const deltaX = event.clientX - state.mapPointer.x;
  const deltaY = event.clientY - state.mapPointer.y;
  state.mapPointer = { x: event.clientX, y: event.clientY };
  if (Math.abs(deltaX) + Math.abs(deltaY) > 1) state.mapDragMoved = true;
  if (!state.mapDragMoved) return;
  const canvas = elements.fullMapCanvas;
  const scale = canvas.width / (300 / state.mapZoom);
  state.mapPanX -= deltaX * (canvas.width / canvas.getBoundingClientRect().width) / scale;
  state.mapPanZ += deltaY * (canvas.height / canvas.getBoundingClientRect().height) / scale;
  state.mapSelection = null;
  paintMap();
}

function onMapPointerUp(event) {
  if (!state.mapDragging) return;
  state.mapDragging = false;
  state.mapPointer = null;
  if (state.mapDragMoved) return;
  const canvas = elements.fullMapCanvas;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  const inset = state.mapNasaInset;
  if (inset && x >= inset.x && x <= inset.x + inset.width && y >= inset.y && y <= inset.y + inset.height) {
    state.mapSelection = { nasaInset: true };
    paintMap();
    return;
  }
  const scale = canvas.width / (300 / state.mapZoom);
  state.mapSelection = {
    x: playerPosition.x + state.mapPanX + (x - canvas.width / 2) / scale,
    z: playerPosition.z + state.mapPanZ - (y - canvas.height / 2) / scale,
    canvasX: x,
    canvasY: y,
  };
  paintMap();
}

function onMapWheel(event) {
  event.preventDefault();
  changeMapZoom(event.deltaY < 0 ? 1.25 : 0.8);
}

function updateSuit(delta) {
  if (!state.started || state.paused) return;
  if (state.inside) {
    state.oxygen = Math.min(100, state.oxygen + delta * 0.9);
    state.battery = Math.min(100, state.battery + delta * 1.2);
    if (state.oxygen > 0) state.suitEmergency = false;
  } else {
    const sprinting = !state.driving && (state.keys.has('ShiftLeft') || state.keys.has('ShiftRight'));
    const weatherDrain = getWeatherIntensity() * 0.055;
    const nightHeatingDrain = getSolarConditions(state.weather.elapsed).night * 0.025;
    state.oxygen = Math.max(0, state.oxygen - delta * (sprinting ? 0.045 : 0.027));
    state.battery = Math.max(0, state.battery - delta * ((sprinting ? 0.035 : 0.014) + weatherDrain + nightHeatingDrain));
  }

  elements.oxygenBar.style.width = `${state.oxygen}%`;
  elements.oxygenValue.textContent = `${Math.ceil(state.oxygen)}%`;
  elements.batteryBar.style.width = `${state.battery}%`;
  elements.batteryValue.textContent = `${Math.ceil(state.battery)}%`;

  if (state.oxygen === 0) {
    elements.suitState.textContent = 'OXÍGENO AGOTADO';
    elements.suitState.style.color = '#ffae77';
  } else if (state.oxygen < 20 || state.battery < 15) {
    elements.suitState.textContent = 'RESERVA BAJA';
    elements.suitState.style.color = '#ffae77';
  } else {
    elements.suitState.textContent = 'ESTABLE';
    elements.suitState.style.color = '#8fe4bd';
  }

  if (state.oxygen === 0) {
    if (!state.suitEmergency) {
      state.suitEmergency = true;
      showToast('Reserva de oxígeno agotada. Regresa a la base para recargar el traje.', 7000);
    }
  }
}

function isBlocked(x, z) {
  const obstacles = state.inside ? interiorCollisionObjects : collisionObjects;
  return obstacles.some((object) => {
    if (state.driving && object === roverCollision) return false;
    return Math.hypot(x - object.x, z - object.z) < object.radius + 0.48;
  });
}

function movePlayer(delta) {
  if (!state.started || state.driving || state.paused || state.terminalOpen || state.labOpen || state.journalOpen || state.mapOpen || state.environmentOpen) return;

  const forwardInput = Number(state.keys.has('KeyW')) - Number(state.keys.has('KeyS'));
  const sideInput = Number(state.keys.has('KeyD')) - Number(state.keys.has('KeyA'));
  const inputLength = Math.hypot(forwardInput, sideInput);
  const previousX = playerPosition.x;
  const previousZ = playerPosition.z;
  if (state.keys.has('Space') && !state.jumping) {
    state.verticalVelocity = 5.3;
    state.jumping = true;
  }

  const sprinting = (state.keys.has('ShiftLeft') || state.keys.has('ShiftRight')) && state.battery > 2;
  const weatherFactor = state.inside ? 1 : 1 - getWeatherIntensity() * 0.52;
  const speed = (state.inside ? (sprinting ? 6.2 : 3.45) : (sprinting ? 8.2 : 4.7)) * weatherFactor;
  const forwardX = -Math.sin(state.yaw);
  const forwardZ = -Math.cos(state.yaw);
  const rightX = Math.cos(state.yaw);
  const rightZ = -Math.sin(state.yaw);
  let remaining = delta;

  while (remaining > 0) {
    const step = Math.min(remaining, 0.05);
    if (inputLength > 0) {
      const scale = (speed * step) / inputLength;
      const nextX = playerPosition.x + (forwardX * forwardInput + rightX * sideInput) * scale;
      const nextZ = playerPosition.z + (forwardZ * forwardInput + rightZ * sideInput) * scale;

      if (state.inside) {
        playerPosition.x = THREE.MathUtils.clamp(nextX, -3.95, 3.95);
        playerPosition.z = THREE.MathUtils.clamp(nextZ, -61, -46.9);
      } else {
        if (!isBlocked(nextX, playerPosition.z)) playerPosition.x = nextX;
        if (!isBlocked(playerPosition.x, nextZ)) playerPosition.z = nextZ;
      }
    }

    state.verticalVelocity -= MARS_GRAVITY * step;
    state.feetY += state.verticalVelocity * step;
    const floorY = state.inside ? 0 : terrainHeight(playerPosition.x, playerPosition.z);
    if (state.feetY <= floorY) {
      state.feetY = floorY;
      state.verticalVelocity = 0;
      state.jumping = false;
    }
    remaining -= step;
  }

  const walkedDistance = Math.hypot(playerPosition.x - previousX, playerPosition.z - previousZ);
  const moving = inputLength > 0 && walkedDistance > 0.0001;
  state.headbobPhase += delta * (sprinting ? 12 : 8) * (moving ? 1 : 0.2);
  state.headbobAmount = THREE.MathUtils.damp(state.headbobAmount, moving ? (sprinting ? 0.065 : 0.035) : 0, 7, delta);
  const headbob = !state.jumping ? Math.sin(state.headbobPhase) * state.headbobAmount : 0;
  camera.position.set(playerPosition.x, state.feetY + 1.68 + headbob, playerPosition.z);
  camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
  if (!state.inside && !state.jumping && moving) {
    state.footprintDistance += walkedDistance;
    while (state.footprintDistance >= 0.92) {
      state.footprintDistance -= 0.92;
      state.leftFootNext = !state.leftFootNext;
      const offset = state.leftFootNext ? 0.16 : -0.16;
      spawnSurfaceMark(
        surfaceMarkPools.footprints,
        playerPosition.x + rightX * offset - forwardX * 0.12,
        playerPosition.z + rightZ * offset - forwardZ * 0.12,
        state.yaw,
        0.19,
        0.34,
      );
      playFootstep();
    }
  }
  const lastVisit = state.visitedLocations[state.visitedLocations.length - 1];
  if (Math.hypot(playerPosition.x - lastVisit.x, playerPosition.z - lastVisit.z) > 8) {
    state.visitedLocations.push({ x: playerPosition.x, z: playerPosition.z });
  }
}

function isRoverBlocked(x, z) {
  return collisionObjects.some((object) => {
    if (object === roverCollision) return false;
    const minimumDistance = object.radius + 1.24;
    const candidateDistance = Math.hypot(x - object.x, z - object.z);
    if (candidateDistance >= minimumDistance) return false;
    const currentDistance = Math.hypot(roverPosition.x - object.x, roverPosition.z - object.z);
    return candidateDistance <= currentDistance + 0.005;
  });
}

function moveRover(delta) {
  if (!state.started || !state.driving || state.paused || state.terminalOpen || state.labOpen || state.journalOpen || state.mapOpen || state.environmentOpen) return;
  const forwardInput = Number(state.keys.has('KeyW')) - Number(state.keys.has('KeyS'));
  const steeringInput = Number(state.keys.has('KeyA')) - Number(state.keys.has('KeyD'));
  const braking = state.keys.has('Space');
  const stormIntensity = getWeatherIntensity();
  const batteryFactor = state.roverBattery > 0 ? 1 : 0.3;
  const maxSpeed = (state.weather.phase === 'storm' ? 1.75 : 3.2) * batteryFactor;
  const desiredSpeed = braking ? 0 : forwardInput * maxSpeed;
  const acceleration = braking ? 7 : forwardInput === 0 ? 1.25 : 1.9;
  const previousSpeed = state.roverSpeed;
  const previousX = roverPosition.x;
  const previousZ = roverPosition.z;
  state.roverSpeed = THREE.MathUtils.damp(state.roverSpeed, desiredSpeed, acceleration, delta);
  if (Math.abs(state.roverSpeed) < 0.025 && forwardInput === 0) state.roverSpeed = 0;
  const steeringFactor = Math.max(0.18, Math.min(1, Math.abs(state.roverSpeed) / 0.55));
  const steeringStability = THREE.MathUtils.clamp(
    1 - stormIntensity * 0.24 + Math.sin(state.weather.elapsed * 2) * stormIntensity * 0.06,
    0.58,
    1.05,
  );
  state.roverYaw += steeringInput * delta * 0.58 * steeringFactor * steeringStability;

  const forwardX = -Math.sin(state.roverYaw);
  const forwardZ = -Math.cos(state.roverYaw);
  let remaining = delta;
  while (remaining > 0) {
    const step = Math.min(remaining, 0.05);
    const nextX = roverPosition.x + forwardX * state.roverSpeed * step;
    const nextZ = roverPosition.z + forwardZ * state.roverSpeed * step;
    const frontHeight = terrainHeight(nextX + forwardX * 1.5, nextZ + forwardZ * 1.5);
    const backHeight = terrainHeight(nextX - forwardX * 1.5, nextZ - forwardZ * 1.5);
    const grade = Math.abs(frontHeight - backHeight) / 3;
    if (!isRoverBlocked(nextX, nextZ) && grade < 0.58) {
      roverPosition.set(nextX, 0, nextZ);
    } else {
      state.roverSpeed = 0;
    }
    remaining -= step;
  }

  const forwardHeight = terrainHeight(roverPosition.x + forwardX * 1.5, roverPosition.z + forwardZ * 1.5);
  const rearHeight = terrainHeight(roverPosition.x - forwardX * 1.5, roverPosition.z - forwardZ * 1.5);
  const leftX = Math.cos(state.roverYaw);
  const leftZ = -Math.sin(state.roverYaw);
  const leftHeight = terrainHeight(roverPosition.x - leftX * 1.25, roverPosition.z - leftZ * 1.25);
  const rightHeight = terrainHeight(roverPosition.x + leftX * 1.25, roverPosition.z + leftZ * 1.25);
  const groundHeight = terrainHeight(roverPosition.x, roverPosition.z);
  roverGroup.position.set(roverPosition.x, groundHeight, roverPosition.z);
  roverGroup.rotation.set(Math.atan2(forwardHeight - rearHeight, 3), state.roverYaw, Math.atan2(rightHeight - leftHeight, 2.5));

  for (const wheel of roverWheels) {
    const wheelX = roverPosition.x + leftX * wheel.offset + forwardX * -wheel.axle;
    const wheelZ = roverPosition.z + leftZ * wheel.offset + forwardZ * -wheel.axle;
    const wheelHeight = terrainHeight(wheelX, wheelZ);
    wheel.suspension.position.y = wheel.radius + THREE.MathUtils.clamp(wheelHeight - groundHeight, -0.32, 0.32);
    const steerAngle = wheel.axle < -0.5
      ? steeringInput * 0.34
      : wheel.axle > 0.5
        ? -steeringInput * 0.34
        : 0;
    wheel.steeringPivot.rotation.y = steerAngle;
    wheel.wheel.rotation.x += state.roverSpeed * delta / wheel.radius;
  }
  for (const sideLinks of roverBogieLinks) {
    const sideWheels = roverWheels.filter((wheel) => wheel.side === sideLinks.side);
    const frontWheel = sideWheels.find((wheel) => wheel.axle < -0.5);
    const middleWheel = sideWheels.find((wheel) => Math.abs(wheel.axle) < 0.1);
    const rearWheel = sideWheels.find((wheel) => wheel.axle > 0.5);
    const frontHub = new THREE.Vector3(sideLinks.side * 1.29, frontWheel.suspension.position.y, -1.02);
    const middleHub = new THREE.Vector3(sideLinks.side * 1.29, middleWheel.suspension.position.y, 0);
    const rearHub = new THREE.Vector3(sideLinks.side * 1.29, rearWheel.suspension.position.y, 1.02);
    sideLinks.rockerPivot.y = (middleHub.y + rearHub.y) * 0.5 + 0.17;
    updateRoverLink(sideLinks.frontRocker, sideLinks.chassisPivot, frontHub);
    updateRoverLink(sideLinks.middleBogie, sideLinks.rockerPivot, middleHub);
    updateRoverLink(sideLinks.rearBogie, sideLinks.rockerPivot, rearHub);
  }

  const longitudinalAcceleration = (state.roverSpeed - previousSpeed) / Math.max(delta, 0.001);
  const terrainPitch = Math.atan2(forwardHeight - rearHeight, 3);
  const terrainRoll = Math.atan2(rightHeight - leftHeight, 2.5);
  state.roverCameraBouncePitch = THREE.MathUtils.damp(
    state.roverCameraBouncePitch,
    THREE.MathUtils.clamp(-longitudinalAcceleration * 0.006 + terrainPitch * 0.08, -0.085, 0.085),
    6,
    delta,
  );
  state.roverCameraBounceRoll = THREE.MathUtils.damp(
    state.roverCameraBounceRoll,
    THREE.MathUtils.clamp(terrainRoll * 0.12 - steeringInput * Math.abs(state.roverSpeed) * 0.008, -0.07, 0.07),
    6,
    delta,
  );

  state.roverTrackDistance += Math.hypot(roverPosition.x - previousX, roverPosition.z - previousZ);
  while (state.roverTrackDistance >= 1.1) {
    state.roverTrackDistance -= 1.1;
    const trackX = roverPosition.x - forwardX * 1.3;
    const trackZ = roverPosition.z - forwardZ * 1.3;
    spawnSurfaceMark(surfaceMarkPools.tracks, trackX + leftX * 0.98, trackZ + leftZ * 0.98, state.roverYaw, 0.24, 0.82);
    spawnSurfaceMark(surfaceMarkPools.tracks, trackX - leftX * 0.98, trackZ - leftZ * 0.98, state.roverYaw, 0.24, 0.82);
  }

  roverCollision.x = roverPosition.x;
  roverCollision.z = roverPosition.z;
  const roverItem = interactiveObjects.find((item) => item.type === 'rover');
  if (roverItem) {
    roverItem.data.x = roverPosition.x;
    roverItem.data.z = roverPosition.z;
  }

  state.roverBattery = Math.max(0, state.roverBattery - delta * (0.008 + Math.abs(state.roverSpeed) * 0.006 + stormIntensity * 0.025));
  const lastVisit = state.visitedLocations[state.visitedLocations.length - 1];
  if (Math.hypot(roverPosition.x - lastVisit.x, roverPosition.z - lastVisit.z) > 8) {
    state.visitedLocations.push({ x: roverPosition.x, z: roverPosition.z });
  }
  updateRoverCamera(delta);
}

function updateDust(delta) {
  const weather = state.weather;
  const center = camera.position;
  const span = 60;
  const height = 14;
  const gust = 1 + 0.22 * Math.sin(weather.elapsed * 1.7) + 0.1 * Math.sin(weather.elapsed * 4.1);
  const wind = (weather.windSpeed / 3.6) * gust;
  for (const particleField of dustParticles) {
    const particles = particleField.mesh;
    particles.visible = !state.inside;
    if (state.inside) continue;
    const attribute = particles.geometry.attributes.position;
    const positions = attribute.array;
    const activeCount = Math.min(particleField.count, Math.round(720 + 4680 * weather.dustLevel));
    for (let index = particleField.activeCount; index < activeCount; index += 1) {
      const offset = index * 3;
      positions[offset] = center.x + (Math.random() - 0.5) * span;
      positions[offset + 1] = center.y + (Math.random() - 0.5) * height;
      positions[offset + 2] = center.z + (Math.random() - 0.5) * span;
    }
    particleField.activeCount = activeCount;
    particles.geometry.setDrawRange(0, activeCount);
    particles.material.opacity = 0.14 + weather.dustLevel * 0.4;
    particles.material.size = 0.12 + weather.dustLevel * 0.18;
    for (let index = 0; index < activeCount; index += 1) {
      const offset = index * 3;
      const speed = wind * particleField.velocities[index] * delta;
      const x = positions[offset] + speed * 0.894 - center.x;
      const y = positions[offset + 1] + Math.sin(weather.elapsed * 2 + index) * delta * 0.18 - center.y;
      const z = positions[offset + 2] + speed * 0.447 - center.z;
      positions[offset] = center.x + ((x + span * 1.5) % span + span) % span - span / 2;
      positions[offset + 1] = center.y + ((y + height * 1.5) % height + height) % height - height / 2;
      positions[offset + 2] = center.z + ((z + span * 1.5) % span + span) % span - span / 2;
    }
    attribute.needsUpdate = true;
  }
}

function updateScanRings(delta) {
  for (let index = scanRings.length - 1; index >= 0; index -= 1) {
    const ring = scanRings[index];
    ring.elapsed += delta;
    const progress = ring.elapsed / 1.6;
    ring.mesh.scale.setScalar(1 + progress * 28);
    ring.mesh.material.opacity = Math.max(0, 0.5 * (1 - progress));
    if (progress >= 1) {
      scene.remove(ring.mesh);
      ring.mesh.geometry.dispose();
      ring.mesh.material.dispose();
      scanRings.splice(index, 1);
    }
  }
}

function createScanPulse(x, z) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.035, 6, 40),
    new THREE.MeshBasicMaterial({ color: 0x9fe9d9, transparent: true, opacity: 0.5, depthWrite: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, terrainHeight(x, z) + 0.08, z);
  scene.add(mesh);
  scanRings.push({ mesh, elapsed: 0 });
}

function updateFrame() {
  const delta = Math.min(clock.getDelta(), 0.5);
  const elapsed = clock.elapsedTime;
  const now = performance.now();

  if (!state.started) {
    camera.position.x = Math.sin(elapsed * 0.09) * 3.2;
    camera.position.y = 8.3 + Math.sin(elapsed * 0.16) * 0.25;
    camera.position.z = 24;
    camera.lookAt(0, 3, -54);
  } else {
    updateWeather(delta);
    updateStormRescue(delta);
    if (!state.rescuePhase) {
      if (state.driving) moveRover(delta);
      else movePlayer(delta);
    }
    if (!state.driving && Math.hypot(roverPosition.x - basePosition.x, roverPosition.z - basePosition.z) < 10) {
      state.roverBattery = Math.min(100, state.roverBattery + delta * 1.1);
    }
    if (!state.rescuePhase) {
      updateSuit(delta);
      updatePrompt();
    }
    if (now - state.lastMapUpdate > 180) {
      paintMap();
      state.lastMapUpdate = now;
    }
    if (state.environmentOpen && now - state.lastEnvironmentUpdate > 1000) {
      updateEnvironmentPanel();
      state.lastEnvironmentUpdate = now;
    }
  }

  updateDust(delta);
  updateSurfaceMarks(delta);
  updateScanRings(delta);
  if (state.labOpen && viewerRenderer && viewerScene) {
    viewerRenderer.render(viewerScene, viewerCamera);
  }
  if (performance.now() > state.lastToast) elements.toast.classList.add('hidden');
  const shake = state.started && !state.paused && !state.inside && state.weather.phase === 'storm' && !reducedMotion.matches
    ? Math.min(1, state.weather.windSpeed / 64)
    : 0;
  const shakeX = Math.sin(elapsed * 8.7) * 0.025 * shake;
  const shakeY = Math.sin(elapsed * 11.3) * 0.014 * shake;
  const shakeRoll = Math.sin(elapsed * 5.2) * 0.004 * shake;
  camera.position.x += shakeX;
  camera.position.y += shakeY;
  camera.rotation.z += shakeRoll;
  renderer.render(scene, camera);
  camera.position.x -= shakeX;
  camera.position.y -= shakeY;
  camera.rotation.z -= shakeRoll;
  updateAudio();
  requestAnimationFrame(updateFrame);
}

function requestPointerLock() {
  if (!state.started) return;
  const result = renderer.domElement.requestPointerLock();
  if (result && typeof result.catch === 'function') {
    result.catch((error) => {
      console.warn('El navegador no permitió capturar el ratón.', error);
      showToast('El bloqueo de ratón no está disponible. Mantén clic y arrastra para mirar.');
      elements.pointerStatus.textContent = state.driving ? 'ROVER · WASD · MOUSE ORBITA' : 'RATÓN LIBRE · ARRASTRA';
    });
  }
}

function openPause() {
  if (!state.started || state.terminalOpen) return;
  state.paused = true;
  elements.pauseScreen.classList.remove('hidden');
  if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
}

function resumeGame() {
  elements.pauseScreen.classList.add('hidden');
  elements.pauseScreen.querySelector('h2').textContent = 'Tómate un respiro, explorador.';
  elements.pauseScreen.querySelector('p:not(.hud-kicker)').textContent =
    'La superficie marciana seguirá aquí. Pulsa continuar para volver al traje.';
  state.paused = false;
  requestPointerLock();
}

function returnToStart() {
  if (state.analysisTimer !== null) {
    window.clearTimeout(state.analysisTimer);
    state.analysisTimer = null;
  }
  state.analysisInProgress = false;
  state.started = false;
  state.paused = false;
  state.inside = false;
  state.terminalOpen = false;
  state.missionComplete = false;
  state.firstStormSurvived = false;
  state.roverUsed = false;
  state.labOpen = false;
  state.journalOpen = false;
  state.mapOpen = false;
  state.environmentOpen = false;
  state.driving = false;
  state.oxygen = 100;
  state.battery = 100;
  state.roverBattery = 100;
  state.roverSpeed = 0;
  state.roverYaw = -0.26;
  state.roverCameraBouncePitch = 0;
  state.roverCameraBounceRoll = 0;
  state.headbobAmount = 0;
  state.footprintDistance = 0;
  state.roverTrackDistance = 0;
  state.leftFootNext = false;
  state.suitEmergency = false;
  state.stormExposure = 0;
  state.rescuePhase = null;
  state.rescueElapsed = 0;
  state.pointerLockActive = false;
  state.dragging = false;
  state.keys.clear();
  state.currentTarget = null;
  state.verticalVelocity = 0;
  state.jumping = false;
  state.yaw = 0;
  state.pitch = -0.035;
  state.headbobPhase = 0;
  state.headbobAmount = 0;
  state.footprintDistance = 0;
  state.roverTrackDistance = 0;
  state.roverCameraBouncePitch = 0;
  state.roverCameraBounceRoll = 0;
  state.collectedSamples = [];
  state.selectedSampleId = null;
  state.selectedInstrument = 'visual';
  state.analysisCount = 0;
  state.waterResourceLocated = false;
  state.missionStartedAt = 0;
  state.mapZoom = 1;
  state.mapPanX = 0;
  state.mapPanZ = 0;
  state.mapSelection = null;
  state.visitedLocations = [{ x: 0, z: 22 }];
  state.journal = [
    { title: 'Llegada a Arcadia Planitia', detail: 'Punto de misión AP-1 · coordenadas estudiadas mediante observaciones orbitales.' },
  ];
  roverPosition.set(11.5, 0, -40);
  roverGroup.position.set(11.5, terrainHeight(11.5, -40), -40);
  roverGroup.rotation.set(0, state.roverYaw, 0);
  roverCollision.x = roverPosition.x;
  roverCollision.z = roverPosition.z;
  const roverItem = interactiveObjects.find((item) => item.type === 'rover');
  if (roverItem) {
    roverItem.data.x = roverPosition.x;
    roverItem.data.z = roverPosition.z;
  }
  roverWheels.forEach((wheel) => {
    wheel.wheel.rotation.x = 0;
    wheel.steeringPivot.rotation.y = 0;
    wheel.suspension.position.y = wheel.radius;
  });
  for (const sideLinks of roverBogieLinks) {
    sideLinks.rockerPivot.y = 0.45;
    updateRoverLink(
      sideLinks.frontRocker,
      sideLinks.chassisPivot,
      new THREE.Vector3(sideLinks.side * 1.29, 0.28, -1.02),
    );
    updateRoverLink(
      sideLinks.middleBogie,
      sideLinks.rockerPivot,
      new THREE.Vector3(sideLinks.side * 1.29, 0.28, 0),
    );
    updateRoverLink(
      sideLinks.rearBogie,
      sideLinks.rockerPivot,
      new THREE.Vector3(sideLinks.side * 1.29, 0.28, 1.02),
    );
  }
  roverCameraYawOffset = 0;
  roverCameraPitch = 0.18;
  clearSurfaceMarks();
  resetWeather();
  for (const item of interactiveObjects) {
    if (item.type === 'rock') {
      item.data.collected = false;
      item.object.visible = true;
      if (item.data.collision && !collisionObjects.includes(item.data.collision)) {
        collisionObjects.push(item.data.collision);
      }
    }
  }

  if (document.pointerLockElement === renderer.domElement) {
    document.exitPointerLock();
  }

  baseExterior.visible = true;
  baseInterior.visible = false;
  playerPosition.set(0, terrainHeight(0, 22), 22);
  state.feetY = playerPosition.y;
  camera.position.set(0, 8, 24);
  camera.lookAt(0, 3, -54);

  elements.hud.classList.add('hidden');
  elements.hud.classList.remove('driving');
  elements.pauseScreen.classList.add('hidden');
  elements.terminalScreen.classList.add('hidden');
  elements.labScreen.classList.add('hidden');
  elements.journalScreen.classList.add('hidden');
  elements.mapScreen.classList.add('hidden');
  elements.environmentScreen.classList.add('hidden');
  elements.weatherHud.classList.add('hidden');
  elements.roverHud.classList.add('hidden');
  elements.interactionPrompt.classList.add('hidden');
  elements.toast.classList.add('hidden');
  elements.stormRescue.classList.add('hidden');
  elements.stormRescue.style.opacity = '0';
  elements.laserScan.classList.add('hidden');
  elements.intro.classList.remove('leaving');
  elements.startButton.disabled = false;
  elements.oxygenBar.style.width = '100%';
  elements.oxygenValue.textContent = '100%';
  elements.batteryBar.style.width = '100%';
  elements.batteryValue.textContent = '100%';
  elements.suitState.textContent = 'ESTABLE';
  elements.suitState.style.color = '#8fe4bd';
  elements.pauseScreen.querySelector('h2').textContent = 'Tómate un respiro, explorador.';
  elements.pauseScreen.querySelector('p:not(.hud-kicker)').textContent =
    'La superficie marciana seguirá aquí. Pulsa continuar para volver al traje.';
  elements.pointerStatus.textContent = state.driving ? 'ROVER · WASD · MOUSE ORBITA' : 'RATÓN LIBRE · ARRASTRA';
  elements.viewerPlaceholder.classList.remove('hidden');
  elements.analyzeButton.disabled = true;
  elements.analysisResult.innerHTML =
    '<span class="result-placeholder">Elige una muestra y usa un instrumento para comenzar.</span>';
  elements.viewerLightButton.classList.remove('active');
  elements.viewerMarkerButton.classList.remove('active');
  if (viewerLighting) viewerLighting.intensity = 0;
  elements.instrumentControls.querySelectorAll('[data-instrument]').forEach((button) => {
    button.classList.toggle('active', button.dataset.instrument === 'visual');
    button.disabled = false;
  });
  if (viewerRockGroup) disposeViewerRock();
  renderInventory();
  renderJournal();
  updateMissionUI();
  updateHydratedResourceObjective();
}

function startGame() {
  if (state.started) return;
  initAudio();
  state.started = true;
  state.paused = false;
  state.driving = false;
  state.roverBattery = 100;
  state.roverSpeed = 0;
  state.missionStartedAt = Date.now();
  resetWeather();
  playerPosition.set(0, 0, 22);
  state.visitedLocations = [{ x: 0, z: 22 }];
  state.feetY = terrainHeight(playerPosition.x, playerPosition.z);
  state.yaw = 0;
  state.pitch = -0.035;
  camera.position.set(playerPosition.x, state.feetY + 1.68, playerPosition.z);
  camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
  elements.intro.classList.add('leaving');
  elements.hud.classList.remove('hidden');
  elements.startButton.disabled = true;
  showToast('Usa WASD para moverte. El faro turquesa señala la base científica.', 4800);
  requestPointerLock();
}

function onKeyDown(event) {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
    event.preventDefault();
  }
  if (state.rescuePhase) return;
  state.keys.add(event.code);

  if (event.code === 'Escape') {
    if (state.terminalOpen) {
      closeTerminal();
    } else if (state.labOpen) {
      closeLab();
    } else if (state.journalOpen) {
      closeJournal();
    } else if (state.environmentOpen) {
      closeEnvironment();
    } else if (state.mapOpen) {
      closeMap();
    } else if (!state.paused) {
      openPause();
    }
    return;
  }

  if (event.repeat || !state.started || state.paused || state.terminalOpen || state.labOpen || state.journalOpen) return;
  if (event.code === 'KeyR') {
    if (state.environmentOpen) closeEnvironment();
    else openEnvironment();
    return;
  }
  if (event.code === 'KeyM') {
    if (state.mapOpen) closeMap();
    else openMap();
    return;
  }
  if (state.mapOpen || state.environmentOpen) return;
  if (event.code === 'KeyE') interact();
  if (event.code === 'KeyF') inspectTarget();
  if (event.code === 'KeyJ') openJournal();
}

function onKeyUp(event) {
  state.keys.delete(event.code);
}

function onPointerLockChange() {
  const locked = document.pointerLockElement === renderer.domElement;
  if (state.rescuePhase) {
    state.pointerLockActive = locked;
    return;
  }
  if (!state.started || state.terminalOpen || state.labOpen || state.journalOpen || state.mapOpen || state.environmentOpen) return;
  if (locked) {
    state.pointerLockActive = true;
    state.paused = false;
    elements.pauseScreen.classList.add('hidden');
    elements.pointerStatus.textContent = state.driving ? 'ROVER · WASD · MOUSE ORBITA' : 'RATÓN CAPTURADO · ESC PARA LIBERAR';
  } else if (state.pointerLockActive) {
    state.pointerLockActive = false;
    elements.pointerStatus.textContent = state.driving ? 'ROVER · WASD · MOUSE ORBITA' : 'RATÓN LIBRE · ARRASTRA';
    if (!state.paused) openPause();
  }
}

function onPointerMove(event) {
  const locked = document.pointerLockElement === renderer.domElement;
  if ((!locked && !state.dragging) || state.rescuePhase || state.paused || state.terminalOpen || state.labOpen || state.journalOpen || state.mapOpen || state.environmentOpen) return;
  if (state.driving) {
    roverCameraYawOffset = THREE.MathUtils.clamp(roverCameraYawOffset - event.movementX * 0.0025, -1.35, 1.35);
    roverCameraPitch = THREE.MathUtils.clamp(roverCameraPitch - event.movementY * 0.0018, -0.2, 0.55);
    return;
  }
  state.yaw -= event.movementX * 0.0022;
  state.pitch -= event.movementY * 0.0019;
  state.pitch = THREE.MathUtils.clamp(state.pitch, -1.32, 1.32);
  camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
}

function onPointerDown(event) {
  if (!state.started || state.rescuePhase || state.paused || state.terminalOpen || state.labOpen || state.journalOpen || state.mapOpen || state.environmentOpen) return;
  if (document.pointerLockElement !== renderer.domElement) {
    state.dragging = true;
    renderer.domElement.setPointerCapture(event.pointerId);
  }
}

function onPointerUp() {
  state.dragging = false;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  resizeSampleViewer();
  if (state.started) paintMap();
}

function onViewerPointerDown(event) {
  viewerDragging = true;
  viewerPreviousPointer = { x: event.clientX, y: event.clientY };
  elements.sampleCanvas.setPointerCapture(event.pointerId);
}

function onViewerPointerMove(event) {
  if (!viewerDragging || !viewerPreviousPointer) return;
  const deltaX = event.clientX - viewerPreviousPointer.x;
  const deltaY = event.clientY - viewerPreviousPointer.y;
  viewerPreviousPointer = { x: event.clientX, y: event.clientY };
  viewerYaw += deltaX * 0.009;
  viewerPitch = THREE.MathUtils.clamp(viewerPitch + deltaY * 0.009, -1.25, 1.25);
  updateViewerCamera();
}

function onViewerPointerUp() {
  viewerDragging = false;
  viewerPreviousPointer = null;
}

function onViewerWheel(event) {
  event.preventDefault();
  viewerZoom = THREE.MathUtils.clamp(viewerZoom + Math.sign(event.deltaY) * 0.3, 2.4, 7.5);
  updateViewerCamera();
}

function setViewerPreset(view) {
  if (view === 'front') {
    viewerYaw = 0;
    viewerPitch = 0;
  } else if (view === 'side') {
    viewerYaw = Math.PI / 2;
    viewerPitch = 0;
  } else {
    viewerYaw = 0;
    viewerPitch = 0.85;
  }
  updateViewerCamera();
}

createScene();
createSampleViewer();
elements.startButton.disabled = false;
startupStatus.textContent = 'Entorno listo · Cámara y comunicaciones operativas.';
updateMissionUI();
updateHydratedResourceObjective();
requestAnimationFrame(updateFrame);

elements.startButton.addEventListener('click', startGame);
elements.resumeButton.addEventListener('click', resumeGame);
elements.returnHomeButton.addEventListener('click', returnToStart);
elements.closeTerminalButton.addEventListener('click', closeTerminal);
elements.leaveTerminalButton.addEventListener('click', closeTerminal);
elements.closeLabButton.addEventListener('click', closeLab);
elements.closeJournalButton.addEventListener('click', closeJournal);
elements.closeJournalFooter.addEventListener('click', closeJournal);
elements.journalButton.addEventListener('click', openJournal);
elements.openMapButton.addEventListener('click', openMap);
elements.closeMapButton.addEventListener('click', closeMap);
elements.mapZoomIn.addEventListener('click', () => changeMapZoom(1.5));
elements.mapZoomOut.addEventListener('click', () => changeMapZoom(1 / 1.5));
elements.mapCenterButton.addEventListener('click', () => {
  state.mapPanX = 0;
  state.mapPanZ = 0;
  state.mapSelection = null;
  paintMap();
});
document.querySelectorAll('[data-map-layer]').forEach((button) => {
  button.addEventListener('click', () => {
    state.mapLayer = button.dataset.mapLayer;
    state.mapSelection = null;
    document.querySelectorAll('[data-map-layer]').forEach((layerButton) => {
      layerButton.classList.toggle('active', layerButton === button);
      layerButton.setAttribute('aria-pressed', String(layerButton === button));
    });
    paintMap();
  });
});
elements.closeEnvironmentButton.addEventListener('click', closeEnvironment);
elements.environmentDoneButton.addEventListener('click', closeEnvironment);
elements.fullMapCanvas.addEventListener('pointerdown', onMapPointerDown);
elements.fullMapCanvas.addEventListener('pointermove', onMapPointerMove);
elements.fullMapCanvas.addEventListener('pointerup', onMapPointerUp);
elements.fullMapCanvas.addEventListener('pointercancel', onMapPointerUp);
elements.fullMapCanvas.addEventListener('wheel', onMapWheel, { passive: false });
elements.analyzeButton.addEventListener('click', performAnalysis);
elements.instrumentControls.querySelectorAll('[data-instrument]').forEach((button) => {
  button.addEventListener('click', () => {
    state.selectedInstrument = button.dataset.instrument;
    elements.instrumentControls.querySelectorAll('[data-instrument]').forEach((instrumentButton) => {
      instrumentButton.classList.toggle('active', instrumentButton === button);
    });
    elements.analysisResult.innerHTML =
      '<span class="result-placeholder">Instrumento preparado. Pulsa iniciar análisis para obtener una lectura.</span>';
  });
});
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => setViewerPreset(button.dataset.view));
});
elements.viewerLightButton.addEventListener('click', () => {
  const active = viewerLighting.intensity > 0;
  viewerLighting.intensity = active ? 0 : 7;
  elements.viewerLightButton.classList.toggle('active', !active);
});
elements.viewerMarkerButton.addEventListener('click', () => {
  if (!viewerMarker) return;
  viewerMarker.visible = !viewerMarker.visible;
  elements.viewerMarkerButton.classList.toggle('active', viewerMarker.visible);
});
elements.sampleCanvas.addEventListener('pointerdown', onViewerPointerDown);
elements.sampleCanvas.addEventListener('pointermove', onViewerPointerMove);
elements.sampleCanvas.addEventListener('pointerup', onViewerPointerUp);
elements.sampleCanvas.addEventListener('pointercancel', onViewerPointerUp);
elements.sampleCanvas.addEventListener('wheel', onViewerWheel, { passive: false });
renderer.domElement.addEventListener('click', () => {
  if (state.started && !state.rescuePhase && !state.paused && !state.terminalOpen && document.pointerLockElement !== renderer.domElement) {
    requestPointerLock();
  }
});
renderer.domElement.addEventListener('pointerdown', onPointerDown);
renderer.domElement.addEventListener('pointerup', onPointerUp);
renderer.domElement.addEventListener('pointercancel', onPointerUp);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);
document.addEventListener('pointermove', onPointerMove);
document.addEventListener('pointerlockchange', onPointerLockChange);
window.addEventListener('resize', onResize);
