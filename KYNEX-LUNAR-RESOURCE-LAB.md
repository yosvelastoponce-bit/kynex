# KYNEX RESOURCE LAB 01

Implementado el 15 de noviembre de 2026. Laboratorio educativo opcional sobre
**soporte vital, energía y blindaje**. No constituye una instalación lunar real
ni un diseño de seguridad certificado.

## Acceso y uso

Desde `C:\PROYECTOS\KYNEX-Junior-Astronaut\app`:

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Abrir la dirección que muestra Vite. En el menú lunar se puede elegir entre las
cuatro misiones cortas existentes y el escenario «Sobrevive 24 horas». Cada
recorrido conserva su partida por separado. El laboratorio no es requisito de
victoria en ninguno de ellos.

1. Iniciar o continuar la misión. Desde el centro del hábitat, caminar hacia su
   extremo izquierdo (X negativo). El nuevo paso interior conduce al laboratorio.
2. Mirar un instrumento desde menos de 1,65 m y pulsar **E**. No se abre al pasar.
3. Elegir una referencia Apollo y pulsar **REGISTRAR MUESTRA**.
4. Registrar la inspección visual. Consultar «Análisis» o «Minerales» según lo que
   se quiera investigar. La inspección visual no revela la composición.
5. Abrir «Soporte vital», «Energía» o «Blindaje», variar los parámetros y ejecutar
   una actividad. Para procesamiento se requiere una composición incorporada.
6. Guardar la conclusión. «Bitácora» conserva muestra, consultas, cálculos,
   aplicaciones, limitaciones y referencias. Repetir una conclusión actualiza la
   misma entrada por muestra y aplicación, sin duplicarla.

La roca ficticia de Site04 aparece en el catálogo después de entregarla en la
mesa del hábitat. Su identificador es **KYNEX-S04-001** y no tiene composición
medida. La recepción de muestras antigua sigue entregando la roca para las
misiones cortas. Los instrumentos del módulo se pueden usar sin recogerla.

**×**, **Escape** y «Volver a explorar» cierran la interfaz. No hay voces ni
etiquetas flotantes añadidas al escenario. Los nombres de proximidad y las
indicaciones de teclado permiten reconocer cada instrumento.

## Estado inspeccionado y decisiones de integración

Antes del cambio, el recorrido activo era de cuatro misiones cortas. Los módulos
de supervivencia de 24 horas y su guardado seguían presentes pero no eran el flujo
del menú. Se ha añadido un selector para ofrecer ambos recorridos; no se ha
eliminado el recorrido sencillo solicitado anteriormente.

Se reutilizan `LunarBaseSystem`, `LifeSupportSystem`, `LunarScene`, la muestra de
entrenamiento, la esclusa y la persistencia de cada misión. El antiguo acertijo
de selección de tres minerales sigue en el código anterior, pero el nuevo
laboratorio usa consultas científicas y conclusiones, sin identificar por colores
la roca de Site04. No añade plantas, minería, vehículos ni misiones marcianas.

## Catálogo y fuentes científicas

| Identificador | Datos incluidos | Referencia exacta |
|---|---|---|
| Apollo **10084** | Suelo <1 mm; petrografía cualitativa; diez óxidos y sus ±; aportes elementales derivados | C. Meyer, *Lunar Sample Compendium*, 2009, tabla 2, p. 7, columna promedio Korotev y Gillis (2001); técnica «multiple» según el documento |
| Apollo **10003** | Basalto con ilmenita; minerales y descripción petrográfica; vínculo a fotografía NASA S76-25545 | C. Meyer, *Lunar Sample Compendium*, 2011, introducción, petrografía y mineralogía; figura 1 |
| Apollo **60025** | Anortosita ferroana, plagioclasa y variación de porciones máficas; vínculo a fotografía NASA S72-41586 | C. Meyer, *Lunar Sample Compendium*, 2011, introducción y petrografía; figura 1 |
| **KYNEX-S04-001** | Objeto ficticio, solo inspección de representación artística | SCENARIO KYNEX; no medición química ni espectral de esta roca |

En esta primera entrega la química numérica transcrita es la de **10084**. Los
PDF de 10003 y 60025 contienen análisis adicionales, pero sus columnas no se han
transcrito en esta versión. La interfaz dice explícitamente que no están
incorporados; no afirma que tales análisis no existan. No mezcla porciones
minerales con roca total ni asigna composición Apollo a Shackleton.

- [10084, Compendium y tabla](https://www.lpi.usra.edu/lunar/samples/atlas/compendium/10084.pdf#page=7).
- [10003, Compendium](https://www.lpi.usra.edu/lunar/samples/atlas/compendium/10003.pdf).
- [60025, Compendium](https://www.lpi.usra.edu/lunar/samples/atlas/compendium/60025.pdf).
- [LPI Lunar Sample Atlas](https://www.lpi.usra.edu/lunar/samples/atlas/index.cfm): fotografías, micrografías y catálogos enlazados; formatos web, imágenes y PDF.
- [Astromat, colección lunar](https://www.astromat.org/collections/lunar): análisis de materiales físicos de Apollo y otras misiones; su base no se replica en esta aplicación.
- [PDS Geosciences](https://pds-geosciences.wustl.edu/): archivo de productos planetarios y documentación.
- [M³ Level 2, CH1-ORB-L-M3-4-L2-REFLECTANCE-V1.0](https://pds.nasa.gov/ds-view/pds/viewProfile.jsp?dsid=CH1-ORB-L-M3-4-L2-REFLECTANCE-V1.0): reflectancia orbital multibanda, binario `RFL.IMG`, etiqueta ASCII `L2.LBL`, cabecera `RFL.HDR` y producto auxiliar `SUP.IMG`. No se importa un mapa químico local ni se usa para clasificar cada roca.

Las diez filas de 10084 conservan el % en masa de óxido, no % de elemento: SiO₂
42 ±0,2; TiO₂ 7,54 ±0,08; Al₂O₃ 13,55 ±0,18; FeO 15,81 ±0,15; MnO 0,213
±0,005; MgO 7,88 ±0,07; CaO 11,96 ±0,13; Na₂O 0,438 ±0,012; K₂O 0,135
±0,005; P₂O₅ 0,101 ±0,017. Son la columna indicada, sin renormalizar al 100 %.
Se conserva el ± publicado sin reinterpretarlo como un intervalo de confianza
específico. No se atribuye XRF a toda la columna: el Compendium dice técnicas
múltiples. Para métodos de cada análisis original se debe consultar su literatura.

## Evidencia

- **OBSERVED**: propiedades y valores documentados de la muestra indicada.
- **DERIVED**: conversiones estequiométricas y masa por superficie.
- **MODELLED**: estimación de recuperación y previsión energética bajo hipótesis.
- **SCENARIO**: réplica 3D, parámetros elegidos, bancada eléctrica y módulo ficticio.
- **UNAVAILABLE**: química no incorporada o ausente para el objeto virtual;
  predicción de dosis sin modelo validado.

El visor 3D es una representación genérica con granos artísticos, no un escaneo
de ninguna muestra Apollo. El microscopio virtual permite explorar esa réplica;
no simula XRF, XRD, microsonda ni una micrografía con escala calibrada. Las
fotografías documentadas se consultan mediante los enlaces al Compendium: no se
han descargado imágenes NASA para usarlas como texturas. La descarga directa de
PDF desde Python devolvió HTTP 403; se verificaron las tablas mediante el lector
web y se conservaron las referencias públicas, sin copiar archivos incompletos.

## Experimento de oxígeno

Se representa conceptualmente la **electrólisis de regolito fundido (MRE)**,
tecnología investigada con simulantes en instalaciones terrestres. No se presenta
como una planta operativa lunar. Referencia: [NASA Kennedy, ensayo MRE en vacío,
2025](https://www.nasa.gov/centers-and-facilities/kennedy/nasa-kennedy-breathes-life-into-moon-soil-testing/).
La [demostración CaRD](https://www.nasa.gov/centers-and-facilities/johnson/sunlight-extracts-oxygen-from-regolith-using-solar-chemistry/)
se ofrece como contexto de otra ruta, la reducción carbotérmica; no se usa su
balance para calcular MRE.

Para óxido j y elemento i, usando masas atómicas convencionales:

`aporte_i (% masa) = Σ w_j × masa_i_en_fórmula_j / masa_molar_j`

`O_ligado_kg = material_kg × aporte_O / 100`

`O₂_potencial_kg = O_ligado_kg × recuperación_asumida`

`energía_kWh = material_kg × consumo_específico_kWh/kg_material`

No se inventa un análisis elemental independiente: los aportes se derivan de
los óxidos listados. Se omiten constituyentes sin fila y no se renormaliza. El
inventario de oxígeno ligado no equivale a una fracción fácilmente extraíble.

Parámetros de interfaz **SCENARIO**: 10–100 g de material de referencia, recuperación
0–50 %, energía específica 5–50 kWh/kg de material. Son hipótesis manipulables,
no prestaciones publicadas de un reactor NASA. No incluyen extracción del suelo,
beneficio, calentamiento detallado, pérdidas, consumibles, purificación,
compresión o licuefacción. La bancada es una carga eléctrica de entrenamiento,
no un reactor de fusión modelado a escala térmica.

El resultado permanece como estimación en la bitácora. No se suministra a la base.
Para hacerlo faltarían equipos de purificación, control de calidad, depósito y
conexión al regulador. El panel distingue O₂ generado por el ECLSS, almacenado
y consumido por la tripulación, leyendo el único sistema existente.

## Experimento de energía

La bancada solicita **1000 W**, después de los equipos existentes en el orden
de prioridad del ECLSS. Integra su consumo real en `energyUsedKWh`, balance solar
y batería; su contador separado mide consumo de esa carga, no es otra batería.

`duración_h = energía_kWh / potencia_kW`

`demanda_batería_kWh = max(0, demanda_base_W + bancada_W − solar_W) × duración_h / 1000`

Solo inicia si la potencia disponible cubre la bancada y, bajo cargas e
iluminación constantes, quedarían al menos **5 kWh** de reserva (política de
escenario KYNEX). La previsión no garantiza el futuro: un corte de potencia
pausa el ensayo, cerrar la interfaz no lo cancela y cancelar no devuelve energía.
Termina al alcanzar la energía solicitada en el reloj simulado, no instantáneamente.
El consumo puede exceder mínimamente el objetivo por el último paso de integración;
se registra lo realmente consumido. Pausar el tiempo también pausa el consumo.

Referencia contextual: [Leger et al., 2025, PNAS,
doi:10.1073/pnas.2306146122](https://pmc.ncbi.nlm.nih.gov/articles/PMC11874342/).
Este trabajo modela una cadena de reducción con hidrógeno y oxígeno líquido.
Sus costes no se trasladan al escenario MRE ni se usan como calibración del juego.
El silicio de los silicatos no equivale a silicio purificado para células solares;
la presencia de ilmenita no demuestra una reserva económicamente explotable.

## Experimento de blindaje

Compara 0 m y un espesor elegido de regolito genérico, con densidad aparente
asumida entre 500 y 2500 kg/m³. No se atribuye esa densidad a la muestra 10084 ni
al suelo exacto de Site04.

`masa_superficial_kg/m² = densidad_kg/m³ × espesor_m`

`masa_superficial_g/cm² = masa_superficial_kg/m² / 10`

El espesor seleccionable es 0–3 m. La multiplicación es DERIVED y los parámetros
son SCENARIO. La comparación radiológica es cualitativa y diferencia SEP, GCR
y partículas secundarias. No hay atenuación exponencial genérica, porcentajes
sin espectro ni cambios del dosímetro del astronauta.

Referencia de contexto y geometrías: [Barghouty, 2007, *Optimization of Crew
Shielding Requirement in Reactor-Powered Lunar Surface Missions*,
NASA NTRS 20070032709](https://ntrs.nasa.gov/citations/20070032709).
No se reproduce su solución numérica. Para calcular dosis faltarían composición,
densidad y geometría validadas, espectros y transporte de partículas primarias
y secundarias, además de la magnitud dosimétrica y el órgano de interés.

## Módulo físico y archivos fuente

- Blender instalado y ejecutado: **5.2.2 LTS**, modo background.
- Constructor reproducible: `scripts/blender/build-resource-lab.py`.
- Fuente editable: `assets-source/laboratory/resource-lab-01.blend`.
- Modelo cargado: `public/models/resource-lab-01.glb`, aproximadamente 147 kB.
- Sin texturas externas ni dependencias nuevas del juego.
- Sala de 4 × 6 m y altura 2,8 m; coordenadas de base X −10…−6, Z −3…3.
  Conector interior X −6…−5, Z ±0,9. El laboratorio y el hábitat comparten aire.
- Mesas de recepción, observación y microscopio, terminal elemental, consola,
  terminales temáticas, archivo de muestras, conductos, luminarias y soportes.
- Colisiones y objetivos en `LaboratoryLayout.js`. Ningún objeto debe abrir
  interfaces por proximidad sin pulsar E.

El volumen de cabina del escenario de base pasa de 100 a **170 m³**, sumando
70 m³ de módulo y conector, una aproximación geométrica declarada. No hay un
segundo sistema atmosférico. La nueva partida incluye el equipamiento inicial
presurizado. Al migrar una partida anterior se conserva temperatura y presiones
parciales al añadir su atmósfera inicial de escenario; se guarda el volumen para
no añadirla de nuevo al recargar. Este cambio modifica naturalmente la inercia
de los gases. No se cambia el modelo térmico global ni se pretende certificar el
dimensionamiento físico del ECLSS para esa ampliación.

No se modifica el raster NASA ni se aplana terreno. El suelo del módulo y el
pasillo usan la misma cota de plataforma. Se conserva gravedad, movimiento,
saltos, reloj solar, Tierra, radiación exterior, esclusa y cargas esenciales.

## Arquitectura y persistencia

- `src/data/lunar-samples/catalog.js`: registros de muestras y composición.
- `src/world/laboratory/ScientificProvenance.js`: evidencia y referencias.
- `SampleCatalog.js`: acceso y disponibilidad de la muestra entregada.
- `OxygenExperiment.js`: estequiometría y estimaciones de escenario.
- `EnergyExperiment.js`: duración y evaluación de reservas/potencia.
- `ShieldingExperiment.js`: densidad superficial y límites radiológicos.
- `LaboratorySystem.js`: registro, consultas, ensayo activo, resultados y bitácora.
- `LaboratoryLayout.js` y `LaboratoryVisual.js`: interacción y carga del GLB.
- `src/components/laboratory/`: catálogo, visor e interfaces de experimentos.
- `LifeSupportSystem.js`: única fuente de gas, agua y electricidad.

El guardado del mundo incluye laboratorio y ECLSS juntos. Un ensayo reanudado
conserva su consumo y no se cobra ni se produce dos veces. La frontera de
restauración convierte objetos reactivos Vue a JSON plano. Reiniciar el recorrido
reinicia su laboratorio; cambiar de recorrido conserva partidas independientes.

## Verificación y límites pendientes

Se añadieron pruebas para catálogo, referencias, estequiometría, unidades,
reservas, falta de potencia, cancelación, restauración reactiva, no duplicación,
ausencia de entrega de O₂, colisiones, orientaciones y carga real del GLB.
La suite completa conserva además pruebas de terreno, ECLSS, radiación y misión
de 24 horas. Se comprueba la compilación de Vite.

Resultado final: **78 pruebas aprobadas, 0 fallidas**, y compilación de producción
correcta. El fallo detectado con `structuredClone` al recibir una partida reactiva
se corrigió y quedó cubierto por prueba. Una nueva sesión del navegador restauró
la partida, el ensayo finalizado y dos conclusiones sin errores nuevos de consola.
El GLB se carga con Three.js también en la prueba automatizada. Se verificó que
los tres archivos públicos de Marte coinciden por SHA-256 con el ZIP recibido.

La comprobación visual incluye caminar desde el hábitat al módulo y abrir el
microscopio con E, registrar 10084, inspeccionarla, consultar la tabla, iniciar un
ensayo y consultar resultados/bitácora. No sustituye una partida manual completa
de veinte minutos en el modo de 24 horas ni pruebas de rendimiento en todos los
equipos. Vite mantiene el aviso previo de tamaño del paquete principal.

Ampliaciones posibles: transcribir columnas completas adicionales con revisión
de cada porción; integrar imágenes verificadas y modelos ópticos; un modelo de
procesamiento con balances térmicos y reactivos; transporte radiológico publicado
con espectro y geometría exactos. Estas mejoras no están simuladas como si ya
existieran en este prototipo.
