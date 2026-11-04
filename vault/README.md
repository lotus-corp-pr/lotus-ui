# VAULT — Private storage

Almacenamiento privado de fotos y videos en tu Google Drive, con reproductor integrado y cerradura por patrón.

## Funciones
- Pantalla de desbloqueo por patrón de símbolos
- Subida de fotos/videos a una carpeta "VAULT" en tu Google Drive (upload resumable con barra de progreso)
- Galería con miniaturas; reproducción de video y fotos integrada
- Descarga, borrado y sincronización entre dispositivos
- Notas privadas guardadas localmente en el navegador
- Barra de capacidad con tu cuota real de Drive

## Puesta en marcha
1. Crea un OAuth Client ID en Google Cloud (guía paso a paso dentro de la app, botón ⚙ SETUP).
2. En "Authorized JavaScript origins" agrega la URL exacta donde vive esta página, p. ej. `https://lotus-corp-pr.github.io`
3. Abre la app, pega el Client ID en ⚙ SETUP y pulsa CONNECT & SYNC.

Nota: OAuth de Google no funciona abriendo el archivo con doble click (file://); debe servirse por https o localhost.
