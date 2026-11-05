/* VAULT Cloud Worker — vinculado SOLO a tu carpeta VAULT de Google Drive.
 * Despliegalo gratis en Cloudflare Workers y configura 3 secretos:
 *   SA_JSON    = contenido completo de la clave JSON de tu cuenta de servicio
 *   FOLDER_ID  = ID de tu carpeta VAULT en Drive
 *   VAULT_KEY  = tu Cloud Key (generada en la app: ⚙ SETUP → COPY CLOUD KEY)
 */
const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const SCOPE = 'https://www.googleapis.com/auth/drive';

let tokenCache = { token: null, exp: 0 };

function b64url(s) { return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64urlBytes(b) { let s = ''; for (const c of b) s += String.fromCharCode(c); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function base64ToBytes(b64) { const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return arr; }

async function importKey(pem) {
  const body = pem.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  return crypto.subtle.importKey('pkcs8', base64ToBytes(body), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

async function saToken(env) {
  if (tokenCache.token && Date.now() < tokenCache.exp - 60000) return tokenCache.token;
  const creds = JSON.parse(env.SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: creds.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const data = header + '.' + claim;
  const key = await importKey(creds.private_key);
  const sig = new Uint8Array(await crypto.subtle.sign('RS256', key, new TextEncoder().encode(data)));
  const jwt = data + '.' + b64urlBytes(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + encodeURIComponent(jwt)
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error_description || j.error || 'SA auth failed');
  tokenCache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return tokenCache.token;
}

async function validKey(sent, env) {
  if (!env.VAULT_KEY || !sent || sent.length !== env.VAULT_KEY.length) return false;
  try {
    const a = new TextEncoder().encode(sent), b = new TextEncoder().encode(env.VAULT_KEY);
    return crypto.subtle.timingSafeEqual(a, b);
  } catch (e) { return sent === env.VAULT_KEY; }
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'X-Vault-Key,Content-Type',
  'Access-Control-Expose-Headers': 'Content-Length,Content-Range,Accept-Ranges'
};

function json(data, status, headers) {
  const h = { ...headers, 'Content-Type': 'application/json; charset=utf-8' };
  return new Response(JSON.stringify(data), { status, headers: h });
}

async function listFiles(env, headers) {
  const t = await saToken(env);
  const q = encodeURIComponent("'" + env.FOLDER_ID + "' in parents and trashed=false");
  const r = await fetch(DRIVE + '/files?q=' + q + '&orderBy=createdTime desc&pageSize=200&fields=files(id,name,mimeType,size,createdTime,thumbnailLink)', {
    headers: { Authorization: 'Bearer ' + t }
  });
  if (!r.ok) throw new Error('DRIVE ' + r.status);
  const j = await r.json();
  return json(j.files || [], 200, headers);
}

async function streamFile(id, request, env, headers) {
  const t = await saToken(env);
  const h = { Authorization: 'Bearer ' + t };
  const range = request.headers.get('Range');
  if (range) h.Range = range;
  const upstream = await fetch(DRIVE + '/files/' + encodeURIComponent(id) + '?alt=media', { headers: h });
  const out = new Headers(headers);
  out.set('Content-Type', upstream.headers.get('Content-Type') || 'application/octet-stream');
  for (const p of ['Content-Length', 'Content-Range', 'Accept-Ranges']) {
    const v = upstream.headers.get(p); if (v) out.set(p, v);
  }
  out.set('Cache-Control', 'private, max-age=3600');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

async function streamThumb(id, env, headers) {
  const t = await saToken(env);
  const meta = await fetch(DRIVE + '/files/' + encodeURIComponent(id) + '?fields=thumbnailLink', { headers: { Authorization: 'Bearer ' + t } });
  const link = (await meta.json()).thumbnailLink;
  if (!link) return json({ error: 'no thumbnail' }, 404, headers);
  const img = await fetch(link, { headers: { Authorization: 'Bearer ' + t } });
  const out = new Headers(headers);
  out.set('Content-Type', img.headers.get('Content-Type') || 'image/jpeg');
  out.set('Cache-Control', 'private, max-age=86400');
  return new Response(img.body, { status: img.status, headers: out });
}

async function deleteFile(id, env, headers) {
  const t = await saToken(env);
  const r = await fetch(DRIVE + '/files/' + encodeURIComponent(id), { method: 'DELETE', headers: { Authorization: 'Bearer ' + t } });
  if (!r.ok && r.status !== 204) throw new Error('DRIVE ' + r.status);
  return json({ ok: true }, 200, headers);
}

async function uploadFile(request, env, headers) {
  const t = await saToken(env);
  const form = await request.formData();
  const file = form.get('file');
  if (!file || !file.name) return json({ error: 'missing file' }, 400, headers);
  const init = await fetch(UPLOAD + '/files?uploadType=resumable&fields=id,name,mimeType,size,createdTime,thumbnailLink', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ name: file.name, parents: [env.FOLDER_ID] })
  });
  const loc = init.headers.get('Location');
  if (!init.ok || !loc) throw new Error('INIT ' + init.status);
  const put = await fetch(loc, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
  if (!put.ok) throw new Error('UPLOAD ' + put.status);
  const meta = await put.json();
  return json(meta, 200, headers);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const key = request.headers.get('X-Vault-Key') || url.searchParams.get('k') || '';
    try {
      if (!key || !await validKey(key, env)) return json({ error: 'CLOUD_KEY' }, 401, CORS);
      const path = url.pathname.replace(/\/+$/, '');
      if (request.method === 'GET' && path === '/ping') return json({ ok: true }, 200, CORS);
      if (request.method === 'GET' && path === '/list') return await listFiles(env, CORS);
      if (request.method === 'GET' && path.startsWith('/file/')) return await streamFile(path.slice(6), request, env, CORS);
      if (request.method === 'GET' && path.startsWith('/thumb/')) return await streamThumb(path.slice(7), env, CORS);
      if (request.method === 'DELETE' && path.startsWith('/file/')) return await deleteFile(path.slice(6), env, CORS);
      if (request.method === 'POST' && path === '/upload') return await uploadFile(request, env, CORS);
      return json({ error: 'not found' }, 404, CORS);
    } catch (e) {
      return json({ error: (e && e.message) || 'server error' }, 500, CORS);
    }
  }
};
