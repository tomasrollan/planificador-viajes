/* ======================= herramientas de la agencia: sesión de reservas, buscador, historial, alta rápida, duplicar, datos viejos ======================= */
var AT=AgencyTools;
function logAct(cid,text,kind,by){ var c=client(cid); if(!c) return; AT.logAdd(c,{t:text,kind:kind||'evento',by:by||(UI.role==='agus'?'agus':'cliente')},NOW()); }
function mealLabel(m){ return (MEALS.filter(function(x){return x[0]===m})[0]||[])[1]||m; }

/* ---------- respuestas rápidas (Casos) ---------- */
function macroVars(k){
  var c=client(k.cid), v={nombre:c?c.name:''};
  if(k.ref&&c&&k.ref.date){ var d=c.days.filter(function(x){return x.date===k.ref.date})[0], s=d&&d.slots[k.ref.slot], r=s&&RID[s.rid]; v.fecha=dayLong(k.ref.date); if(r) v.restaurante=r.name; if(s){ v.hora=s.time||''; v.conf=s.conf||''; } }
  else if(k.ref&&k.ref.rid&&RID[k.ref.rid]) v.restaurante=RID[k.ref.rid].name;
  return v;
}
function macroPills(k){ return AT.macros().map(function(m){ return '<button class="pill" data-qr="'+m.id+'|'+k.id+'" title="'+esc(AT.fill(m.text,macroVars(k)))+'">'+esc(m.label)+'</button>'; }).join(''); }

/* ---------- buscador global (Ctrl/Cmd + K) ---------- */
var CP={sel:0,res:[]};
function isMac(){ try{ return /Mac|iPhone|iPad/.test(navigator.platform||''); }catch(e){ return false; } }
function paletteItems(){
  var it=[];
  [['go|panel','Ir al panel','inicio clientes hoy','grid'],['go|reservas','Ir a Reservas (cola)','reservas cola pendientes','list'],['go|sesion','Iniciar sesión de reservas','reservar sesion modo foco confirmar','check'],['go|casos','Ir a Casos','mesa de ayuda pedidos tickets','chat'],['go|catalogo','Ir a Restaurantes','catalogo restaurantes','utensils'],['go|nuevo','Nuevo cliente','alta crear cliente viaje','plus'],['go|ajustes','Ajustes de la agencia','configuracion nombre zona horaria','key']].forEach(function(a){ it.push({type:'act',id:a[0].slice(3),label:a[1],sub:'Acción',text:a[1]+' '+a[2],ic:a[3]}); });
  S.clients.forEach(function(c){ it.push({type:'cli',id:c.id,label:c.name,sub:destsLabel(c)+' · '+fmtShort(c.start)+' → '+fmtShort(c.end)+(hotelLine(c)?' · '+hotelLine(c):''),text:c.name+' '+destsLabel(c)+' '+hotelLine(c)+' '+(c.phone||'')+' '+c.travelers.map(function(t){return t.name}).join(' '),ic:'users',boost:6}); });
  S.cases.forEach(function(k){ var c=client(k.cid); it.push({type:'case',id:k.id,label:'#'+k.num+' · '+k.title,sub:(c?c.name+' · ':'')+k.type+' · '+CST[k.status][0],text:'caso '+k.num+' '+k.title+' '+(c?c.name:'')+' '+k.type,ic:'chat',boost:isOpen(k)?3:0}); });
  Object.keys(RID).forEach(function(id){ var r=RID[id]; it.push({type:'rest',id:id,label:r.name,sub:(r.dest==='uor'?'Universal':'Disney')+' · '+(r.area||'')+' · '+(r.cuisine||''),text:r.name+' '+(r.area||'')+' '+(r.cuisine||'')+' '+(r.zone||''),ic:'utensils'}); });
  return it;
}
function openPalette(){
  if(UI.role!=='agus') return; CP.all=paletteItems(); CP.sel=0; CP.res=AT.rank(CP.all,'',9);
  showModal('<div class="mask cpmask" data-close="1"><div class="modal cp" role="dialog" aria-label="Buscar"><div class="cpin">'+I('search')+'<input type="text" id="cp-q" placeholder="Buscar cliente, caso, restaurante o acción…" autocomplete="off"><span class="tiny muted cpesc">Esc</span></div><div id="cp-list" class="cplist"></div><div class="cpft tiny muted">↑ ↓ para moverte · Enter para abrir</div></div></div>');
  drawPalette(); var q=$('#cp-q'); if(q) q.focus();
}
function drawPalette(){
  var el=$('#cp-list'); if(!el) return; var T={act:'Acción',cli:'Cliente',case:'Caso',rest:'Restaurante'};
  el.innerHTML=CP.res.length?CP.res.map(function(x,i){ return '<button class="cprow'+(i===CP.sel?' on':'')+'" data-cp="'+i+'"><span class="cpi">'+I(x.ic)+'</span><span class="cpt"><b>'+esc(x.label)+'</b><span class="tiny muted">'+esc(x.sub)+'</span></span><span class="chip gray">'+T[x.type]+'</span></button>'; }).join(''):'<div class="empty" style="margin:12px">No encontré nada. Probá con otra palabra.</div>';
  var on=el.querySelector('.cprow.on'); if(on&&on.scrollIntoView) on.scrollIntoView({block:'nearest'});
}
function runPalette(i){
  var x=CP.res[i]; if(!x) return; closeModal();
  if(x.type==='cli'){ UI.tab='agenda'; location.hash='cliente-'+x.id; }
  else if(x.type==='case'){ openCase(x.id); }
  else if(x.type==='rest'){ modalRest(x.id,{c:null}); }
  else if(x.id==='nuevo'){ newTripModal(); } else if(x.id==='ajustes'){ openSettings(); }
  else if(x.id==='panel'){ location.hash=''; UI.route='panel'; render(); }
  else { location.hash=x.id; }
}
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&String(e.key).toLowerCase()==='k'){ if(UI.role==='agus'){ e.preventDefault(); if($('#cp-q')) closeModal(); else openPalette(); } return; }
  if(!$('#cp-q')) return;
  if(e.key==='ArrowDown'){ e.preventDefault(); CP.sel=Math.min(CP.res.length-1,CP.sel+1); drawPalette(); }
  else if(e.key==='ArrowUp'){ e.preventDefault(); CP.sel=Math.max(0,CP.sel-1); drawPalette(); }
  else if(e.key==='Enter'){ e.preventDefault(); runPalette(CP.sel); }
});

/* ---------- sesión de reservas (modo foco) ---------- */
UI.ses={mode:'now',done:0,skip:{},started:false};
function sesKey(x){ return x.c.id+'|'+x.d.date+'|'+x.m[0]; }
function sesReady(x){ return x.r.dest==='uor'?uorFrom(x)<=todayISO():resWindow(x.c).passed; }
function sesItems(){
  var q=getQueue(), all=UI.ses.mode==='now'?q.filter(sesReady):q;
  return all.sort(function(a,b){ return (b.r.diff-a.r.diff)||queueKey(a).localeCompare(queueKey(b))||a.d.date.localeCompare(b.d.date)||a.c.name.localeCompare(b.c.name); });
}
function sesNext(list){ for(var i=0;i<list.length;i++){ if(!UI.ses.skip[sesKey(list[i])]) return list[i]; } return null; }
function vSesion(){
  var ses=UI.ses, q=getQueue(), nowN=q.filter(sesReady).length, list=sesItems(), cur=sesNext(list);
  var left=list.filter(function(x){return !ses.skip[sesKey(x)]}), total=ses.done+left.length;
  var h='<main class="wrap"><section class="sec ses"><div class="sec-h"><div><span class="eyebrow">Modo foco</span><h3>'+I('check')+' Sesión de reservas</h3><p>Una reserva por vez: abrís el sitio oficial, reservás y anotás hora y confirmación. Primero las mesas más difíciles.</p></div><a class="btn line sm" href="#reservas">Salir</a></div>'+
   '<div class="row" style="gap:8px;flex-wrap:wrap"><div class="pills"><button class="pill'+(ses.mode==='now'?' on':'')+'" data-sesmode="now">Se pueden reservar ya ('+nowN+')</button><button class="pill'+(ses.mode==='all'?' on':'')+'" data-sesmode="all">Todas las pendientes ('+q.length+')</button></div>'+(Object.keys(ses.skip).length?'<button class="btn line sm" data-sesreset="1">Volver a mostrar las salteadas ('+Object.keys(ses.skip).length+')</button>':'')+'</div>';
  if(!cur){
    var nxt=q.filter(function(x){return !sesReady(x)}).sort(function(a,b){return queueKey(a).localeCompare(queueKey(b))})[0];
    h+='<div class="empty" style="margin-top:16px"><b>'+(ses.done?'¡Listo! Terminaste la sesión.':'No hay reservas para hacer ahora.')+'</b>'+(ses.done?'<br>Reservaste '+ses.done+(ses.done===1?' comida.':' comidas.'):'')+(nxt&&ses.mode==='now'?'<br><span class="small">La próxima abre el '+esc(fmtDate(queueKey(nxt),true))+' ('+esc(nxt.c.name)+').</span>':'')+'<div class="row" style="justify-content:center;margin-top:12px"><a class="btn" href="#panel">Volver al panel</a></div></div></section></main>';
    return h;
  }
  var c=cur.c, r=cur.r, s=cur.s, nAd=c.travelers.filter(function(t){return t.type!=='niño'}).length, nCh=c.travelers.length-nAd, al=algText(c), n=ses.done+1;
  var url=r.dest==='uor'?(r.rurl||UOR_URL):'https://disneyworld.disney.go.com/dining/'+r.path+'/';
  h+='<div class="sesbar"><b>Reserva '+Math.min(total,n)+' de '+total+'</b><div class="meter"><i style="width:'+Math.round(ses.done/Math.max(1,total)*100)+'%"></i></div></div>'+
   '<div class="card sescard"><div class="row between" style="align-items:flex-start;gap:12px"><div style="min-width:0"><h2 class="sesname">'+esc(r.name)+'</h2><div class="small muted">'+esc((r.dest==='uor'?'Universal Orlando':'Walt Disney World')+(r.area?' · '+r.area:''))+'</div></div><div class="row" style="gap:6px"><span class="chip '+(r.diff===3?'bad':'gray')+'">Mesa: '+DIFFL[r.diff]+'</span>'+tsChip(r,cur.m[0])+'</div></div>'+
   '<div class="sesfacts"><div><label class="f">Cliente</label><a href="#cliente-'+c.id+'"><b>'+esc(c.name)+'</b></a></div><div><label class="f">Día y comida</label><b>'+esc(fmtDate(cur.d.date,true))+'</b><div class="small">'+esc(mealLabel(cur.m[0]))+(cur.d.park?' · '+esc(cur.d.park):'')+'</div></div><div><label class="f">Personas</label><b>'+c.travelers.length+'</b><div class="small">'+nAd+(nAd===1?' adulto':' adultos')+(nCh?' · '+nCh+(nCh===1?' niño':' niños'):'')+'</div></div><div><label class="f">Hora que pidió</label><b>'+(s.time?esc(s.time):'A elección')+'</b></div></div>'+
   (al?'<div class="notice warn" style="margin-top:12px">'+I('shield')+'<div><b>Alergias del grupo:</b> '+esc(al)+'<br><span class="small">Cargalas en la reserva (nota o campo de alergias) y confirmá que quedaron registradas.</span></div></div>':'')+
   mealLine(r,cur.m[0])+
   '<div class="row" style="margin-top:14px"><a class="btn" target="_blank" rel="noopener" href="'+esc(url)+'">Abrir reserva oficial '+I('ext')+'</a>'+(r.dest==='uor'&&r.murl?'<a class="btn line" target="_blank" rel="noopener" href="'+esc(r.murl)+'">Menú oficial '+I('ext')+'</a>':'')+'</div>'+
   '<div class="sesform"><div class="grid g2" style="gap:12px"><div><label class="f">Hora reservada (la que te confirmaron)</label><input type="time" id="ses-time" value=""><div id="ses-warn" class="tiny" style="margin-top:4px">'+timeWarnHtml(r,cur.d.date,s.time)+'</div></div><div><label class="f">N.º de confirmación</label><input type="text" id="ses-conf" value="'+esc(s.conf||'')+'" placeholder="Ej: 123456789"></div></div>'+
   '<label class="small" style="display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:600"><input type="checkbox" id="ses-lock"'+(c.mode!=='auto'?' checked':'')+'> Bloquear para que el cliente solo pueda pedir cambios</label>'+sesCostHtml(c,r,cur.m[0])+
   '<div class="row" style="margin-top:14px"><button class="btn" data-sessave="'+sesKey(cur)+'">'+I('check')+' Guardar y siguiente</button><button class="btn line" data-sesskip="'+sesKey(cur)+'">Saltear por ahora</button><button class="btn line" data-sesno="'+sesKey(cur)+'">No había lugar</button></div></div></div>';
  var up=left.filter(function(x){return sesKey(x)!==sesKey(cur)}).slice(0,3);
  if(up.length) h+='<div class="small muted" style="margin-top:14px"><b>Siguen:</b> '+up.map(function(x){ return esc(x.r.name)+' ('+esc(x.c.name)+')'; }).join(' · ')+'</div>';
  return h+'</section></main>';
}
function sesFind(key){ var p=key.split('|'), c=client(p[0]); if(!c) return null; var d=c.days.filter(function(x){return x.date===p[1]})[0], s=d&&d.slots[p[2]]; return s?{c:c,d:d,m:p[2],s:s,r:RID[s.rid]}:null; }
function sesCostHtml(c,r,mk){
  var plan=budHasPlan(c)&&r.dest!=='uor', cr=plan?Rules.creditsOf(r,mk):0;
  return '<details class="sesopt"'+(plan?' open':'')+'><summary>'+I('bag')+' Sumar al presupuesto <span class="muted">(opcional)</span></summary><div class="grid g2" style="gap:12px;margin-top:10px"><div><label class="f" for="ses-cost">Costo de esta reserva (US$)</label><input type="text" inputmode="decimal" id="ses-cost" placeholder="Ej: 120 (si hay depósito o paquete)"></div>'+
   (plan?'<div><label class="f" for="ses-cred">Créditos del plan que usa (por persona)</label><input type="number" id="ses-cred" min="0" max="99" value="'+cr+'"></div>':'')+'</div></details>';
}
function sesSave(key){
  var x=sesFind(key); if(!x) return; var time=$('#ses-time').value, conf=($('#ses-conf').value||'').trim(); if(!time){ toast('Poné la hora que te dieron'); var ti=$('#ses-time'); if(ti) ti.focus(); return; }
  x.s.state='reservada'; x.s.time=time; x.s.conf=conf; x.s.locked=!!$('#ses-lock').checked; x.s.by='agus';
  var cost=BC.parseAmount(($('#ses-cost')||{}).value)||0, cred=Math.max(0,Math.floor(+(($('#ses-cred')||{}).value)||0)); budFromSlot(x.c,x.d,x.m,x.r,conf,cost,cred); save();
  logAct(x.c.id,'Reservó '+x.r.name+' · '+fmtShort(x.d.date)+' '+mealLabel(x.m)+(time?' a las '+time:'')+(conf?' (conf. '+conf+')':''),'reserva'); UI.ses.done++; toast('Reserva guardada'); render(); window.scrollTo(0,0);
}
function sesNoSpot(key){
  var x=sesFind(key); if(!x) return; var stamp='Sin lugar el '+fmtShort(todayISO())+'.'; x.s.note=(x.s.note?x.s.note+' ':'')+stamp; save(); UI.ses.skip[key]=1;
  logAct(x.c.id,'Intentó reservar '+x.r.name+' · '+fmtShort(x.d.date)+' '+mealLabel(x.m)+': no había lugar','reserva'); toast('Anotado: no había lugar'); render();
}

/* ---------- historial y notas por cliente ---------- */
function historyPanel(c){
  var log=c.log||[], h='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Solo para la agencia</span><h3>'+I('clock')+' Historial y notas</h3><p>Qué pasó con este viaje y quién lo hizo. Las notas no las ve el cliente.</p></div></div>';
  if(c.notes) h+='<div class="notice">'+I('pin')+'<div><b>Nota fija:</b> '+esc(c.notes)+' <a href="#cliente-'+c.id+'" data-opendatos="'+c.id+'">Editar</a></div></div>';
  h+='<div class="row" style="gap:8px;align-items:flex-start;margin-top:12px"><textarea id="hist-note" rows="2" placeholder="Agregar una nota interna (ej: llamó para pedir mesa cerca del show)…" style="flex:1 1 260px"></textarea><button class="btn" data-addnote="'+c.id+'">'+I('plus')+' Agregar nota</button></div>';
  h+=log.length?'<div class="hist">'+log.map(function(e,i){ var who=e.by==='cliente'?'Cliente':e.by==='sis'?'Sistema':'Agus'; return '<div class="hrow k-'+esc(e.kind)+'"><span class="hdot">'+I(e.kind==='nota'?'chat':e.kind==='reserva'?'check':'clock')+'</span><div class="hb"><div>'+esc(e.t)+'</div><div class="tiny muted">'+who+' · '+ago(e.at)+' · '+esc(new Date(e.at).toLocaleString('es-AR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))+(e.kind==='nota'?' · <a href="#" data-delnote="'+c.id+'|'+i+'">Borrar</a>':'')+'</div></div></div>'; }).join('')+'</div>':'<div class="empty" style="margin-top:12px">Todavía no hay actividad registrada. Desde ahora queda anotado cada cambio de reservas, casos y datos.</div>';
  return h+'</section>';
}

/* ---------- duplicar cliente ---------- */
function dupClient(id){
  var c=client(id); if(!c) return; var n=JSON.parse(JSON.stringify(c));
  n.id=uid(); n.token=genToken('cliente'); n.pin=genPin(); n.name=c.name+' (copia)'; n.phone=''; n.notes=''; n.intake=null; n.requests=[]; n.favs={}; n.log=[]; n.budget=null; n.items=[]; n.pay=null; n.travelers=[{id:'t1',name:'Viajero 1',type:'adulto',allergies:''}];
  n.days.forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots[m[0]]; if(s) d.slots[m[0]]={rid:s.rid,state:'idea',time:'',conf:'',by:'agus',locked:false,note:'',sug:s.sug}; }); });
  repo.addClient(n); logAct(n.id,'Creado como copia de '+c.name,'evento'); save(); UI.tab='datos'; location.hash='cliente-'+n.id;
  toast('Copia creada: cargá los viajeros (con sus alergias) y las fechas');
}

/* ---------- alta rápida desde un mensaje de WhatsApp ---------- */
function intakeHotels(){ return HOTELS.map(function(h){ return {n:h.n,k:h.k,dest:'wdw'}; }).concat(UOR_HOTELS.map(function(h){ return {n:h.n,k:h.k,dest:'uor'}; })); }
function quickParse(){ var t=($('#qa-text')||{}).value||''; return AT.parseIntake(t,{today:todayISO(),hotels:intakeHotels()}); }
function quickPreview(){
  var el=$('#qa-prev'), btn=$('#qa-go'); if(!el) return; var r=quickParse(), t=($('#qa-text')||{}).value||'';
  if(!t.trim()){ el.innerHTML='<div class="tiny muted">Pegá el mensaje y te muestro qué entendí antes de crear nada.</div>'; if(btn) btn.disabled=true; return; }
  function row(l,v){ return '<div class="qrow"><span class="tiny muted">'+l+'</span><b>'+(v?esc(v):'<span class="muted" style="font-weight:600">no encontré</span>')+'</b></div>'; }
  var tv=(r.adults||r.kids)?(r.adults+(r.adults===1?' adulto':' adultos')+(r.kids?' · '+r.kids+(r.kids===1?' niño':' niños'):'')):'';
  el.innerHTML=row('Nombre',r.name)+row('Destino',r.dests.map(function(d){return DESTS[d].s}).join(' + '))+row('Fechas',r.start&&r.end?fmtShort(r.start)+' → '+fmtShort(r.end):'')+row('Viajeros',tv)+row('Teléfono',r.phone)+(r.hotel?row('Hotel',r.hotel.name):'')+(r.plan?row('Plan de comidas',PLANS[r.plan].n):'')+(r.budget?row('Presupuesto','US$ '+r.budget.toLocaleString('es-AR')):'')+
   (r.allergyLines.length?'<div class="notice warn" style="margin-top:8px">'+I('shield')+'<div><b>Menciona alergias o dietas.</b> Van a la nota del cliente; después cargalas en cada viajero.</div></div>':'');
  if(btn) btn.disabled=!r.hasAny;
}
function quickCreate(){
  var r=quickParse(); if(!r.hasAny){ toast('No encontré datos en el mensaje'); return; }
  var kind=r.dests.length===2?'both':(r.dests[0]||'wdw'); var tv=[]; for(var i=0;i<r.adults;i++) tv.push({id:'t'+(tv.length+1),name:'Viajero '+(tv.length+1),type:'adulto',allergies:''}); for(var j=0;j<r.kids;j++) tv.push({id:'t'+(tv.length+1),name:'Viajero '+(tv.length+1),type:'niño',allergies:''});
  var note=(r.allergyLines.length?'Del mensaje original (asignar a cada viajero): '+r.allergyLines.join(' '):'');
  var nc=createTrip(kind,{name:r.name,start:r.start,end:r.end,phone:r.phone,travelers:tv.length?tv:null,hotel:r.hotel,plan:r.plan,notes:note,quick:true});
  if(r.budget>0) budInit(nc,r.budget);
  logAct(nc.id,'Alta rápida desde un mensaje pegado','evento'); save();
  toast('Cliente creado. Revisá y completá lo que falta'+(r.missing.length?' ('+r.missing.join(', ')+')':''));
}

/* ---------- estado de los datos del catálogo ---------- */
var _menusAt=null;
function menusAt(){ if(_menusAt!==null) return _menusAt; var min=''; try{ document.querySelectorAll('script[data-mf]').forEach(function(e){ var m=/"at":"(\d{4}-\d{2}-\d{2})"/.exec(e.textContent.slice(0,200)); if(m&&(!min||m[1]<min)) min=m[1]; }); }catch(e){} return (_menusAt=min); }
function freshItems(){
  var u=(window.CATALOG_UOR_META||{});
  return AT.freshness([{k:'menus',label:'Menús de Disney',at:menusAt()},{k:'hor',label:'Horarios de Disney',at:window.HORARIOS_AT||''},{k:'tr',label:'Transporte',at:TRANSP_AT},{k:'uor',label:'Enlaces de Universal',at:u.linksCaptured||''}],todayISO());
}
function staleCount(){ return freshItems().filter(function(x){return x.level==='warn'||x.level==='bad'}).length; }
function freshSection(){
  var L=freshItems(), bad=L.filter(function(x){return x.level==='bad'}).length, warn=L.filter(function(x){return x.level==='warn'}).length;
  var txt=bad?bad+(bad===1?' dato desactualizado':' datos desactualizados'):warn?warn+(warn===1?' dato para refrescar pronto':' datos para refrescar pronto'):'Todo el catálogo está al día';
  return '<details class="sec bkp" id="fresh"'+((bad||warn)?' open':'')+'><summary>'+(bad||warn?'Atención: ':'')+txt+'</summary><div class="fresh">'+L.map(function(x){ return '<div class="frow"><span class="chip '+(x.level==='ok'?'ok':x.level==='warn'?'warn':x.level==='bad'?'bad':'gray')+'">'+(x.level==='ok'?'Al día':x.level==='warn'?'Refrescar pronto':x.level==='bad'?'Desactualizado':'Sin fecha')+'</span><b>'+esc(x.label)+'</b><span class="small muted">'+(x.at?'tomado el '+esc(fmtShort(x.at))+' · hace '+x.days+(x.days===1?' día':' días'):'sin fecha')+'</span></div>'; }).join('')+'</div><div class="tiny muted" style="margin-top:10px">Menús y precios cambian por temporada. Se consideran viejos a partir de 30 días (aviso) y 60 días (desactualizado). Para refrescarlos hay que volver a leer las páginas oficiales desde Chrome.</div></details>';
}

/* ---------- eventos ---------- */
CLICK.push(
 {a:'data-cp-open',present:1, f:function(){ openPalette(); }},
 {a:'data-cp', f:function(v){ runPalette(+v); }},
 {a:'data-sesmode', f:function(v){ UI.ses.mode=v; render(); }},
 {a:'data-sessave', f:function(v){ sesSave(v); }},
 {a:'data-sesskip', f:function(v){ UI.ses.skip[v]=1; render(); window.scrollTo(0,0); }},
 {a:'data-sesno', f:function(v){ sesNoSpot(v); }},
 {a:'data-sesreset',present:1, f:function(){ UI.ses.skip={}; render(); }},
 {a:'data-addnote', f:function(v){ var t=(($('#hist-note')||{}).value||'').trim(); if(!t){ toast('Escribí la nota'); return; } logAct(v,t,'nota'); save(); render(); }},
 {a:'data-delnote', f:function(v,t,at,e){ e.preventDefault(); var p=v.split('|'), c=client(p[0]); if(c&&c.log&&c.log[+p[1]]&&c.log[+p[1]].kind==='nota'){ c.log.splice(+p[1],1); save(); render(); } }},
 {a:'data-dupclient', f:function(v){ dupClient(v); }},
 {a:'data-qagen',present:1, f:function(){ quickCreate(); }},
 {a:'data-qaopen',present:1, f:function(){ openQuickAdd(); }},
 {a:'data-gofresh',present:1, f:function(){ var el=$('#fresh'); if(el){ el.open=true; el.scrollIntoView({behavior:'smooth',block:'center'}); } }}
);
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.id==='cp-q'){ CP.res=AT.rank(CP.all,t.value,9); CP.sel=0; drawPalette(); }
  else if(t.id==='qa-text'){ quickPreview(); }
  else if(t.id==='ses-time'){ var x=UI.route==='sesion'?sesNext(sesItems()):null, w=$('#ses-warn'); if(x&&w) w.innerHTML=timeWarnHtml(x.r,x.d.date,t.value); }
});
document.addEventListener('keydown',function(e){ if(e.key==='Enter'&&e.target.id==='ses-conf'){ var b=document.querySelector('[data-sessave]'); if(b) b.click(); } });
