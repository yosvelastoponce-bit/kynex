# KYNEX: datos reales NASA y límites científicos

Fecha de revisión: 2026-11-14. Escenario geográfico único: **Shackleton Rim, Site04**. La base KYNEX y sus sistemas son un escenario educativo, no infraestructura NASA.

## Inventario de fuentes y estados

| Variable | Estado | Fuente y tratamiento |
|---|---|---|
| Elevación raster | OBSERVED | NASA PGDA, LRO/LOLA, `Site04_final_adj_5mpp_surf.tif`. Producto de elevación procesado, no medición puntual instantánea. |
| Altura local y pendiente | DERIVED | Elevación LOLA menos referencia fija; gradiente de celdas de 5 m. Calculado por KYNEX. |
| Fotografía orbital del mapa | OBSERVED | Mosaico LROC NAC promedio de NASA Moon Trek, recortado por coordenadas polares al sector Site04. Es una composición de capturas históricas, no una imagen en tiempo real. |
| Sombra variable superpuesta al mapa | MODELLED | Rayos hacia el Sol simulado sobre el DEM Site04. La máscara de 120 × 120 celdas se oscurece cuando el terreno intercepta el rayo y cambia con el reloj. El horizonte exterior al DEM no está incluido. |
| Superficie gris 3D | SCENARIO | Material gráfico provisional. La imagen LROC solo se muestra en el mapa y no representa albedo actual del suelo 3D. |
| Base, muestra, ECLSS, electricidad, misiones | SCENARIO | Diseño y parámetros hipotéticos KYNEX. No son equipos instalados en Shackleton. |
| Sol, Tierra, iluminación, fase | MODELLED | Ciclos simplificados heredados. Pendientes de validación con efemérides, libración, fecha UTC y horizonte local. Sus ángulos no son observaciones. |
| Temperatura mostrada | MODELLED | Balance térmico educativo KYNEX, parámetros aproximados. No es Diviner. |
| Temperatura observada local | UNAVAILABLE | No hay un producto Diviner georreferenciado y coincidente con el tiempo simulado integrado. |
| Dosis mostrada | MODELLED | Dosímetro educativo con referencia GCR externa y protección geométrica no calibrada. SEP es ejercicio hipotético. |
| Dosis observada local | UNAVAILABLE | CRaTER observa en órbita; no se dispone aquí de dosímetro en la superficie de Site04. |

La interfaz usa el registro `src/world/DataProvenance.js` y permite consultar fuente, instrumento, periodo, ubicación, resolución e incertidumbre. Un test impide marcar como OBSERVED un registro sin fuente, periodo o resolución.

## GeoTIFF verificado

Archivo original del usuario: `C:/PROYECTOS/KYNEX-Junior-Astronaut/INVESTIGACIÓN 2/Site04_final_adj_5mpp_surf.tif`.
SHA-256: `38FF70DBDF2F066C2CFA94A646C3A59D653CE7F6B4528B15FC1B43EE397CE758`.

Se leyeron directamente los tags TIFF y la matriz Float32:

- Dimensiones 3200 × 3200; 5 × 5 m/celda; valor NODATA `nan`.
- ModelPixelScale `(5, 5, 0)`; ModelTiepoint `(0,0,0,-9000,1000,0)`.
- Cobertura de celdas: X de −9000 a 6995 m; Y de 1000 a −14995 m. Extensión de bordes: X −9000 a 7000 m, Y 1000 a −15000 m.
- Proyección polar estereográfica lunar sur; radio de referencia 1 737 400 m según GeoDoubleParamsTag. Las coordenadas son proyectadas lunares, no latitud/longitud terrestres.
- Los valores Float32 del TIFF completo van aproximadamente de −2847,877 a 1805,073 m.

`public/assets/site04-dem.bin` (SHA-256 `F0FA28A0D503BAB55AEFF95A6CF9DC1B7F4A56697CC1444E49FD352BDC41AA3B`) contiene un recorte **exacto, sin remuestreo**, de 480 × 480 celdas Float32 little endian: columnas 800…1279, filas 2520…2999 del TIFF. Se compararon celdas de esquinas y centro con el TIFF original, valor a valor. La escena no carga los 40 MB del GeoTIFF completo en el navegador.
El procedimiento reproducible está en `scripts/extract-site04.py` (requiere Pillow), con validación de dimensión y georreferencia.

El recorte abarca X proyectada −5000…−2605 m e Y proyectada −11600…−13995 m (centros de celda). Los bordes del recorte abarcan 2,4 × 2,4 km. Las coordenadas de Three.js usan `x = X_proyectada + 3800`, `z = −Y_proyectada − 12800`. En pantalla, −Z señala hacia el norte de la imagen. El centro local `(0,0)` coincide con la celda `(240,240)` y elevación de referencia **1244,210693359375 m**. La altura renderizada y usada en colisiones es `elevación DEM − elevación de referencia`, con interpolación triangular que sigue las dos caras de la malla. La posición de la base se expresa respecto al mismo origen. La malla no recibe escala vertical ni cráteres/rocas aleatorias.

El límite físico del jugador se fija dentro de las celdas disponibles. Al intentar salir se avisa: «Límite de la zona cartografiada con datos NASA». La elevación fuera del raster no se presenta como terreno visible. El mapa se limita al recorte, muestra escala, marcadores y orientación. La pendiente es el arco tangente de la magnitud del gradiente de elevación con diferencias centrales (unilaterales en bordes); no es el producto oficial de pendiente de PGDA. El porcentaje <10° y la mediana se calculan desde las 230 400 celdas del recorte, no se atribuyen a NASA. La elevación se colorea solo en el mapa. No se utilizó ColorHillshade ni ColorSlope para recuperar alturas.

## Límites pendientes

- El mapa incorpora `public/assets/site04-lroc-nac.png`, recorte de 480 × 480 píxeles del mosaico LROC NAC promedio servido por NASA Moon Trek (`LRO_NAC_AvgMosaic_SPole855_1mp`). Se extrajo de 12 teselas WMTS del nivel 11 (4,180641 m/píxel) mediante la misma proyección polar estereográfica lunar sur (meridiano 0°, radio 1 737 400 m), y se remuestreó al marco X −5000…−2605 m / Y −11600…−13995 m de Site04. Procedimiento: `scripts/extract-site04-lroc.py`. SHA-256 del PNG: `5D83E507D0DBAEFEE5687E2DA372390B45F66F5C86AE45BD1E6A2EB499D85648`. El mosaico original es de 1 m/píxel, pero esta vista no ofrece ese detalle porque usa teselas de 4,18 m/píxel.
- El mosaico se publicó en 2011 a partir de imágenes de 2009–2011, ortorrectificadas y registradas al DEM polar LOLA. Sus sombras originales permanecen; encima se dibuja una máscara oscura variable calculada desde el DEM y el Sol simulado. Las celdas sin luz directa se detectan con rayos muestreados cada 10 m y un sesgo vertical de 0,35 m, sin inventar alturas fuera del recorte. Esta capa es una simulación, no una nueva fotografía ni una predicción validada de iluminación. La interfaz aplica brillo CSS ×1,55 para facilitar la lectura, sin crear detalle en zonas negras. Los metadatos indican que puede haber huecos sin cobertura y estiman hasta 20 m RMS de error horizontal absoluto. La coincidencia cartográfica procede de la proyección y coordenadas compartidas; no se ha hecho una validación de puntos de control independientes para este recorte. El material gris 3D sigue siendo provisional.
- La iluminación y las posiciones de Sol/Tierra siguen siendo modelos educativos del proyecto. El reloj empieza en día simulado +0 sin fecha UTC astronómica asociada. Para afirmar posiciones reales se requieren kernels NASA SPICE o un cálculo validado, orientación lunar y verificación del horizonte Site04. Los paneles indican esta limitación. La geometría DEM puede ocultar visualmente la Tierra en el sector; fuera del recorte no se extrapola el horizonte.
- No se integraron productos térmicos Diviner por ubicación y fecha. La temperatura observada aparece como no disponible. Los parámetros térmicos (albedo, emisividad, capacidad, sustrato) son supuestos educativos, sin incertidumbre calibrada.
- CRaTER es un instrumento orbital y la tasa del dosímetro no equivale a una medición en Shackleton. La referencia LND proviene de otro lugar y periodo. La protección geométrica y los eventos SEP son hipótesis de entrenamiento. DONKI no proporciona dosis local.
- La potencia de 2400 W, capacidad de 120 kWh, consumos y parámetros ECLSS están definidos en `LifeSupportSystem.js` para un diseño hipotético. No son mediciones de una instalación real. La generación depende del Sol modelado, por lo que tampoco puede presentarse como predicción energética validada.
- La elevación del DEM conserva la precisión Float32, pero la incertidumbre vertical de cada celda no está incorporada; la publicación y productos de incertidumbre deben consultarse antes de usar el sector para navegación o selección de emplazamiento.

## Referencias

- [NASA PGDA, LOLA 5 m/px landing site products](https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/). Sitúa Site04 en Shackleton rim y describe el DEM polar estereográfico.
- [NASA PGDA, Site04 product](https://pgda.gsfc.nasa.gov/products/78).
- Barker, M. K. et al. *Improved LOLA Elevation Maps for South Pole Landing Sites: Error Estimates and Their Impact on Illumination Conditions*. Planetary and Space Science (2020). DOI [10.1016/j.pss.2020.105119](https://doi.org/10.1016/j.pss.2020.105119).
- [NASA LRO Science and Data](https://science.nasa.gov/mission/lro/science-and-data/) y [instrumentos LRO](https://science.nasa.gov/mission/lro/spacecraft-and-instruments/): Diviner y CRaTER son orbitales.
- [NASA Moon Trek: metadatos del mosaico LROC NAC sur](https://trek.nasa.gov/moon/TrekWS/rest/cat/metadata/fgdc/html?label=LRO_NAC_AvgMosaic_SPole855_1mp) y [servicio WMTS](https://trek.nasa.gov/tiles/Moon/SP/LRO_NAC_AvgMosaic_SPole855_1mp/1.0.0/WMTSCapabilities.xml).

## Verificación de esta entrega

`npm test` incluye las transformaciones del recorte, muestreo de alturas, pendiente, base, esclusa, ECLSS, misiones y procedencia. `npm run build` compila Vite. Se abrió la aplicación en un navegador local, se entró en Site04 y no se observaron errores de consola. La validación visual se hizo con una ventana estrecha; aún conviene recorrer en escritorio el perímetro y los accesos de la base.
