/* ======================= agenda (compartida) ======================= */
function slotBox(c,d,m){
  var s=d.slots[m[0]], r=s&&RID[s.rid];
  var head='<div class="lh"><span class="lb">'+I(m[2])+' '+m[1]+'</span>'+(r&&s.time?'<span class="timep">'+I('clock')+' Hora: '+esc(s.time)+'</span>':'')+'</div>';
  if(!s||!r){ return '<div class="sl emp"><span class="lb">'+I(m[2])+' '+m[1]+'</span>'+(canAdd(c)?'<button class="addslot" data-add="'+d.date+'|'+m[0]+'">'+I('plus')+' Asignar</button>':'<span class="muted small">Sin definir</span>')+'</div>'; }
  var st=STATES[s.state];
  var th='<div class="th">'+(thumbUri(r)?'<img loading="lazy" decoding="async" alt="" src="'+thumbUri(r)+'">':I('utensils'))+'</div>';
  var tools=canEdit(c,s)||(!canEdit(c,s)&&c.mode==='collab'&&UI.role!=='agus')?'<div class="acts"><button class="lnk" data-edit="'+d.date+'|'+m[0]+'">'+I('refresh')+' '+(canEdit(c,s)?'Editar / cambiar':'Ver / pedir cambio')+'</button>'+(canEdit(c,s)?'<button class="btn danger sm" data-clearslot="'+d.date+'|'+m[0]+'">'+I('trash')+' Quitar</button>':'')+'</div>':'';
  var lk=''; if(UI.role==='agus'&&s.state!=='reservada'){ var bu=r.dest==='uor'?(r.rurl||UOR_URL):'https://disneyworld.disney.go.com/dining/'+r.path+'/', mu=r.dest==='uor'?r.murl:'https://disneyworld.disney.go.com/dining/'+r.path+'/menus/'; lk='<div class="acts"><a class="lnk" target="_blank" rel="noopener" href="'+esc(bu)+'">'+I('ext')+' Reservar</a>'+(mu?'<a class="lnk" target="_blank" rel="noopener" href="'+esc(mu)+'">'+I('ext')+' Menú oficial</a>':'')+'</div>'; }
  return '<div class="sl">'+head+'<div class="it"><div class="rt">'+th+'<div style="min-width:0;flex:1"><div class="nm" data-open="'+r.id+'">'+esc(r.name)+'</div><div class="mt"><span>'+esc(r.area)+'</span><span>•</span>'+tsChip(r,m[0])+'</div>'+(function(){ var mc=mealCheck(r,m[0]); return mc&&!mc.ok?'<div class="tiny" style="color:var(--bad);font-weight:700;margin-top:4px">No figura '+MEALLOW[m[0]]+' en sus horarios</div>':''; })()+'</div></div>'+
   '<div class="row" style="gap:6px"><span class="chip '+st[1]+'">'+(s.state==='reservada'?I('check'):'')+st[0]+(s.locked&&s.state==='reservada'?' '+I('lock'):'')+'</span>'+(s.sug&&s.state==='idea'?'<span class="chip gray" title="Lo propuso el sistema: revisalo">Sugerido</span>':'')+(s.conf?'<span class="chip gray">Conf. '+esc(s.conf)+'</span>':'')+''+(r.dest==='uor'?'':'<span class="chip gold">'+IF('star')+' '+stars(r.rating)+'</span>')+'</div>'+(algList(c).length?'<div class="algflag" data-open="'+r.id+'">'+I('shield')+' '+algList(c).length+' con alergias · ver opciones del restaurante</div>':'')+lk+tools+'</div></div>';
}
function dayCards(c){
  var h='<div class="grid g3">';
  c.days.forEach(function(d){
    var parkSel=(UI.role==='agus'||c.mode==='auto'||c.mode==='collab')?'<div style="position:relative"><select data-park="'+d.date+'"><option value="">Elegir parque…</option>'+parksFor(c).map(function(p){return '<option'+(d.park===p?' selected':'')+'>'+p+'</option>'}).join('')+'</select></div>':'<span class="chip">'+esc(d.park||'Sin parque definido')+'</span>';
    h+='<div class="day" id="day-'+d.date+'"><div class="hd"><div><div class="dn">'+dayName(d.date)+'</div><div class="dd">'+dayLong(d.date)+'</div></div>'+parkSel+'</div>';
    MEALS.forEach(function(m){ h+=slotBox(c,d,m); });
    h+='</div>';
  });
  return h+'</div>';
}
function creditsBox(c){ return (hasDest(c,'wdw')?creditsBoxWdw(c):'')+(hasDest(c,'uor')?creditsBoxUor(c):''); }
function creditsBoxWdw(c){
  var pl=PLANS[c.plan], n=nights(c), per=pl.per*n; var u=usedCredits(c);
  if(c.plan==='none'){
    return '<div class="cbox"><div class="ic">'+I('ticket')+'</div><div><div class="k">Costo estimado</div><div class="v"><b>≈ US$ '+estimate(c,'wdw').toLocaleString('es-AR')+'</b> · '+c.travelers.length+' persona'+(c.travelers.length===1?'':'s')+'</div></div></div>';
  }
  var pct=per?Math.min(100,Math.round(u.plan/per*100)):0, over=u.plan>per;
  return '<div class="cbox"><div class="ic">'+I('utensils')+'</div><div><div class="k">Créditos restantes</div><div class="v"><b>'+Math.max(0,per-u.plan)+'</b> / '+per+' disponibles'+(over?' · <span style="color:var(--rose)">te pasás por '+(u.plan-per)+'</span>':'')+'</div><div class="meter'+(over?' over':'')+'"><i style="width:'+pct+'%"></i></div></div></div>';
}
function mathNotice(c){ return (hasDest(c,'wdw')?mathNoticeWdw(c):'')+(hasDest(c,'uor')?uorMathNotice(c):''); }
function mathNoticeWdw(c){ var pl0=PLANS[c.plan], n0=Dates.nights(Rules.range(c,'wdw').start,Rules.range(c,'wdw').end); return '<details class="mathd"><summary>'+I('info')+' <b>'+(c.plan==='none'?'Sin plan de comidas':(pl0.per*n0)+' créditos Table Service por persona')+'</b><span class="muted">· cómo se calcula</span></summary>'+mathNotice0(c)+'</details>'; }
function mathNotice0(c){
  var pl=PLANS[c.plan], n=Dates.nights(Rules.range(c,'wdw').start,Rules.range(c,'wdw').end);
  if(c.plan==='none') return '<div class="notice">'+I('info')+'<div><strong>Sin plan de comidas:</strong> cada comida se paga aparte. Mostramos un estimado por persona según el rango de precio de los platos principales que publica Disney (sin bebidas ni propina). Es orientativo.</div></div>';
  return '<div class="notice">'+I('info')+'<div><strong>Matemática del plan de comidas:</strong> su estadía es de <strong>'+n+' noches</strong>, así que disponen de <strong>'+(pl.per*n)+' créditos Table Service por persona</strong> ('+pl.per+' por noche · '+esc(pl.n)+'). Algunos restaurantes (shows, personajes, cenas especiales) cuestan <strong>2 créditos</strong>: están marcados con «2 TS». Los que no figuran en el plan no descuentan. Confirmar siempre al reservar.</div></div>';
}
function heroReserva(c){
  if(!hasDest(c,'wdw')) return heroUor(c);
  var w=resWindow(c);
  var hard=[]; c.days.forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots[m[0]],r=s&&RID[s.rid]; if(r&&r.diff===3&&s.state!=='reservada') hard.push(r.name); }); });
  hard=hard.filter(function(x,i,a){return a.indexOf(x)===i}).slice(0,4);
  return '<section class="hero"><div class="in"><div class="hero-pill">'+I('bell')+' '+(w.passed?'Reservas abiertas desde el '+fmtShort(w.open):'Apertura de reservas: '+fmtShort(w.open)+' · 6:00 AM (Florida)')+'</div>'+
   '<h2>Estrategia de reservas & plan de comidas</h2>'+
   '<p>'+(c.hotel?'Al alojarse en <strong>'+esc(c.hotel)+'</strong>, ':'Si se alojan en un hotel de Disney, ')+'pueden reservar con <strong>60 días de anticipación</strong> toda la estadía (hasta 10 noches) el mismo día de apertura. Los restaurantes más buscados se llenan en minutos.</p>'+
   '<div class="box"><b class="t">'+I('sparkles')+' El secreto para reservar bien:</b><span>'+(hard.length?'Empiecen por los más codiciados de su agenda: <strong>'+esc(hard.join(', '))+'</strong>. Después completen el resto de los días.':'Armen la agenda y marquen los restaurantes más difíciles para reservarlos primero el día de apertura.')+'</span></div></div>'+I('utensils','bg-i')+'</section>'+(hasDest(c,'uor')?'<div class="notice gold" style="margin:-8px 0 16px">'+I('bell')+'<div><b>Universal Orlando:</b> '+esc(uorAdvice(c).text)+' No hay plan de comidas ni apertura fija.</div></div>':'');
}
function plannerSection(c){
  return '<section class="sec" id="planificador"><div class="sec-h"><div><span class="eyebrow">Itinerario '+new Date(c.start+'T12:00:00').getFullYear()+'</span><h3>'+I('calendar')+' Planificador de comidas</h3><p>'+(UI.role==='agus'?'Tocá una comida para editarla, cambiar su estado o cargar la confirmación.':'Asigná desayuno, almuerzo y cena de cada día. Se guarda en este navegador.')+'</p></div><div class="row">'+(UI.role==='agus'?'':creditsBox(c))+'<button class="btn wa sm" data-copyshare="'+c.id+'">'+I('chat')+' Copiar plan para WhatsApp</button><button class="btn ice sm" data-ics="'+c.id+'">'+I('calendar')+' Calendario (.ics)</button><button class="btn ice sm" data-print="1">Imprimir / PDF</button></div></div>'+mathNotice(c)+(UI.role==='agus'?agentTools(c)+aviewToggle()+(aview()==='cards'?dayCards(c):agendaGrid(c)):dayStrip(c)+dayCards(c))+'</section>';
}
function shareText(c){
  var t='*'+c.name+'* · '+destsLabel(c)+'\n'+fmtShort(c.start)+' al '+fmtShort(c.end)+(hotelLine(c)?' · '+hotelLine(c):'')+'\n';
  c.days.forEach(function(d){ var lines=[]; MEALS.forEach(function(m){ var s=d.slots[m[0]],r=s&&RID[s.rid]; if(r) lines.push('  • '+m[1]+': '+r.name+(s.time?' '+s.time:'')+' ['+STATES[s.state][0]+(s.conf?' · conf. '+s.conf:'')+']'); });
    if(lines.length||d.park) t+='\n'+dayName(d.date)+' '+dayLong(d.date)+(d.park?' · '+d.park:'')+'\n'+lines.join('\n')+(lines.length?'':'\n  (sin comidas definidas)'); });
  return t+'\n\nArmado con '+S.agency.name; }

