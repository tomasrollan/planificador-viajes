/* ======================= Panel de Agus ======================= */
function panelToday(){
  var it=[], q=getQueue(), by={}, by2={};
  S.cases.filter(isOpen).forEach(function(k){ var du=dueInfo(k), c=client(k.cid), hot=du.late||k.priority==='urgente';
    if(hot||k.status==='nuevo') it.push({p:du.late?0:hot?1:4,ic:'chat',cls:hot?'bad':'warn',t:'#'+k.num+' · '+k.title,s:(c?c.name+' · ':'')+(du.late?'vencido':k.status==='nuevo'?'sin atender':PRIO[k.priority][0]),b:'<button class="btn sm" data-opencase="'+k.id+'">Abrir</button>'}); });
  q.forEach(function(x){ var ready=x.r.dest==='uor'?['cerca','urgente','en_viaje'].indexOf(uorAdvice(x.c).state)>=0:resWindow(x.c).passed;
    if(ready){ var g=by[x.c.id]=by[x.c.id]||{c:x.c,n:0,names:[]}; g.n++; g.names.push(x.r.name); }
    if(x.r.dest!=='uor'){ var w=resWindow(x.c); if(!w.passed&&daysTo(w.open)<=21){ var g2=by2[x.c.id]=by2[x.c.id]||{c:x.c,w:w,n:0}; g2.n++; } } });
  Object.keys(by).forEach(function(k){ var g=by[k]; it.push({p:2,ic:'list',cls:'warn',t:'Reservar ya · '+g.c.name,s:g.n+(g.n===1?' comida lista para reservar: ':' comidas listas para reservar: ')+g.names.slice(0,2).join(', ')+(g.n>2?'…':''),b:'<a class="btn sm" href="#reservas">Modo reserva</a>'}); });
  S.clients.forEach(function(c){ if(c.intake&&c.intake.done&&!c.intake.reviewed) it.push({p:3,ic:'user',cls:'warn',t:'Revisar formulario · '+c.name,s:'El cliente completó el formulario de ingreso.',b:'<button class="btn sm" data-opendatos="'+c.id+'">Revisar</button>'}); });
  Object.keys(by2).forEach(function(k){ var g=by2[k]; it.push({p:5,ic:'bell',cls:'',t:'Abren las reservas · '+g.c.name,s:fmtShort(g.w.open)+' · en '+daysTo(g.w.open)+' días · '+g.n+' por reservar',b:'<a class="btn ice sm" href="#cliente-'+g.c.id+'">Abrir agenda</a>'}); });
  payAlerts().forEach(function(x){ it.push(x); });
  var sc=staleCount(); if(sc) it.push({p:6,ic:'refresh',cls:'warn',t:'Datos del catálogo para refrescar',s:sc+(sc===1?' dato tiene':' datos tienen')+' más de 30 días (menús, horarios, transporte o enlaces).',b:'<button class="btn ice sm" data-gofresh="1">Ver cuáles</button>'});
  it.sort(function(a,b){return a.p-b.p});
  return it;
}
function clientNext(c){
  if(c.intake&&c.intake.done&&!c.intake.reviewed) return ['Formulario recibido: revisalo','warn'];
  var pg=progress(c); if(pg.filled<pg.cap) return ['Faltan '+(pg.cap-pg.filled)+' comidas por elegir',''];
  if(pg.pend) return [pg.pend+(pg.pend===1?' comida por reservar':' comidas por reservar'),'warn'];
  return ['Todo reservado','ok'];
}
function tripWhen(c){ var t=todayISO(); if(c.end<t) return 'Viaje terminado'; if(c.start<=t) return 'En viaje'; var n=daysTo(c.start); return 'Viaja en '+n+(n===1?' día':' días'); }
function clientCard(c){
  var pg=progress(c), nc=casesOf(c.id).filter(isOpen).length, form=c.intake&&c.intake.done&&!c.intake.reviewed;
  return '<div class="card ccard"><div class="row between" style="align-items:flex-start"><div style="min-width:0"><h4 style="font-size:17px;font-weight:800">'+esc(c.name)+'</h4><div class="muted small" style="margin-top:4px">'+I('calendar')+' '+fmtShort(c.start)+' → '+fmtShort(c.end)+' · <b>'+tripWhen(c)+'</b></div></div><span class="row" style="gap:6px;justify-content:flex-end">'+destChips(c)+'</span></div>'+
   '<div class="muted small" style="margin:6px 0 10px">'+I('hotel')+' '+esc(hotelLine(c)||'sin hotel')+' · '+c.travelers.length+' viajeros · '+esc(MODES[c.mode])+(hasDest(c,'wdw')?' · '+esc(PLANS[c.plan].n):'')+'</div>'+
   '<div class="row" style="gap:6px">'+resChip(c)+'<span class="chip ok">'+pg.res+(pg.res===1?' reservada':' reservadas')+'</span>'+(form?'<span class="chip warn">'+I('user')+' formulario recibido</span>':'')+(algList(c).length?'<span class="chip warn">'+I('shield')+' alergias</span>':'')+(nc?'<span class="chip warn">'+nc+(nc===1?' caso abierto':' casos abiertos')+'</span>':'')+'</div>'+
   budCard(c,pg)+payLine(c)+
   '<div class="row" style="margin-top:12px"><a class="btn" href="#cliente-'+c.id+'">'+I('calendar')+' Abrir agenda</a><button class="btn ice" data-viewas="'+c.id+'">Ver como cliente</button></div></div>';
}
function clientsGrid(){
  var f=UI.pf, q=(f.q||'').toLowerCase().trim(), today=Dates.todayIn(S.agency.tz,NOW());
  var L=S.clients.filter(function(c){
    if(q&&(c.name+' '+hotelLine(c)+' '+destsLabel(c)).toLowerCase().indexOf(q)<0) return false;
    if(f.f==='wdw'||f.f==='uor') return hasDest(c,f.f);
    if(f.f==='pend'){ var pg=progress(c); return pg.pend>0||casesOf(c.id).some(isOpen)||!!(c.intake&&c.intake.done&&!c.intake.reviewed); }
    return true; });
  L.sort(function(a,b){ var pa=a.end<today, pb=b.end<today; if(pa!==pb) return pa?1:-1; return pa?b.start.localeCompare(a.start):a.start.localeCompare(b.start); });
  return L.length?L.map(clientCard).join(''):(S.clients.length?'<div class="empty" style="grid-column:1/-1">Ningún cliente coincide con la búsqueda.</div>':'<div class="empty" style="grid-column:1/-1"><b>Todavía no cargaste ningún cliente.</b><br>Tocá «Nuevo cliente» arriba. Podés pegar el mensaje de WhatsApp y la app completa destino, fechas y viajeros.</div>');
}
function refreshClients(){ var g=$('#cl-grid'); if(!g){ render(); return; } g.innerHTML=clientsGrid(); document.querySelectorAll('[data-pf]').forEach(function(p){ p.classList.toggle('on',p.getAttribute('data-pf')===UI.pf.f); }); }
function vPanel(){
  var queue=getQueue(), items=panelToday();
  var open=S.cases.filter(isOpen), late=open.filter(function(k){return dueInfo(k).late}).length, urg=open.filter(function(k){return k.priority==='urgente'}).length;
  var h='<main class="wrap"><section class="hero hero-s"><div class="in"><div class="row between" style="gap:12px;align-items:flex-start"><div><div class="hero-pill">'+I('users')+' Panel de la agencia</div><h2>Hola, Agus</h2><p>'+(items.length?'Hoy tenés <b>'+items.length+(items.length===1?' cosa':' cosas')+'</b> para atender.':'Está todo al día.')+'</p></div><button class="btn gold" data-newclient="1">'+I('plus')+' Nuevo cliente</button></div>'+
   '<div class="stats s4"><div class="stat" role="button" tabindex="0" data-statgo="clientes"><div>Clientes con viaje</div><div>'+S.clients.length+'</div></div><div class="stat" role="button" tabindex="0" data-statgo="reservas"><div>Reservas por hacer</div><div>'+queue.length+'</div></div><div class="stat" role="button" tabindex="0" data-statgo="casos"><div>Casos abiertos</div><div>'+open.length+'</div></div><div class="stat" role="button" tabindex="0" data-statgo="casos"><div>Vencidos / urgentes</div><div>'+late+' / '+urg+'</div></div></div></div></section>';
  var pills=[['all','Todos'],['pend','Con pendientes'],['wdw','Disney'],['uor','Universal']];
  h+='<section class="sec" id="clientes"><div class="sec-h"><div><span class="eyebrow">Agenda de la agencia</span><h3>'+I('users')+' Mis clientes</h3></div></div><div class="cltool"><input type="text" id="pc-q" placeholder="Buscar cliente u hotel…" value="'+esc(UI.pf.q)+'"><div class="pills">'+pills.map(function(p){ return '<button class="pill'+(UI.pf.f===p[0]?' on':'')+'" data-pf="'+p[0]+'">'+p[1]+'</button>'; }).join('')+'</div></div><div class="grid g2" id="cl-grid">'+clientsGrid()+'</div></section>';
  h+='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Prioridades</span><h3>'+I('bell')+' Para hacer hoy</h3></div></div>';
  if(!items.length) h+='<div class="empty">Todo al día: no hay casos urgentes ni reservas para hacer ahora.</div>';
  else h+='<div class="tlist">'+items.slice(0,6).map(function(x){ return '<div class="trow"><span class="ti '+x.cls+'">'+I(x.ic)+'</span><div class="tb"><b>'+esc(x.t)+'</b><div class="small muted">'+esc(x.s)+'</div></div>'+x.b+'</div>'; }).join('')+'</div>'+(items.length>6?'<div class="tiny muted" style="margin-top:10px">Y '+(items.length-6)+' más en Casos y Reservas.</div>':'');
  h+='</section>';
  h+='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Reservas</span><h3>'+I('list')+' Próximas reservas</h3><p>Lo marcado como «Para reservar», ordenado por la fecha en que abre cada reserva.</p></div><div class="row" style="gap:8px"><a class="btn sm" href="#sesion">'+I('check')+' Iniciar sesión de reservas</a><a class="btn ice sm" href="#reservas">Ver las '+queue.length+' en lista</a></div></div>';
  if(!queue.length) h+='<div class="empty">No hay reservas pendientes. Cuando marques una comida como «Para reservar», aparece acá.</div>';
  else { h+='<div class="qwrap"><table class="q"><tr><th>Cliente</th><th>Cuándo</th><th>Restaurante</th><th>Abre</th><th></th></tr>';
    queue.sort(function(a,b){return queueKey(a).localeCompare(queueKey(b))}).slice(0,5).forEach(function(x){
      h+='<tr><td><a href="#cliente-'+x.c.id+'"><b>'+esc(x.c.name)+'</b></a></td><td>'+fmtDate(x.d.date)+'<br><span class="muted small">'+x.m[1]+(x.s.time?' · '+esc(x.s.time):'')+'</span></td><td>'+esc(x.r.name)+'<br>'+tsChip(x.r,x.m[0])+'</td><td>'+openCell(x)+'</td><td><button class="btn sm" data-markres="'+x.c.id+'|'+x.d.date+'|'+x.m[0]+'">'+I('check')+' Marcar reservada</button></td></tr>'; });
    h+='</table></div>'; }
  h+='</section>';
  h+=freshSection();
  h+='<details class="sec bkp"><summary>Copia de seguridad y datos de la demo</summary><div class="row" style="margin-top:12px"><button class="btn line sm" data-export="1">Exportar copia (JSON)</button><label class="btn line sm" for="imp-file" style="cursor:pointer">Importar copia</label><input type="file" id="imp-file" accept=".json,application/json" style="position:absolute;width:1px;height:1px;opacity:0"><button class="btn line sm" data-resetdemo="1">Restablecer datos de la demo</button></div><div class="tiny muted" style="margin-top:8px">Los datos viven en este navegador: exportá una copia de vez en cuando. Importar reemplaza todo lo actual.</div></details></main>';
  return h;
}

/* ======================= Editor de cliente (Agus) ======================= */
function vClienteEdit(){
  var c=client(UI.cid); if(!c) return '<main class="wrap"><div class="empty">Cliente no encontrado. <a href="#panel">Volver</a></div></main>';
  var pend=casesOf(c.id).filter(isOpen).length;
  var tabs=[['agenda','calendar','Agenda'],['datos','user','Datos del viaje'],['link','link','Link y PIN'],['trans','bus','Transporte'],['pres','bag','Presupuesto'],['pagos','ticket','Pagos'],['pedidos','chat','Casos'+(pend?' ('+pend+')':'')],['hist','clock','Historial']];
  var h='<main class="wrap"><div style="display:flex;flex-direction:column;gap:14px"><div class="row between"><div><a href="#panel" class="small" style="font-weight:700;text-decoration:none">'+I('back')+' Panel</a><h2 style="font-size:26px;font-weight:900;margin-top:6px">'+esc(c.name)+'</h2><div class="muted small">'+fmtShort(c.start)+' → '+fmtShort(c.end)+' · '+nights(c)+' noches · '+esc(destsLabel(c))+(hotelLine(c)?' · '+esc(hotelLine(c)):'')+(hasDest(c,'wdw')?' · '+esc(PLANS[c.plan].n):'')+'</div></div><div class="row" style="gap:8px"><button class="btn line" data-dupclient="'+c.id+'" title="Crea otro viaje con el mismo destino, hotel, plan y agenda de ideas (sin viajeros ni alergias)">'+I('copy')+' Duplicar</button><button class="btn ice" data-viewas="'+c.id+'">Ver como cliente</button></div></div>'+
   '<div class="tabs">'+tabs.map(function(t){return '<button data-tab="'+t[0]+'" class="'+(UI.tab===t[0]?'on':'')+'">'+I(t[1])+' '+t[2]+'</button>'}).join('')+'</div></div>';
  if(UI.tab==='agenda') h+=agentSummary(c)+plannerSection(c);
  if(UI.tab==='datos') h+=intakeAgentCard(c)+datosForm(c);
  if(UI.tab==='link') h+=linkPanel(c);
  if(UI.tab==='trans') h+=transportSection(c,true);
  if(UI.tab==='pedidos') h+=pedidosPanel(c);
  if(UI.tab==='pres') h+=budgetPanel(c);
  if(UI.tab==='pagos') h+=payPanel(c);
  if(UI.tab==='hist') h+=historyPanel(c);
  return h+'</main>';
}
function datosForm(c){
  var trav=c.travelers.map(function(t,i){ return '<div class="card" style="box-shadow:none;padding:16px"><div class="grid g3" style="gap:12px"><div><label class="f">Nombre</label><input type="text" data-tv="'+i+'|name" value="'+esc(t.name)+'"></div><div><label class="f">Tipo</label><select data-tv="'+i+'|type"><option'+(t.type==='adulto'?' selected':'')+'>adulto</option><option'+(t.type==='niño'?' selected':'')+'>niño</option></select></div><div><label class="f">Alergias / dieta</label><input type="text" data-tv="'+i+'|allergies" value="'+esc(t.allergies)+'" placeholder="Ej: maní, gluten, vegetariano"></div></div><div style="margin-top:10px"><button class="btn danger sm" data-deltrav="'+i+'">'+I('trash')+' Quitar viajero</button></div></div>'; }).join('');
  return '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Viaje</span><h3>'+I('user')+' Datos del viaje</h3></div></div><div class="grid g2" style="gap:16px">'+destFields(c)+'<div><label class="f">Nombre del cliente / familia</label><input type="text" id="d-name" value="'+esc(c.name)+'"></div><div><label class="f">Destino (texto libre)</label><input type="text" id="d-dest" value="'+esc(c.destination||'')+'"></div><div><label class="f">WhatsApp / teléfono del cliente</label><input type="text" id="d-phone" inputmode="tel" value="'+esc(c.phone||'')+'" placeholder="Ej: +54 9 11 1234 5678"></div>'+hotelFields(c)+'<div><label class="f">Llegada</label><input type="date" id="d-start" value="'+esc(c.start)+'"></div><div><label class="f">Salida</label><input type="date" id="d-end" value="'+esc(c.end)+'"></div>'+planFields(c)+'<div><label class="f">Cómo participa el cliente</label><select id="d-mode">'+Object.keys(MODES).map(function(k){return '<option value="'+k+'"'+(c.mode===k?' selected':'')+'>'+MODES[k]+'</option>'}).join('')+'</select></div></div><div><label class="f">Notas internas (el cliente no las ve)</label><textarea id="d-notes">'+esc(c.notes||'')+'</textarea></div><div><button class="btn" data-savedatos="1">'+I('check')+' Guardar datos</button></div></section>'+
   '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Quiénes viajan</span><h3>'+I('users')+' Viajeros</h3><p>Las alergias se usan para armar la tarjeta en inglés que el cliente muestra en el restaurante.</p></div><button class="btn ice" data-addtrav="1">'+I('plus')+' Agregar viajero</button></div><div class="grid">'+trav+'</div></section>';
}
function accessMsg(c){ return 'Hola '+c.name+'! Armé tu planificador de viaje. Entrá con este link:\n'+linkFor(c)+'\nTu código de acceso: '+c.pin+'\n\nAhí vas a ver tu agenda, los restaurantes, la guía de alergias y podés mandarme pedidos.'; }
function linkPanel(c){
  return '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Acceso del cliente</span><h3>'+I('key')+' Link y código</h3><p>El cliente entra con su link y un código de 6 dígitos. Solo él (y vos) ven esta agenda.</p></div></div><div class="grid g2"><div><label class="f">Link único</label><div class="copybox">'+esc(linkFor(c))+'</div></div><div><label class="f">Código de acceso (PIN)</label><div class="pin">'+esc(c.pin)+'</div></div></div><div class="row"><button class="btn" data-copylink="'+c.id+'">'+I('link')+' Copiar link</button><button class="btn wa" data-copymsg="'+c.id+'">'+I('chat')+' Copiar mensaje para WhatsApp</button><button class="btn line" data-newpin="'+c.id+'">'+I('refresh')+' Generar nuevo PIN</button><button class="btn ice" data-viewas="'+c.id+'">Probar como cliente</button></div><div><label class="f">Vista previa del mensaje</label><div class="copybox">'+esc(accessMsg(c))+'</div></div><div class="tiny muted">Demo: el PIN se valida en este navegador. En la versión real se valida en el servidor, con bloqueo tras varios intentos y vencimiento del link después del viaje.</div></section>';
}
function pedidosPanel(c){
  var L=casesOf(c.id).sort(function(a,b){return b.updated-a.updated});
  return '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Atención al cliente</span><h3>'+I('chat')+' Casos de '+esc(c.name)+'</h3></div><button class="btn" data-newcase="'+c.id+'">'+I('plus')+' Nuevo caso</button></div>'+(L.length?'<div class="grid g2">'+L.map(caseCard).join('')+'</div>':'<div class="empty">Sin casos todavía.</div>')+'</section>';
}
function shareSection(c){ return '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Para compartir</span><h3>'+I('list')+' Resumen del plan</h3></div><button class="btn wa" data-copyshare="'+c.id+'">'+I('chat')+' Copiar plan para WhatsApp</button></div><div class="copybox">'+esc(shareText(c))+'</div></section>'; }

