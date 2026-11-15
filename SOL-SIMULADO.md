# Sol simulado en el polo sur lunar

## Modelo

KYNEX emplea un modelo **didáctico del polo geográfico**, no una efeméride ni una reconstrucción de Shackleton. El día solar se aproxima por 29,53 días terrestres y la elevación oscila dentro de ±1,5°. NASA describe al Sol casi pegado al horizonte polar, sus largas sombras y los cráteres que pueden permanecer sin luz: [Shadows near the Moon's South Pole](https://science.nasa.gov/resource/shadows-near-the-moons-south-pole/) y [Earth and Sun from the Moon's South Pole](https://science.nasa.gov/resource/earth-and-sun-from-the-moons-south-pole/).

El reloj empieza en `t = 0`, azimut `60°` y elevación `1,2°`. `SolarSystem.js` permite cambiar estos valores. En grados:

```text
azimut(t) = azimutInicial + 360 × t / 29,53
elevación(t) = 1,5 × sin(2πt / 365,24 + fase)
fase = asin(elevaciónInicial / 1,5)
```

`t` son días terrestres **simulados**. La fase reproduce la elevación inicial elegida, pero no representa una fecha real.

## Coordenadas y visualización

`+Y` es arriba, `−Z` es norte del mapa y `+X` es este. El azimut crece en sentido horario desde `−Z`. La dirección hacia el Sol es `(sin(az) cos(h), sin(h), −cos(az) cos(h))`. El disco se sitúa a 3 km de la cámara, con diámetro angular aproximado de `0,5°`; es una representación visual, no una distancia física al Sol. Tiene material luminoso independiente de la iluminación y un halo tenue sin atmósfera. El terreno puede taparlo mediante la prueba de profundidad del renderizador.

La misma dirección controla un `THREE.DirectionalLight`. Su intensidad y sus sombras se desactivan cuando la elevación astronómica es cero o menor. La luz ambiental tenue se mantiene para que el terreno en sombra sea legible; no representa dispersión atmosférica.

## Alcance de las sombras

Rocas y terreno proyectan sombras dentro de una ventana local de aproximadamente 460 × 460 m que sigue al astronauta. El mapa de sombras mide 2048² píxeles y se actualiza al desplazarse el jugador o cambiar de forma apreciable la dirección solar. Los bordes de cráter cercanos pueden oscurecer el suelo, pero las sombras de montañas lejanas no son físicamente completas: Three.js usa una cámara de sombra limitada para mantener el rendimiento. A ángulos tan bajos pueden verse franjas o bordes de sombra en la topografía distante. El relieve procedural tampoco utiliza un modelo digital de elevaciones real.

El estado **sobre/bajo el horizonte astronómico** del HUD se refiere a `0°` de elevación y no calcula un horizonte topográfico local. Por eso un cerro puede ocultar el disco aun cuando el HUD indique que está sobre el horizonte astronómico.

## Mapa local y esfera lunar

El mapa local usa las mismas alturas procedurales que el terreno 3D. Para cada celda comprueba si una altura situada hacia el Sol bloquea la luz dentro de unos 400 m; al cambiar el azimut, esas sombras se recalculan. Es una aproximación en una cuadrícula de 256 × 256 para un sector de 2,4 km, por lo que no coincide píxel a píxel con el mapa de sombras de Three.js ni incluye montañas fuera del sector.

La esfera usa la misma dirección solar para iluminar su textura y mostrar el terminador entre día y noche. La iluminación de esa esfera representa la fase vista desde la cámara del HUD; no calcula sombras de cráteres ni un mapa térmico o de iluminación real del polo sur. Cuando el Sol cae bajo el horizonte del lugar explorado, otra zona de la Luna puede seguir iluminada, por lo que la esfera conserva su mitad diurna.
