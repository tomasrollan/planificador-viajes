// Nube: login, primera vez (importar demo), sincronización entre dispositivos, portal del cliente con PIN validado "en el servidor"
// (servidor falso en memoria que usa la misma lógica que la función real: supabase/functions/portal/core.mjs).
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{
const P=await import('../../supabase/functions/portal/core.mjs');
const CFG=(html.match(/window\.CLOUD_CFG=(\{[^;]*\});/)||[])[1];const cfg=CFG?JSON.parse(CFG):null;ok(!!cfg&&/supabase\.co/.test(cfg.url),'el build incluye la configuración pública de la nube');
// ---------- servidor falso ----------
const rows={};let tm=Date.parse('2027-01-01T00:00:00Z');const tick=()=>new Date(tm+=1000).toISOString();const files={};const log=[];const portalResponses=[];
const USERS={'agus@test.invalid':'clave-larga-123'};let fails=0;
const J=(b,s=200)=>({ok:s<300,status:s,text:()=>Promise.resolve(b===undefined?'':JSON.stringify(b)),blob:()=>Promise.resolve(b)});
function push(items){return items.map(it=>{const k=it.kind+'/'+it.id,cur=rows[k];
  if(!cur){if(it.base_rev)return {kind:it.kind,id:it.id,status:'conflict',gone:true};rows[k]={agency_id:'ag_default',kind:it.kind,id:it.id,data:it.data||{},rev:1,deleted:!!it.deleted,updated_at:tick()};return {kind:it.kind,id:it.id,status:'ok',rev:1}}
  if(cur.rev!==(it.base_rev||0))return {kind:it.kind,id:it.id,status:'conflict',rev:cur.rev,data:JSON.parse(JSON.stringify(cur.data)),deleted:cur.deleted};
  if(it.data)cur.data=JSON.parse(JSON.stringify(it.data));cur.deleted=!!it.deleted;cur.rev++;cur.updated_at=tick();return {kind:it.kind,id:it.id,status:'ok',rev:cur.rev}})}
const caseRows=cid=>Object.values(rows).filter(r=>r.kind==='case'&&!r.deleted&&r.data.cid===cid);
const agencyMeta=()=>(rows['meta/state']||{data:{}}).data.agency||{name:'Agus Natrone Turismo'};
function portal(b){const row=Object.values(rows).find(r=>r.kind==='client'&&!r.deleted&&r.data.token===b.token);
  if(!row||!P.pinOk(row.data,b.pin)){fails++;return J({error:'link o código incorrecto',code:'bad_pin'},401)}
  if(b.action==='open')return J({ok:true,view:P.portalView(row.data,caseRows(row.id).map(r=>r.data),agencyMeta())});
  if(b.action==='file'){const al=P.visibleFileIds(row.data);return al[b.fileId]?J({ok:true,url:'https://files.test/'+b.fileId,name:al[b.fileId]}):J({error:'archivo no disponible'},404)}
  const cs=caseRows(row.id);const res=P.applyPatch(Object.assign({},row.data,{agency_id:'ag_default'}),cs.map(r=>r.data),b.patch,null);const cl=res.client;delete cl.agency_id;row.data=cl;row.rev++;row.updated_at=tick();
  res.caseOps.forEach(op=>{const d=Object.assign({},op.data);delete d.agency_id;if(op.op==='insert')rows['case/'+d.id]={agency_id:'ag_default',kind:'case',id:d.id,data:d,rev:1,deleted:false,updated_at:tick()};else{const r=rows['case/'+d.id];r.data=d;r.rev++;r.updated_at=tick()}});
  const resp=J({ok:true,rejected:res.rejected,view:P.portalView(cl,caseRows(row.id).map(r=>r.data),agencyMeta())});return resp}
function fetchMock(url,o){o=o||{};const u=new URL(url),p=u.pathname,m=o.method||'GET',body=typeof o.body==='string'?JSON.parse(o.body||'null'):o.body;log.push(m+' '+p);
  if(!url.startsWith(cfg.url))return Promise.reject(new Error('host inesperado '+url));
  if(p==='/auth/v1/token'&&u.searchParams.get('grant_type')==='password'){return Promise.resolve(USERS[body.email]===body.password?J({access_token:'tok',refresh_token:'ref',expires_in:3600,user:{id:'u1',email:body.email}}):J({error_description:'Invalid login credentials'},400))}
  if(p==='/auth/v1/user'&&m==='PUT'){ if(o.headers.Authorization!=='Bearer INVTOK')return Promise.resolve(J({error:'bad'},401)); if(body.password==='12345678')return Promise.resolve(J({msg:'weak'},422)); USERS['nueva@test.invalid']=body.password; return Promise.resolve(J({id:'u2',email:'nueva@test.invalid'})) }
  if(p==='/auth/v1/logout')return Promise.resolve(J({}));
  if(p==='/rest/v1/rpc/claim_invites')return Promise.resolve(J(['ag_default']));
  if(p==='/rest/v1/agencies')return Promise.resolve(J([{name:'Agus Natrone Turismo'}]));
  if(p==='/rest/v1/rpc/push_records')return Promise.resolve(J(push(body.p_items)));
  if(p==='/rest/v1/records'){let l=Object.values(rows).filter(r=>r.agency_id==='ag_default');const gt=u.searchParams.get('updated_at');if(gt)l=l.filter(r=>r.updated_at>gt.replace(/^gt\./,''));l.sort((a,b)=>a.updated_at<b.updated_at?-1:1);const off=+u.searchParams.get('offset')||0,lim=+u.searchParams.get('limit')||1000;return Promise.resolve(J(JSON.parse(JSON.stringify(l.slice(off,off+lim)))))}
  if(p==='/functions/v1/portal'){const r=portal(body);if(r.ok){const t=JSON.parse(JSON.stringify(r)&&'null');}
    return r.text().then(t=>{portalResponses.push(t);return r})}
  if(p.startsWith('/storage/v1/object/comprobantes/')){files[decodeURIComponent(p.split('/').pop())]=o.body;return Promise.resolve(J({Key:'ok'}))}
  if(p.startsWith('/storage/v1/object/authenticated/comprobantes/')){const f=files[decodeURIComponent(p.split('/').pop())];return Promise.resolve(f?J(f):J({error:'not found'},404))}
  return Promise.resolve(J({error:'no mock '+p},404))}
const boot=(url,ls)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url,beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};
  w.CLOUD_FORCE=true;w.fetch=(u,o)=>fetchMock(u,o);w.open=()=>null;Object.keys(ls||{}).forEach(k=>w.localStorage.setItem(k,ls[k]))}});
const T=d=>{const b=d.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
const mk=dom=>{const w=dom.window,d=w.document;return {w,d,click:s=>{const e=typeof s==='string'?d.querySelector(s):s;if(!e)throw new Error('no existe '+s);e.click()},set:(sel,v)=>{const e=d.querySelector(sel);if(!e)throw new Error('no existe '+sel);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}))},text:()=>T(d),ls:k=>w.localStorage.getItem(k)}};

// ================= agencia: login =================
let A=mk(boot('https://x.test/?notour#panel'));await sleep(600);
ok(A.d.querySelector('#cl-email')&&!/Panel|Clientes/.test(A.d.querySelector('.hdr')?A.d.querySelector('.hdr').textContent:''),'sin sesión: se ve el login y nada de la app');
ok(!/Rodríguez/.test(A.text()),'los datos locales no se ven detrás del login');
A.set('#cl-email','agus@test.invalid');A.set('#cl-pass','mala');A.click('[data-cl-login]');await sleep(300);
ok(/incorrectos/.test(A.text())&&!!A.d.querySelector('#cl-email'),'contraseña incorrecta: error y sigue el login');
A.set('#cl-email','Agus@Test.invalid');A.set('#cl-pass','clave-larga-123');A.click('[data-cl-login]');await sleep(500);
ok(/todavía está vacía en la nube/.test(A.text())&&!!A.d.querySelector('[data-cl-import]'),'agencia vacía: ofrece empezar vacía o subir lo local');
ok(Object.keys(rows).length===0,'todavía no se subió nada sin elegir');
A.click('[data-cl-import]');await sleep(1200);
const nCl=Object.values(rows).filter(r=>r.kind==='client').length;
ok(nCl===5&&Object.values(rows).filter(r=>r.kind==='family').length>=3&&!!rows['meta/state'],'subió los 5 viajes, las familias y los datos de la agencia');
ok(rows['meta/state'].data.agency.name==='Agus Natrone Turismo'&&!rows['meta/state'].data.clients,'meta sin listas');
ok(/Panel/.test(A.text())&&A.d.querySelector('#cloudbox')&&A.d.querySelector('[data-cl-logout]'),'la app se abre y tiene el botón «Cerrar sesión»');
ok(!A.d.querySelector('#cloudchip')&&!/Guardado en la nube/.test(A.text()),'con todo guardado no se muestra ningún cartel de estado');
ok(!A.d.querySelector('.demo-note')||A.d.querySelector('.demo-note').hidden,'sin cartel de demo en modo nube');
ok(!!A.ls('agency_cloud_session')&&!!A.ls('agency_cloud_sync'),'la sesión y el estado de sync quedan guardados');
// editar → sube solo
A.w.location.hash='cliente-c1';await sleep(300);A.click('[data-tab="datos"]');await sleep(150);
ok(!!A.d.querySelector('#d-notes'),'está el formulario de datos del viaje');
A.set('#d-notes','Nota nueva de Agus');A.click('[data-savedatos]');
await sleep(2300);
ok(rows['client/c1'].data.notes==='Nota nueva de Agus'&&rows['client/c1'].rev>=2,'un cambio local sube solo a la nube (rev '+rows['client/c1'].rev+')');
const revC2=rows['client/c2'].rev;ok(revC2===1,'lo que no cambió no se vuelve a subir');
// ================= invitación: elegir contraseña =================
let I=mk(boot('https://i.test/?notour#access_token=INVTOK&refresh_token=R&expires_in=3600&token_type=bearer&type=invite'));await sleep(400);
ok(!!I.d.querySelector('#cl-pw1')&&!/INVTOK/.test(I.w.location.href),'el link de invitación abre «Elegí tu contraseña» y limpia el token de la barra');
I.set('#cl-pw1','corta');I.set('#cl-pw2','corta');I.click('[data-cl-setpw]');await sleep(100);ok(/al menos 8/.test(I.text()),'rechaza contraseñas cortas');
I.set('#cl-pw1','una-clave-larga');I.set('#cl-pw2','otra-distinta-x');I.click('[data-cl-setpw]');await sleep(100);ok(/iguales/.test(I.text()),'rechaza si no coinciden');
I.set('#cl-pw1','12345678');I.set('#cl-pw2','12345678');I.click('[data-cl-setpw]');await sleep(300);ok(/fácil de adivinar/.test(I.text()),'si el servidor la rechaza por débil, lo explica');
I.set('#cl-pw1','una-clave-larga');I.set('#cl-pw2','una-clave-larga');I.click('[data-cl-setpw]');await sleep(700);ok(USERS['nueva@test.invalid']==='una-clave-larga'&&!I.d.querySelector('#cl-pw1'),'guarda la contraseña y sigue al ingreso');
ok(/todavía está vacía|Panel/.test(I.text())&&JSON.parse(I.ls('agency_cloud_session')||'{}').email==='nueva@test.invalid','queda con la sesión iniciada');
let X=mk(boot('https://i.test/?notour#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'));await sleep(300);ok(/El link no sirve/.test(X.text()),'link vencido: mensaje claro');
// ================= otro dispositivo =================
const sess=A.ls('agency_cloud_session');
let B=mk(boot('https://y.test/?notour#clientes',{agency_cloud_session:sess}));await sleep(1800);
ok(/Rodríguez/.test(B.text())&&/Gómez/.test(B.text()),'otro dispositivo: baja los clientes de la nube');
ok(!/todavía está vacía/.test(B.text()),'y no ofrece importar porque la nube ya tiene datos');
B.w.location.hash='cliente-c1';await sleep(300);B.click('[data-tab="datos"]');await sleep(150);const sb=B.d.querySelector('#d-notes');ok(sb&&sb.value==='Nota nueva de Agus','ve el cambio hecho en el otro dispositivo');
// ================= portal =================
const tok=rows['client/c1'].data.token,pin=rows['client/c1'].data.pin;
let C=mk(boot('https://z.test/#portal-'+tok));await sleep(500);
ok(!!C.d.querySelector('#pin')&&!/Rodríguez/.test(C.text()),'portal: pide el código y no muestra nada del viaje');
ok(C.ls('agency_planner_v3')===null,'el portal no escribe en el almacenamiento local de la agencia');
C.set('#pin','000000');C.click('[data-cl-unlock]');await sleep(300);ok(/incorrecto/.test(C.text())&&!!C.d.querySelector('#pin'),'código incorrecto: no entra');
C.set('#pin',pin);C.click('[data-cl-unlock]');await sleep(600);
ok(/Rodríguez/.test(C.text())&&/Agenda/.test(C.text()),'código correcto: ve su viaje');
ok(!C.d.querySelector('[data-role]')&&!C.d.querySelector('[data-go="panel"]')&&!/Ajustes/.test(C.text()),'sin controles de agencia');
const resp=portalResponses.join('');ok(resp.indexOf(pin)<0&&!/"notes"|"stage"|famId|Historial|Nota nueva/.test(resp),'lo que recibió el cliente no trae PIN, notas ni ficha');
ok(C.ls('agency_planner_v3')===null,'sigue sin escribir local tras entrar');
// el cliente marca un favorito (restaurante) → el servidor lo guarda
C.w.document.querySelector('[data-ptab="rest"]').click();await sleep(200);
const fav=C.d.querySelector('[data-fav]');ok(!!fav,'hay corazones para marcar favoritos');if(fav){const rid=fav.getAttribute('data-fav');fav.click();await sleep(1500);const favs=rows['client/c1'].data.favs;ok(Object.values(favs).some(a=>a.indexOf(rid)>=0),'el favorito del cliente llegó al servidor');ok(rows['client/c1'].data.pin===pin&&rows['client/c1'].data.notes==='Nota nueva de Agus','y no se perdió ni se pisó nada privado')}
// la agencia lo recibe al sincronizar
B.d.dispatchEvent(new B.w.Event('visibilitychange'));await sleep(1200);
B.w.location.hash='cliente-c1';await sleep(300);
ok(Object.values(JSON.parse(B.ls('agency_planner_v3')).clients.find(c=>c.id==='c1').favs).some(a=>a.length),'la agencia recibe los cambios del cliente');
// portal con recarga: recuerda el código solo en la pestaña
const pinKey='portal_pin_'+tok;ok(C.w.sessionStorage.getItem(pinKey)===pin,'el código queda solo en la sesión de la pestaña');
// bloqueo por demasiados intentos del lado del servidor se muestra bien
// ================= comprobantes =================
// ================= cierre de sesión =================
A.click('[data-cl-logout]');await sleep(1500);
ok(!!A.d.querySelector('#cl-email')&&!A.ls('agency_cloud_session')&&!A.ls('agency_planner_v3')&&!A.ls('agency_cloud_sync'),'cerrar sesión borra los datos de este dispositivo y vuelve al login');
{const pw=A.d.querySelector('#cl-pass'),eye=A.d.querySelector('[data-cl-eye="cl-pass"]');ok(!!eye&&pw.type==='password','el login tiene el ojito y la contraseña está oculta');eye.click();ok(pw.type==='text','el ojito muestra la contraseña');A.d.querySelector('[data-cl-eye="cl-pass"]').click();ok(pw.type==='password','y la vuelve a ocultar');}
ok(Object.values(rows).filter(r=>r.kind==='client').length===5,'y en la nube siguen intactos');
// ================= el modo local no cambia =================
const L=mk(new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#panel',beforeParse(w){w.scrollTo=()=>{};w.addEventListener('error',e=>errs.push(String(e.message)))}}));await sleep(500);
ok(/Rodríguez/.test(L.text())&&!L.d.querySelector('#cloudchip'),'sin forzar la nube (jsdom/?local): todo igual que siempre');
ok(errs.length===0,'sin errores de JavaScript '+errs.slice(0,3).join(' | '));
console.log(out.join('\n'));process.exit(process.exitCode||0);
})().catch(e=>{console.error('ERR [test20]',e);process.exit(1)});
