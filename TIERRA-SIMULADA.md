# Tierra simulada desde el polo sur lunar

La Tierra de KYNEX es un modelo educativo, no una efeméride para una fecha o un lugar real. El terreno representa una región polar procedural y no reproduce la topografía de Shackleton. La Tierra, el Sol y la iluminación usan los días del mismo `SimulationClock`.

## Coordenadas y posición aparente

En la escena Three.js, `+Y` es arriba, `-Z` es el norte del mapa y `+X` es el este. El azimut se mide en grados desde `-Z` y aumenta hacia `+X`. La dirección unitaria para azimut `a` y elevación `h` es `(sin(a) cos(h), sin(h), -cos(a) cos(h))`.

`src/world/EarthSystem.js` define un observador ilustrativo a **89,2° S, 0° de longitud**. La elevación media es `90° + latitud`, por lo que la Tierra queda próxima al horizonte astronómico. El azimut medio a longitud cero es 300°. La configuración permite cambiar latitud, longitud, azimut de referencia, amplitudes, periodos y fases iniciales. La relación con la longitud es deliberadamente esquemática y **no** equivale a una transformación selenográfica precisa.

La libración visual usa:

```text
elevación(t) = elevaciónMedia + 1,0° · sen(2πt / 27,21 + π/3)
azimut(t)   = azimutMedio + 8° · sen(2πt / 27,55)
```

`t` son días terrestres simulados. Estos valores producen una oscilación lenta de la Tierra alrededor de una región del horizonte; no son una predicción astronómica ni se obtuvieron copiando las amplitudes máximas de libración. La [visualización polar de NASA](https://svs.gsfc.nasa.gov/4944/) muestra el comportamiento cualitativo de la Tierra próxima al horizonte.

## Tamaño, orientación y rotación

El diámetro angular objetivo es **1,9°**. La esfera se coloca a 5000 unidades de la cámara y su radio se calcula como `5000 · tan(1,9° / 2)`. Así conserva su tamaño aparente al caminar y no depende de la escala del terreno. El valor angular está dentro del intervalo descrito en [material educativo de NASA sobre eclipses](https://eclipse2017.nasa.gov/static/img/answer-key-challenge/ChallengeAnswerKey.pdf).

La superficie gira sobre su propio eje a `2π · t / 0,9972696`, equivalente aproximadamente a un día sideral de [23 h 56 min 4 s](https://www.grc.nasa.gov/www/K-12/Numbers/Math/Mathematical_Thinking/telling_time_by_the_stars.htm). La posición del objeto en el cielo y su rotación son transformaciones separadas. El eje visual está inclinado y volteado para sugerir la Tierra invertida vista desde el polo lunar; no se calcula la orientación física completa de ese observador. La capa procedural de nubes gira ligeramente más rápido que la superficie.

## Fases e iluminación

El material de la Tierra recibe la **misma dirección solar** que utiliza la escena lunar. Cada píxel combina la textura terrestre con el producto escalar entre la normal de la esfera y esa dirección. El lado nocturno conserva un nivel de luz tenue para que el disco no desaparezca por completo. El porcentaje aproximado iluminado se calcula como `(1 - direcciónTierra · direcciónSol) / 2`, limitado a `[0, 1]`; corresponde a la geometría entre Sol, Tierra y observador lunar en este modelo. La fase del HUD clasifica ese porcentaje como nueva, creciente, cuarto, gibosa o llena. No se intercambian texturas para simular fases.

Como la trayectoria solar existente es didáctica, las fechas y duración de las fases terrestres tampoco son efemérides precisas. Su evolución comparte el mismo reloj y es coherente con la luz dibujada. Las fases terrestres son aproximadamente complementarias de las fases lunares observadas desde la Tierra, según [NASA](https://starchild.gsfc.nasa.gov/docs/StarChild/questions/question58.html).

## Relieve y visibilidad

La esfera se renderiza como objeto 3D con prueba de profundidad. Si el terreno se encuentra delante de ella, los bordes de cráter y montañas tapan el disco de forma parcial o completa. `src/world/EarthVisibility.js` calcula por separado una **estimación para el HUD**: muestrea el perfil de `heightAt(x,z)` en siete direcciones cercanas al azimut terrestre y varios puntos del disco. El estado distingue visibilidad completa, parcial, ocultación por relieve y posición bajo el horizonte astronómico. La estimación discreta puede diferir algunos píxeles de la oclusión visual real.

## Recursos y límites

La textura de océanos, continentes y regiones polares es `public/assets/earth-nasa-bmng-2k.jpg`, procedente de [NASA Scientific Visualization Studio, Blue Marble Next Generation](https://svs.gsfc.nasa.gov/3615/) (NASA/GSFC SVS; datos BMNG de Reto Stöckli, NASA/GSFC Earth Observatory). Es una imagen terrestre **sin nubes**; la capa de nubes se genera en el navegador mediante ruido procedural y no representa datos meteorológicos. El recurso NASA se usa con atribución y no implica aval de NASA a KYNEX.

El modelo no incorpora relieve real, coordenadas selenográficas calibradas, paralaje preciso, estaciones de la textura, atenuación atmosférica detallada ni efemérides JPL. La curvatura, sombras y línea del horizonte dependen del terreno procedural y su nivel de detalle. El cálculo de visibilidad del HUD es local y aproximado. El panel muestra tiempo relativo de simulación, no una fecha UTC astronómica.

Para ajustar el modelo, editar `EARTH_CONFIG` en `src/world/EarthSystem.js`. Para introducir efemérides reales, sustituir `earthState(days, solar)` por un adaptador que reciba fecha UTC, posición selenográfica y datos de [NASA/JPL SPICE](https://naif.jpl.nasa.gov/naif/), y entregue `direction`, `azimuth`, `elevation`, orientación del eje e iluminación al sistema visual. La geometría, el panel y la oclusión pueden seguir usando esa interfaz. Se necesitaría además vincular el reloj simulado con una época UTC y calibrar el terreno contra un modelo de elevación lunar.
