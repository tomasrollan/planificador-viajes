/* ======================= Transporte desde el hotel ======================= */
var TRANSP_AT='2026-11-10';
var TR_DEST={MK:['Magic Kingdom','sparkles'],EP:['EPCOT','pin'],HS:['Hollywood Studios','star'],AK:['Animal Kingdom','sun'],DS:['Disney Springs','bag']};
var TR_BUS=['Bus de Disney','Gratis, desde la parada del resort. Llegá con margen: las esperas y el tránsito varían según el horario.'];
var TR_GRP={
 mono_c:{n:'Resort sobre la línea del monorail (a pie al Magic Kingdom)',m:{MK:['A pie o monorail','Sendero peatonal (unos 10 min) o monorail. No hace falta bus.'],EP:['Monorail + monorail','Monorail hasta el Ticket and Transportation Center (TTC) y ahí el monorail a EPCOT.'],HS:TR_BUS,AK:TR_BUS,DS:TR_BUS}},
 mono_p:{n:'Resort sobre la línea del monorail',m:{MK:['Monorail o barco','Monorail o barco hasta el Magic Kingdom, sin bus.'],EP:['Monorail + monorail','Monorail hasta el Ticket and Transportation Center (TTC) y ahí el monorail a EPCOT.'],HS:TR_BUS,AK:TR_BUS,DS:TR_BUS}},
 boat_mk:{n:'Resort con barco al Magic Kingdom',m:{MK:['Barco','Barco directo al Magic Kingdom, gratis.'],EP:TR_BUS,HS:TR_BUS,AK:TR_BUS,DS:TR_BUS}},
 sky:{n:'Resort con Skyliner (góndolas)',m:{MK:TR_BUS,EP:['Skyliner','Góndolas hasta la entrada International Gateway de EPCOT (zona World Showcase). Según el resort puede haber cambio de góndola en la estación Caribbean Beach.'],HS:['Skyliner','Góndolas hasta la entrada de Hollywood Studios. Según el resort puede haber cambio de góndola en Caribbean Beach.'],AK:TR_BUS,DS:TR_BUS}},
 epc:{n:'Resort en la zona de EPCOT (a pie o barco)',m:{MK:TR_BUS,EP:['A pie o barco','Sendero a la entrada International Gateway o barco, gratis.'],HS:['A pie o barco','Sendero peatonal o barco hasta Hollywood Studios, gratis.'],AK:TR_BUS,DS:TR_BUS}},
 springs:{n:'Resort con barco a Disney Springs',m:{MK:TR_BUS,EP:TR_BUS,HS:TR_BUS,AK:TR_BUS,DS:['Barco','Barco directo a Disney Springs, gratis (también hay bus).']}},
 bus:{n:'Resort con buses de Disney',m:{MK:TR_BUS,EP:TR_BUS,HS:TR_BUS,AK:TR_BUS,DS:TR_BUS}}
};
var HOTELS=[
 {n:"Disney's Contemporary Resort",g:'mono_c',k:['contemporary']},
 {n:"Disney's Bay Lake Tower",g:'mono_c',k:['bay lake']},
 {n:"Disney's Polynesian Village Resort",g:'mono_p',k:['polynesian']},
 {n:"Disney's Grand Floridian Resort & Spa",g:'mono_p',k:['grand floridian']},
 {n:"Disney's Wilderness Lodge",g:'boat_mk',k:['wilderness lodge']},
 {n:"Disney's Fort Wilderness Resort & Campground",g:'boat_mk',k:['fort wilderness']},
 {n:"Disney's Riviera Resort",g:'sky',k:['riviera']},
 {n:"Disney's Caribbean Beach Resort",g:'sky',k:['caribbean beach']},
 {n:"Disney's Pop Century Resort",g:'sky',k:['pop century']},
 {n:"Disney's Art of Animation Resort",g:'sky',k:['art of animation']},
 {n:"Disney's BoardWalk Inn & Villas",g:'epc',k:['boardwalk']},
 {n:"Disney's Yacht Club Resort",g:'epc',k:['yacht club']},
 {n:"Disney's Beach Club Resort",g:'epc',k:['beach club']},
 {n:"Walt Disney World Swan",g:'epc',k:['swan']},
 {n:"Walt Disney World Dolphin",g:'epc',k:['dolphin']},
 {n:"Disney's Old Key West Resort",g:'springs',k:['old key west']},
 {n:"Disney's Saratoga Springs Resort & Spa",g:'springs',k:['saratoga']},
 {n:"Disney's Port Orleans Resort – Riverside",g:'springs',k:['riverside']},
 {n:"Disney's Port Orleans Resort – French Quarter",g:'springs',k:['french quarter']},
 {n:"Disney's Port Orleans Resort",g:'springs',k:['port orleans']},
 {n:"Disney's Animal Kingdom Lodge",g:'bus',k:['animal kingdom lodge','kidani']},
 {n:"Disney's Animal Kingdom Villas",g:'bus',k:['animal kingdom villas']},
 {n:"Disney's Coronado Springs Resort",g:'bus',k:['coronado']},
 {n:"Disney's All-Star Movies Resort",g:'bus',k:['all-star movies','all star movies']},
 {n:"Disney's All-Star Music Resort",g:'bus',k:['all-star music','all star music']},
 {n:"Disney's All-Star Sports Resort",g:'bus',k:['all-star sports','all star sports']}
];
function hnorm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/disney'?s?/g,'').replace(/\s+/g,' ').trim(); }
function hotelInfo(name){
  var nm=hnorm(name); if(!nm) return null;
  for(var i=0;i<HOTELS.length;i++){ var h=HOTELS[i]; for(var j=0;j<h.k.length;j++){ if(nm.indexOf(h.k[j])>=0){ var g=TR_GRP[h.g]; return {n:h.n,g:h.g,gn:g.n,m:g.m}; } } }
  return {n:name,g:'off',gn:'Hotel fuera de Disney',m:null};
}
function overlap(c,a,b){ return c.start<=b&&c.end>=a; }
function transportSection(c,ag){
  var a=hasDest(c,'wdw')?transportWdw(c,ag):'', b=hasDest(c,'uor')?transportUor(c,ag):'';
  return a+b+((hasDest(c,'wdw')&&hasDest(c,'uor'))?transportBetween():'');
}
function transportWdw(c,ag){
  var hi=hotelInfo(c.hotel);
  var h='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Cómo moverse</span><h3>'+I('bus')+' Transporte desde tu hotel</h3><p>'+(hi?'Cómo llegar a cada parque desde <strong>'+esc(hi.n)+'</strong>.':(ag?'Cargá el hotel en “Datos del viaje” para ver las opciones.':'Tu agente todavía no cargó tu hotel. Consultale por acá y lo completamos.'))+'</p></div></div>';
  if(hi&&hi.m){
    h+='<div class="row" style="gap:6px"><span class="chip">'+I('hotel')+' '+esc(hi.gn)+'</span></div><div class="tr-grid">'+Object.keys(TR_DEST).map(function(z){ var m=hi.m[z]; return '<div class="tr-c"><h5>'+I(TR_DEST[z][1])+' '+TR_DEST[z][0]+'</h5><div class="md">'+esc(m[0])+'</div><p>'+esc(m[1])+'</p></div>'; }).join('')+'</div>';
    if(hi.g==='sky'){ h+='<div class="notice '+(overlap(c,'2027-01-24','2027-01-30')?'bad':'gold')+'" style="margin-top:14px">'+I('info')+'<div>'+(overlap(c,'2027-01-24','2027-01-30')?'<b>Atención: tu viaje coincide con un cierre del Skyliner (24–30 de enero de 2027).</b> ':'')+'El Skyliner tiene cierres programados por mantenimiento (reportado: 24 al 30 de enero de 2027, con buses de reemplazo). Confirmá las fechas en My Disney Experience antes de viajar.</div></div>'; }
  } else if(hi){
    h+='<div class="notice gold">'+I('info')+'<div><b>'+esc(hi.n)+'</b> no figura como resort de Disney, así que no tiene el transporte gratuito de Disney. Según el hotel puede haber shuttle propio (a veces con costo); si no, se llega en Uber/Lyft, taxi o auto de alquiler. Confirmalo con el hotel.</div></div>';
  }
  h+='<div class="grid g2" style="gap:12px;margin-top:14px"><div class="tr-c"><h5>'+I('bus')+' Otras formas de moverse</h5><p><b>Minnie Van:</b> autos con chofer dentro de los resorts, se piden desde la app de Lyft. Aprox. US$ 40–70 por viaje según la demanda.</p><p><b>Uber / Lyft:</b> funcionan en todo Disney. Para el Magic Kingdom te dejan en el Ticket and Transportation Center (TTC), no en la puerta del parque.</p></div>'+
   '<div class="tr-c"><h5>'+I('pin')+' Desde y hacia el aeropuerto (MCO)</h5><p><b>Mears Connect</b> (shuttle compartido, 24 h): aprox. US$ 17,60 por adulto y US$ 14,30 por niño de 3 a 9 años, cada tramo.</p><p><b>Uber / Lyft:</b> aprox. US$ 35–55 hasta un resort.</p><p><b>Minnie Van:</b> solo desde/hacia resorts Deluxe, aprox. US$ 199 por tramo, se reserva por teléfono. El servicio gratuito Magical Express ya no existe.</p></div></div>';
  h+='<div class="tiny muted" style="margin-top:12px">Información general relevada el '+esc(fmtShort(TRANSP_AT))+' ('+ageTxt(TRANSP_AT)+'; Disney World, TouringPlans, AllEars, WDWMagic, Disney Tourist Blog). Los precios son aproximados y los recorridos, horarios y cierres por obras pueden cambiar: confirmá en la app My Disney Experience.</div>';
  if(!ag) h+='<div class="row" style="margin-top:14px"><button class="btn ice" data-askgen="transporte">'+I('chat')+' Preguntar a la agencia sobre el transporte</button></div>';
  return h+'</section>';
}

