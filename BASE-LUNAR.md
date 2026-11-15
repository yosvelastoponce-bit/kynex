# KYNEX Lunar Outpost 01

Primera base explorable del prototipo. En el modo de entrenamiento se encuentra en las coordenadas globales `X = -45 m`, `Z = 220 m`, a unos 54 m del punto inicial. Su emplazamiento y relieve son **procedurales e ilustrativos**: no corresponden a un lugar georreferenciado ni a un plano de construcción aprobado.

La portada ofrece también **Site04**, un escenario alternativo construido a partir del recorte de 2,4 × 2,4 km del TIFF proporcionado (`Site04_final_adj_5mpp_surf.tif`). Cada celda representa 5 m y las alturas `float32` se usan en la malla 3D y en el contacto del jugador. La región está centrada aproximadamente en `X = -3800 m`, `Y = -12800 m` en la retícula del archivo. En el mapa, **PENDIENTE** separa zonas `<10°`, `10–15°` y `>15°`; **ALTURA** muestra la elevación raster. También se marcan el jugador, una base educativa y la roca de la misión. Usa `H` para mostrar/ocultar el mapa.

El análisis que acompaña al TIFF informa 76,5 % de celdas bajo 10° y una pendiente mediana de 7,2°. Son indicadores de cribado del sector, no criterios suficientes para aprobar aterrizaje o excursión. La imagen identifica los datos como NASA LOLA, pero los metadatos del archivo dejan el CRS/datum como desconocidos; no deben interpretarse como coordenadas de navegación. La misión de muestra es un ensayo educativo en un punto ficticio del recorte, no una operación validada.

## Recorrido

La misión **Inspección del puesto** guía al jugador para localizar la base, examinar el hábitat, identificar la esclusa, revisar paneles solares, baterías, soporte vital y antena, y entrar al hábitat. El mapa local marca el puesto en sus coordenadas globales. Al acercarse a un control o instalación, `E` lo usa y `F` muestra su ficha educativa. `F` cierra la ficha.

Dentro hay un mini invernadero y un observatorio con actividades educativas. La misión geológica tiene una secuencia propia:

1. Busca la roca marcada en la superficie, al lado del puesto, y pulsa `E` para recogerla.
2. Llévala al laboratorio y pulsa `E` junto al microscopio para entregarla e iniciar el análisis.
3. Arrastra la roca 3D para girarla, usa la rueda para acercarla y compara los granos con el mapa regional Kaguya SP de NASA Trek. Selecciona los tres minerales de la mezcla de entrenamiento; puedes pedir pistas y volver a intentarlo.

La roca 3D y la respuesta (plagioclasa, ortopiroxeno y olivino) son **sintéticas e inferidas para el juego**, no una medición de una muestra real. La zona de la base es procedural y no está georreferenciada. NASA Trek ofrece capas orbitales regionales de Kaguya SP —plagioclasa, ortopiroxeno, clinopiroxeno, olivino y FeO—; su escala aproximada de 1 km/píxel es demasiado grande para determinar la composición de una roca individual. La marca del mapa es solo una referencia del polo sur simulado. Si el servicio no está disponible, el resto del análisis sigue funcionando y el juego muestra un aviso.

Las referencias reales ayudan a comparar tipos de roca, pero no identifican la muestra ficticia: Apollo 16, 60025, es una anortosita rica en plagioclasa; Apollo 11, 10003, es un basalto que incluye clinopiroxeno, plagioclasa e ilmenita, entre otros componentes. Consulta [NASA Trek y la API de sus capas lunares](https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=moon) y el [Lunar Sample Atlas del Lunar and Planetary Institute](https://www.lpi.usra.edu/lunar/samples/atlas/). El microscopio 3D es un modelo didáctico, no una sección delgada ni una imagen de las muestras Apollo. El progreso y las insignias aparecen en el panel de misión.

Para entrar, acércate a la compuerta exterior desde la rampa y pulsa `E`. La cámara se aísla y simula un cambio de presión de 2 segundos antes de abrirla. Camina hasta el interior de la esclusa y pulsa `E` junto al control exterior para cerrar esa compuerta. Pulsa `E` junto al control interior: se simula el cambio de presión y se abre la puerta al hábitat. Para salir, invierte la secuencia. Las dos puertas nunca permanecen abiertas a la vez. Es una **secuencia didáctica**, sin presión de gas ni procedimiento EVA real.

## Elementos modelados

| Elemento | Versión actual |
| --- | --- |
| Hábitat | Casco cilíndrico de unos 10 m de largo y 4 m de diámetro, puerta lateral abierta en la malla, suelo interior y zonas de control, descanso, almacenamiento y ECLSS. |
| Plataforma | Base nivelada, apoyos que alcanzan el relieve muestreado y rampa de acceso. |
| Esclusa | Cámara de unos 3,3 × 2,5 m, dos compuertas deslizantes y luces. |
| Energía | Arreglo de cuatro paneles verticales que gira hacia el Sol simulado y dos gabinetes de baterías. Todavía no calculan electricidad. |
| Servicios | Módulo ECLSS exterior, bastidor interior, antena, radiadores y punto de control del polvo. Son modelos conceptuales. |
| Estaciones educativas | Microscopio y roca de entrenamiento exterior, dos macetas con plantas y un telescopio de observación. La roca desaparece al recogerla y el indicador del laboratorio se ilumina tras completar su análisis. |

El hábitat usa una geometría visual con abertura real para la esclusa y colisiones 2D separadas para casco, puertas y equipos. El jugador conserva el mismo control de gravedad y salto; en la zona de la plataforma, el contacto con el suelo toma la altura de la base. Fuera de ella continúa usando la función de altura del terreno lunar. La base se mantiene fija en coordenadas globales mientras la malla del terreno visible se recentra alrededor del astronauta.

## Código

- `src/world/BasePlacement.js`: emplazamiento y cota de la plataforma.
- `src/world/Site04Data.js`, `Site04Terrain.js` y `public/assets/site04-dem.bin`: retícula de 5 m/píxel, alturas locales interpoladas y superficie 3D del escenario Site04.
- `src/components/Site04Map.vue`: mapa de cribado de elevación y pendiente del sector candidato.
- `src/world/LunarBaseModel.js`: geometría, materiales, iluminación local y animación de compuertas y paneles.
- `src/world/BaseCollisions.js`: colisiones, rampa, suelo y zonas.
- `src/world/AirlockSystem.js`: estados y temporización de la esclusa.
- `src/world/BaseKnowledge.js`: puntos interactivos y fichas educativas.
- `src/world/BaseMission.js`: pasos de la misión.
- `src/world/LunarSampleMission.js`: estados de roca en superficie, recogida, entrega y análisis; valida la mezcla sintética.
- `src/components/LunarSampleLab.vue`, `LunarRockViewer.vue` y `NasaPolarMineralMap.vue`: reto, modelo 3D giratorio y mosaico de capas Kaguya SP de NASA Trek.
- `src/world/LunarBaseSystem.js`: coordinación con la escena y estado para el HUD.
- `src/components/BaseMissionPanel.vue` y `BaseInfoPanel.vue`: misión y ficha contextual.

La construcción se inspira en el [estudio estructural preliminar del equipo](../INVESTIGACION/2026-11-12_KYNEX_diseno_estructural_habitat_lunar.pdf). Las funciones del hábitat, soporte vital, acceso EVA y mitigación del polvo se contrastaron con [NASA Moon Base Systems](https://www.nasa.gov/moonbase-systems/), [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/), [NASA NTRS: EVA access](https://ntrs.nasa.gov/citations/20230000121/) y [NASA Dust Mitigation](https://www.nasa.gov/dust-mitigation/). Las dimensiones, materiales visuales y distribución son decisiones de diseño del prototipo. No se han modelado cargas estructurales, atmósfera, producción eléctrica, consumos, blindaje ni certificación de seguridad.

## Ejecución y comprobación

En Windows, desde `C:\Proyectos\KYNEX-Junior-Astronaut\app`:

```powershell
npm install
npm run dev
```

Abre la URL local que indique Vite, normalmente `http://localhost:5173/`. `npm test` verifica ubicación, transiciones de esclusa, exclusión de compuertas, colisiones y progreso de misión; `npm run build` genera `dist/`.
