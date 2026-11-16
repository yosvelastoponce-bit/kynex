# KYNEX — Misiones educativas 01 y 02

## Arquitectura y secuencia

`EducationalMissions.vue` es el panel y controlador de la secuencia educativa. `EducationalMissions.js` contiene cálculos, consulta del DEM y guardado. `PlayerController` emite despegues y aterrizajes medidos por el movimiento real; `LunarScene` sitúa un marcador sobre el terreno y transmite esos eventos. `Site04Map` emite la celda pulsada en las capas de elevación y pendiente. El panel principal muestra una misión por vez. Los retos preexistentes del hábitat, la esclusa, el ECLSS y las muestras permanecen en Información → Mi misión y la base y conservan sus reglas.

La secuencia es **descubrir → experimentar → decidir → comprender → demostrar**. La misión 01 empieza caminando hasta el marcador, exige un salto aterrizado en terreno de pendiente menor de 10°, y presenta el laboratorio de gravedad en tres ventanas consecutivas: Tierra con velocidad ajustable, Luna con el mismo impulso y una breve explicación de las fórmulas. Después enseña masa y peso y termina con tres preguntas con pistas de reintento. La misión 02 exige seleccionar celdas del DEM, comparar dos puntos separados al menos 5 m, registrar una hipótesis, cambiar parámetros del laboratorio de sombras, reconocer la falta de visibilidad solar validada y justificar con dos evidencias la preselección de un sitio. La pantalla final entrega una insignia por misión.

## Eventos y condiciones de éxito

| Evento | Procedencia | Avance |
| --- | --- | --- |
| Posición del jugador | Telemetría de `LunarScene` | A 2 m o menos del marcador de entrenamiento |
| Despegue y aterrizaje | `PlayerController` | Vuelo de 0,2–8 s, subida mayor de 0,1 m, aterrizaje a menos de 0,6 m de diferencia vertical y pendiente local menor de 10° |
| Cambio de planeta y velocidad | Laboratorio ideal | Comparación interactiva antes de avanzar |
| Cambio Tierra/Luna | Laboratorio de peso | Observación de masa constante y peso calculado |
| Respuestas | Evaluación de gravedad | Tres aciertos; el error ofrece pista y después explicación |
| Selección de celdas | Mapa Site04 | Una celda válida en ALTURA y después dos puntos distintos |
| Hipótesis | Panel de misión | Se registra antes del experimento, sin penalizar |
| Ajustes del laboratorio | Controles de sombra | Dos configuraciones distintas |
| Emplazamiento | DEM y decisión del alumno | Un candidato y dos evidencias seleccionadas |

La misión 01 usa un marcador de entrenamiento sobre el DEM junto al inicio. El jugador aparece en (0, 18) m; se elige primero (0, 11) m si la pendiente local es menor de 10°, con alternativas (2, 10) y (−2, 10). El marcador es un objeto de entrenamiento sin colisión.

## Datos y fórmulas

- **OBSERVED / producto científico:** DEM NASA LRO-LOLA Site04 de 480 × 480 celdas a 5 m/celda. Sus celdas pueden incluir interpolación; no se presentan como observaciones puntuales directas.
- **DERIVED:** elevación muestreada, pendiente calculada del gradiente del DEM y distancia horizontal `√((x₂−x₁)²+(z₂−z₁)²)`.
- **MODELLED:** salto vertical ideal `h = v₀²/(2g)` y `t = 2v₀/g`, con g lunar 1,62 m/s² y g terrestre 9,81 m/s². Se supone velocidad inicial igual, suelo horizontal, gravedad constante y sin resistencia del aire. Peso `P = m × g` para 60 kg: Tierra 588,6 N; Luna 97,2 N. Sombra ideal `L = H/tan(α)` con obstáculo vertical, suelo horizontal y rayos paralelos.
- **SCENARIO:** marcador, base e instrumento solar hipotético.
- **UNAVAILABLE:** visibilidad solar temporal, horizonte completo y horas de iluminación verificadas para un punto de Site04. El Sol visual y las sombras de Three.js son educativos; no se usan para aprobar una instalación real.

Coordenadas de los tres candidatos, en metros locales del recorte DEM: A (−120, −130), B (120, −100), C (60, 150). Sus elevaciones y pendientes se leen del DEM en ejecución. Se muestran coordenadas proyectadas `X = −3800 + x`, `Y = −12800 − z` según la orientación del recorte. La distancia a la base educativa se calcula respecto a (0, 0). El resultado es **preselección topográfica**, no recomendación solar definitiva.

## KYNEX Mission Control

Cada etapa tiene un subtítulo permanente en el indicador pequeño. Las instrucciones, experimentos y resultados aparecen en una ventana centrada de cristal translúcido, con botón de cierre. El navegador puede leer el texto mediante Web Speech API con una voz española disponible; si no existe, el texto sigue funcionando. Hay controles para repetir, silenciar, omitir y ajustar volumen. Cada mensaje cancela el anterior y el audio se cancela al desmontar el panel. Pulsa **M** para abrir o cerrar una actividad; el simulador libera el ratón al abrirla. La guía original sigue disponible.

El progreso se guarda en `localStorage` bajo `kynex-educational-missions-v1`: misión, etapa, medición del salto, respuestas, intentos, puntos elegidos, hipótesis, justificación, fechas e insignias. No se guarda identidad personal. La opción de reiniciar aparece al terminar ambas misiones. Los retos anteriores mantienen su funcionamiento propio y no se borran.

Al pausar la exploración, **Reiniciar simulación y misiones** borra el avance educativo y recarga la aplicación para restablecer también la escena. Una recarga normal del navegador o **Salir al menú principal** conserva el avance para poder continuar. **Restablecer tiempo** solo reinicia el reloj solar.

## Pruebas y límites

`npm test` comprueba fórmulas, coordenadas y distancia del DEM, límites de selección, persistencia y desbloqueo. `npm run build` valida el paquete. La comprobación visual en navegador confirma la carga del escenario y del panel inicial. Falta validar con alumnado la comprensión de los textos y las voces disponibles en cada equipo. La iluminación de puntos concretos requiere un producto externo validado que cubra el horizonte fuera del recorte de 2,4 km. Para próximas misiones conviene añadir efemérides y un análisis topográfico con alcance suficiente antes de plantear recomendaciones solares cuantitativas.

Fuentes: [NASA Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html), [NASA LOLA Site04](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/), [NASA Moon Trek](https://trek.nasa.gov/moon/), [Bussey et al. (2010)](https://doi.org/10.1016/j.icarus.2010.03.028).
