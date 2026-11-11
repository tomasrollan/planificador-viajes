/* ======================= catálogo ======================= */
function allowedDests(c){ return c?tripDests(c):DEST_ORDER; }
function filtered(c){
  var f=UI.filt,q=f.q.trim().toLowerCase(), ad=allowedDests(c);
  var out=R.filter(function(r){
    if(ad.indexOf(r.dest)<0) return false;
    if(f.dest&&r.dest!==f.dest) return false;
    if(q&&(r.name+' '+r.cuisine+' '+r.area+' '+r.dishes.join(' ')+' '+(window.MENUS[r.path]||[]).join(' ')).toLowerCase().indexOf(q)<0) return false;
    if(f.zone&&r.zone!==f.zone) return false;
    if(f.tipo&&r.flags.indexOf(f.tipo)<0) return false;
    if(f.cred&&r.dest==='uor') return false;
    if(f.cred==='1'&&r.c!==1) return false; if(f.cred==='2'&&r.c!==2) return false; if(f.cred==='0'&&r.c!==0) return false;
    if(f.tier&&String(r.tier)!==f.tier) return false;
    if(f.onlyRated&&r.rating==null) return false;
    return true; });
  out.sort(function(a,b){
    if(f.sort==='rating') return (b.rating==null?-1:b.rating)-(a.rating==null?-1:a.rating);
    if(f.sort==='diff') return b.diff-a.diff||(b.rating||0)-(a.rating||0);
    if(f.sort==='tier') return a.tier-b.tier||(b.rating||0)-(a.rating||0);
    return a.name.localeCompare(b.name); });
  return out;
}
function filterBar(c){
  var f=UI.filt, ad=allowedDests(c); if(f.dest&&ad.indexOf(f.dest)<0) f.dest='';
  var vis=f.dest?[f.dest]:ad, zk=Object.keys(ZONES).filter(function(k){ return vis.indexOf(ZONES[k].d)>=0; }); if(f.zone&&zk.indexOf(f.zone)<0) f.zone='';
  var dp=ad.length>1?'<div class="pills"><button class="pill '+(!f.dest?'on':'')+'" data-fd="">Todos los destinos</button>'+ad.map(function(d){ return '<button class="pill '+(f.dest===d?'on':'')+'" data-fd="'+d+'">'+esc(DESTS[d].n)+'</button>'; }).join('')+'</div>':'';
  var showCred=vis.indexOf('wdw')>=0;
  var z='<button class="pill '+(!f.zone?'on':'')+'" data-fz="">Todos</button>'+zk.map(function(k){return '<button class="pill '+(f.zone===k?'on':'')+'" data-fz="'+k+'">'+ZONES[k].n+'</button>'}).join('');
  return '<div style="display:flex;flex-direction:column;gap:14px"><div class="sw"><input type="search" id="q" placeholder="Buscar restaurante, parque o comida..." value="'+esc(f.q)+'">'+I('search')+'</div>'+
   dp+'<div class="pills">'+z+'</div>'+
   '<details class="fdet"'+(window.innerWidth>=900?' open':'')+'><summary>Más filtros (tipo, créditos, precio, orden)</summary><div class="fbar"><select id="f-tipo"><option value="">Tipo: todos</option><option value="P"'+(f.tipo==='P'?' selected':'')+'>Con personajes</option><option value="B"'+(f.tipo==='B'?' selected':'')+'>Buffet / estilo familiar</option><option value="S"'+(f.tipo==='S'?' selected':'')+'>Con show</option></select>'+
   (showCred?'<select id="f-cred"><option value="">Créditos: todos</option><option value="1"'+(f.cred==='1'?' selected':'')+'>1 crédito</option><option value="2"'+(f.cred==='2'?' selected':'')+'>2 créditos</option><option value="0"'+(f.cred==='0'?' selected':'')+'>No acepta plan</option></select>':'')+
   '<select id="f-tier"><option value="">Precio: todos</option><option value="2"'+(f.tier==='2'?' selected':'')+'>$$ (US$15–35)</option><option value="3"'+(f.tier==='3'?' selected':'')+'>$$$ (US$35–60)</option><option value="4"'+(f.tier==='4'?' selected':'')+'>$$$$ (US$60+)</option></select>'+
   '<select id="f-sort"><option value="rating"'+(f.sort==='rating'?' selected':'')+'>Mejor valorados (Disney)</option><option value="diff"'+(f.sort==='diff'?' selected':'')+'>Más difíciles de reservar</option><option value="tier"'+(f.sort==='tier'?' selected':'')+'>Más económicos</option><option value="name"'+(f.sort==='name'?' selected':'')+'>A–Z</option></select>'+
   '<label class="small" style="display:flex;gap:6px;align-items:center;font-weight:600;color:#334155"><input type="checkbox" id="f-rated"'+(f.onlyRated?' checked':'')+'> solo con valoración</label></div></details></div>';
}
function menuTags(r){ var m=window.MENUS[r.path]; var arr=(m&&m.length)?m:r.dishes; return arr.filter(Boolean).slice(0,3); }
function restCard(r,opts){
  opts=opts||{}; var fav=opts.fav;
  var uo=r.dest==='uor';
  var rate=uo?'':'<div class="rate'+(r.rating!=null&&r.rating>=8.5?' hi':'')+'">'+IF('star')+' '+stars(r.rating)+(r.rating!=null?'<span style="opacity:.7;font-weight:600">/10</span>':'')+'</div>';
  var extra='<span class="loc">'+esc(ZONES[r.zone].n)+'</span>'+rate+(opts.showFav?'<button class="fav'+(fav?' on':'')+'" data-fav="'+r.id+'" title="Guardar en favoritos">'+(fav?IF('heart'):I('heart'))+'</button>':'');
  var tags=menuTags(r).map(function(t){return '<span class="tag">'+esc(t)+'</span>'}).join('');
  var lab=uo?('Mesa '+DIFFL[r.diff].toLowerCase()+(r.hot?' · Destacado por las guías':'')):((r.rating!=null?'Valoración '+stars(r.rating)+' de 10':'Sin valoración todavía')+' · Mesa '+DIFFL[r.diff].toLowerCase());
  return '<div class="rc" data-open="'+r.id+'">'+photoBox(r,extra)+'<div class="bd"><div><div class="lab">'+esc(lab)+'</div><h4 style="margin-top:6px">'+esc(r.name)+'</h4><div class="small muted" style="margin-top:2px">'+esc(r.area)+' · '+esc(r.cuisine)+'</div><p class="ds">'+esc(r.desc)+'</p>'+
   (uo?'<div class="opts"><div class="t">'+I('info')+' Cómo reservar:</div><div class="small muted">'+esc(Universal.BOOK[r.book]||'')+'</div></div></div>':'<div class="opts"><div class="t">'+I('utensils')+' Opciones de comida:</div><div class="tags">'+tags+'</div></div></div>')+
   '<div class="ft"><div class="cr">'+I('ticket')+'<span>'+esc(creditLabel(r))+'</span><span style="margin-left:auto">'+('$'.repeat(r.tier))+' · '+PRICE[r.tier]+'</span></div>'+
   '<div class="btns"><button class="btn ice" data-open="'+r.id+'">'+I('info')+' Detalles & Carta</button>'+(opts.canAdd?'<button class="btn" data-addto="'+r.id+'" title="Agendar en el plan">'+I('calendar')+' Agendar</button>':'')+'</div></div></div></div>';
}
function catalogGrid(opts){
  var c=opts&&opts.c; var L=filtered(c);
  var vd=UI.filt.dest?[UI.filt.dest]:allowedDests(c), parts=[];
  if(vd.indexOf('wdw')>=0) parts.push('Disney: valoración = promedio de lectores (escala 10) · verificado '+window.CATALOG_META.verified);
  if(vd.indexOf('uor')>=0) parts.push('Universal: contenido propio, sin fotos ni menús copiados; precios y dificultad de mesa estimados · verificado '+window.CATALOG_UOR_META.verified);
  var h='<div class="small muted" style="margin:0 2px 14px">'+L.length+' restaurantes · '+esc(parts.join(' · '))+'</div><div class="grid g3">';
  L.forEach(function(r){ h+=restCard(r,{showFav:!!c,fav:c&&who(c)&&(c.favs[who(c)]||[]).indexOf(r.id)>=0,canAdd:c&&canAdd(c)}); }); h+='</div>'; return h;
}
function catalogSection(c){
  return '<section class="sec" id="catalogo"><div class="sec-h"><div><span class="eyebrow">Directorio</span><h3>'+I('utensils')+' Guía de restaurantes con servicio de mesa</h3><p>Los que suelen requerir reserva. Filtrá, comparalos y agendalos en el plan.</p></div></div>'+filterBar()+'<div id="cat">'+catalogGrid({c:c})+'</div></section>';
}
function vCatalogoPage(){ if(!UI.filt.dest&&!UI.filtInit){ UI.filtInit=1; } return '<main class="wrap">'+subPills('cat',UI.csub||'all',[['all','Todos los restaurantes'],['dishes','Buscar platos']])+(UI.csub==='dishes'?dishSection(null):catalogSection(null))+'</main>'; }

var MEALKEY=Rules.MEALKEY, MEALLOW={breakfast:'desayuno',lunch:'almuerzo',dinner:'cena'};
function mealCheck(r,meal){ var x=Rules.mealServed((window.HORARIOS||{})[r.path],meal); if(!x) return null; return x.ok?{ok:true,txt:x.from+' a '+x.to+' hs'}:{ok:false,txt:''}; }
function mealLine(r,meal){ var mc=mealCheck(r,meal); if(!mc) return ''; return mc.ok?'<div class="tiny" style="color:var(--ok);font-weight:700">Sirve '+MEALLOW[meal]+': '+mc.txt+'</div>':'<div class="tiny" style="color:var(--bad);font-weight:700">No figura '+MEALLOW[meal]+' en sus horarios</div>'; }
function dayHours(r,date){ return Rules.dayHours((window.HORARIOS||{})[r.path],date); }
function timeWarnHtml(r,date,t){ var v=dayHours(r,date); if(!v) return ''; var a=v.split('-'), rg=a[0]+' a '+a[1]+' hs'; if(t&&(t<a[0]||t>a[1])) return '<span style="color:var(--bad);font-weight:700">Esa hora queda fuera del horario publicado ('+rg+').</span> <span class="muted">Referencia: horarios de la semana del '+fmtShort((window.HORARIOS_WEEK||[])[0]||'2026-11-10')+'; confirmalo con Disney.</span>'; return '<span class="muted">Horario publicado para ese día de la semana: '+rg+' (referencia: semana del '+fmtShort((window.HORARIOS_WEEK||[])[0]||'2026-11-10')+').</span>'; }
function applyMenuFilter(){
  var q=((($('#mq')||{}).value)||'').toLowerCase().trim(), dt=UI.mdiet||{}, any=!!q||dt.p||dt.g, n=0;
  document.querySelectorAll('.mf .it').forEach(function(it){ var t=it.textContent.toLowerCase(); var ok=(!q||t.indexOf(q)>=0)&&(!dt.p||/plant-based|vegan|vegetarian/.test(t))&&(!dt.g||/\(gf\)|gluten[- ]free/.test(t)); it.style.display=ok?'':'none'; it._v=ok; if(ok) n++; });
  document.querySelectorAll('.mf details.msec').forEach(function(d){ var v=0; d.querySelectorAll('.it').forEach(function(i){ if(i._v!==false) v++; }); d.style.display=(any&&!v)?'none':''; if(any&&v) d.open=true; });
  document.querySelectorAll('.mf details.alq').forEach(function(d){ var v=0; d.querySelectorAll('.it').forEach(function(i){ if(i._v!==false) v++; }); d.style.display=(any&&!v)?'none':''; if(any&&v) d.open=true; });
  var c=$('#mcount'); if(c) c.textContent=any?(n?n+' platos coinciden':'Ningún plato coincide'):'';
}
function nextAction(c){
  var pc=parkCard(c); if(pc) return pc;
  var empties=[],toBook=0; c.days.forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots[m[0]]; if(!s) empties.push([d.date,m]); else if(s.state==='por_reservar') toBook++; }); });
  var t,p,b='';
  if(empties.length&&canAdd(c)){ var e=empties.filter(function(x){return x[1][0]==='dinner'})[0]||empties[0]; t='Elegí '+MEALLOW[e[1][0]]+' del '+fmtDate(e[0]); p='Te faltan '+empties.length+' comidas por elegir en tu agenda.'; b='<button class="btn" data-add="'+e[0]+'|'+e[1][0]+'">'+I('plus')+' Elegir ahora</button>'; }
  else if(empties.length){ t='Agus está armando tu agenda'; p='Te avisa cuando esté lista. Mientras tanto mirá los restaurantes y marcá tus favoritos.'; b='<button class="btn" data-sub="rest|all">'+I('utensils')+' Ver restaurantes</button>'; }
  else if(toBook){ var w=resWindow(c); t=toBook+' comidas esperan ser reservadas'; p=!hasDest(c,'wdw')?((c.mode==='auto'?'Reservalas. ':'Agus las reserva. ')+uorAdvice(c).text):((c.mode==='auto'?'Reservalas ':'Agus las reserva ')+(w.passed?'ya: las reservas están abiertas.':'el día de apertura, el '+fmtShort(w.open)+'.')+(hasDest(c,'uor')?' '+'Universal: '+uorAdvice(c).text:'')); }
  else { t='Todo reservado'; p='Ahora revisá cómo te vas a mover desde tu hotel.'; b='<button class="btn" data-sub="viaje|trans">'+I('bus')+' Ver transporte</button>'; }
  return '<section class="sec nxt"><span class="eyebrow">Tu próxima acción</span><h3>'+esc(t)+'</h3><p>'+esc(p)+'</p>'+b+'</section>';
}
function subPills(tab,cur,list){ return '<div class="subp">'+list.map(function(x){ return '<button class="pill'+(cur===x[0]?' on':'')+'" data-sub="'+tab+'|'+x[0]+'">'+x[1]+'</button>'; }).join('')+'</div>'; }
function horariosHtml(r){
  var H=(window.HORARIOS||{})[r.path], wk=window.HORARIOS_WEEK||[], DN=['lun','mar','mié','jue','vie','sáb','dom'];
  var hasD=H&&H.d&&H.d.some(function(x){return x}), hasM=H&&H.m&&H.m.length;
  var h='<div class="opts" style="margin:0 0 14px"><div class="t">'+I('clock')+' Horarios</div>';
  if(!hasD&&!hasM){ return h+'<div class="small muted">Disney no publica horarios para este lugar (por ejemplo, shows con funciones fijas). Consultá la hora en la web oficial o con la agencia.</div></div>'; }
  function fh(v){ var a=v.split('-'); return a[0]+' a '+a[1]+' hs'; }
  if(hasM) h+='<div class="small" style="margin-bottom:6px"><b>Sirve:</b> '+H.m.map(function(m){ return esc(m[0])+' '+m[1]+' a '+m[2]; }).join(' · ')+' hs</div>';
  if(hasD){ var g={},ord=[]; H.d.forEach(function(v,i){ if(!v) return; if(!g[v]){ g[v]=[]; ord.push(v); } g[v].push(DN[i]); });
    if(ord.length===1) h+='<div class="small"><b>Abierto todos los días:</b> '+fh(ord[0])+'</div>';
    else h+='<div class="small"><b>Abierto:</b></div>'+ord.map(function(v){ return '<div class="small">'+g[v].join(', ')+': '+fh(v)+'</div>'; }).join(''); }
  var past=wk[1]&&Date.now()>new Date(wk[1]+'T23:59:59').getTime();
  h+='<div class="tiny muted" style="margin-top:8px">Leídos '+ageTxt(window.HORARIOS_AT||'2026-11-10')+'. Semana del '+(wk[0]?fmtShort(wk[0]):'')+' al '+(wk[1]?fmtShort(wk[1]):'')+'. Los horarios cambian según la temporada, el horario del parque y los eventos. Confirmalos al reservar.</div>';
  if(past) h+='<div class="notice bad" style="margin-top:8px">'+I('info')+'<div><b>Estos horarios son de una semana que ya pasó.</b> Pueden haber cambiado: verificá en la web oficial.</div></div>';
  return h+'</div>';
}
function modalRest(rid,ctx){
  var r=RID[rid]; if(!r) return; if(r.dest==='uor') return modalRestUor(r,ctx); var m=window.MENUS[r.path]; var real=!!(m&&m.length);
  var c=ctx&&ctx.c;
  var dishes=(real?m:r.dishes).map(function(d){return '<div class="dish">'+I('utensils')+'<span>'+esc(d)+'</span></div>'}).join('');
  var mf=menuFull(r.path), mfh='';
  ASKREG=[]; UI.mdiet={}; var canAsk=!!(c&&UI.role!=='agus');
  var age=mf&&mf.at?Math.floor((Date.now()-new Date(mf.at+'T12:00:00'))/864e5):0, stale=age>60;
  function secH(list,openFirst){ return list.map(function(sec,si){ return '<details class="msec"'+(openFirst&&si===0?' open':'')+'><summary><h5>'+esc(sec.n)+'<span class="cnt">'+sec.items.length+'</span></h5></summary>'+sec.items.map(function(it){ var en=TRX.name(it.n), ed=it.d?TRX.desc(it.d):''; return '<div class="it"><div><b>'+esc(it.n)+'</b>'+(en!==it.n?'<span class="es esn" lang="es">'+esc(en)+'</span>':'')+(canAsk?askQ(r.id,it.n):'')+(it.d?(ed&&ed!==it.d?'<p class="es" lang="es">'+esc(ed)+'</p>':'')+'<p class="en">'+esc(it.d)+'</p>':'')+'</div>'+(it.p?'<div class="pr">'+esc(it.p)+'</div>':'')+'</div>'; }).join('')+'</details>'; }).join(''); }
  if(mf&&mf.menus&&mf.menus.length){
    TRX=Translate.create(esData()); var esOn=prefs().es!==false; mfh='<div class="mf'+(esOn?'':' noes')+'"><div class="estog"><button class="pill'+(esOn?' on':'')+'" data-esview="1" aria-pressed="'+esOn+'">Ver en español</button><span class="tiny muted">Traducción orientativa hecha con diccionario: puede tener errores. Manda el menú oficial en inglés; para alergias usá siempre el texto original y el proceso oficial.</span></div>'+(stale?'<div class="notice bad" style="margin-bottom:10px">'+I('info')+'<div><b>Este menú tiene '+age+' días y puede estar desactualizado.</b> '+(canAsk?'Consultale a la agencia antes de decidir o reservar.':'Verificá platos y precios en el menú oficial antes de recomendar, y refrescalo.')+'</div></div>':'')+'<div class="notice gold">'+I('info')+'<div><b>Menú tomado el '+esc(fmtShort(mf.at))+' ('+ageTxt(mf.at)+').</b> Los precios (en US$) y las opciones pueden variar según la temporada y la disponibilidad. Confirmá siempre en el menú oficial.</div></div>'+'<div class="mqs"><div class="sw"><input type="search" id="mq" placeholder="Buscar en el menú (plato o ingrediente)…">'+I('search')+'</div></div><div class="mq"><div class="row"><button class="pill" data-mdiet="p">A base de plantas / vegetariano</button><button class="pill" data-mdiet="g">Marcado sin gluten (GF)</button></div><div class="tiny muted" id="mcount" style="margin-top:6px"></div><div class="tiny muted">Los filtros usan solo lo que Disney marca en el texto del menú. No son una garantía: avisá siempre la alergia.</div></div>'+mf.menus.map(function(m,mi){ return (mf.menus.length>1?'<h4 class="mn">'+esc(m.n)+'</h4>':'')+secH(m.sections,mi===0)+(m.alerg&&m.alerg.length?'<details class="alq"><summary>Opciones para alergias que publica Disney ('+esc(m.n)+')</summary>'+secH(m.alerg,false)+'<div class="tiny muted" style="margin-top:8px">Información publicada por Disney. Avisá siempre la alergia al reservar y al mozo; no reemplaza el consejo médico.</div></details>':''); }).join('')+'</div>';
  }
  var hasMF=!!(mf&&mf.menus&&mf.menus.length);
  var algN=(c&&algList(c).length)?'<div class="notice" style="margin:0 0 14px;background:var(--ok-soft);border-color:var(--ok-line)">'+I('shield')+'<div><b>En tu grupo:</b> '+esc(algText(c))+'. Mirá las opciones para alergias que publica Disney y avisá siempre al reservar y al mozo. '+(hasMF?'<button class="pill" style="margin-top:6px" data-alq="1">Ver opciones para alergias</button>':'')+'</div></div>':'';
  var hinfo=c&&c.hotel?hotelInfo(c.hotel):null, hline=(hinfo&&hinfo.g!=='off'&&TR_DEST[r.zone])?'<div class="notice" style="margin:0 0 14px">'+I('bus')+'<div><b>Desde tu hotel ('+esc(hinfo.n)+'):</b> '+esc(hinfo.m[r.zone][0])+' — '+esc(hinfo.m[r.zone][1])+'</div></div>':'';
  var askBtn=''; if(canAsk){ ASKREG.push({rid:r.id,dish:null}); askBtn='<div class="askbar"><button class="btn" data-ask="'+(ASKREG.length-1)+'">'+I('chat')+' Preguntar a la agencia sobre este restaurante</button></div>'; }
  var menuUrl='https://disneyworld.disney.go.com/dining/'+r.path+'/menus/', pageUrl='https://disneyworld.disney.go.com/dining/'+r.path+'/';
  var acts='';
  if(c){ acts+='<div class="row" style="margin-top:16px">'; if(canAdd(c)) acts+='<button class="btn" data-addto="'+r.id+'">'+I('calendar')+' Agendar</button>'; var isf=(c.favs[who(c)]||[]).indexOf(r.id)>=0; acts+='<button class="btn ice" data-fav="'+r.id+'">'+(isf?IF('heart'):I('heart'))+(isf?' En favoritos':' Favorito')+'</button></div>'; }
  var rate='<span class="rate">'+IF('star')+' '+stars(r.rating)+(r.rating!=null?'<span style="opacity:.7;font-weight:600">/10</span>':'')+'</span>';
  var h='<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button>'+photoBox(r,'<span class="loc">'+esc(ZONES[r.zone].n)+'</span>'+rate)+'<div class="pad"><h2 style="font-size:22px;font-weight:900">'+esc(r.name)+'</h2>'+
   '<div class="muted small" style="margin:4px 0 12px">'+esc(r.area)+' · '+esc(r.cuisine)+'</div>'+
   '<div class="row" style="gap:6px;margin-bottom:14px"><span class="chip">'+I('ticket')+' '+esc(creditLabel(r))+'</span>'+(r.cb!=null&&r.cb!==r.c?'<span class="chip">Desayuno: '+r.cb+' crédito</span>':'')+'<span class="chip">'+('$'.repeat(r.tier))+' '+PRICE[r.tier]+' por adulto</span><span class="chip gray">Mesa: '+DIFFL[r.diff]+'</span>'+(r.flags.indexOf('P')>=0?'<span class="chip gold">Personajes</span>':'')+(r.flags.indexOf('S')>=0?'<span class="chip gold">Show</span>':'')+'</div>'+
   '<p style="margin:0 0 14px;font-size:13.5px">'+esc(r.desc)+'</p>'+hline+algN+horariosHtml(r)+
   (hasMF?'':'<div class="opts" style="margin-top:0"><div class="t">'+I('utensils')+' '+(real?'Platos del menú publicado':'Platos orientativos')+'</div><div class="small muted">'+(real?'Leídos del menú que publica Disney (nov 2026). Pueden cambiar por temporada.':'Orientativos: no se pudieron leer del menú oficial. Verificá en el link antes de recomendar.')+'</div>'+dishes+'</div>')+
   mfh+'<div class="menubtn"><div><b style="font-family:var(--fh)">Menú completo y precios</b><div class="small muted">Disney no permite mostrar su sitio dentro de otra página, así que se abre en la web oficial, siempre actualizado.</div></div><a class="btn" target="_blank" rel="noopener" href="'+menuUrl+'">Ver menú oficial '+I('ext')+'</a></div><div class="row" style="margin-top:10px"><a class="btn line sm" target="_blank" rel="noopener" href="'+pageUrl+'">Página oficial del restaurante '+I('ext')+'</a></div>'+acts+
   '<div class="tiny muted" style="margin-top:14px">Valoración: '+esc(window.CATALOG_META.ratingSource)+' Créditos: '+esc(window.CATALOG_META.creditsSource)+'</div>'+askBtn+'</div></div></div>';
  showModal(h);
}
function modalRestUor(r,ctx){
  var c=ctx&&ctx.c, canAsk=!!(c&&UI.role!=='agus'); ASKREG=[];
  var askBtn=''; if(canAsk){ ASKREG.push({rid:r.id,dish:null}); askBtn='<div class="askbar"><button class="btn" data-ask="'+(ASKREG.length-1)+'">'+I('chat')+' Preguntar a la agencia sobre este restaurante</button></div>'; }
  var tline=''; if(c&&c.hotelU){ var tt=uorTransportLine(c.hotelU,r); if(tt) tline='<div class="notice" style="margin:0 0 14px">'+I('bus')+'<div><b>Desde tu hotel ('+esc(tt.hotel)+'):</b> '+esc(tt.text)+'</div></div>'; }
  var acts=''; if(c){ acts+='<div class="row" style="margin-top:16px">'; if(canAdd(c)) acts+='<button class="btn" data-addto="'+r.id+'">'+I('calendar')+' Agendar</button>'; var isf=(c.favs[who(c)]||[]).indexOf(r.id)>=0; acts+='<button class="btn ice" data-fav="'+r.id+'">'+(isf?IF('heart'):I('heart'))+(isf?' En favoritos':' Favorito')+'</button></div>'; }
  var adv=c&&hasDest(c,'uor')?Universal.advice(c,Dates.todayIn(S.agency.tz,NOW())):null;
  var h='<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button>'+photoBox(r,'<span class="loc">'+esc(ZONES[r.zone].n)+'</span>')+'<div class="pad"><h2 style="font-size:22px;font-weight:900">'+esc(r.name)+'</h2>'+
   '<div class="muted small" style="margin:4px 0 12px">'+esc(r.area)+' · '+esc(r.cuisine)+'</div>'+
   '<div class="row" style="gap:6px;margin-bottom:14px"><span class="chip">'+I('ticket')+' '+esc(creditLabel(r))+'</span><span class="chip">'+('$'.repeat(r.tier))+' '+PRICE[r.tier]+' por adulto (estimado)</span><span class="chip gray">Mesa: '+DIFFL[r.diff]+'</span>'+(r.hot?'<span class="chip gold">Destacado por las guías</span>':'')+(r.flags.indexOf('P')>=0?'<span class="chip gold">Personajes</span>':'')+(r.flags.indexOf('S')>=0?'<span class="chip gold">Música en vivo</span>':'')+(r.prio?'<span class="chip gray" title="Huéspedes de Royal Pacific, Hard Rock Hotel y Portofino Bay">Prioridad hoteles Signature</span>':'')+'</div>'+
   '<p style="margin:0 0 14px;font-size:13.5px">'+esc(r.desc)+'</p>'+(r.note?'<div class="notice gold" style="margin:0 0 14px">'+I('info')+'<div>'+esc(r.note)+'</div></div>':'')+(r.conf?'<div class="notice" style="margin:0 0 14px">'+I('info')+'<div>El estilo de cocina o ambiente de este lugar quedó <b>a confirmar</b> en la web oficial.</div></div>':'')+tline+
   '<div class="opts" style="margin:0 0 14px"><div class="t">'+I('bell')+' Cómo reservar</div><div class="small">'+esc(Universal.BOOK[r.book]||'')+(r.phone?' · '+esc(r.phone):'')+'</div>'+(adv?'<div class="small muted" style="margin-top:6px">'+esc(adv.text)+'</div>':'<div class="small muted" style="margin-top:6px">Universal permite reservar con hasta ~6 meses de anticipación; los más buscados conviene pedirlos con 1 a 2 meses.</div>')+'<div class="tiny muted" style="margin-top:6px">Las guías indican que no se pide tarjeta ni se cobra por no presentarse (la cena de Marvel se paga al reservar). Confirmalo al reservar.</div></div>'+
   '<div class="opts" style="margin:0 0 14px"><div class="t">'+I('shield')+' Alergias</div><div class="small">Avisá la alergia al reservar y de nuevo al llegar, y pedí hablar con el encargado o el chef antes de ordenar. Acá no hay una lista de platos aptos de Universal cargada: usá el proceso y el menú oficiales.</div></div>'+
   '<div class="menubtn"><div><b style="font-family:var(--fh)">Menú, horarios y disponibilidad</b><div class="small muted">Para Universal no copiamos menús ni fotos: se consultan en la web oficial, siempre actualizados. Los horarios de cada restaurante no figuran en su ficha: se ven al reservar.</div></div><div class="row" style="gap:8px">'+(r.murl?'<a class="btn ice" target="_blank" rel="noopener" href="'+esc(r.murl)+'">Menú oficial '+I('ext')+'</a>':'')+'<a class="btn" target="_blank" rel="noopener" href="'+esc(r.rurl||window.CATALOG_UOR_META.officialUrl)+'">'+(r.rurl?'Reservar / ver disponibilidad ':'Ver en la web oficial ')+I('ext')+'</a></div></div>'+acts+
   '<div class="tiny muted" style="margin-top:14px">'+esc(window.CATALOG_UOR_META.note)+' Fuentes: '+esc(window.CATALOG_UOR_META.sources.join('; '))+'.</div>'+askBtn+'</div></div></div>';
  showModal(h);
}
function showModal(h){ closeModal(); UI.lastFocus=document.activeElement; var d=document.createElement('div'); d.id='modalRoot'; d.innerHTML=h; document.body.appendChild(d); document.body.style.overflow='hidden'; var m=d.querySelector('.modal'); if(m){ m.setAttribute('role','dialog'); m.setAttribute('aria-modal','true'); m.setAttribute('tabindex','-1'); try{ m.focus({preventScroll:true}); }catch(e){} } }
function closeModal(){ var m=$('#modalRoot'); if(m) m.remove(); document.body.style.overflow=''; var f=UI.lastFocus; UI.lastFocus=null; if(f&&f.focus&&document.body.contains(f)){ try{ f.focus({preventScroll:true}); }catch(e){} } }

