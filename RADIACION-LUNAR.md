# Radiación lunar: modelo educativo KYNEX

Este módulo estima **tasa y dosis equivalente** durante una exploración ficticia del polo sur lunar. No es un dosímetro certificado, una previsión de clima espacial, una evaluación médica ni un mapa medido de Shackleton. El terreno local es procedural y no está georreferenciado.

## Fuentes y unidades

- **GCR**: rayos cósmicos galácticos; fondo continuo. Una sombra visible o una noche lunar no los elimina.
- **SEP**: partículas energéticas solares; el prototipo solo las añade al activar manualmente un escenario ficticio. No se infieren de la intensidad luminosa ni se pronostican.
- **Partículas atrapadas**: importantes en algunos trayectos por el entorno de la Tierra, pero no se modelan como fuente permanente local sobre la Luna.
- **Gy**: gray, energía absorbida por masa. **Sv**: sievert, dosis equivalente o efectiva según el cálculo y la ponderación aplicados. **1 mSv = 1000 µSv**. Una **tasa en mSv/día** se integra en días terrestres simulados para obtener mSv. Gy y Sv no son intercambiables.

El experimento LND de Chang’e 4 reportó **1369 µSv/día = 1,369 mSv/día** de dosis equivalente media durante sus observaciones. KYNEX usa ese número como **referencia inicial para GCR en terreno abierto**, no como una constante universal ni como medición del astronauta simulado. La tasa real varía con actividad solar, espectro de partículas, ubicación, blindaje y configuración del detector.

## Cálculo espacial

`TerrainShielding.js` divide el mundo procedural en celdas globales de **100 m**. Para cada celda calcula una vez el horizonte en **16 azimuts**, con muestras hasta **1,2 km**, desde 1,7 m sobre el suelo. `skyView` aproxima la fracción del hemisferio superior visible:

`skyView = promedio_azimut[1 − sin(max(0, horizonte))]`

El valor se conserva al recentrar la geometría visible. Es solo un **indicador geométrico**. No modela composición, densidad, espesor del regolito, interacción de partículas ni radiación secundaria. No depende del mapa de sombras ni de la temperatura.

Para enseñar que la geometría puede modificar la exposición, la tasa GCR provisional es:

`GCR = 1,369 · [1 − sensibilidad · (1 − skyView)] mSv/día`

`sensibilidad = 0,45` es una **hipótesis didáctica sin calibración**, no un porcentaje físico de protección de una montaña. El fondo no desaparece en cráteres ni de noche. Un modelo futuro debe reemplazar esta relación por espectros de CRaTER/LND y transporte de partículas, incluidas secundarias. `environment: 'surface'` queda disponible para futuros tipos de entorno; no hay aún refugios o hábitats con factores de blindaje.

## Eventos SEP hipotéticos

El panel permite elegir aporte máximo **0,5 / 2 / 5 mSv/día** y duración **6 / 12 / 24 horas simuladas**. Son **valores de prueba inventados**, no mediciones ni predicciones de un evento real. Cada evento tiene inicio y fin en el reloj compartido; su tasa sigue:

`SEP(t) = pico · sin[π · (t − inicio) / duración]` dentro del intervalo, y `0` fuera.

El pulso se integra analíticamente, por lo que un fotograma lento no pierde un evento corto. Como aproximación espacial, el escenario recibe un azimut desplazado **25°** respecto del Sol en el momento de activación y una elevación ficticia de **20°**. Esta **no es la dirección física calculada de partículas solares**. Si el horizonte procedural tapa esa dirección, se omite la componente SEP primaria de esa celda; no se está afirmando que desaparezcan todas las partículas ni las secundarias. Un evento puede finalizarse manualmente.

## Dosímetro y reloj

`AstronautDosimeter` mantiene la dosis del astronauta separada de la tasa propia de cada celda:

`dosis_nueva = dosis_previa + GCR_local · Δt + ∫ SEP_local(t)dt`

`Δt` se mide en **días terrestres simulados** mediante `SimulationClock`, no con el reloj del navegador. Pausar impide que se acumule dosis. Pasar a `1 día/s` incrementa la exposición según ese tiempo simulado. Moverse a una zona más resguardada reduce la **tasa futura**; no borra la dosis recibida. Al restablecer el tiempo solar, el escenario SEP termina y el dosímetro comienza una nueva época temporal **conservando la dosis y el tiempo de exposición anteriores**. Recargar la página sí inicia una misión nueva. El historial básico se limita a las últimas 120 muestras.

## Interfaz y controles

El panel **RADIACIÓN / SUPERFICIE LUNAR** muestra tasa total, GCR, SEP, dosis acumulada, tiempo de exposición y cielo visible. Puede minimizarse. La advertencia superior identifica cualquier evento SEP como hipotético. La tecla **G** alterna mapa local/radiación; **M** abre/cierra la carta de cráteres y **T** mantiene el mapa térmico. El mapa radiológico actualiza una cuadrícula de **24 × 24** progresivamente; su escala fija de **0,7 a 6 mSv/día** es relativa para este modelo, sin umbrales médicos. El punto y triángulo del astronauta permanecen visibles. Apunta al suelo y pulsa **R**, o haz clic en el mapa radiológico, para inspeccionar un sector sin llenar el mapa de etiquetas permanentes.

## Fuentes científicas y calibración futura

- [Zhang et al., *First measurements of the radiation dose on the lunar surface*](https://pmc.ncbi.nlm.nih.gov/articles/PMC7518862/) (2020): referencia experimental LND de 1369 µSv/día en las condiciones del estudio.
- [NASA LRO / CRaTER](https://science.nasa.gov/mission/lro/spacecraft-and-instruments/): instrumentación que caracteriza radiación en el entorno lunar.
- [NASA NTRS, *Maps of Primary Radiation Dose Around the Lunar South Pole*](https://ntrs.nasa.gov/citations/20240004047) (2024): enfoque de cartografía polar y distinción GCR/SEP.
- [NASA, CRaTER factsheet](https://science.nasa.gov/wp-content/uploads/2024/01/crater-litho-2023feb.pdf): dos fuentes y observaciones orbitales.
- Informe local `INVESTIGACION/2026-11-12_KYNEX_radiacion_espacial_lunar.pdf`: guía conceptual y advertencias de interpretación.

Para una versión científicamente calibrada harían falta DEM lunar georreferenciado, espectros temporales de GCR/SEP, composición y geometría del entorno, transporte de partículas, secundarias, respuesta de un detector definido y validación contra observaciones. Hasta entonces, **ninguna cifra del mapa debe usarse para seguridad o salud de astronautas**.
