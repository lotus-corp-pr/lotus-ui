# LOTUS UI — VAULT

Bóveda privada de fotos y videos con almacenamiento en Google Drive, reproductor integrado y cerradura por patrón.

## Funciones
- Cerradura por patrón de símbolos (se configura al primer uso)
- Subida de fotos/videos a una carpeta "VAULT" en tu Google Drive (subida resumable con barra de progreso, cola secuencial)
- Galería con miniaturas; reproducción de video y fotos integrada
- Descarga y borrado de archivos; sincronización entre dispositivos
- Notas privadas guardadas localmente en el navegador
- Barra de capacidad con tu cuota real de Drive
- Notificaciones toast, manejo de errores robusto y tokens de Google renovados automáticamente

## Puesta en marcha (GitHub Pages)
1. En Google Cloud: crea un OAuth Client ID (tipo Web application) — guía paso a paso dentro de la app (⚙ SETUP).
2. En "Authorized JavaScript origins" agrega: `https://lotus-corp-pr.github.io`
3. Abre la app, pulsa ⚙ SETUP, pega el Client ID y presiona CONNECT & SYNC.

## Estructura
- `index.html` — estructura de la interfaz
- `css/style.css` — estilos
- `js/vault.js` — lógica (patrón, Google Drive, subidas, reproductor)

> Nota: OAuth de Google no funciona abriendo el archivo con doble click (file://); la app debe servirse por https o localhost.
