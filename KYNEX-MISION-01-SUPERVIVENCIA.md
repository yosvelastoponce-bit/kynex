# Misión 01 — Sobrevive 24 horas en la Luna

## Objetivo y relato

El astronauta se hace cargo de **KYNEX Lunar Outpost 01** durante 24 horas terrestres simuladas. Debe revisar el hábitat, comprobar el suministro, salir a una EVA corta, aislar un equipo científico que aumenta el consumo y cerrar el turno con el ECLSS estable. La base y el incidente son un **escenario educativo KYNEX** sobre el terreno NASA LRO/LOLA Site04.

## Duración y relojes

El reloj de misión y el astronómico comparten el mismo incremento: `72` segundos simulados por segundo real. Las 24 horas de operación duran unos **20 minutos reales** con la pestaña activa. Un paso de fotograma se limita a `0,1 s` para que una pestaña suspendida no consuma varias horas al volver. Las pantallas iniciales y la pausa explícita detienen el reloj y el consumo. El Sol continúa su trayectoria del modelo lunar existente; no se crea un ciclo de día/noche de 24 horas. La posición solar de Site04 sigue siendo educativa y pendiente de validación astronómica.

## Etapas y eventos

| Etapa | Acción verificable | Evento |
|---|---|---|
| Revisión inicial | En el hábitat, abrir el control por `E`, verificar O₂, presión y energía, activar ventilación y captador de CO₂, confirmar estabilidad | `habitat:initial-check-completed` |
| Inspección energética | Inspeccionar arreglo solar y batería con `F`, comprobar demanda y confirmar suministro | `power:inspection-completed` |
| EVA | Salir por la esclusa, inspeccionar con `F` la roca de entrenamiento junto a la base y volver al interior | `eva:started`, `eva:inspection-completed`, `eva:return-confirmed` |
| Incidente | Al llegar a la hora 14, el equipo científico ficticio se enciende con consumo adicional. Abrir control, apagar solo ese equipo y verificar energía con el ECLSS esencial operativo | `incident:detected`, `incident:resolved` |
| Cierre | Tras 24 h, dentro del hábitat, con tareas e incidente resueltos y ECLSS estable, confirmar turno | `mission:survived-24-hours` |

Las horas son ritmo operativo del escenario, no horarios del Sol. La inspección exterior se hace sobre el terreno DEM; la roca es una instalación ficticia de entrenamiento con desplazamiento `(4, 11,5)` m desde la base. No se ha colocado un cráter inventado.

## Modelo de recursos y unidades

`LifeSupportSystem.js` es la fuente de verdad de la atmósfera y la energía. No existen barras de oxígeno o CO₂ independientes. El HUD lee presión parcial de O₂ en **kPa**, CO₂ en **Pa**, temperatura interior en **°C**, potencia en **kW** y energía almacenada en **kWh**.

Los parámetros de entrenamiento existentes son paneles de `2,4 kW` cuando el Sol del modelo está sobre el horizonte y batería de `120 kWh`. Para esta misión se permite una entrega de batería de hasta `5 kW`; ello evita bloquear los equipos esenciales durante una inspección. El equipo científico no esencial añade `250 W` normales y `1600 W` extra durante la anomalía. Todos esos valores son **supuestos KYNEX**, no especificaciones NASA. El ECLSS integra sus gases y energía en pasos de hasta cinco minutos simulados, incluso a 72×.

La demanda suma equipos activos y el equipo científico. El consumo real reduce batería cuando supera la generación solar, y la generación excedente la recarga hasta la capacidad. El modelo ECLSS existente hace que el metabolismo de cuatro tripulantes consuma O₂, produzca CO₂ y calor; ventilación, captador, regulador, generador y control térmico afectan el estado real del hábitat. La banda operativa KYNEX está en `ECLSS_CONFIG`; no es un umbral clínico certificado.

## Victoria, fracaso y recuperación

La victoria exige 24 horas, revisión inicial, inspección energética, EVA con regreso, incidente resuelto, astronauta dentro y ECLSS estable. Pulsar un botón sin cumplir esas condiciones no completa una etapa.

Una condición crítica sostenida durante **45 minutos simulados** interrumpe la misión: presión inferior a `40 kPa`, O₂ parcial inferior a `14 kPa`, CO₂ parcial superior a `0,8 kPa`, temperatura interior fuera de `10–35 °C`, o batería casi agotada con demanda eléctrica no atendida. Hay tiempo para corregir la causa. El panel ofrece reiniciar la misión y, si existe un control válido, reintentar desde el último punto de control. No se borra la bitácora general.

## Controles y narración

- `E`: conserva el uso de equipos y esclusa.
- `F`: conserva la inspección de equipos de la base. Las fichas opcionales de descubrimientos no desplazan esa inspección cuando hay un equipo cerca.
- `M` o botón del HUD: panel de misión y confirmaciones.
- `R`: centro de información opcional.
- `ESC`: pausa explícita.

La voz española aparece solo en inicio, incidente, resolución y resultado, con texto visible. El panel permite silenciarla. No hay preguntas obligatorias ni laboratorios de gravedad o sombras en el recorrido principal. La antigua lógica de misiones educativas permanece aislada en sus archivos, sin acceso desde la interfaz. La guía de 11 pasos ya no se abre al entrar; se puede consultar desde Información.

## Persistencia y reinicio

`kynex-survival-mission-v1` en `localStorage` guarda misión, tiempo, objetivos, incidente, eventos, punto de control, ECLSS (gases, reservas, batería, equipos y flujos), esclusa, fecha del reloj y posición. Recargar detiene la operación en la pantalla de inicio y permite continuar el turno desde el estado guardado. **Reiniciar misión** borra solo esta clave y crea un escenario nuevo; la bitácora independiente se conserva. No se guardan datos personales.

## Fuentes y límites

- Terreno y mapa: NASA Lunar Reconnaissance Orbiter / LOLA, recorte Site04 descrito en `KYNEX-DATOS-REALES-NASA.md`. [LRO](https://science.nasa.gov/mission/lro/).
- Gravedad y ciclo lunar: [NASA Moon Facts](https://science.nasa.gov/moon/facts/).
- Concepto de soporte vital: [NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/).

La base no es una instalación real. El modelo atmosférico es educativo; no certifica seguridad humana. No existe un modelo de consumibles ni riesgo del traje EVA, por lo que el fracaso no se atribuye al traje. El incidente es un evento hipotético y el equipo científico no corresponde a un dispositivo NASA específico.

## Pruebas

`tests/survival-mission.test.js` verifica la relación 20 min/24 h, balance de batería y ECLSS en un día sin generación, aumento y reducción real de demanda durante el incidente, progresión por acciones, victoria, fracaso tras ventana de recuperación y persistencia. `npm test` cubre además esclusa, colisiones, DEM, Sol, Tierra, térmica y radiación. `npm run build` comprueba Vue/Vite. La verificación manual en navegador confirmó inicio, reloj, HUD, panel y visualización de valores físicos.
