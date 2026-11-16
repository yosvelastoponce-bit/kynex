# Luna y Marte en la misma web

## Acceso

Ejecutar desde esta carpeta en Windows:

```powershell
npm install
npm run dev -- --host 127.0.0.1
```

Abrir la URL que imprime Vite (normalmente http://127.0.0.1:5173/), seleccionar
MARTE con la flecha derecha y pulsar INICIAR MISIÓN. Aparece MARS FRONTIER,
con su propia pantalla original de inicio. Luna conserva su acceso habitual.

## Conservación del proyecto original

- `integrations/KYNEX-MARTE-v1.zip`: copia íntegra del ZIP recibido, incluidos sus metadatos Git.
- `public/mars/index.html`, `script.js` y `styles.css`: extraídos sin cambios de bytes.
- Vite copia esos tres archivos sin transformar a `dist/mars/` al compilar.
- No se expone la carpeta `.git` del ZIP en la web.
- `src/components/MarsExperience.vue`: contenedor externo con una barra para volver
  al menú de mundos. El documento de Marte vive en un iframe del mismo origen;
  su CSS y su Three.js original no entran en conflicto con Vue ni con la Luna.
- No se han cambiado las misiones, física, muestras, laboratorio, rover o tormentas de Marte.

El botón **MENÚ DE MUNDOS** utiliza el control Escape original para pausar Marte,
y mantiene su documento montado. Al pulsar **VOLVER A MARTE** se recupera esa
misma sesión y se puede continuar. Si hay un rescate en curso, se espera a que termine.

La conservación de la partida es durante la pestaña actual: el proyecto recibido
no implementa guardado persistente. Recargar/cerrar la página reinicia Marte.
Su botón original **VOLVER AL INICIO** conserva también su comportamiento original
de reinicio; para cambiar de mundo sin reiniciar, usar la barra superior KYNEX.

## Dependencias originales

Marte sigue descargando Three.js 0.170.0 desde jsDelivr y su mosaico cartográfico
desde NASA Trek. Requiere conexión para esos recursos, igual que el ZIP recibido.
No se instaló otro motor ni se añadieron paquetes a la aplicación.

## Verificación

- Comparación SHA-256 de los tres archivos: ZIP = `public/mars` = `dist/mars`.
- Los tres recursos responden HTTP 200 desde Vite.
- Compilación de producción y 67 pruebas existentes correctas.
- Navegador: selector Luna → Marte, carga de MARS FRONTIER, inicio de exploración,
  regreso al menú y reapertura de la misma sesión pausada. Sin errores de consola
  en esa comprobación. El navegador de prueba usó el modo de mirar arrastrando
  que ya trae Marte al no disponer de Pointer Lock.
- No se hizo una partida completa de las cuatro etapas marcianas.
