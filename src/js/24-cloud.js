/* ======================= Nube (Supabase) =======================
   Tres modos (se eligen al cargar, ver 01-util.js):
   · local  → todo en este navegador (demo, ?local, tests).
   · agency → login con mail y contraseña; los datos se guardan en el navegador y se sincronizan con la nube (local-first).
   · portal → el cliente entra con su link + PIN; el PIN lo valida el servidor y solo recibe lo que puede ver.
   La clave publishable es pública; la protección son las políticas RLS y la función del portal. Nunca hay claves secretas acá. */
var CFG=CL.cfg, SESSKEY='agency_cloud_session', SYNCKEY='agency_cloud_sync', UPKEY='agency_cloud_uploads';
CL.st='idle'; CL.err=''; CL.lastOk=0; CL.eng=null; CL.agency=null; CL.email='';

/* ---------- red ---------- */
function clHttp(path,o){
  o=o||{}; var h={apikey:CFG.key}; if(o.token) h.Authorization='Bearer '+o.token; if(o.json!==undefined) h['Content-Type']='application/json';
  if(o.headers) Object.keys(o.headers).forEach(function(k){ h[k]=o.headers[k]; });
  return fetch(CFG.url+path,{method:o.method||'GET',headers:h,body:o.body!==undefined?o.body:(o.json!==undefined?JSON.stringify(o.json):undefined)}).then(function(r){
    if(o.blob&&r.ok) return r.blob();
    return r.text().then(function(t){ var j=null; try{ j=t?JSON.parse(t):null; }catch(e){}
      if(!r.ok){ var er=new Error((j&&(j.msg||j.message||j.error_description||j.error))||('HTTP '+r.status)); er.status=r.status; er.body=j; throw er; }
      return j; });
  });
}
function clSession(){ try{ return JSON.parse(localStorage.getItem(SESSKEY)||'null'); }catch(e){ return null; } }
function clSetSession(s){ try{ if(s) localStorage.setItem(SESSKEY,JSON.stringify(s)); else localStorage.removeItem(SESSKEY); }catch(e){} CL.sess=s; }
function clSessFrom(j,prev){ return {access_token:j.access_token,refresh_token:j.refresh_token,expires_at:j.expires_at||Math.floor(Date.now()/1000)+(j.expires_in||3600),user_id:(j.user&&j.user.id)||(prev&&prev.user_id),email:(j.user&&j.user.email)||(prev&&prev.email)||''}; }
function clRefresh(){
  var s=CL.sess||clSession(); if(!s||!s.refresh_token) return Promise.reject(Object.assign(new Error('sin sesión'),{status:401}));
  if(CL._rf) return CL._rf;
  CL._rf=clHttp('/auth/v1/token?grant_type=refresh_token',{method:'POST',json:{refresh_token:s.refresh_token}}).then(function(j){ CL._rf=null; var n=clSessFrom(j,s); clSetSession(n); return n; },function(e){ CL._rf=null; if(e.status===400||e.status===401||e.status===403){ clSetSession(null); e.status=401; } throw e; });
  return CL._rf;
}
function clToken(){ var s=CL.sess||clSession(); if(!s) return Promise.reject(Object.assign(new Error('sin sesión'),{status:401})); CL.sess=s;
  if(s.expires_at*1000-Date.now()<60000) return clRefresh().then(function(n){ return n.access_token; }); return Promise.resolve(s.access_token); }
function clAuthed(path,o){ o=Object.assign({},o||{});
  return clToken().then(function(t){ o.token=t; return clHttp(path,o); }).catch(function(e){
    if(e.status===401&&!o._retried){ return clRefresh().then(function(n){ o.token=n.access_token; o._retried=true; return clHttp(path,o); }); } throw e; });
}

/* ---------- estado / chip ---------- */
var CLST={ok:['Guardado en la nube','ok'],sync:['Sincronizando…','sync'],pending:['Cambios sin subir','warn'],offline:['Sin conexión','warn'],auth:['Volvé a iniciar sesión','err'],idle:['Nube','ok']};
function cloudChip(){ var p=CLST[CL.st]||CLST.idle; return '<button class="cloudchip '+p[1]+'" id="cloudchip" data-cloudmenu="1" title="Estado de la sincronización">'+I(p[1]==='ok'||p[1]==='sync'?'check':'info')+'<span>'+esc(p[0])+'</span></button>'; }
function clSetStatus(st){ CL.st=st; var e=$('#cloudchip'); if(e) e.outerHTML=cloudChip(); }
function clStatusAfter(r){
  if(r&&r.ok){ CL.err=''; CL.lastOk=Date.now(); clSetStatus(r.pending?'pending':'ok'); }
  else { CL.err=(r&&r.error)||''; clSetStatus((r&&r.auth)?'auth':'offline'); }
}
/* re-dibuja después de cambios que llegaron de la nube, sin pisar lo que la persona está escribiendo */
function clSoftRender(){
  var a=document.activeElement, typing=a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  if($('#modalRoot')||typing||CL.gate){ CL.needRender=true; return; }
  CL.needRender=false; render();
}
document.addEventListener('focusout',function(){ if(CL.needRender) setTimeout(clSoftRender,300); });
if(CL.on) setInterval(function(){ if(CL.needRender) clSoftRender(); },4000);   // solo con la nube activa (en modo local no queda ningún temporizador)

/* ---------- pantallas de entrada ---------- */
function clGateShell(inner){ return '<main class="wrap"><div class="gate card"><div class="logo" style="margin:0 auto 14px">'+I('utensils')+'</div>'+inner+'</div></main>'; }
function clGateLogin(msg,keep){
  CL.gate=clGateShell('<h2 style="font-weight:900">Planificador de viajes</h2><p class="muted">Entrá con tu mail y tu contraseña.'+(keep?' Tus cambios sin subir siguen guardados en este dispositivo.':'')+'</p>'+
    '<label class="f" style="text-align:left">Mail</label><input type="email" id="cl-email" autocomplete="username" inputmode="email" value="'+esc((CL.sess&&CL.sess.email)||'')+'">'+
    '<label class="f" style="text-align:left;margin-top:10px">Contraseña</label><input type="password" id="cl-pass" autocomplete="current-password">'+
    '<div id="cl-err" class="small" style="color:var(--rose);min-height:22px;margin-top:6px;font-weight:600">'+esc(msg||'')+'</div>'+
    '<button class="btn" style="width:100%;margin-top:6px;padding:13px" data-cl-login="'+(keep?'keep':'new')+'">Entrar</button><div class="tiny muted" style="margin-top:12px">¿No tenés acceso? Pedíselo a quien administra la agencia.</div>');
  render(); var e=$('#cl-email'); if(e&&!e.value) e.focus(); else if($('#cl-pass')) $('#cl-pass').focus();
}
function clGateMsg(title,text,btn){ CL.gate=clGateShell('<h2 style="font-weight:900">'+esc(title)+'</h2><p class="muted">'+esc(text)+'</p>'+(btn?'<button class="btn" style="width:100%;margin-top:6px" '+btn[1]+'>'+esc(btn[0])+'</button>':'')); render(); }
function clGateLoading(t){ CL.gate=clGateShell('<h2 style="font-weight:900">'+esc(t||'Conectando…')+'</h2><p class="muted">Un momento.</p>'); render(); }
function clGateChoice(name,hasLocal){
  CL.gate=clGateShell('<h2 style="font-weight:900">'+esc(name)+' todavía está vacía en la nube</h2><p class="muted">¿Cómo querés empezar?</p>'+
    '<button class="btn" style="width:100%;margin-top:6px;padding:13px" data-cl-empty="1">Empezar con la agencia vacía</button>'+
    (hasLocal?'<button class="btn line" style="width:100%;margin-top:10px;padding:13px" data-cl-import="1">Subir los datos que hay en este navegador (demo)</button><div class="tiny muted" style="margin-top:10px">Los datos de demo incluyen familias y viajes de ejemplo.</div>':''));
  render();
}

/* ---------- login ---------- */
function clLogin(email,pass,keep){
  if(!email||!pass){ clGateLogin('Completá el mail y la contraseña.',keep); return; }
  var btn=$('[data-cl-login]'); if(btn){ btn.disabled=true; btn.textContent='Entrando…'; }
  clHttp('/auth/v1/token?grant_type=password',{method:'POST',json:{email:email.trim().toLowerCase(),password:pass}}).then(function(j){
    clSetSession(clSessFrom(j)); CL.gate=null; if(keep&&CL.eng){ clSetStatus('sync'); render(); CL.syncNow(); } else clStartAgency();
  },function(e){
    var m=(e.status===400||e.status===401)?'Mail o contraseña incorrectos.':(e.status===429?'Demasiados intentos. Esperá un rato y probá de nuevo.':'No se pudo conectar. Revisá tu internet.');
    clGateLogin(m,keep);
  });
}

/* ---------- arranque de la agencia ---------- */
function clSyncRec(){ return store.get(SYNCKEY); }
function clMakeEngine(agency,base,cursor){
  CL.agency=agency;
  CL.eng=Cloud.createEngine({base:base,cursor:cursor,get:function(){ return S; },
    transport:{
      pull:function(since){ var all=[],off=0;
        function page(){ return clAuthed('/rest/v1/records?agency_id=eq.'+encodeURIComponent(agency)+(since?'&updated_at=gt.'+encodeURIComponent(since):'')+'&select=kind,id,data,rev,deleted,updated_at&order=updated_at.asc,kind.asc,id.asc&limit=300&offset='+off).then(function(rows){ rows=rows||[]; all=all.concat(rows); if(rows.length===300){ off+=300; return page(); } return all; }); }
        return page(); },
      push:function(items){ return clAuthed('/rest/v1/rpc/push_records',{method:'POST',json:{p_agency:agency,p_items:items}}); }
    },
    onChange:function(){ Cloud.fixCaseNums(S); repo.set(S); try{ mem[KEY]=S; localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} clSoftRender(); }});
}
function clPersistSync(){ if(!CL.eng) return; var sn=CL.eng.snapshot(); store.set(SYNCKEY,{user:(CL.sess||{}).user_id,agency:CL.agency,base:sn.base,cursor:sn.cursor}); }

/* link del mail de Supabase (invitación o recuperar contraseña): llega en el # con el token; se usa una sola vez para elegir la contraseña */
function clAuthHash(){
  var h=location.hash.replace(/^#/,''); if(h.indexOf('access_token=')<0&&h.indexOf('error=')<0) return false;
  var q={}; h.split('&').forEach(function(p){ var i=p.indexOf('='); if(i>0) q[p.slice(0,i)]=decodeURIComponent(p.slice(i+1).replace(/\+/g,' ')); });
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}   // que el token no quede en la barra ni en el historial
  if(q.error){ clGateMsg('El link no sirve','El link venció o ya se usó. Pedile a quien administra la agencia que te mande otro.',['Ir al inicio','data-cl-home="1"']); return true; }
  if(q.type!=='invite'&&q.type!=='recovery'&&q.type!=='signup'&&q.type!=='magiclink') return false;
  CL.setpw={access_token:q.access_token,refresh_token:q.refresh_token,expires_at:Math.floor(Date.now()/1000)+(+q.expires_in||3600),type:q.type}; clGatePw(''); return true;
}
function clGatePw(msg){
  CL.gate=clGateShell('<h2 style="font-weight:900">Elegí tu contraseña</h2><p class="muted">Con esta contraseña vas a entrar siempre. Usá al menos 8 caracteres.</p>'+
    '<label class="f" style="text-align:left">Contraseña nueva</label><input type="password" id="cl-pw1" autocomplete="new-password">'+
    '<label class="f" style="text-align:left;margin-top:10px">Repetila</label><input type="password" id="cl-pw2" autocomplete="new-password">'+
    '<div id="cl-err" class="small" style="color:var(--rose);min-height:22px;margin-top:6px;font-weight:600">'+esc(msg||'')+'</div><button class="btn" style="width:100%;margin-top:6px;padding:13px" data-cl-setpw="1">Guardar y entrar</button>');
  render(); var e=$('#cl-pw1'); if(e) e.focus();
}
function clSetPw(){
  var a=($('#cl-pw1')||{}).value||'', b=($('#cl-pw2')||{}).value||''; if(!CL.setpw) return;
  if(a.length<8){ clGatePw('Tiene que tener al menos 8 caracteres.'); return; } if(a!==b){ clGatePw('Las dos contraseñas tienen que ser iguales.'); return; }
  var t=CL.setpw; var btn=$('[data-cl-setpw]'); if(btn){ btn.disabled=true; btn.textContent='Guardando…'; }
  clHttp('/auth/v1/user',{method:'PUT',token:t.access_token,json:{password:a}}).then(function(u){
    clSetSession({access_token:t.access_token,refresh_token:t.refresh_token,expires_at:t.expires_at,user_id:u&&u.id,email:(u&&u.email)||''}); CL.setpw=null; CL.gate=null; clStartAgency();
  },function(e){ clGatePw(e.status===422?'Esa contraseña es muy fácil de adivinar. Probá con otra más larga.':(e.status===401||e.status===403)?'El link venció. Pedí otra invitación.':'No se pudo guardar. Probá de nuevo.'); });
}
function clStartAgency(){
  if(clAuthHash()) return;
  var ss=clSession(); CL.sess=ss; if(!ss){ clGateLogin(); return; }
  CL.email=ss.email||''; clGateLoading('Entrando…');
  clAuthed('/rest/v1/rpc/claim_invites',{method:'POST',json:{}}).then(function(ids){
    ids=(ids||[]).filter(function(x){ return typeof x==='string'; });
    if(!ids.length){ clGateMsg('Sin agencia asignada','Tu usuario existe pero todavía no tiene una agencia habilitada. Pedile acceso a quien administra la agencia.',['Salir','data-cl-logout2="1"']); return; }
    var rec=clSyncRec(), agency=ids[0];
    if(rec&&rec.user===ss.user_id&&ids.indexOf(rec.agency)>=0){ CL.gate=null; clMakeEngine(rec.agency,rec.base||{},rec.cursor||null); render(); clScheduleLoop(); CL.syncNow(); return; }
    return clFirstTime(agency);
  }).catch(function(e){
    var rec=clSyncRec();
    if(e.status===401){ clGateLogin('La sesión venció. Iniciá sesión de nuevo.'); return; }
    if(rec&&rec.user===(ss||{}).user_id){ CL.gate=null; clMakeEngine(rec.agency,rec.base||{},rec.cursor||null); render(); clScheduleLoop(); clStatusAfter({ok:false,error:'Sin conexión'}); return; }   // sin red pero con datos de antes: se trabaja local
    clGateMsg('No se pudo conectar','Revisá tu internet y probá de nuevo.',['Reintentar','data-cl-retry="1"']);
  });
}
/* primera vez en este dispositivo: si la nube ya tiene datos se bajan; si está vacía se elige cómo empezar */
function clFirstTime(agency){
  return Promise.all([clAuthed('/rest/v1/records?agency_id=eq.'+encodeURIComponent(agency)+'&select=kind,id&limit=1'),clAuthed('/rest/v1/agencies?id=eq.'+encodeURIComponent(agency)+'&select=name')]).then(function(r){
    r=[null].concat(r);
    var has=(r[1]||[]).length>0, name=((r[2]||[])[0]||{}).name||'La agencia';
    if(has){ S=Repo.migrate(Cloud.emptyState(name,agency)); repo.set(S); clMakeEngine(agency,{},null); CL.gate=null; render(); clScheduleLoop(); CL.syncNow(); return; }
    CL.pendingAgency={id:agency,name:name}; clGateChoice(name,Repo.valid(S)&&(S.clients||[]).length>0);
  });
}
function clChoose(importLocal){
  var a=CL.pendingAgency; if(!a) return; CL.pendingAgency=null;
  if(importLocal){ S.agency=S.agency||{}; S.agency.id=a.id; } else { S=Repo.migrate(Cloud.emptyState(a.name,a.id)); }
  repo.set(S); try{ localStorage.setItem(KEY,JSON.stringify(S)); mem[KEY]=S; }catch(e){}
  clMakeEngine(a.id,{},null); CL.gate=null; render(); clScheduleLoop(); CL.syncNow();
}

/* ---------- sincronización ---------- */
var _clT=null, _clLoop=false;
CL.dirty=function(){ if(CL.mode!=='agency'||!CL.eng) return; clearTimeout(_clT); if(CL.st!=='sync') clSetStatus('pending'); _clT=setTimeout(function(){ CL.syncNow(); },1500); };
CL.syncNow=function(){
  if(!CL.eng) return Promise.resolve();
  clSetStatus('sync');
  return clUploads().then(function(){ return CL.eng.sync(); }).then(function(r){
    if(r&&r.busy) return r;
    if(!r.ok&&/sin sesi|401|JWT|expired/i.test(r.error||'')) r.auth=true;
    clPersistSync(); clStatusAfter(r); return r; });
};
function clScheduleLoop(){
  if(_clLoop) return; _clLoop=true;
  setInterval(function(){ if(CL.eng&&!document.hidden&&CL.st!=='auth') CL.syncNow(); },25000);
  document.addEventListener('visibilitychange',function(){ if(!document.hidden&&CL.eng&&CL.st!=='auth') CL.syncNow(); });
  window.addEventListener('online',function(){ if(CL.eng&&CL.st!=='auth') CL.syncNow(); });
  window.addEventListener('beforeunload',function(){ if(CL.eng&&CL.eng.pending()>0) clPersistSync(); });
}

/* ---------- archivos (PDF e imágenes): IndexedDB + Storage privado ---------- */
function clUpList(){ try{ return JSON.parse(localStorage.getItem(UPKEY)||'[]'); }catch(e){ return []; } }
function clUpSet(l){ try{ localStorage.setItem(UPKEY,JSON.stringify(l)); }catch(e){} }
function clUpload(id,blob){
  return clAuthed('/storage/v1/object/comprobantes/'+encodeURIComponent(CL.agency)+'/'+encodeURIComponent(id),{method:'POST',body:blob,headers:{'Content-Type':blob.type||'application/octet-stream','x-upsert':'true'}}).then(function(){ clUpSet(clUpList().filter(function(x){ return x!==id; })); return true; },function(){ return false; });
}
function clUploads(){
  var l=clUpList(); if(!l.length||!CL.agency) return Promise.resolve();
  return l.reduce(function(p,id){ return p.then(function(){ return Files.get(id).then(function(b){ if(!b){ clUpSet(clUpList().filter(function(x){ return x!==id; })); return; } return clUpload(id,b); }); }); },Promise.resolve());
}
(function(){
  var put=Files.put, get=Files.get;
  Files.put=function(id,blob){ return put(id,blob).then(function(ok){ if(CL.mode==='agency'&&CL.agency){ var l=clUpList(); if(l.indexOf(id)<0){ l.push(id); clUpSet(l); } clUpload(id,blob); } return ok; }); };
  Files.get=function(id){ return get(id).then(function(b){
    if(b||CL.mode!=='agency'||!CL.agency) return b;
    return clAuthed('/storage/v1/object/authenticated/comprobantes/'+encodeURIComponent(CL.agency)+'/'+encodeURIComponent(id),{blob:true}).then(function(bl){ return put(id,bl).then(function(){ return bl; }); },function(){ return null; }); }); };
})();

/* ---------- menú de estado y cierre de sesión ---------- */
function clMenu(){
  var p=CL.eng?CL.eng.pending():0, when=CL.lastOk?new Date(CL.lastOk).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}):'—';
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Nube</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 12px">Tu cuenta y la sincronización</h3>'+
    '<div class="small" style="line-height:1.7"><b>Usuario:</b> '+esc(CL.email||'—')+'<br><b>Estado:</b> '+esc((CLST[CL.st]||CLST.idle)[0])+(p?' · '+p+' cambio'+(p===1?'':'s')+' por subir':'')+'<br><b>Última sincronización:</b> '+esc(when)+(CL.err?'<br><span style="color:var(--rose)">'+esc(CL.err)+'</span>':'')+'</div>'+
    '<div class="row" style="margin-top:16px;gap:8px;flex-wrap:wrap"><button class="btn sm" data-cl-sync="1">Sincronizar ahora</button>'+(CL.st==='auth'?'<button class="btn sm" data-cl-relogin="1">Iniciar sesión</button>':'')+'<button class="btn line sm" data-cl-logout="1">Cerrar sesión</button></div>'+
    '<div class="tiny muted" style="margin-top:10px">Al cerrar sesión se borran los datos guardados en este dispositivo; en la nube siguen intactos.</div></div></div></div>');
}
function clLogout(force){
  var done=function(){ clDoLogout(); };
  if(force||!CL.eng) return done();
  CL.syncNow().then(function(){ var p=CL.eng?CL.eng.pending():0; if(p>0){ showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><h3 style="font-size:19px;font-weight:900">Hay cambios sin subir</h3><p class="muted">Hay '+p+' cambio'+(p===1?'':'s')+' que todavía no llegaron a la nube (¿sin internet?). Si cerrás sesión ahora se pierden.</p><div class="row" style="gap:8px"><button class="btn sm" data-close="1">Volver</button><button class="btn line sm" data-cl-logout2="1">Cerrar sesión igual</button></div></div></div></div>'); } else done(); });
}
function clDoLogout(){
  var s=CL.sess||clSession(); closeModal();
  try{ if(s) clHttp('/auth/v1/logout',{method:'POST',token:s.access_token,json:{}}).catch(function(){}); }catch(e){}
  [KEY,SYNCKEY,SESSKEY,UPKEY].forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} delete mem[k]; });
  Files.keys().then(function(ks){ ks.forEach(function(k){ Files.del(k); }); });
  CL.eng=null; CL.agency=null; CL.sess=null; CL.email=''; CL.st='idle';
  S=Repo.migrate(Cloud.emptyState('Agencia')); repo.set(S); location.hash=''; clGateLogin('');
}

/* ================= portal del cliente ================= */
function clPortalToken(){ return location.hash.replace(/^#portal-/,'').replace(/[^A-Za-z0-9_-]/g,'').slice(0,80); }
function clPortalCall(action,extra){
  var b=Object.assign({action:action,token:CL.token,pin:CL.pin},extra||{});
  return fetch(CFG.url+'/functions/v1/portal',{method:'POST',headers:{'Content-Type':'application/json',apikey:CFG.key},body:JSON.stringify(b)}).then(function(r){
    return r.text().then(function(t){ var j=null; try{ j=JSON.parse(t); }catch(e){} if(!r.ok){ var er=new Error((j&&j.error)||('HTTP '+r.status)); er.status=r.status; er.code=j&&j.code; throw er; } return j; }); });
}
function clPortalGate(msg){
  CL.gate=clGateShell('<h2 style="font-weight:900">Tu viaje</h2><p class="muted">Ingresá tu código de 6 dígitos para ver tu agenda de comidas.</p><input type="text" inputmode="numeric" maxlength="6" id="pin" placeholder="······" autocomplete="off"><div id="pinerr" class="small" style="color:var(--rose);min-height:22px;margin-top:6px;font-weight:600">'+esc(msg||'')+'</div><button class="btn" style="width:100%;margin-top:6px;padding:13px" data-cl-unlock="1">Entrar</button><div class="tiny muted" style="margin-top:12px">Si no tenés el código, pedíselo a tu agencia de viajes.</div>');
  render(); var e=$('#pin'); if(e) e.focus();
}
function clPortalShell(view){
  var ag=Object.assign({id:'portal',name:'',tagline:'',tz:'America/Argentina/Buenos_Aires',tzName:'Argentina'},view.agency||{});
  var st=Repo.migrate({v:3,agency:ag,seq:1000,families:[],famSeq:0,templates:[],clients:[view.client],cases:view.cases||[]}); return st;
}
var CLP_FIELDS=['days','favs','intake','requests','travelers'];
function clPortalBase(view){ var c=view.client, b={fields:{},cases:{}}; CLP_FIELDS.forEach(function(k){ b.fields[k]=Cloud.canon(c[k]===undefined?null:c[k]); }); (view.cases||[]).forEach(function(k){ b.cases[k.id]=Cloud.canon(k); }); CL.pbase=b; }
function clPortalApply(view){
  S=clPortalShell(view); repo.set(S); clPortalBase(view); UI.role='cliente'; UI.cid=view.client.id; UI.unlocked[view.client.id]=true; CL.gate=null; CL.portalReady=true;
}
function clPortalOpen(pin,silent){
  CL.pin=String(pin||'').trim(); if(!CL.token){ clPortalGate('El link no es válido.'); return; }
  if(!silent) clGateLoading('Entrando…');
  clPortalCall('open').then(function(j){ try{ sessionStorage.setItem('portal_pin_'+CL.token,CL.pin); }catch(e){} clPortalApply(j.view); render(); clPortalLoop(); },function(e){
    try{ sessionStorage.removeItem('portal_pin_'+CL.token); }catch(x){}
    clPortalGate(e.status===403?'Este viaje ya no está disponible. Consultá con la agencia.':e.status===401?'Código incorrecto. Revisalo o pedíselo a la agencia.':e.status===429?'Demasiados intentos. Esperá 15 minutos o pedile ayuda a la agencia.':'No se pudo conectar. Revisá tu internet y probá de nuevo.'); });
}
function clPortalBoot(){
  CL.token=clPortalToken(); UI.role='cliente'; var pin=null; try{ pin=sessionStorage.getItem('portal_pin_'+CL.token); }catch(e){}
  if(pin) clPortalOpen(pin,false); else clPortalGate('');
}
/* guardar: solo se manda lo que cambió y que el cliente puede tocar; el servidor revalida todo */
var _cpT=null;
CL.portalDirty=function(){ if(!CL.portalReady) return; CL.prev=(CL.prev||0)+1; clearTimeout(_cpT); _cpT=setTimeout(clPortalSave,800); };
function clPortalPatch(){
  var c=S.clients[0]; if(!c||!CL.pbase) return null; var fields={}, any=false;
  CLP_FIELDS.forEach(function(k){ var v=c[k]===undefined?null:c[k]; if(Cloud.canon(v)!==CL.pbase.fields[k]){ fields[k]=v; any=true; } });
  var cases=(S.cases||[]).filter(function(k){ return CL.pbase.cases[k.id]!==Cloud.canon(k); }).slice(0,30);
  var log=(c.log||[]).slice(0,20).map(function(e){ return {t:e.t}; });
  if(!any&&!cases.length&&!log.length) return null;
  return {fields:fields,cases:cases,logAppend:log};
}
function clPortalSave(){
  var patch=clPortalPatch(); if(!patch||CL.psaving) return; CL.psaving=true; var mark=CL.prev;
  clPortalCall('save',{patch:patch}).then(function(j){ CL.psaving=false; CL.pfail=0;
    if(CL.prev===mark){ var c=S.clients[0]; if(c) c.log=[]; clPortalApply(j.view); clSoftRender(); }
    else { clPortalBaseKeep(patch,j.view); CL.portalDirty(); }
  },function(e){ CL.psaving=false; CL.pfail=(CL.pfail||0)+1; if(e.status===403){ CL.portalReady=false; clPortalGate('Este viaje ya no está disponible. Consultá con la agencia.'); return; }
    if(e.status===401||e.status===429){ CL.portalReady=false; clPortalGate('Tu sesión se cerró. Ingresá de nuevo tu código.'); return; }
    if(CL.pfail===1) toast('No se pudo guardar, reintentando…'); _cpT=setTimeout(clPortalSave,Math.min(30000,4000*CL.pfail)); });
}
function clPortalBaseKeep(patch,view){ /* hubo cambios nuevos mientras se guardaba: se conserva lo enviado como base */ var b=CL.pbase; Object.keys(patch.fields||{}).forEach(function(k){ b.fields[k]=Cloud.canon(patch.fields[k]); }); (patch.cases||[]).forEach(function(k){ b.cases[k.id]=Cloud.canon(k); }); }
function clPortalLoop(){
  if(CL._pl) return; CL._pl=true;
  var tick=function(){ if(document.hidden||!CL.portalReady||CL.psaving||_cpT||clPortalPatch()) return;
    clPortalCall('open').then(function(j){ if(clPortalPatch()) return; var c=S.clients[0]; if(Cloud.canon(j.view.client)!==Cloud.canon(Object.assign({},c,{log:undefined}))||Cloud.canon(j.view.cases)!==Cloud.canon(S.cases)){ var ch=false; try{ ch=Cloud.canon(clPortalShell(j.view).clients[0])!==Cloud.canon(c)||Cloud.canon(clPortalShell(j.view).cases)!==Cloud.canon(S.cases); }catch(e){ ch=true; } if(ch){ clPortalApply(j.view); clSoftRender(); } } },function(){}); };
  setInterval(tick,45000); document.addEventListener('visibilitychange',function(){ if(!document.hidden) tick(); });
}
/* comprobantes del portal: link temporal firmado por el servidor */
var _openFileLocal=openFile;
openFile=function(id,name){
  if(CL.mode!=='portal') return _openFileLocal(id,name);
  var w=null; try{ w=window.open('','_blank'); }catch(e){}
  clPortalCall('file',{fileId:id}).then(function(j){ if(w&&!w.closed) w.location.href=j.url; else location.href=j.url; },function(e){ try{ if(w) w.close(); }catch(x){} toast(e.status===404?(e.message||'Este archivo no está disponible. Pedíselo a la agencia.'):'No se pudo abrir el archivo. Probá de nuevo.'); });
};

/* ---------- clics y teclado ---------- */
CLICK.push(
 {a:'data-cl-login', f:function(v,t,at,e){ clLogin(($('#cl-email')||{}).value,($('#cl-pass')||{}).value,v==='keep'); }},
 {a:'data-cl-setpw', f:function(){ clSetPw(); }},
 {a:'data-cl-home', f:function(){ CL.gate=null; clStartAgency(); }},
 {a:'data-cl-empty', f:function(){ clChoose(false); }},
 {a:'data-cl-import', f:function(){ clChoose(true); }},
 {a:'data-cl-retry', f:function(){ clStartAgency(); }},
 {a:'data-cloudmenu', f:function(){ clMenu(); }},
 {a:'data-cl-sync', f:function(){ closeModal(); CL.syncNow().then(function(r){ if(r&&r.ok) toast('Sincronizado'); else toast('No se pudo sincronizar: '+((r&&r.error)||'sin conexión')); }); }},
 {a:'data-cl-relogin', f:function(){ closeModal(); clGateLogin('',true); }},
 {a:'data-cl-logout', f:function(){ clLogout(false); }},
 {a:'data-cl-logout2', f:function(){ clLogout(true); }},
 {a:'data-cl-unlock', f:function(){ var v=($('#pin')||{}).value||''; if(!/^\d{6}$/.test(v.trim())){ var er=$('#pinerr'); if(er) er.textContent='Son 6 números.'; return; } clPortalOpen(v,false); }}
);
document.addEventListener('keydown',function(e){
  if(e.key!=='Enter'||!CL.gate) return;
  if(e.target.id==='cl-pass'||e.target.id==='cl-email'){ var b=$('[data-cl-login]'); if(b) b.click(); }
  if(e.target.id==='cl-pw1'||e.target.id==='cl-pw2'){ var sp=$('[data-cl-setpw]'); if(sp) sp.click(); }
  if(e.target.id==='pin'){ var u=$('[data-cl-unlock]'); if(u) u.click(); }
});
