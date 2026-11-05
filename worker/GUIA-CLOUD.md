# GUIA-CLOUD — Tu VAULT en cualquier dispositivo (sin cuenta de Google)

El "modo nube" conecta tu VAULT con tu carpeta de Drive a través de un pequeño servidor gratuito (Cloudflare Worker) que queda vinculado SOLO a tu carpeta VAULT. Tu patrón se convierte en la llave real: el servidor lo verifica antes de entregar cualquier archivo. Desde entonces, cualquier dispositivo → tu página → patrón → tus archivos.

## Paso 1 — Cuenta de servicio en Google Cloud (5 min)
1. Entra en console.cloud.google.com con **lcorpmx1@gmail.com** (el mismo proyecto de antes).
2. **IAM y administración → Cuentas de servicio → Crear cuenta de servicio**: nombre "vault-worker" → Crear (los roles no importan).
3. Abre la cuenta creada → pestaña **Claves** → **Agregar clave → Crear clave nueva → JSON** → se descarga un archivo .json. **Ábrelo con el bloc de notas** y copia TODO su contenido (una sola línea larga). Lo necesitarás en el Paso 3.

## Paso 2 — Comparte tu carpeta VAULT con la cuenta de servicio (1 min)
1. En el archivo JSON busca "client_email": es algo como `vault-worker@tuproyecto.iam.gserviceaccount.com`.
2. En Drive, clic derecho sobre tu carpeta **VAULT** → **Compartir** → pega ese correo → permiso **Editor** → Enviar.

## Paso 3 — Crea el Worker en Cloudflare (5 min)
1. Entra en **dash.cloudflare.com** y crea una cuenta gratuita (puede ser con tu correo de Gmail).
2. Menú **Compute (Workers) → Create application → Create Worker** → nombre: `vault-worker` → Deploy.
3. Pulsa **Edit code**, borra el contenido y pega TODO el archivo `worker/worker.js` de este repositorio → **Save and Deploy**.
4. En la página del Worker, entra a **Settings → Variables and Secrets → Add** y crea los 3 secretos:

| Nombre | Valor |
|---|---|
| `SA_JSON` | Todo el contenido del JSON del Paso 1 (una línea) |
| `FOLDER_ID` | El ID de tu carpeta VAULT: ábrela en Drive y copia el código del final del link (drive.google.com/drive/folders/**ESTE**) |
| `VAULT_KEY` | Tu Cloud Key: se genera en la app (Paso 4) |

5. Copia la URL de tu Worker: `https://vault-worker.TUCUENTA.workers.dev`

## Paso 4 — Conecta tu VAULT (2 min)
1. Abre tu VAULT → patrón → **⚙ SETUP**.
2. Pulsa **COPY CLOUD KEY** y pega esa clave como el secreto `VAULT_KEY` en Cloudflare (Paso 3.4).
3. Pega la URL del Worker en **CLOUDFLARE WORKER URL** → **SAVE CLOUD MODE**.
4. Pulsa **⟳ SYNC DRIVE**. Debe decir "Modo nube conectado".

## ¿Qué cambia?
- ✅ Cualquier dispositivo, sin cuenta de Google: página → patrón → tus archivos
- ✅ Subidas desde cualquier dispositivo (hasta ~100 MB por archivo, límite del plan gratuito de Cloudflare)
- ✅ Videos se reproducen con avance libre (streaming)
- ⚠️ Tu patrón AHORA es la llave real: sin él, ni el servidor entrega nada. No lo olvides.
- ⚠️ Si cambias tu patrón, genera una nueva Cloud Key y actualiza el secreto VAULT_KEY en Cloudflare.
- 🔒 La cuenta de servicio solo ve la carpeta que compartiste (VAULT). Si algún día quieres cortar el acceso, quita el permiso de compartir en Drive.
