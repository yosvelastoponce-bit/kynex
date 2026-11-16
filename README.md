# KYNEX Lunar Lab — Shackleton Rim, Site04

Prototipo local en Vue 3, Three.js y Vite. La única geografía explorable es un recorte exacto de 480 × 480 celdas (5 m/celda) del DEM NASA LRO/LOLA Site04 del borde de Shackleton. No hay selector público ni terreno procedural en la escena. El mapa incluye una imagen LROC NAC georreferenciada; el suelo 3D conserva un material gris neutro provisional.

El astronauta puede caminar con WASD, mirar con el ratón y saltar con Espacio. La malla 3D y el contacto con el suelo comparten los mismos datos de elevación, referencia vertical e interpolación triangular. Al llegar al borde del sector aparece un aviso y no se puede avanzar fuera de los datos. El mapa abre con una vista orbital real LROC NAC del sector y permite alternar a elevación y pendiente del DEM; conserva posición y dirección del jugador, base simulada, resolución y escala. Sobre la foto se superponen sombras variables calculadas del DEM y el Sol simulado. Las sombras originales de la captura permanecen.

La pantalla de bienvenida usa la ilustración proporcionada por el equipo, `public/assets/lunar-ky-logo.png`. No representa una observación del Site04. Durante la exploración, la ventana «Tu misión» muestra una sola misión y objetivo a la vez, una pista breve y una flecha con distancia cuando el destino está en la superficie. Al completar un objetivo aparece una explicación científica corta basada en la actividad realizada.

**KYNEX Lunar Outpost 01** es una infraestructura educativa ficticia. Se conservan el hábitat, la esclusa, ECLSS y las misiones. Los modelos de Sol, Tierra, temperatura, radiación y electricidad siguen siendo educativos; la interfaz los identifica y distingue sus valores de datos observados. La posición astronómica del Sol y de la Tierra aún requiere validación. Consulta [KYNEX-DATOS-REALES-NASA.md](KYNEX-DATOS-REALES-NASA.md) para la procedencia, el procesamiento del TIFF y las limitaciones.

## Ejecutar en Windows

```powershell
Set-Location C:\Proyectos\KYNEX-Junior-Astronaut\app
npm install
npm run dev
```

Abre la URL local indicada por Vite, normalmente `http://localhost:5173/`. Pulsa **Explorar Shackleton Rim**. Antes de empezar aparece una guía de 11 pasos: cada ventana flotante señala con una línea el control, mapa o panel que explica. Puedes navegar entre pasos o pulsar **Saltar guía**. Para verla otra vez, abre **Información → Más controles del juego → Volver a ver la guía**. Durante la guía, el reloj simulado queda en pausa.

Usa `R` para información y fuentes, `E` para interactuar con la base, `F` para sus fichas y `Esc` para pausar. Si Pointer Lock no está disponible, arrastra el ratón para mirar.

## Verificación

```powershell
npm test
npm run build
```

El DEM optimizado se encuentra en `public/assets/site04-dem.bin`. El GeoTIFF original del usuario está en `C:\PROYECTOS\KYNEX-Junior-Astronaut\INVESTIGACIÓN 2\Site04_final_adj_5mpp_surf.tif`; no se carga directamente en el navegador. La procedencia se registra en `src/world/DataProvenance.js`.

Los archivos procedurales antiguos permanecen aislados para no romper pruebas históricas o utilidades compartidas. `LunarScene.js`, `PlayerController.js` y `PolarMap.vue` ya no los cargan en la experiencia pública.


## Laboratorio de recursos lunares

RESOURCE LAB 01 está conectado al extremo izquierdo del hábitat. Camina por el
paso interior, mira un instrumento y pulsa E. Permite registrar muestras Apollo,
consultar análisis publicados e investigar soporte vital, energía y blindaje.
Los resultados se guardan en la bitácora del laboratorio junto con la partida.

El menú ofrece las cuatro misiones cortas y el recorrido de supervivencia de
24 horas; el laboratorio es opcional en ambos. Los ensayos usan la red eléctrica
existente y no añaden oxígeno respirable ni protección automáticamente.

Consulta [KYNEX-LUNAR-RESOURCE-LAB.md](KYNEX-LUNAR-RESOURCE-LAB.md) para las fuentes,
fórmulas, parámetros asumidos, archivos Blender/GLB y limitaciones del prototipo.
