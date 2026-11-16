# Primera exploración lunar

El menú lunar inicia ahora cuatro misiones cortas y secuenciales. La tarjeta
superior izquierda muestra solo el objetivo actual y una explicación breve.
Se completan por acciones del mundo, sin confirmaciones manuales ni esperas.

1. **Prepara tu refugio:** abre la consola con E y activa ventilación y captura
   de CO₂. El regulador debe estar funcionando. Los indicadores muestran qué falta.
2. **Recoge una roca lunar:** sal mediante la esclusa y recoge la roca de entrenamiento con E.
3. **Lleva la roca al laboratorio:** regresa y entrega la muestra con E en la mesa.
   El microscopio y la identificación de minerales siguen disponibles como investigación opcional.
4. **Revisa la energía y vuelve:** inspecciona paneles y baterías con F y regresa al hábitat.

M abre una ventana cristalizada con el objetivo y una pista opcional; × o Escape
la cierran. Los resultados de cada misión se anuncian sin bloquear la exploración.
Tras completar las cuatro, se puede continuar explorando o reiniciar desde el panel.

El flujo anterior de supervivencia de 24 horas deja de ser el recorrido del menú.
Sus módulos y su guardado anterior se conservan. El nuevo recorrido usa la clave
independiente `kynex-lunar-exploration-v1` y guarda posición, reloj, soporte vital,
esclusa, muestra y descubrimientos. Reiniciar elimina su progreso e inventario.

El DEM NASA Site04, gravedad, saltos, colisiones, esclusa, Sol, Tierra, mapas,
temperatura, radiación y balances del ECLSS continúan con sus modelos anteriores.
Las misiones solo observan acciones y estados; no regalan energía ni activan
equipos automáticamente. El incidente programado y el límite de 24 horas ya no
se imponen en este recorrido. El reloj compartido conserva su velocidad de misión.

El botón del selector de Marte tiene acabado naranja translúcido y desenfoque
de fondo. El código original de `public/mars` no se modifica.
