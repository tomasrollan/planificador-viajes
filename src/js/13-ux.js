/* ======================= UX: utilidades y módulos nuevos ======================= */
function deviceTz(){ try{ return Intl.DateTimeFormat().resolvedOptions().timeZone||Dates.DEFAULT_TZ; }catch(e){ return Dates.DEFAULT_TZ; } }
function todayISO(){ if(UI.fakeToday) return UI.fakeToday; return Dates.todayIn(deviceTz(),NOW()); }
function daysTo(iso){ return Dates.daysTo(iso,Dates.todayIn(deviceTz(),NOW())); }
function ageTxt(iso){ return Dates.ageText(iso,Dates.todayIn(deviceTz(),NOW())); }
/* zona horaria de la agencia (configurable en Ajustes); por defecto Argentina */
var TZOPTS=[['America/Argentina/Buenos_Aires','Argentina'],['America/Santiago','Chile'],['America/Montevideo','Uruguay'],['America/Asuncion','Paraguay'],['America/La_Paz','Bolivia'],['America/Lima','Perú'],['America/Bogota','Colombia'],['America/Mexico_City','México'],['America/Panama','Panamá'],['Europe/Madrid','España'],['America/New_York','Florida / Este de EE.UU.']];
function agencyTz(){ return (S.agency&&S.agency.tz)||Dates.DEFAULT_TZ; }
function agencyTzName(){ return (S.agency&&S.agency.tzName)||'Argentina'; }
function flToArg(iso){ try{ return Dates.parkToLocal(iso,6,0,agencyTz()).time; }catch(e){ return '8:00'; } }
var algList=Rules.algList;
var algText=Rules.algText;
function getQueue(){ return Rules.queue(S.clients.filter(function(c){ return !c.cancel; }),RID).map(function(x){ x.m=MEALS.filter(function(mm){return mm[0]===x.m})[0]; return x; }); }
var progress=Rules.progress;
function downloadFile(name,text,type){ var fallback=function(){ try{ var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:type})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ a.remove(); },500); toast('Descargado: '+name); }catch(e){ toast('Este navegador no permite descargar desde acá'); } };
  try{ if(window.claude&&window.claude.use){ window.claude.use('downloads').then(function(dl){ if(!dl) return fallback(); return dl.save({filename:name,data:text}).then(function(){ toast('Guardado: '+name); },function(){ toast('No se guardó el archivo'); }); },function(){ fallback(); }); return; } }catch(e){} fallback(); }
function icsEsc(t){ return String(t||'').replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\n/g,'\\n'); }
function icsFor(c){
  var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//'+icsEsc(S.agency.name)+'//Planificador//ES','CALSCALE:GREGORIAN'], def={breakfast:'08:00',lunch:'12:30',dinner:'18:30'}, stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z';
  c.days.forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots[m[0]], r=s&&RID[s.rid]; if(!r) return;
    var t=s.time||def[m[0]], hh=+t.slice(0,2), mm=+t.slice(3,5), em=hh*60+mm+90, eh=Math.floor(em/60)%24, emm=em%60, z=function(n){return String(n).padStart(2,'0')};
    L.push('BEGIN:VEVENT','UID:'+s.rid+'-'+d.date+'-'+m[0]+'@planificador','DTSTAMP:'+stamp,'DTSTART:'+d.date.replace(/-/g,'')+'T'+z(hh)+z(mm)+'00','DTEND:'+d.date.replace(/-/g,'')+'T'+z(eh)+z(emm)+'00',
      'SUMMARY:'+icsEsc(m[1]+': '+r.name+(s.state==='reservada'?'':' (sin confirmar)')),'LOCATION:'+icsEsc(r.area+', Walt Disney World'),
      'DESCRIPTION:'+icsEsc('Estado: '+STATES[s.state][0]+(s.conf?'. Confirmación: '+s.conf:'')+(s.time?'':'. Hora a confirmar')+'. Los horarios y las reservas pueden cambiar: confirmá en My Disney Experience.'),'END:VEVENT'); }); });
  L.push('END:VCALENDAR'); return L.join('\r\n');
}
function dayStrip(c){
  return '<div class="dstrip">'+c.days.map(function(d){ var n=0; MEALS.forEach(function(m){ if(d.slots[m[0]]) n++; }); var dt=new Date(d.date+'T12:00:00');
    return '<button class="dchip" data-jump="'+d.date+'"><small>'+dt.toLocaleDateString('es-AR',{weekday:'short'}).replace('.','')+'</small><b>'+dt.getDate()+'</b><i class="dot d'+n+'"></i></button>'; }).join('')+'</div>';
}
function parkCard(c){
  var t=todayISO(), d=c.days.filter(function(x){return x.date===t})[0]; if(!d) return '';
  var rows=MEALS.map(function(m){ var s=d.slots[m[0]], r=s&&RID[s.rid]; if(!r) return '<div class="pm"><b>'+m[1]+'</b><span class="muted">Sin definir</span></div>';
    return '<div class="pm"><div><b>'+m[1]+(s.time?' · '+esc(s.time):' · hora a confirmar')+'</b><div class="nm" data-open="'+r.id+'">'+esc(r.name)+'</div>'+(s.conf?'<div class="tiny muted">Confirmación: <b>'+esc(s.conf)+'</b></div>':'')+'</div><span class="chip '+STATES[s.state][1]+'">'+STATES[s.state][0]+'</span></div>'; }).join('');
  return '<section class="sec nxt"><span class="eyebrow">Hoy · '+esc(fmtDate(t,true))+(d.park?' · '+esc(d.park):'')+'</span><h3>Tus comidas de hoy</h3>'+rows+'<div class="row" style="margin-top:12px"><button class="btn" data-sub="viaje|trans">'+I('bus')+' Cómo llegar desde mi hotel</button><button class="btn ice" data-sub="viaje|alerg">'+I('shield')+' Mis tarjetas de alergia</button></div></section>';
}
function agendaGrid(c){
  var h='<div class="gwrap"><table class="gt"><tr><th>Día</th><th>Parque</th>'+MEALS.map(function(m){return '<th>'+m[1]+'</th>'}).join('')+'</tr>';
  c.days.forEach(function(d){ h+='<tr><td><b>'+dayName(d.date)+'</b><br><span class="muted small">'+dayLong(d.date)+'</span></td><td><select data-park="'+d.date+'"><option value="">Elegir…</option>'+parksFor(c).map(function(p){return '<option'+(d.park===p?' selected':'')+'>'+p+'</option>'}).join('')+'</select></td>';
    MEALS.forEach(function(m){ var s=d.slots[m[0]], r=s&&RID[s.rid];
      if(!r) h+='<td><button class="gcell emp" data-add="'+d.date+'|'+m[0]+'">'+I('plus')+' Asignar</button></td>';
      else { var st=STATES[s.state], mc=mealCheck(r,m[0]); h+='<td><button class="gcell" data-edit="'+d.date+'|'+m[0]+'"><b>'+esc(r.name)+'</b><span class="row" style="gap:4px"><span class="chip '+st[1]+'">'+st[0]+'</span>'+(s.sug&&s.state==='idea'?'<span class="chip gray" title="Lo propuso el sistema: revisalo">Sugerido</span>':'')+(s.time?'<span class="chip gray">'+esc(s.time)+'</span>':'')+(mc&&!mc.ok?'<span class="chip warn">sin '+MEALLOW[m[0]]+'</span>':'')+'</span></button></td>'; } });
    h+='</tr>'; });
  return h+'</table></div>';
}
function agentSummary(c){
  var w=resWindow(c), pg=progress(c), n=daysTo(w.open), hard=[]; c.days.forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots[m[0]], r=s&&RID[s.rid]; if(r&&r.diff===3&&s.state!=='reservada') hard.push(r.name); }); });
  hard=hard.filter(function(x,i,a){return a.indexOf(x)===i}).slice(0,3);
  return '<section class="sec asum"><div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">'+(hasDest(c,'wdw')?'<span class="chip '+(w.passed?'ok':'warn')+'">'+I('bell')+' '+(hasDest(c,'uor')?'Disney: ':'')+(w.passed?'Reservas abiertas':'Reservas abren el '+esc(fmtShort(w.open))+' · en '+n+' días · '+flToArg(w.open)+' hs ARG')+'</span>':'')+(hasDest(c,'uor')?'<span class="chip '+UOR_ST[uorAdvice(c).state][1]+'">'+I('bell')+' Universal: '+UOR_ST[uorAdvice(c).state][0]+'</span>':'')+creditsBox(c)+(algList(c).length?'<span class="chip warn">'+I('shield')+' '+esc(algText(c))+'</span>':'')+'</div>'+
   '<div style="margin-top:12px"><div class="row between small"><b>Agenda completa al '+pg.pct+' %</b><span class="muted">'+pg.filled+' de '+pg.cap+' comidas · '+pg.res+' reservadas · '+pg.pend+' por reservar</span></div><div class="meter" style="margin-top:6px"><i style="width:'+pg.pct+'%"></i></div></div>'+
   (hard.length?'<div class="small" style="margin-top:10px">'+I('sparkles')+' <b>Reservar primero:</b> '+esc(hard.join(', '))+'</div>':'')+'</section>';
}
function aview(){ return UI.aview||((window.innerWidth||1024)<720?'cards':'grid'); }
function aviewToggle(){ var v=aview(); return '<div class="subp" style="margin:0 0 14px"><button class="pill'+(v==='grid'?' on':'')+'" data-aview="grid">Grilla</button><button class="pill'+(v==='cards'?' on':'')+'" data-aview="cards">Tarjetas por día</button></div>'; }
function openMarkRes(cid,date,meal){
  var c=client(cid), d=c.days.filter(function(x){return x.date===date})[0], s=d&&d.slots[meal], r=s&&RID[s.rid]; if(!s||!r) return;
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Marcar como reservada</span><h3 style="padding-right:40px;font-size:19px;font-weight:900;margin:4px 0 4px">'+esc(r.name)+'</h3><div class="small muted" style="margin-bottom:12px">'+esc(c.name)+' · '+fmtDate(date,true)+' · '+(MEALS.filter(function(m){return m[0]===meal})[0]||[])[1]+'</div>'+
   '<div class="grid g2" style="gap:12px"><div><label class="f">Hora de la reserva</label><input type="time" id="mr-time" value="'+esc(s.time||'')+'"><div id="mr-warn" class="tiny" style="margin-top:4px">'+timeWarnHtml(r,date,s.time)+'</div></div><div><label class="f">N.º de confirmación</label><input type="text" id="mr-conf" value="'+esc(s.conf||'')+'" placeholder="Ej: 123456789"></div></div>'+
   '<label class="small" style="display:flex;gap:8px;align-items:center;margin-top:12px;font-weight:600"><input type="checkbox" id="mr-lock"'+(c.mode!=='auto'?' checked':'')+'> Bloquear para que el cliente solo pueda pedir cambios</label>'+
   '<div class="row" style="margin-top:14px"><button class="btn" data-savemr="'+cid+'|'+date+'|'+meal+'">'+I('check')+' Guardar reserva</button></div></div></div></div>'); UI.se={rid:s.rid,date:date,mr:true};
}
function vReservas(){
  var q=getQueue(), groups={}; q.forEach(function(x){ var o=(x.r.dest==='uor'?'U':'W')+'|'+queueKey(x); (groups[o]=groups[o]||[]).push(x); });
  var h='<main class="wrap"><section class="sec"><div class="sec-h"><div><span class="eyebrow">Cuándo reservar</span><h3>'+I('list')+' Modo reserva</h3><p>Ordenado por cuándo se puede reservar. Disney abre un día fijo (60 días antes de la llegada, 6:00 AM de Florida). Universal no tiene día fijo: se puede reservar con meses de anticipación y las mesas difíciles conviene pedirlas con 1 a 2 meses. Primero las más difíciles. Marcá cada una al confirmarla.</p></div><a class="btn" href="#sesion">'+I('check')+' Iniciar sesión de reservas</a></div>';
  var keys=Object.keys(groups).sort(function(a,b){ return a.slice(2).localeCompare(b.slice(2))||a.localeCompare(b); }); if(!keys.length) h+='<div class="empty">No hay reservas pendientes.</div>';
  keys.forEach(function(gk){ var uo=gk.charAt(0)==='U', k=gk.slice(2), n=daysTo(k), L=groups[gk].sort(function(a,b){ return b.r.diff-a.r.diff||a.d.date.localeCompare(b.d.date); });
    h+=uo?'<div class="rgh"><div><b>Universal Orlando · '+(n<=0?'ya se puede reservar':'se puede reservar desde el '+esc(fmtDate(k,true)))+'</b><div class="small muted">Sin día de apertura fijo: se reserva online, por Resy/OpenTable (hoteles) o por teléfono. Las mesas más buscadas, con 1 a 2 meses de anticipación o más.</div></div><span class="chip '+(n<=0?'ok':'gray')+'">'+(n<=0?'disponible':'en '+n+' días')+'</span></div>':'<div class="rgh"><div><b>Abren el '+esc(fmtDate(k,true))+'</b><div class="small muted">6:00 AM Florida · '+flToArg(k)+' hs '+esc(agencyTzName())+'</div></div><span class="chip '+(n<=0?'ok':n<=14?'warn':'gray')+'">'+(n<=0?'Ya abierto':'en '+n+' días')+'</span></div>';
    L.forEach(function(x){ h+='<div class="rrow"><div style="min-width:0;flex:1 1 260px"><div class="nm">'+esc(x.r.name)+'</div><div class="small muted"><a href="#cliente-'+x.c.id+'"><b>'+esc(x.c.name)+'</b></a> · '+fmtDate(x.d.date)+' · '+x.m[1]+(x.s.time?' '+esc(x.s.time):'')+'</div><div class="row" style="gap:6px;margin-top:6px"><span class="chip '+(x.r.diff===3?'bad':'gray')+'">Mesa: '+DIFFL[x.r.diff]+'</span>'+tsChip(x.r,x.m[0])+'</div>'+mealLine(x.r,x.m[0])+'</div><div class="row" style="gap:8px">'+(x.r.dest==='uor'?'<a class="btn ice sm" target="_blank" rel="noopener" href="'+esc(x.r.rurl||UOR_URL)+'">Reservas de Universal '+I('ext')+'</a>':'<a class="btn ice sm" target="_blank" rel="noopener" href="https://disneyworld.disney.go.com/dining/'+x.r.path+'/">Abrir en Disney '+I('ext')+'</a>')+'<button class="btn sm" data-markres="'+x.c.id+'|'+x.d.date+'|'+x.m[0]+'">'+I('check')+' Marcar reservada</button></div></div>'; }); });
  return h+'</section></main>';
}
function ctxBlock(c){ var al=algText(c); return '<div class="notice" style="margin-bottom:12px">'+I('users')+'<div><b>'+esc(c.name)+'</b> · '+fmtShort(c.start)+' → '+fmtShort(c.end)+(hotelLine(c)?' · '+esc(hotelLine(c)):'')+' · '+c.travelers.length+' viajeros<br><b>Alergias:</b> '+(al?esc(al):'ninguna cargada')+' · <a href="#cliente-'+c.id+'" data-close-go="1">Abrir agenda</a></div></div>'; }

