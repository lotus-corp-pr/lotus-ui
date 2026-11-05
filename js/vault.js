'use strict';
(function(){
const $=id=>document.getElementById(id);
const SCOPE='https://www.googleapis.com/auth/drive.file';
const FIELDS='id,name,mimeType,size,createdTime,thumbnailLink';
const API='https://www.googleapis.com/drive/v3/';
const UPLOAD='https://www.googleapis.com/upload/drive/v3/';
const SYMBOLS=['⌬','⌭','⏣','◈','⬢','⬡','⧉','▣','⊞','⌗','✥','⌘'];

/* ── safe storage ── */
const store={
  get(k,fb){try{const v=localStorage.getItem(k);return v===null?fb:JSON.parse(v)}catch(e){return fb}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  raw(k){try{return localStorage.getItem(k)}catch(e){return null}},
  setRaw(k,v){try{localStorage.setItem(k,v)}catch(e){}}
};

/* ── state ── */
let notes=store.get('vault-notes',[]);
let media=store.get('vault-drive-cache',[]);
const DEFAULT_CLIENT_ID='989647976886-9opqdk7aqncijjl2auiul1snj8cs8scg.apps.googleusercontent.com';
const DEFAULT_CLOUD_URL=''; // URL del Worker de Cloudflare — se integra al confirmarla
const RESET_PASSWORD='3366';
let cfg=store.get('vault-cfg',{});
if(!cfg.clientId)cfg.clientId=DEFAULT_CLIENT_ID;
let cloud=store.get('vault-cloud',{}),cloudKey=null;
if(!cloud.url&&DEFAULT_CLOUD_URL)cloud.url=DEFAULT_CLOUD_URL;
const cloudOn=()=>!!(cloud.url&&cloudKey);
let quota=store.get('vault-quota',null);
let folderId=store.raw('vault-folder')||null;
let token=store.raw('vault-token')||null,tokenExp=+store.raw('vault-token-exp')||0,tokenClient=null,gisReady=null,pendingTok=null,tokenLock=Promise.resolve();
let thumbCache=new Map(),playUrl=null,currentPlay=null;
let seq=[],patPending=null,patMode=(store.raw('vault-pattern')||cloud.url)?'enter':'set';
const hasToken=()=>!!(token&&Date.now()<tokenExp-60000);

const fmt=n=>String(n).padStart(2,'0');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=s=>{let h=5381;for(const c of s)h=(h*33+c.charCodeAt(0))>>>0;return String(h)};
async function patternHash(arr){try{const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(arr.join('-')));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch(e){return null}}
function fmtSize(b){b=+b||0;if(!b)return '0 B';if(b<1024)return b+' B';if(b<1048576)return (b/1024).toFixed(1)+' KB';if(b<1073741824)return (b/1048576).toFixed(1)+' MB';return (b/1073741824).toFixed(2)+' GB'}
const ERRTEXT={NO_CLIENT_ID:'falta el Client ID (⚙ SETUP)',TOKEN_FAILED:'Google rechazó el inicio de sesión — revisa Client ID y origen autorizado',GIS_BLOCKED:'script de Google bloqueado',GIS_TIMEOUT:'tiempo de espera agotado con Google',NO_TOKEN:'Google no devolvió token',GIS_LOAD:'no se pudo cargar el módulo de Google',CLOUD_KEY:'clave de nube incorrecta — actualiza el secreto VAULT_KEY del Worker (⚙ SETUP → COPY CLOUD KEY)',CLOUD:'error del servidor de nube'};
const errText=e=>(e&&e.name==='TypeError')?'error de red — revisa tu conexión':ERRTEXT[(e&&e.message)||'']||((e&&e.message)||'error desconocido');

/* ── toasts ── */
function toast(msg,type){const t=document.createElement('div');t.className='toast '+(type||'info');t.textContent=msg;$('toasts').appendChild(t);
  setTimeout(()=>{t.style.transition='opacity .3s';t.style.opacity='0';setTimeout(()=>t.remove(),320)},3800)}

/* ── lock screen ── */
function renderKeys(){document.querySelectorAll('.key').forEach(k=>k.classList.toggle('on',seq.includes(k.dataset.s)));
  $('dots').innerHTML=SYMBOLS.map((_,i)=>`<span class="dot2${i<seq.length?' on':''}"></span>`).join('')}
function updateLockSub(){$('lockSub').textContent=patMode==='set'?'SET YOUR PATTERN':patMode==='confirm'?'CONFIRM YOUR PATTERN':'ENTER PATTERN'}
function shakeLock(){const p=$('lockPanel');p.classList.remove('shake');void p.offsetWidth;p.classList.add('shake')}
function submitPattern(){
  $('lockMsg').textContent='';
  if(!seq.length)return shakeLock();
  const h=hash(seq.join(''));
  if(patMode==='set'){patPending=h;patMode='confirm';seq=[];updateLockSub();renderKeys();return}
  if(patMode==='confirm'){
    if(h===patPending){store.setRaw('vault-pattern',h);patPending=null;patMode='enter';unlock()}
    else{patPending=null;patMode='set';seq=[];updateLockSub();renderKeys();shakeLock();$('lockMsg').textContent='PATTERNS DID NOT MATCH — TRY AGAIN'}
    return}
  const stored=store.raw('vault-pattern');
  if(!stored&&cloud.url){unlock();return}
  if(stored&&h===stored)unlock();
  else{seq=[];renderKeys();shakeLock();$('lockMsg').textContent='WRONG PATTERN'}}
async function unlock(){const entered=[...seq];seq=[];patMode='enter';updateLockSub();renderKeys();$('lock').classList.add('hidden');cloudKey=await patternHash(entered);renderAll();connectDrive(false)}
function lockNow(){seq=[];patMode='enter';updateLockSub();renderKeys();$('lockMsg').textContent='';cloudKey=null;$('lock').classList.remove('hidden')}

/* ── google auth ── */
function loadGis(){if(!gisReady)gisReady=new Promise((res,rej)=>{
  if(window.google&&google.accounts&&google.accounts.oauth2)return res();
  const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=true;
  s.onload=()=>{(window.google&&google.accounts&&google.accounts.oauth2)?res():rej(new Error('GIS_LOAD'))};
  s.onerror=()=>rej(new Error('GIS_BLOCKED'));
  document.head.appendChild(s);
  setTimeout(()=>{if(!(window.google&&google.accounts&&google.accounts.oauth2))rej(new Error('GIS_TIMEOUT'))},9000)});
  return gisReady}
function setToken(t,exp){token=t;tokenExp=exp;store.setRaw('vault-token',t);store.setRaw('vault-token-exp',String(exp))}
function clearToken(){token=null;tokenExp=0;store.setRaw('vault-token','');store.setRaw('vault-token-exp','')}
async function requestToken(){
  if(!cfg.clientId)throw new Error('NO_CLIENT_ID');
  await loadGis();
  if(!tokenClient){tokenClient=google.accounts.oauth2.initTokenClient({
    client_id:cfg.clientId,scope:SCOPE,
    callback:r=>{const p=pendingTok;pendingTok=null;
      if(r&&r.access_token){setToken(r.access_token,Date.now()+((r.expires_in||3600)-60)*1000);p&&p.resolve(token)}
      else{clearToken();p&&p.reject(new Error('NO_TOKEN'))}},
    error_callback:()=>{const p=pendingTok;pendingTok=null;clearToken();p&&p.reject(new Error('TOKEN_FAILED'))}})}
  return new Promise((resolve,reject)=>{pendingTok={resolve,reject};
    try{tokenClient.requestAccessToken({prompt:''})}catch(e){pendingTok=null;reject(e)}})}
function ensureToken(){
  if(hasToken())return Promise.resolve(token);
  const run=tokenLock.then(()=>hasToken()?token:requestToken());
  tokenLock=run.catch(()=>{});
  return run}
async function api(path,opts={},retry=true){
  const t=await ensureToken();
  const r=await fetch(path.startsWith('http')?path:API+path,{...opts,headers:{...(opts.headers||{}),Authorization:'Bearer '+t}});
  if(r.status===401&&retry){clearToken();return api(path,opts,false)}
  return r}

/* ── drive ── */
async function ensureFolder(){
  if(folderId)return folderId;
  const q=encodeURIComponent("name='VAULT' and mimeType='application/vnd.google-apps.folder' and trashed=false");
  const r=await api(`files?q=${q}&fields=files(id)&pageSize=5`);
  if(!r.ok)throw new Error('FOLDER_LIST '+r.status);
  const j=await r.json();
  if(j.files&&j.files.length){folderId=j.files[0].id}
  else{
    const c=await api('files',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'VAULT',mimeType:'application/vnd.google-apps.folder'})});
    if(!c.ok)throw new Error('FOLDER_CREATE '+c.status);
    folderId=(await c.json()).id}
  store.setRaw('vault-folder',folderId);return folderId}
async function syncDrive(){
  const fid=await ensureFolder();
  const q=encodeURIComponent(`'${fid}' in parents and trashed=false`);
  const r=await api(`files?q=${q}&orderBy=createdTime desc&pageSize=200&fields=files(${FIELDS})`);
  if(!r.ok)throw new Error('SYNC '+r.status);
  media=(await r.json()).files||[];
  store.set('vault-drive-cache',media);renderAll()}
async function cloudSync(){
  const r=await fetch(cloud.url+'/list',{headers:{'X-Vault-Key':cloudKey}});
  if(r.status===401)throw new Error('CLOUD_KEY');
  if(!r.ok){
    let msg='CLOUD '+r.status;
    try{const j=await r.json();if(j&&j.error)msg=String(j.error)+' ('+r.status+')'}catch(e){}
    throw new Error(msg)}
  media=(await r.json())||[];store.set('vault-drive-cache',media);renderAll()}
async function updateQuota(){try{
  const r=await api('about?fields=storageQuota');if(!r.ok)return;
  quota=(await r.json()).storageQuota||null;store.set('vault-quota',quota);renderStats()}catch(e){}}
async function connectDrive(interactive){
  if(cloud.url){
    if(!cloudKey){if(interactive)toast('Desbloquea con tu patrón primero','err');return false}
    setDriveStatus('CONNECTING');
    try{await cloudSync();setDriveStatus('CLOUD');renderAll();if(interactive)toast('Modo nube conectado — '+media.length+' elemento(s)','ok');return true}
    catch(e){setDriveStatus('OFFLINE');
      if((e&&e.message)==='CLOUD_KEY'){lockNow();toast('PATRÓN INCORRECTO','err');return false}
      if(interactive)toast('Nube: '+errText(e),'err');return false}}
  if(!cfg.clientId){if(interactive)openSettings();return false}
  setDriveStatus('CONNECTING');
  try{
    await ensureToken();await syncDrive();updateQuota();
    setDriveStatus('ONLINE');renderAll();
    if(interactive)toast('Drive conectado — '+media.length+' elemento(s)','ok');
    return true}
  catch(e){setDriveStatus('OFFLINE');
    if(interactive){toast('No se pudo conectar: '+errText(e),'err');if((e&&e.message)==='NO_CLIENT_ID')openSettings()}
    return false}}
const STATUS={CONNECTING:['SYSTEM ONLINE · CONNECTING','CONNECTING'],ONLINE:['SYSTEM ONLINE · DRIVE','DRIVE ONLINE'],CLOUD:['SYSTEM ONLINE · CLOUD','CLOUD MODE'],OFFLINE:['SYSTEM ONLINE · LOCAL','LOCAL MODE']};
function setDriveStatus(s){const st=STATUS[s]||STATUS.OFFLINE;$('statusTxt').textContent=st[0];$('vaultState').textContent=st[1]}

/* ── uploads (sequential queue) ── */
const uploadQueue=[];let pumping=false;
function enqueueUpload(file){uploadQueue.push(file);if(!pumping)pumpUploads()}
async function pumpUploads(){pumping=true;
  while(uploadQueue.length){try{await uploadFile(uploadQueue.shift())}catch(e){}}
  pumping=false}
function addUploadRow(name){const d=document.createElement('div');d.className='uprow';
  d.innerHTML=`<div style="display:flex;justify-content:space-between"><span>${esc(name)}</span><span>0%</span></div><div class="progress"><div class="bar" style="transition:width .2s"></div></div>`;
  $('uploadList').appendChild(d);return d}
function setUploadRow(row,pct){row.querySelector('span:last-child').textContent=pct+'%';row.querySelector('.bar').style.width=pct+'%'}
async function cloudUpload(file){
  setDriveStatus('CONNECTING');
  const row=addUploadRow(file.name);
  try{
    const info=await new Promise((res,rej)=>{
      const fd=new FormData();fd.append('file',file,file.name);
      const x=new XMLHttpRequest();x.open('POST',cloud.url+'/upload');
      x.setRequestHeader('X-Vault-Key',cloudKey);
      x.upload.onprogress=e=>{if(e.lengthComputable)setUploadRow(row,Math.round(e.loaded/e.total*100))};
      x.onload=()=>{if(x.status<300){try{res(JSON.parse(x.responseText||'{}'))}catch(_){res({})}}else{let m='HTTP '+x.status;try{const j=JSON.parse(x.responseText);if(j&&j.error)m=String(j.error)}catch(_){}rej(new Error(m))}};
      x.onerror=()=>rej(new Error('NETWORK'));x.send(fd)});
    row.remove();if(info.id)media.unshift(info);
    store.set('vault-drive-cache',media);renderAll();setDriveStatus('CLOUD');
    toast('Subido: '+file.name,'ok')}
  catch(e){row.remove();setDriveStatus('OFFLINE');toast('Error subiendo '+file.name+': '+errText(e),'err')}}
async function uploadFile(file){
  if(cloudOn())return cloudUpload(file);
  if(!cfg.clientId){openSettings();return}
  setDriveStatus('CONNECTING');
  const row=addUploadRow(file.name);
  try{
    await ensureFolder();
    const t=await ensureToken();
    const init=await fetch(UPLOAD+'files?uploadType=resumable&fields='+FIELDS,{
      method:'POST',
      headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json; charset=UTF-8'},
      body:JSON.stringify({name:file.name,parents:[folderId]})});
    if(!init.ok)throw new Error('INIT '+init.status);
    const loc=init.headers.get('Location');if(!loc)throw new Error('NO_SESSION');
    const info=await new Promise((res,rej)=>{
      const x=new XMLHttpRequest();x.open('PUT',loc);
      x.setRequestHeader('Content-Type',file.type||'application/octet-stream');
      x.upload.onprogress=e=>{if(e.lengthComputable)setUploadRow(row,Math.round(e.loaded/e.total*100))};
      x.onload=()=>{if(x.status<300){try{res(JSON.parse(x.responseText||'{}'))}catch(_){res({id:'',name:file.name,mimeType:file.type,size:file.size,createdTime:new Date().toISOString()})}}else rej(new Error('UPLOAD '+x.status))};
      x.onerror=()=>rej(new Error('NETWORK'));x.send(file)});
    row.remove();
    if(info.id)media.unshift(info);
    store.set('vault-drive-cache',media);renderAll();updateQuota();setDriveStatus('ONLINE');
    toast('Subido: '+file.name,'ok')}
  catch(e){row.remove();setDriveStatus('OFFLINE');toast('Error subiendo '+file.name+': '+errText(e),'err')}}

/* ── thumbnails ── */
const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){io.unobserve(e.target);loadThumb(e.target)}},{rootMargin:'150px'});
async function loadThumb(img){
  const f=media.find(x=>x.id===img.dataset.id);if(!f)return;
  try{
    const c=thumbCache.get(f.id);if(c){img.src=c;return}
    if(!f.thumbnailLink)return;
    const r=await api(f.thumbnailLink);if(!r.ok)return;
    const u=URL.createObjectURL(await r.blob());thumbCache.set(f.id,u);img.src=u}
  catch(e){}}

/* ── player ── */
async function openPlayer(id){
  const f=media.find(x=>x.id===id);if(!f)return;
  currentPlay=f;
  $('playerTitle').textContent=f.name;
  $('playerMeta').textContent=fmtSize(f.size)+' · '+(f.createdTime?new Date(f.createdTime).toLocaleString():'');
  $('pimg').classList.add('hidden');$('pvid').classList.add('hidden');$('pnofile').classList.add('hidden');$('pspin').classList.remove('hidden');
  $('player').classList.add('show');
  if(cloudOn()){
    const mt=(f.mimeType||''),u=cloud.url+'/file/'+f.id+'?k='+cloudKey;
    $('pspin').classList.add('hidden');
    if(mt.startsWith('video/')){$('pvid').src=u;$('pvid').classList.remove('hidden');$('pvid').play().catch(()=>{})}
    else if(mt.startsWith('image/')){$('pimg').src=u;$('pimg').classList.remove('hidden')}
    else{const a=$('pnofile');a.href=u;a.download=f.name;a.classList.remove('hidden')}
    return}
  try{
    const r=await api(`files/${id}?alt=media`);
    if(!r.ok)throw new Error('HTTP '+r.status);
    const b=await r.blob();playUrl=URL.createObjectURL(b);
    const mt=(f.mimeType||'');
    if(mt.startsWith('video/')){$('pvid').src=playUrl;$('pvid').classList.remove('hidden');$('pvid').play().catch(()=>{})}
    else if(mt.startsWith('image/')){$('pimg').src=playUrl;$('pimg').classList.remove('hidden')}
    else{const a=$('pnofile');a.href=playUrl;a.download=f.name;a.classList.remove('hidden')}}
  catch(e){toast('No se pudo abrir el archivo: '+errText(e),'err')}
  $('pspin').classList.add('hidden')}
function closePlayer(){
  if(playUrl){URL.revokeObjectURL(playUrl);playUrl=null}
  const v=$('pvid');try{v.pause()}catch(e){}v.removeAttribute('src');try{v.load()}catch(e){}
  $('pimg').removeAttribute('src');$('pnofile').removeAttribute('href');
  $('pimg').classList.add('hidden');$('pvid').classList.add('hidden');$('pnofile').classList.add('hidden');
  $('player').classList.remove('show');currentPlay=null}
async function downloadCurrent(){
  if(!currentPlay)return;
  if(cloudOn()){
    try{
      const r=await fetch(cloud.url+'/file/'+currentPlay.id+'?k='+cloudKey);
      if(!r.ok)throw new Error('HTTP '+r.status);
      const b=await r.blob();const a=document.createElement('a');
      a.href=URL.createObjectURL(b);a.download=currentPlay.name;document.body.appendChild(a);a.click();
      setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},5000)}
    catch(e){toast('Fallo la descarga: '+errText(e),'err')}
    return}
  try{
    const r=await api(`files/${currentPlay.id}?alt=media`);
    if(!r.ok)throw new Error('HTTP '+r.status);
    const b=await r.blob();const a=document.createElement('a');
    a.href=URL.createObjectURL(b);a.download=currentPlay.name;document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},5000)}
  catch(e){toast('Fallo la descarga: '+errText(e),'err')}}
async function deleteMedia(id){
  if(!confirm('¿Borrar este archivo de Google Drive? Esta acción no se puede deshacer.'))return;
  if(cloudOn()){
    try{
      const r=await fetch(cloud.url+'/file/'+id+'?k='+cloudKey,{method:'DELETE'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      media=media.filter(x=>x.id!==id);store.set('vault-drive-cache',media);
      if(currentPlay&&currentPlay.id===id)closePlayer();
      renderAll();toast('Archivo borrado','ok')}
    catch(e){toast('No se pudo borrar: '+errText(e),'err')}
    return}
  try{
    const r=await api(`files/${id}`,{method:'DELETE'});
    if(r.status!==204&&r.status!==200&&!r.ok)throw new Error('HTTP '+r.status);
    media=media.filter(x=>x.id!==id);store.set('vault-drive-cache',media);
    if(currentPlay&&currentPlay.id===id)closePlayer();
    renderAll();updateQuota();toast('Archivo borrado','ok')}
  catch(e){toast('No se pudo borrar: '+errText(e),'err')}}

/* ── render ── */
function renderStats(){
  $('total').textContent=fmt(notes.length+media.length);
  $('notesCount').textContent=fmt(notes.length);
  $('noteTotal').textContent=fmt(notes.length);
  $('fileTotal').textContent=fmt(media.length);
  if(quota&&quota.limit){
    const u=+quota.usage||0,l=+quota.limit||1;
    $('storage').innerHTML=(u/1073741824).toFixed(1)+' <small>GB</small>';
    $('capacity').textContent=(u/1073741824).toFixed(1)+' / '+(l/1073741824).toFixed(0)+' GB';
    $('bar').style.width=Math.min(100,u/l*100)+'%'}
  else{
    $('storage').textContent=fmtSize(media.reduce((a,x)=>a+(+x.size||0),0));
    $('capacity').textContent='— / —';$('bar').style.width='0'}}
function renderNotes(){
  const q=$('search').value.toLowerCase();
  const ns=notes.filter(x=>(x.title||'').toLowerCase().includes(q));
  $('notesList').innerHTML=ns.length?ns.map(x=>`<div class="entry"><div>▤ ${esc(x.title)}<small>${new Date(x.date).toLocaleString()}</small></div><button type="button" data-note-del="${x.id}">DELETE</button></div>`).join(''):'<div class="empty">NO MATCHING NOTES<br><span style="font-size:9px;color:#637784">USE ADD NOTE TO BEGIN</span></div>';
  $('notesList').querySelectorAll('[data-note-del]').forEach(b=>b.onclick=()=>{
    notes=notes.filter(x=>x.id!==b.dataset.noteDel);store.set('vault-notes',notes);renderAll()})}
function renderMedia(){
  const q=$('search').value.toLowerCase();
  const fs=media.filter(x=>(x.name||'').toLowerCase().includes(q));
  $('dropzone').style.display=fs.length?'none':'grid';
  if(!fs.length){$('mediaGrid').innerHTML='';return}
  const canThumb=(hasToken()&&!!cfg.clientId)||cloudOn();
  $('mediaGrid').innerHTML=fs.map(f=>{
    const mt=f.mimeType||'',isImg=mt.startsWith('image/'),isVid=mt.startsWith('video/');
    return `<div class="card" data-id="${f.id}" role="button" tabindex="0">
      <div class="thumb">${((isImg||isVid)&&canThumb)?(cloudOn()?`<img loading="lazy" src="${cloud.url}/thumb/${f.id}?k=${cloudKey}" alt="">`:`<img data-id="${f.id}" alt="">`):`<span class="thumb-icon">${isVid?'▶':isImg?'▣':'▧'}</span>`}
        <span class="badge" style="${isVid?'':'display:none'}">▶</span>
        <button type="button" class="card-del" data-del="${f.id}" title="Delete">DEL</button></div>
      <div class="card-name">${esc(f.name)}<small>${fmtSize(f.size)}</small></div></div>`}).join('');
  if(canThumb&&!cloudOn())document.querySelectorAll('#mediaGrid img[data-id]').forEach(el=>io.observe(el))}
function renderAll(){renderStats();renderNotes();renderMedia()}

/* ── notes ── */
function showModal(){$('title').value='';$('body').value='';$('modal').classList.add('show');setTimeout(()=>$('title').focus(),50)}
function saveNote(){
  const title=$('title').value.trim()||'Untitled entry',body=$('body').value.trim();
  if(!body){$('body').focus();return}
  notes.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2),title,body,date:Date.now()});
  store.set('vault-notes',notes);$('modal').classList.remove('show');renderAll();toast('Nota guardada','ok')}

/* ── settings ── */
function openSettings(){$('clientId').value=cfg.clientId||'';$('cloudUrl').value=cloud.url||'';$('openFolder').classList.toggle('hidden',!folderId);$('settings').classList.add('show')}

/* ── events ── */
$('keys').innerHTML=SYMBOLS.map(s=>`<button type="button" class="key" data-s="${s}">${s}</button>`).join('');
$('keys').onclick=e=>{const b=e.target.closest('.key');if(!b)return;const s=b.dataset.s;const i=seq.indexOf(s);if(i>-1)seq.splice(i,1);else seq.push(s);renderKeys()};
$('lockClear').onclick=()=>{seq=[];renderKeys();$('lockMsg').textContent=''};
$('lockEnter').onclick=submitPattern;
$('lockReset').onclick=()=>{const p=prompt('CONTRASEÑA PARA RESETEAR EL PATRÓN:');if(p===null)return;
  if(p!==RESET_PASSWORD){toast('Contraseña incorrecta','err');return}
  if(confirm('¿Resetear el patrón en este dispositivo?')){localStorage.removeItem('vault-pattern');patPending=null;patMode=cloud.url?'enter':'set';seq=[];updateLockSub();renderKeys();toast('Patrón reseteado en este dispositivo','ok')}};

$('addNote').onclick=showModal;
$('save').onclick=saveNote;
$('cancel').onclick=()=>$('modal').classList.remove('show');
$('search').oninput=renderAll;
$('lockBtn').onclick=lockNow;

$('uploadBtn').onclick=()=>{if(!cfg.clientId){openSettings();return}$('fileInput').click()};
$('fileInput').onchange=e=>{[...e.target.files].forEach(enqueueUpload);e.target.value=''};
$('syncBtn').onclick=()=>connectDrive(true);
$('setupBtn').onclick=openSettings;

$('dropzone').ondragover=e=>{e.preventDefault();$('dropzone').style.borderColor='var(--cyan)'};
$('dropzone').ondragleave=()=>$('dropzone').style.borderColor='';
$('dropzone').ondrop=e=>{e.preventDefault();$('dropzone').style.borderColor='';
  if(!cfg.clientId){openSettings();return}
  [...e.dataTransfer.files].forEach(enqueueUpload)};

$('mediaGrid').onclick=e=>{
  const del=e.target.closest('[data-del]');if(del){deleteMedia(del.dataset.del);return}
  const card=e.target.closest('.card');if(card)openPlayer(card.dataset.id)};
$('mediaGrid').onkeydown=e=>{if(e.key==='Enter'){const card=e.target.closest('.card');if(card)openPlayer(card.dataset.id)}};

$('pClose').onclick=closePlayer;
$('player').onclick=e=>{if(e.target===$('player'))closePlayer()};
$('pDownload').onclick=downloadCurrent;
$('pDelete').onclick=()=>{if(currentPlay)deleteMedia(currentPlay.id)};

$('saveCfg').onclick=()=>{cfg.clientId=$('clientId').value.trim();store.set('vault-cfg',cfg);toast('Configuración guardada — pulsa CONNECT & SYNC','ok')};
$('connectBtn').onclick=()=>{cfg.clientId=$('clientId').value.trim();store.set('vault-cfg',cfg);$('settings').classList.remove('show');connectDrive(true)};
$('closeCfg').onclick=()=>$('settings').classList.remove('show');
$('cloudKeyBtn').onclick=()=>{if(!cloudKey){toast('Desbloquea con tu patrón primero','err');return}
  const done=()=>toast('Cloud key copiada — ponla como VAULT_KEY en el Worker','ok');
  const fallback=()=>{const t=document.createElement('textarea');t.value=cloudKey;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(e){}t.remove();done()};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(cloudKey).then(done,fallback);else fallback()};
$('saveCloud').onclick=()=>{cloud.url=$('cloudUrl').value.trim().replace(/\/+$/,'');store.set('vault-cloud',cloud);toast('Cloud mode guardado','ok');connectDrive(true)};
$('openFolder').onclick=()=>{if(folderId)window.open('https://drive.google.com/drive/folders/'+folderId,'_blank','noopener')};

document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePlayer();$('settings').classList.remove('show');$('modal').classList.remove('show')}});

updateLockSub();renderKeys();renderAll();
})();
