# LOTUS UI — VAULT

Bóveda privada de fotos y videos con almacenamiento en Google Drive, reproductor integrado y cerradura por patrón.

## Puesta en marcha
La app ya viene preconfigurada con el OAuth Client ID — solo:
1. Abre la app: `https://lotus-corp-pr.github.io/lotus-ui/`
2. Crea tu patrón al primer uso
3. La app se conecta sola a Google Drive (acepta el permiso la primera vez)

El origen autorizado en Google Cloud debe ser: `https://lotus-corp-pr.github.io`

## Funciones
- Cerradura por patrón de símbolos (se configura al primer uso)
- Subida de fotos/videos a una carpeta "VAULT" en tu Google Drive (subida resumable con barra de progreso, cola secuencial)
- Galería con miniaturas; reproducción de video y fotos integrada
- Descarga y borrado de archivos; sincronización entre dispositivos
- Notas privadas guardadas localmente en el navegador
- Barra de capacidad con tu cuota real de Drive
- Token persistente: reconexión automática y silenciosa en cada visita
- Notificaciones toast, manejo de errores robusto

## Estructura
- `index.html` — estructura de la interfaz
- `css/style.css` — estilos
- `js/vault.js` — lógica (patrón, Google Drive, subidas, reproductor)

## Configuración técnica
- OAuth Client ID (integrado): `989647976886-9opqdk7aqncijjl2auiul1snj8cs8scg.apps.googleusercontent.com`
- Scope: `drive.file` — la app solo accede a su carpeta "VAULT" y a los archivos que ella crea
- Los Client ID de OAuth web son públicos por diseño; la seguridad recae en el origen autorizado y el patrón de la bóveda
