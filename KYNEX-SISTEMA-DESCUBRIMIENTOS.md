# KYNEX Discoveries

## Propósito

El astronauta avanza por acciones en el mundo. Un hallazgo abre una invitación pequeña y temporal. La lectura y la voz son opcionales; cerrar una ficha no penaliza. Las misiones y la bitácora usan estados independientes.

## Arquitectura

- `src/world/Discoveries.js`: catálogo, procedencia, reglas de registro y guardado. El catálogo describe siete tipos. Los estados `found` y `read` se persisten por separado bajo `kynex-discoveries-v1`.
- `src/components/KynexDiscoveries.vue`: aviso no bloqueante, panel de investigación y bitácora. Un descubrimiento se emite una sola vez. La voz usa Speech Synthesis en español solo después de pulsar **Escuchar**, con texto visible y botón **Detener**.
- `src/world/ExplorationMissionFlow.js` y `src/components/EducationalMissions.vue`: recorrido educativo anterior, conservado como módulo aislado y retirado de la interfaz principal tras la introducción de la misión de supervivencia.
- `src/App.vue` y `src/world/LunarScene.js`: conectan eventos reales de salto, consulta de mapa e interacción con la base. La tecla **E** conserva su función. **F** abre un hallazgo pendiente; cuando no hay uno, inspecciona la base. **B** abre la bitácora. Al abrir un panel se libera Pointer Lock y al cerrarlo se reanuda la exploración.

## Catálogo y activación

| Descubrimiento | Activación | Procedencia |
|---|---|---|
| Cráter lunar | Pendiente de un inventario geográfico validado del DEM Site04 | UNAVAILABLE |
| Gravedad lunar | Primer aterrizaje válido sobre pendiente menor de 10° | MODELLED |
| Sombras del polo sur | Consulta de celda válida de elevación o pendiente del DEM | DERIVED |
| Regolito lunar | A menos de 4 m de la roca educativa junto a la base | SCENARIO |
| Esclusa EVA | Primer uso aceptado de una compuerta | SCENARIO |
| Paneles solares | Inspección del arreglo solar de la base | SCENARIO |
| Soporte vital ECLSS | Inspección o apertura de control ambiental | SCENARIO |

La roca educativa usa el desplazamiento local `(4, 11.5)` m respecto a `SITE04_OUTPOST`; los paneles y el ECLSS usan las entidades de `BaseKnowledge.js`. Esas posiciones pertenecen a la base ficticia. No se han asignado coordenadas a cráteres sin verificación. Para agregar uno, verificar primero su centro y relieve en el DEM; después crear una entidad ligada a esas coordenadas y una prueba de alineación.

## Recorrido anterior, ahora aislado

1. **Primeros pasos en la Luna:** llegar al marcador, aterrizar tras un salto en zona suave y alejarse al menos 16 m del marcador.
2. **El misterio de las sombras:** seleccionar elevación o pendiente en el mapa NASA, consultar una celda válida del DEM y desplazarse 45 m desde el inicio hacia un sector del terreno. El descubrimiento geográfico validado se ha sustituido temporalmente por la consulta DEM para no inventar un cráter.

La bitácora sigue siendo opcional durante la nueva misión de supervivencia y conserva una clave de guardado independiente. El recorrido de dos misiones ya no aparece en la interfaz principal.

## Fuentes y límites

El terreno y las elevaciones de Site04 proceden de NASA LRO/LOLA, según `KYNEX-DATOS-REALES-NASA.md`. Los valores de pendiente se derivan del DEM. Las sombras que dibuja Three.js son visuales; la posición solar es un modelo educativo y no permite afirmar una fracción de iluminación temporal validada. Los equipos, muestras y mediciones ECLSS de la base son escenarios KYNEX. Cada ficha enlaza su referencia NASA o NTRS. La ficha de cráter es general y su ubicación local sigue sin estar disponible.

## Pruebas

`npm test` verifica persistencia separada, registro único, cráter no disponible, progresión de ambas misiones y las pruebas existentes de terreno, esclusa, ECLSS, Sol, Tierra y mapa. `npm run build` verifica la compilación de Vue y Vite. Para comprobar manualmente: iniciar, cerrar la guía, caminar al marcador, saltar, inspeccionar con F, abrir B, probar E en la esclusa y consultar altura o pendiente en el mapa.

## Ampliaciones

Validar inventario de cráteres Site04, añadir recortes científicos autorizados a las fichas y permitir que el usuario marque hallazgos de interés en la bitácora.
