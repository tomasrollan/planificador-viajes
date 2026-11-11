/* ======================= Universal Orlando (módulo) =======================
   Todo lo específico de Universal en la interfaz: transporte, presupuesto de comidas, avisos de reserva, destinos del viaje.
   Universal no tiene plan de comidas (lo discontinuó en 2021): no hay créditos; se estima en US$ y se compara con una tarjeta de comidas si el paquete la trae. */
var TR_UOR_AT='2026-11-11';
var UOR_URL=window.CATALOG_UOR_META.officialUrl;
var UOR_PK=[['US','Universal Studios Florida','star'],['IA','Islands of Adventure','sparkles'],['CW','CityWalk','bag'],['EU','Epic Universe','sun'],['VB','Volcano Bay','sun']];
var UT_EU_BUS=['Bus','Bus gratuito del hotel hasta Epic Universe (o transbordo en el Bus Hub de CityWalk). Epic Universe queda a unos 10–15 minutos en vehículo del resto del complejo: no hay camino a pie ni barco desde CityWalk.'];
var UT_VB_BUS=['Bus','Bus gratuito del hotel hasta Volcano Bay.'];
var UT_SIG_CW=['Barco o a pie','Water taxi gratis desde el muelle del hotel (menos de 10 min) o sendero peatonal hasta CityWalk.'];
var UT_CW_BUS=['Bus','Bus gratuito del hotel hasta CityWalk (el Bus Hub): desde ahí se camina a los parques.'];
function utViaCW(n){ return ['Por CityWalk','Llegás a CityWalk y desde ahí son unos pasos hasta la entrada de '+n+'.']; }
var UOR_GRP={
 sig:{n:'Hotel Signature con water taxi y sendero a CityWalk',m:{CW:UT_SIG_CW,US:utViaCW('Universal Studios Florida'),IA:utViaCW('Islands of Adventure'),EU:UT_EU_BUS,VB:UT_VB_BUS}},
 sig_vb:{n:'Hotel Signature con water taxi y senderos a CityWalk y Volcano Bay',m:{CW:UT_SIG_CW,US:utViaCW('Universal Studios Florida'),IA:utViaCW('Islands of Adventure'),EU:UT_EU_BUS,VB:['A pie o bus','Hay senderos peatonales hasta Volcano Bay; también el bus gratuito del hotel.']}},
 value:{n:'Hotel con buses frecuentes y sendero a Volcano Bay',m:{CW:['Bus','Bus gratuito (una guía de 2023 indica uno cada 15 minutos) hasta CityWalk. Cabana Bay también tiene un sendero de unos 20 minutos.'],US:utViaCW('Universal Studios Florida'),IA:utViaCW('Islands of Adventure'),EU:UT_EU_BUS,VB:['A pie','Sendero peatonal corto hasta Volcano Bay.']}},
 es:{n:'Hotel con buses a todos los parques',m:{CW:UT_CW_BUS,US:utViaCW('Universal Studios Florida'),IA:utViaCW('Islands of Adventure'),EU:UT_EU_BUS,VB:UT_VB_BUS}},
 epic_walk:{n:'Hotel de Epic Universe con entrada directa al parque',m:{EU:['A pie','Entrada directa a Epic Universe desde el lobby del hotel.'],CW:UT_CW_BUS,US:utViaCW('Universal Studios Florida'),IA:utViaCW('Islands of Adventure'),VB:UT_VB_BUS}},
 epic_path:{n:'Hotel de Epic Universe con sendero al parque',m:{EU:['A pie o bus','Sendero hasta la entrada de Epic Universe (unos 10–15 min a pie según una guía) o bus gratuito desde la apertura anticipada hasta el cierre.'],CW:UT_CW_BUS,US:utViaCW('Universal Studios Florida'),IA:utViaCW('Islands of Adventure'),VB:UT_VB_BUS}}
};
var UOR_HOTELS=[
 {n:'Universal Helios Grand Hotel',k:['helios'],g:'epic_walk'},
 {n:'Universal Stella Nova Resort',k:['stella nova'],g:'epic_path'},
 {n:'Universal Terra Luna Resort',k:['terra luna'],g:'epic_path'},
 {n:'Loews Portofino Bay Hotel',k:['portofino'],g:'sig'},
 {n:'Hard Rock Hotel',k:['hard rock'],g:'sig'},
 {n:'Loews Royal Pacific Resort',k:['royal pacific'],g:'sig'},
 {n:'Loews Sapphire Falls Resort',k:['sapphire'],g:'sig_vb'},
 {n:'Universal Cabana Bay Beach Resort',k:['cabana bay'],g:'value'},
 {n:'Universal Aventura Hotel',k:['aventura'],g:'value'},
 {n:'Universal Endless Summer Resort – Surfside Inn and Suites',k:['surfside'],g:'es'},
 {n:'Universal Endless Summer Resort – Dockside Inn and Suites',k:['dockside'],g:'es'}
];
function uorHotelInfo(name){
  var nm=Suggest.norm(name).trim(); if(!nm) return null;
  for(var i=0;i<UOR_HOTELS.length;i++){ var h=UOR_HOTELS[i]; for(var j=0;j<h.k.length;j++){ if(nm.indexOf(h.k[j])>=0){ var g=UOR_GRP[h.g]; return {n:h.n,g:h.g,gn:g.n,m:g.m}; } } }
  return {n:name,g:'off',gn:'Hotel fuera de Universal',m:null};
}
/* línea "desde tu hotel" para la ficha de un restaurante de Universal */
function uorTransportLine(hotel,r){
  var hi=uorHotelInfo(hotel); if(!hi) return null;
  if(!hi.m) return {hotel:hi.n,text:'No figura como hotel de Universal, así que no tiene el transporte gratuito del complejo. Se llega en auto, Uber/Lyft o taxi.'};
  if(r.zone==='UH'){ return (Suggest.norm(r.area).indexOf(Suggest.norm(hi.n).replace(/^(universal|loews)\s+/,'').slice(0,8))>=0)?{hotel:hi.n,text:'El restaurante está en tu mismo hotel.'}:{hotel:hi.n,text:'Está en otro hotel de Universal. Los buses no van de un hotel a otro: se hace transbordo en el Bus Hub de CityWalk (o el de Epic Universe), o se llega en barco si ambos hoteles tienen muelle.'}; }
  var m=hi.m[r.zone]; return m?{hotel:hi.n,text:m[0]+' — '+m[1]}:null;
}
function transportUor(c,ag){
  var hi=uorHotelInfo(c.hotelU);
  var h='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Cómo moverse · Universal</span><h3>'+I('bus')+' Transporte en Universal Orlando</h3><p>'+(hi?'Cómo llegar a cada parque desde <strong>'+esc(hi.n)+'</strong>.':(ag?'Cargá el hotel de Universal en «Datos del viaje» para ver las opciones.':'Tu agente va a cargar el hotel para mostrarte cómo llegar.'))+'</p></div></div>';
  if(hi&&hi.m){
    h+='<div class="row" style="gap:6px"><span class="chip">'+I('hotel')+' '+esc(hi.gn)+'</span></div><div class="tr-grid">'+UOR_PK.map(function(z){ var m=hi.m[z[0]]; return '<div class="tr-c"><h5>'+I(z[2])+' '+z[1]+'</h5><div class="md">'+esc(m[0])+'</div><p>'+esc(m[1])+'</p></div>'; }).join('')+'</div>';
  } else if(hi){
    h+='<div class="notice gold">'+I('info')+'<div><b>'+esc(hi.n)+'</b> no figura como hotel de Universal, así que no tiene el transporte gratuito del complejo. Se llega en auto (hay estacionamiento en los parques), Uber/Lyft o taxi. Confirmalo con el hotel.</div></div>';
  }
  h+='<div class="grid g2" style="gap:12px;margin-top:14px"><div class="tr-c"><h5>'+I('star')+' Entre parques</h5><p><b>Studios ↔ Islands:</b> se camina por CityWalk. También está el <b>Hogwarts Express</b> (tren entre Hogsmeade y Diagon Alley), que requiere entrada a los dos parques (Park-to-Park).</p><p><b>Epic Universe:</b> solo por bus (desde CityWalk y los hoteles) o en auto; el Hogwarts Express no llega a Epic Universe y el water taxi tampoco.</p></div>'+
   '<div class="tr-c"><h5>'+I('pin')+' Auto y aeropuerto</h5><p><b>Estacionamiento:</b> hay uno para Studios, Islands, Volcano Bay y CityWalk (6000 Universal Blvd) y otro propio en Epic Universe (1001 Epic Blvd). El estacionamiento prepago online vale para los cuatro parques y CityWalk.</p><p><b>Aeropuerto (MCO):</b> los hoteles de Universal ofrecen un shuttle desde el aeropuerto; consultá condiciones y costo con Universal. También Uber/Lyft o taxi.</p></div></div>';
  h+='<div class="tiny muted" style="margin-top:12px">Información general relevada el '+esc(fmtShort(TR_UOR_AT))+' ('+ageTxt(TR_UOR_AT)+'; blog oficial Discover Universal, AllEars, Undercover Tourist, Visit Orlando, Karta). Frecuencias y horarios de buses y barcos pueden cambiar: confirmalos con el hotel.</div>';
  if(!ag) h+='<div class="row" style="margin-top:14px"><button class="btn ice" data-askgen="transporte">'+I('chat')+' Preguntar a la agencia sobre el transporte</button></div>';
  return h+'</section>';
}
function transportBetween(){
  return '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Cómo moverse · entre complejos</span><h3>'+I('bus')+' De Disney a Universal (y vuelta)</h3></div></div><div class="notice gold">'+I('info')+'<div>No hay un servicio gratuito entre Walt Disney World y Universal Orlando. Se usa Uber/Lyft, taxi, auto de alquiler o un transporte contratado (los hoteles de Universal los venden en el desk de Vacation/Concierge). Contá con 20 a 40 minutos de viaje según el tráfico y la hora. Tené en cuenta el día del cambio de hotel: salida de uno y llegada al otro.</div></div></section>';
}

/* ---------- presupuesto de comidas (sin créditos) ---------- */
function uorEstimate(c){ return Rules.estimate(c,RID,'uor'); }
function uorSlotCount(c){ var n=0; Rules.slots(c).forEach(function(x){ var r=RID[x.slot.rid]; if(r&&r.dest==='uor') n++; }); return n; }
function creditsBoxUor(c){
  var est=uorEstimate(c), card=+c.cardUSD||0, np=c.travelers.length;
  var body='<div class="k">Comidas de mesa en Universal (estimado)</div><div class="v"><b>≈ US$ '+est.toLocaleString('es-AR')+'</b> · '+np+' persona'+(np===1?'':'s')+'</div>';
  if(card>0){ var pct=est?Math.min(100,Math.round(est/card*100)):0, over=est>card; body+='<div class="k" style="margin-top:6px">Tarjeta de comidas del paquete: US$ '+card.toLocaleString('es-AR')+'</div><div class="v">'+(over?'<span style="color:var(--rose)">las comidas de mesa superan la tarjeta por ≈ US$ '+(est-card).toLocaleString('es-AR')+'</span>':'quedan ≈ US$ '+(card-est).toLocaleString('es-AR')+' para el resto de las comidas')+'</div><div class="meter'+(over?' over':'')+'"><i style="width:'+pct+'%"></i></div>'; }
  return '<div class="cbox"><div class="ic">'+I('ticket')+'</div><div>'+body+'</div></div>';
}
function uorMathNotice0(c){
  return '<div class="notice">'+I('info')+'<div><strong>Universal no tiene plan de comidas:</strong> lo discontinuó en 2021, así que no hay créditos por restaurante. Cada comida se paga aparte; mostramos un estimado por persona según el rango de precios que publican las guías (sin bebidas ni propina), por eso es orientativo.'+((+c.cardUSD>0)?' El paquete incluye una <strong>tarjeta de comidas de US$ '+(+c.cardUSD).toLocaleString('es-AR')+'</strong>: se usa en todo el complejo (parques, CityWalk y hoteles), no solo en restaurantes de mesa, así que la comparamos contra el estimado de las mesas.':' Algunos paquetes de hotel traen una tarjeta de comidas en fechas puntuales (hay que cargar el monto en «Datos del viaje»).')+'</div></div>';
}
function uorMathNotice(c){ return '<details class="mathd"><summary>'+I('info')+' <b>Universal: sin plan de comidas</b><span class="muted">· cómo se calcula</span></summary>'+uorMathNotice0(c)+'</details>'; }

/* ---------- reservas ---------- */
var UOR_ST={lejos:['aún es pronto','gray'],abierta:['ya se puede reservar','ok'],cerca:['reservar ya','warn'],urgente:['reservar ya mismo','bad'],en_viaje:['viaje en curso','gray']};
function uorAdvice(c){ return Universal.advice(c,todayISO()); }
function resChip(c){
  var o='';
  if(hasDest(c,'wdw')){ var w=resWindow(c); o+='<span class="chip '+(w.passed?'ok':'gray')+'">'+(hasDest(c,'uor')?'Disney: ':'')+(w.passed?'reservas abiertas':'abren en '+daysTo(w.open)+' días')+'</span>'; }
  if(hasDest(c,'uor')){ var a=uorAdvice(c), s=UOR_ST[a.state]; o+='<span class="chip '+s[1]+'">Universal: '+s[0]+'</span>'; }
  return o;
}
function openCell(x){
  if(x.r.dest==='uor'){ var a=uorAdvice(x.c), s=UOR_ST[a.state]; return '<span class="chip '+s[1]+'" title="'+esc(a.text)+'">Universal: '+(a.state==='lejos'?'desde el '+fmtShort(uorFrom(x)):s[0])+'</span>'; }
  var w=resWindow(x.c); return w.passed?'<span class="chip ok">Ya abierto</span>':'<span class="chip warn">'+fmtShort(w.open)+' · en '+daysTo(w.open)+' días</span>';
}
/* Clave para ordenar la cola: Disney por su día de apertura (fijo); Universal por el día desde el que ya se puede reservar (≈ 6 meses antes de la estadía) o hoy si ya se puede. */
function uorFrom(x){ var a=uorAdvice(x.c); return a.state==='lejos'?addDays(a.start,-Universal.WINDOW_DAYS):todayISO(); }
function queueKey(x){ return x.r.dest==='uor'?uorFrom(x):resWindow(x.c).open; }
function resHint(c){
  var parts=[];
  if(hasDest(c,'wdw')){ var w=resWindow(c); parts.push(w.passed?'Disney: las reservas están abiertas.':'Disney: abren el '+fmtShort(w.open)+'.'); }
  if(hasDest(c,'uor')) parts.push('Universal: '+uorAdvice(c).text);
  return parts.join(' ');
}
function heroUor(c){
  var a=uorAdvice(c), hard=[]; c.days.forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots[m[0]],r=s&&RID[s.rid]; if(r&&r.dest==='uor'&&r.diff===3&&s.state!=='reservada') hard.push(r.name); }); });
  hard=hard.filter(function(x,i,arr){return arr.indexOf(x)===i}).slice(0,4);
  return '<section class="hero"><div class="in"><div class="hero-pill">'+I('bell')+' Universal Orlando · '+esc(UOR_ST[a.state][0])+'</div>'+
   '<h2>Reservas en Universal Orlando</h2>'+
   '<p>'+esc(a.text)+' No hay un día de apertura fijo ni un plan de comidas con créditos: cada mesa se reserva por separado (online, por Resy u OpenTable en los hoteles, o por teléfono).</p>'+
   '<div class="box"><b class="t">'+I('sparkles')+' Para reservar bien:</b><span>'+(hard.length?'Empezá por los más buscados de la agenda: <strong>'+esc(hard.join(', '))+'</strong>. Después completá el resto de los días.':'Armá la agenda y reservá primero los restaurantes marcados como difíciles (Toothsome, Mythos, los de Epic Universe, la cena de Marvel).')+'</span></div></div>'+I('utensils','bg-i')+'</section>';
}

/* ---------- destinos del viaje (formulario de datos) ---------- */
var KNOWN_DEST_LABELS=['Walt Disney World','Universal Orlando Resort','Walt Disney World + Universal Orlando Resort',''];
function destFields(c){
  var chk=DEST_ORDER.map(function(d){ return '<label class="small" style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-dest="'+d+'"'+(hasDest(c,d)?' checked':'')+'> '+esc(DESTS[d].n)+'</label>'; }).join('');
  var segs='';
  if(hasDest(c,'wdw')&&hasDest(c,'uor')){ var gw=Rules.range(c,'wdw'), gu=Rules.range(c,'uor');
    segs='<div style="grid-column:1/-1"><label class="f">Fechas de cada estadía (viaje combinado)</label><div class="grid g2" style="gap:12px"><div class="notice">'+I('hotel')+'<div><b>Walt Disney World</b><div class="row" style="gap:8px;margin-top:6px"><input type="date" id="d-sw-start" value="'+esc(gw.start)+'"><input type="date" id="d-sw-end" value="'+esc(gw.end)+'"></div></div></div><div class="notice">'+I('hotel')+'<div><b>Universal Orlando</b><div class="row" style="gap:8px;margin-top:6px"><input type="date" id="d-su-start" value="'+esc(gu.start)+'"><input type="date" id="d-su-end" value="'+esc(gu.end)+'"></div></div></div></div><div class="tiny muted" style="margin-top:6px">El plan de comidas de Disney se calcula con las noches de la estadía en Disney; las reservas de Disney abren 60 días antes de esa llegada.</div></div>'; }
  return '<div style="grid-column:1/-1"><label class="f">Destinos del viaje</label><div class="row" style="gap:18px">'+chk+'</div></div>'+segs;
}
function hotelFields(c){
  var o='';
  if(hasDest(c,'wdw')) o+='<div><label class="f">Hotel'+(hasDest(c,'uor')?' en Disney':'')+'</label><input type="text" id="d-hotel" list="hotels-dl" value="'+esc(c.hotel)+'" placeholder="Elegí de la lista o escribí otro"><datalist id="hotels-dl">'+HOTELS.map(function(h){return '<option value="'+esc(h.n)+'">'}).join('')+'</datalist></div>';
  if(hasDest(c,'uor')) o+='<div><label class="f">Hotel'+(hasDest(c,'wdw')?' en Universal':'')+'</label><input type="text" id="d-hotelU" list="hotelsu-dl" value="'+esc(c.hotelU||'')+'" placeholder="Elegí de la lista o escribí otro"><datalist id="hotelsu-dl">'+UOR_HOTELS.map(function(h){return '<option value="'+esc(h.n)+'">'}).join('')+'</datalist></div>';
  return o;
}
function planFields(c){
  var o='';
  if(hasDest(c,'wdw')) o+='<div><label class="f">Plan de comidas'+(hasDest(c,'uor')?' de Disney':'')+'</label><select id="d-plan">'+Object.keys(PLANS).map(function(k){return '<option value="'+k+'"'+(c.plan===k?' selected':'')+'>'+PLANS[k].n+'</option>'}).join('')+'</select></div>';
  if(hasDest(c,'uor')) o+='<div><label class="f">Tarjeta de comidas de Universal (US$)</label><input type="number" min="0" step="10" id="d-card" value="'+(+c.cardUSD||0)+'" placeholder="0 si no hay"><div class="tiny muted" style="margin-top:4px">Universal no tiene plan de comidas. Cargá el monto solo si el paquete incluye una tarjeta.</div></div>';
  return o;
}
function readDestFields(c){
  var gv=function(id){ var e=$(id); return e?e.value:null; };
  var h1=gv('#d-hotel'); if(h1!==null) c.hotel=h1; var h2=gv('#d-hotelU'); if(h2!==null) c.hotelU=h2;
  var p=gv('#d-plan'); if(p!==null) c.plan=p; var cd=gv('#d-card'); if(cd!==null) c.cardUSD=Math.max(0,+cd||0);
  if(hasDest(c,'wdw')&&hasDest(c,'uor')){ var a=gv('#d-sw-start'),b=gv('#d-sw-end'),x=gv('#d-su-start'),y=gv('#d-su-end'); c.segs={}; if(a&&b&&b>=a) c.segs.wdw={start:a,end:b}; if(x&&y&&y>=x) c.segs.uor={start:x,end:y}; if(!c.segs.wdw&&!c.segs.uor) c.segs=null; }
  else c.segs=null;
}
function setDests(c,d,on){
  var cur=tripDests(c).slice(); var i=cur.indexOf(d);
  if(on&&i<0) cur.push(d); if(!on&&i>=0) cur.splice(i,1);
  if(!cur.length){ toast('El viaje tiene que tener al menos un destino'); return false; }
  cur.sort(function(a,b){return DEST_ORDER.indexOf(a)-DEST_ORDER.indexOf(b)}); var before=destsLabel(c); c.dests=cur;
  if(KNOWN_DEST_LABELS.indexOf((c.destination||'').trim())>=0||(c.destination||'')===before) c.destination=destsLabel(c);
  if(cur.length<2) c.segs=null; else if(!c.segs){ c.segs=null; }
  return true;
}
function newTripModal(){
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Nuevo cliente</span><h3 style="padding-right:40px;font-size:20px;font-weight:900;margin:4px 0 14px">¿A dónde viaja?</h3><div class="grid" style="gap:10px">'+
   '<button class="btn" style="justify-content:flex-start" data-newtrip="wdw">'+I('sparkles')+' Walt Disney World</button>'+
   '<button class="btn" style="justify-content:flex-start" data-newtrip="uor">'+I('star')+' Universal Orlando Resort</button>'+
   '<button class="btn" style="justify-content:flex-start" data-newtrip="both">'+I('calendar')+' Disney + Universal (viaje combinado)</button></div>'+
   '<div class="qa"><div class="rgh" style="margin:16px 0 8px"><div><b>O pegá el mensaje del cliente</b><div class="small muted">Leo destino, fechas, viajeros y teléfono. Vos revisás antes de crear.</div></div></div><textarea id="qa-text" rows="4" placeholder="Ej: Hola Agus! Somos la familia Pérez, vamos a Disney del 12 al 20 de julio. Somos 2 adultos y 2 chicos…"></textarea><div id="qa-prev" class="qprev"></div><div class="row" style="margin-top:10px"><button class="btn" id="qa-go" data-qagen="1" disabled>'+I('plus')+' Crear desde el mensaje</button></div></div>'+
   '<div class="tiny muted" style="margin-top:12px">Después podés cambiarlo todo en «Datos del viaje».</div></div></div></div>');
  quickPreview();
}
function createTrip(kind,o){
  o=o||{}; var base=new Date().toISOString().slice(0,10), ds=kind==='both'?['wdw','uor']:[kind];
  var nc={id:uid(),token:genToken(o.name||'cliente'),pin:genPin(),name:o.name||'Nuevo cliente',destination:'',dests:ds,hotel:'',hotelU:'',cardUSD:0,segs:null,start:addDays(base,90),end:addDays(base,96),plan:ds.indexOf('wdw')>=0?'base':'none',mode:'collab',travelers:[{id:'t1',name:'Viajero 1',type:'adulto',allergies:''}],days:[],requests:[],favs:{},notes:o.notes||'',templates:undefined,intake:null,phone:o.phone||''};
  if(o.start&&o.end&&o.end>=o.start){ nc.start=o.start; nc.end=o.end; }
  if(o.travelers&&o.travelers.length) nc.travelers=o.travelers;
  if(o.hotel){ if(o.hotel.dest==='uor'&&ds.indexOf('uor')>=0) nc.hotelU=o.hotel.name; else if(o.hotel.dest==='wdw'&&ds.indexOf('wdw')>=0) nc.hotel=o.hotel.name; }
  if(o.plan&&ds.indexOf('wdw')>=0) nc.plan=o.plan;
  delete nc.templates; nc.destination=destsLabel(nc); nc.days=mkDays(nc.start,nc.end);
  if(kind==='both'){ var span=Math.max(1,Dates.nights(nc.start,nc.end)), mid=addDays(nc.start,Math.min(span-1,Math.max(1,Math.round(span/2)))); nc.segs={wdw:{start:nc.start,end:mid},uor:{start:mid,end:nc.end}}; }
  repo.addClient(nc); save(); closeModal(); UI.tab=o.quick?'datos':'datos'; location.hash='cliente-'+nc.id; return nc;
}
function destChips(c){ return tripDests(c).map(function(d){ return '<span class="chip '+(d==='uor'?'gold':'')+'">'+esc(DESTS[d].s)+'</span>'; }).join(''); }
