# KYNEX — atmósfera y soporte vital

Modelo educativo de KYNEX Lunar Outpost 01. Las lecturas de la interfaz provienen del inventario gaseoso y de los balances de recursos; **no son sensores reales ni una validación de habitabilidad**. El estudio del equipo que guía esta etapa está en [Investigación 07](../INVESTIGACION/2026-11-12_KYNEX_atmosfera_soporte_vital_habitat.pdf).

## Referencias y parámetros de KYNEX

NASA describe ECLSS como un conjunto de recuperación de agua, revitalización del aire y generación de oxígeno ([NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/)). NASA estudió una atmósfera de exploración de 56,5 kPa y 34 % de O₂ ([NTRS 20240003211](https://ntrs.nasa.gov/citations/20240003211)). Es una referencia de estudio, no una composición obligatoria para este hábitat. La revisión vigente de [NASA-STD-3001 Vol. 2](https://standards.nasa.gov/standard/NASA/NASA-STD-3001_VOL_2) debe consultarse para requisitos reales; este prototipo no los certifica.

| Magnitud | Valor inicial KYNEX | Procedencia |
| --- | ---: | --- |
| Volumen geométrico cilíndrico (10 m × 4 m) | 125,7 m³ | Geometría propuesta por KYNEX |
| Volumen gaseoso libre de cabina | 100 m³ | Supuesto KYNEX, menor por casco y equipos |
| Volumen gaseoso de esclusa | 8 m³ | Supuesto KYNEX, inventario separado |
| Presión total / objetivo | 56,5 kPa | Atmósfera de exploración estudiada por NASA, elegida para KYNEX |
| Presión parcial O₂ | 19,21 kPa (34,0 %) | 56,5 × 0,34 |
| Presión parcial CO₂ | 0,050 kPa | Consigna educativa KYNEX |
| Presión parcial de vapor | ≈1,117 kPa (45 % HR a 21 °C) | Configuración KYNEX + ecuación de saturación |
| Presión parcial N₂ | ≈36,123 kPa (63,935 %) | Resto del total, sin duplicar fracciones |
| Temperatura inicial / objetivo | 21 °C | Configuración KYNEX |
| Tripulación virtual | 4, configurable | Escenario KYNEX |
| O₂ por persona | 0,82 kg/día terrestre | Valor de planificación citado en el informe del equipo; depende de actividad |
| CO₂ por persona | 1,04 kg/día terrestre | Valor de planificación citado en el informe del equipo; depende de actividad |

El modelo calcula `Pᵢ = nᵢRT/V` con `R = 8,314462618 Pa·m³/(mol·K)`. La presión total suma las presiones parciales de O₂, N₂, CO₂ y H₂O. La masa de cada gas se convierte mediante su masa molar. La humedad es `100 × Pᵥ/Pₛₐₜ(T)`; `Pₛₐₜ = 610,94 × exp(17,625 T°C/(T°C+243,04)) Pa` es una aproximación de Magnus adecuada alrededor de la temperatura de cabina prevista. El vapor puede superar 100 % HR si falla la condensación: eso señala un límite del modelo homogéneo, no predice formación espacial de gotas.

## Flujos y energía

La tripulación consume O₂ de la **cabina** y produce CO₂ en el mismo paso metabólico. El alimento y el agua de la tripulación quedan resumidos: el CO₂ adicional incluye carbono procedente de alimento no modelado químicamente. La humedad liberada por la tripulación descuenta agua del depósito. El generador convierte agua en O₂ almacenado e H₂ almacenado mediante `2 H₂O → 2 H₂ + O₂`: 1 kg de O₂ requiere al menos 1,125 kg de agua y produce 0,125 kg de H₂ en este balance teórico. No se simulan pérdidas reales de electrólisis ni Sabatier. Un regulador separado transfiere O₂ y N₂ de los depósitos a la cabina, con capacidad limitada. Nunca añade gas sin reserva. El captador transfiere CO₂ de la cabina a un contenedor, con capacidad y límite de llenado. El condensador recupera 90 % del vapor retirado y deja el resto en aguas residuales; esa eficacia es una **suposición KYNEX**.

Los paneles 3D se representan mediante una fuente eléctrica simplificada de 2,4 kW mientras el Sol está sobre el horizonte; una batería configurable de 120 kWh puede aportar hasta 2,2 kW. No hay modelo eléctrico completo de orientación, degradación, cableado o cargas externas. Demandas educativas KYNEX: regulador 35 W, ventilación 170 W, captador 470 W, generador 760 W, condensador 130 W y control térmico 1000 W. El despacho da prioridad en ese orden; si falta potencia, un equipo queda inoperativo. Se muestran potencia disponible, demanda, potencia usada, energía acumulada y carga de batería. La generación de O₂ depende de agua, energía y espacio libre en depósitos. El H₂ queda almacenado y puede limitar la producción al llenarse.

La temperatura del aire usa `Cₜₕ·ΔT = (Qtripulación + Qequipos + Qclima − Qpérdidas)·Δt`. `Cₜₕ = 50 MJ/K`, fuga térmica `6 W/K`, 100 W de calor por persona, 35 % de la potencia usada como calor interno y actuador de ±1200 W son **parámetros didácticos**. El exterior se toma del sistema de temperatura superficial existente como condición de intercambio; el aire interior conserva su propio estado. El apagado de ventilación reduce la eficacia del captador de CO₂ a 25 %, una simplificación operativa. El modelo sigue mostrando una única mezcla homogénea y advierte que no resuelve bolsas locales de CO₂.

## Esclusa, fugas y reloj

La cabina y la cámara tienen inventarios propios. Con la compuerta interior abierta se igualan por especie manteniendo los moles totales. Antes de abrir al exterior, el gas de la cámara se registra en `vented`; no existe recuperación de ese aire. La presurización posterior toma gas de la cabina y el regulador puede reponerlo de reservas. Las compuertas conservan el bloqueo mutuo. Si la cámara ya está presurizada, la puerta interior rechaza una diferencia superior a 2 kPa, límite operativo educativo KYNEX. Una fuga configurable elimina una fracción de cada gas y registra lo perdido en `vented`. La animación de puertas usa tiempo de presentación; los ciclos y transferencias de presión usan segundos del **reloj simulado**. La pausa detiene todos los flujos; a velocidad acelerada se integran subpasos de cinco minutos simulados.

## Control y misión

Dentro del hábitat, acércate a la consola ambiental, mírala y pulsa **E**. El panel muestra presión, composición, temperatura, humedad, reservas, energía, estado de equipos y alertas. Permite activar ventilación, captura de CO₂, generador, regulador, condensador y control térmico. Las verificaciones registran objetivos de **Misión 02**. La misión requiere entrada, consola, lectura de presión, reservas y energía, funcionamiento real de ventilación y captador, verificación de suministro de O₂, lectura de clima y una hora simulada de parámetros dentro de las bandas KYNEX.

Las bandas operativas educativas configuradas son: presión 50–62 kPa; O₂ parcial 17–23 kPa; CO₂ parcial hasta 0,4 kPa; aire 18–27 °C; HR 25–75 %. Las bandas **críticas KYNEX**, también configurables, son presión 40–70 kPa, O₂ 14–26 kPa, CO₂ hasta 0,8 kPa, aire 10–35 °C y HR 10–90 %. Estas cifras **no son umbrales médicos ni NASA-STD-3001**; sirven para demostrar alarmas basadas en valores calculados. La [nota técnica NASA sobre CO₂](https://www.nasa.gov/ochmo-tb-004-carbon-dioxide-2/) analiza límites ligados a periodos de exposición que este modelo no resuelve.

## Límites y pruebas

No se simulan gradientes espaciales, incendios, trazas químicas, microbios, combustible, reciclaje completo de agua, fisiología, hardware certificado, energía de toda la base ni flujos reales de un equipo de la ISS. Los modelos 3D son esquemáticos. `src/world/AtmosphereModel.js`, `LifeSupportSystem.js` y `Mission02.js` se prueban sin Three.js ni Vue. `npm test` verifica presiones, fracciones, metabolismo, captación, estequiometría, potencia, depósitos, fugas, esclusa, humedad, pausa y misión; `npm run build` verifica la aplicación completa.

```powershell
Set-Location C:\Proyectos\KYNEX-Junior-Astronaut\app
npm test
npm run build
npm run dev
```
