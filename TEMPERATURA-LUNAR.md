# Modelo térmico educativo del polo sur lunar

La temperatura en el HUD y en el mapa **TÉRMICO** es una estimación calculada sobre el relieve procedural de KYNEX. **No es una medición Diviner ni una carta térmica georreferenciada de Shackleton.** La cuadrícula local tiene celdas globales de 100 m; el mapa muestra 2,4 km y se desplaza con el astronauta. Cada celda conserva su temperatura y tiempo de iluminación en memoria mientras la página siga abierta, incluso si el jugador sale y vuelve. «Restablecer tiempo» reinicia ese historial.

## Balance por unidad de superficie

Para la capa superficial se usa, en kelvin:

`C_s · dT_s/dt = (1 − A) · S · max(0, n·s) · V + Q_terreno + G(T_b − T_s) − εσT_s⁴`

La capa subsuperficial sigue `C_b · dT_b/dt = G(T_s − T_b)`. `n` es la normal del relieve por diferencias centrales, `s` la dirección solar compartida con la escena y `V` la fracción visible del disco solar. Se prueba el horizonte del terreno mediante rayos de altura hacia el azimut del Sol hasta 1,2 km, en ocho distancias. Se aproxima un disco de radio angular 0,266°. La radiación de terreno cercano se representa con `Q_terreno = factor_de_vista · εσ · (95 K)⁴`, donde el factor depende de la concavidad local. Es un término muy simplificado: no hay intercambio radiativo detallado entre todas las laderas.

Valores configurables en `src/world/ThermalPhysics.js`: irradiancia `1361 W/m²`, albedo `0,12`, emisividad `0,95`, capacidad de capa superficial `25 000 J/(m²·K)`, capacidad subsuperficial `150 000 J/(m²·K)` y conductancia `0,03 W/(m²·K)`. Son **parámetros efectivos ilustrativos**, no propiedades calibradas para un lugar concreto. Una celda nueva empieza en `112 K + 85 K · incidencia · V`; el subsuelo empieza en `110 K`. Las temperaturas del panel se convierten con `°C = K − 273,15`. El panel indica si la celda está iluminada, en penumbra o sombra, su tendencia y el tiempo desde el último cambio de iluminación.

La ecuación superficial se resuelve de forma implícita por bisección, con pasos recientes de hasta 0,125 días simulados y un máximo de 192 pasos para recuperar una celda tras una ausencia larga. Esto evita temperaturas negativas y oscilaciones numéricas al usar `1 día/s`. El estado de celdas nuevas no se reconstruye desde una historia solar anterior a su primera visita; las ausencias muy largas se muestrean de forma más gruesa. Por eso la continuidad es por **sector observado durante la sesión**, y los valores no deben interpretarse como predicciones científicas.

El mapa actualiza progresivamente 24 celdas cada 80 ms para evitar bloquear el renderizado 3D. Su escala fija va de `−250 °C` (azul muy oscuro), pasando por `−100 °C` (turquesa), hasta `+60 °C` (rojo). El punto verde y su triángulo muestran posición y orientación. La tecla `T` alterna mapa local/térmico; `M` abre/cierra la carta regional. Las sombras térmicas usan el mismo Sol y la misma función de altura procedural que la escena, con resolución aproximada de 100 m.

## Referencias y límites

- [NASA, Moon Facts](https://science.nasa.gov/moon/facts/): rango día/noche genérico; no debe aplicarse sin más al polo sur.
- [NASA, Shadows Near the Moon's South Pole](https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/): geometría de iluminación rasante y cráteres en sombra.
- [Diviner Lunar Radiometer, Science](https://www.diviner.ucla.edu/science): temperaturas polares muy bajas y papel del regolito.
- [NASA Earth Observatory, energía solar](https://science.nasa.gov/earth/earth-observatory/climate-and-earths-energy-budget/): irradiancia solar media próxima a 1360 W/m².

El informe local de investigación KYNEX en `INVESTIGACION/2026-11-11_KYNEX_temperatura_superficie_lunar.pdf` motivó las ecuaciones y la separación entre simulación y observaciones. El Sol de esta aplicación también es un modelo didáctico, no una efeméride polar calibrada; véase `SOL-SIMULADO.md`.
