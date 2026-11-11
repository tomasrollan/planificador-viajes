/* ======================= catálogo ======================= */
var DESTS={wdw:{n:'Walt Disney World',s:'Disney'},uor:{n:'Universal Orlando Resort',s:'Universal'}};
var DEST_ORDER=['wdw','uor'];
var ZONES={MK:{n:'Magic Kingdom',d:'wdw'},EP:{n:'EPCOT',d:'wdw'},HS:{n:'Hollywood Studios',d:'wdw'},AK:{n:'Animal Kingdom',d:'wdw'},DS:{n:'Disney Springs',d:'wdw'},RS:{n:'Hoteles / Resorts',d:'wdw'},
  US:{n:Universal.ZONES.US,d:'uor'},IA:{n:Universal.ZONES.IA,d:'uor'},EU:{n:Universal.ZONES.EU,d:'uor'},CW:{n:Universal.ZONES.CW,d:'uor'},UH:{n:Universal.ZONES.UH,d:'uor'}};
var PRICE={2:'US$15–35',3:'US$35–60',4:'US$60+'}; var PRICE_EST=Rules.PRICE_EST;
var R=window.CATALOG.map(function(a){
  var path=a[0]; return {dest:'wdw',id:path.split('/')[1],path:path,name:a[1],zone:a[2],area:a[3],cuisine:a[4],flags:a[5]||'',tier:a[6],c:a[7],cb:a[8],cu:!!a[9],rating:a[10],diff:a[11],img:a[12],desc:a[13],dishes:(a[14]||'').split('|')};
});
/* Universal Orlando: contenido propio (sin fotos ni menús copiados): modo «solo enlaces» */
(window.CATALOG_UOR||[]).forEach(function(o){ R.push({dest:'uor',id:o.id,path:'',name:o.name,zone:o.zone,area:o.area,cuisine:o.cuisine,flags:o.flags||'',tier:o.tier,c:0,cb:null,cu:false,rating:null,diff:o.diff,img:'',desc:o.desc,dishes:[],hot:!!o.hot,book:o.book,phone:o.phone||'',prio:!!o.prio,meals:o.meals||'',note:o.note||'',conf:!!o.conf,rurl:((window.CATALOG_UOR_LINKS||{})[o.id]||{}).r||'',murl:((window.CATALOG_UOR_LINKS||{})[o.id]||{}).m||''}); });
var RID={}; R.forEach(function(r){RID[r.id]=r});
var PH=window.PHOTOS||{};
/* menús completos: se parsean al abrir cada restaurante (arranque liviano) */
var MF_CACHE={};
function menuFull(path){ if(MF_CACHE[path]!==undefined) return MF_CACHE[path]; var v=null; try{ var e=document.querySelector('script[data-mf="'+path+'"]'); if(e) v=JSON.parse(e.textContent); }catch(x){ v=null; } MF_CACHE[path]=v; return v; }
var ES_DATA=null; function esData(){ if(!ES_DATA) ES_DATA=(window.JDATA&&window.JDATA('es'))||{names:{},terms:{},alg:{}}; return ES_DATA; }
function thumbUri(r){ var p=PH[r.id]||{}; return p.a||p.d||''; }
function slides(r){ var p=PH[r.id]||{}, o=[]; if(p.a) o.push(['Restaurante',p.a]); if(p.d) o.push(['Plato',p.d]); if(p.x) o.push(['Más fotos',p.x]); return o; }
function photoBox(r,extra,cls){
  var sl=slides(r);
  if(!sl.length) return '<div class="ph'+(cls?' '+cls:'')+'"><div class="fb">'+I(KEYS_ZONE_ICON[r.zone]||'utensils')+esc(r.name)+'</div>'+(extra||'')+'</div>';
  var imgs=sl.map(function(x){return '<div class="sld"><img loading="lazy" decoding="async" alt="'+esc(r.name)+' · '+x[0]+'" src="'+x[1]+'"><span class="stag">'+x[0]+'</span></div>'}).join('');
  var nav=sl.length>1?'<button class="arr l" data-slide="-1" aria-label="Foto anterior">&#8249;</button><button class="arr r" data-slide="1" aria-label="Foto siguiente">&#8250;</button><div class="dts"><i class="on"></i><i></i></div>':'';
  return '<div class="ph car'+(cls?' '+cls:'')+'"><div class="trk">'+imgs+'</div>'+nav+(extra||'')+'</div>';
}
var creditsOf=Rules.creditsOf;
function tsChip(r,meal){ if(r.dest==='uor') return '<span class="chip gray" title="Universal no tiene plan de comidas">'+esc(Universal.BOOK_SHORT[r.book]||'')+'</span>'; var c=creditsOf(r,meal);
  if(c===0) return '<span class="chip gray" title="No figura en las listas del Dining Plan">Sin plan de comidas</span>';
  return '<span class="chip '+(c===2?'warn':'')+'">'+c+' TS'+(r.cu?' (a confirmar)':'')+'</span>'; }
function creditLabel(r,meal){ if(r.dest==='uor') return Universal.BOOK_SHORT[r.book]||''; var c=creditsOf(r,meal);
  if(c===0) return 'No acepta el plan de comidas';
  return c+(c===1?' crédito':' créditos')+' Table Service'+(meal==='breakfast'&&r.cb!=null?' (desayuno)':'')+(r.cu?' · a confirmar':''); }
function diffDots(d){ return '<span class="dots" title="Dificultad para conseguir mesa">'+'●'.repeat(d)+'<i>'+'●'.repeat(3-d)+'</i></span>'; }
function stars(x){ return x==null?'s/d':x.toFixed(1); }
var DIFFL={1:'Fácil',2:'Media',3:'Difícil'};
var MEALS=[['breakfast','Desayuno','coffee','#d97706'],['lunch','Almuerzo','sun','#f59e0b'],['dinner','Cena principal','moon','#6366f1']];
var STATES={idea:['Idea','gray'],por_reservar:['Para reservar','warn'],reservada:['Reservada','ok']};
var PLANS=Rules.PLANS;
var MODES={view:'Solo ver (Agus arma todo)',collab:'Colaborativo (propone, Agus reserva)',auto:'Autónomo (arma y reserva solo)'};
var PARKS=['Magic Kingdom','EPCOT','Hollywood Studios','Animal Kingdom','Disney Springs','Día de descanso / hoteles'];
var CTYPES=['Cambio de reserva','Alergia / dieta','Consulta','Pago / documentación','Otro'];
var PRIO={urgente:['Urgente','bad',24],alta:['Alta','warn',48],normal:['Normal','',120],baja:['Baja','gray',240]};
var PRIO_ORDER=['urgente','alta','normal','baja'];
var CST={nuevo:['Nuevo','bad'],en_curso:['En curso',''],esperando:['Esperando al cliente','warn'],resuelto:['Resuelto','ok']};
var CST_ORDER=['nuevo','en_curso','esperando','resuelto'];
var PARKZONE={'Magic Kingdom':'MK','EPCOT':'EP','Hollywood Studios':'HS','Animal Kingdom':'AK','Disney Springs':'DS'};
Object.keys(Universal.PARKZONE).forEach(function(k){ PARKZONE[k]=Universal.PARKZONE[k]; });
/* destinos y parques de un viaje */
function tripDests(c){ return Rules.dests(c); }
function hasDest(c,d){ return Rules.hasDest(c,d); }
function destOfPark(p){ return Universal.isPark(p)?'uor':'wdw'; }
function parksFor(c){ var o=[]; if(hasDest(c,'wdw')) o=o.concat(PARKS); if(hasDest(c,'uor')) o=o.concat(Universal.PARKS); return o; }
function destsLabel(c){ return tripDests(c).map(function(d){return DESTS[d].n}).join(' + '); }
function hotelLine(c){ var a=[]; if(hasDest(c,'wdw')&&c.hotel) a.push(c.hotel); if(hasDest(c,'uor')&&c.hotelU) a.push(c.hotelU); return a.join(' · '); }

