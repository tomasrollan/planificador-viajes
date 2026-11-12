/* ======================= Ficha de cliente / familia (mini CRM, solo agencia) =======================
   S.families = [{id,code,name,phone,email,tags,personality,prefs,notes:[{id,t,at,by}],past:[{id,year,dest,hotel,notes}]}]
   Cada viaje (cliente de la agenda) apunta a su familia con c.famId. La ficha NUNCA se muestra en el portal del cliente. */
UI.famNew=null; UI.fq='';
var SOON_DESTS=[['caribe','Caribe','sun'],['europa','Europa','calendar'],['cruceros','Cruceros','bus'],['otro','Otro destino','pin']];

function fam(id){ return (S.families||[]).filter(function(f){return f.id===id})[0]; }
function famOf(c){ return c&&c.famId?fam(c.famId):null; }
function famTrips(f){ return S.clients.filter(function(c){return c.famId===f.id}).sort(function(a,b){return b.start.localeCompare(a.start)}); }
function famTripsLive(f){ return famTrips(f).filter(function(c){ return !FU.isCancelled(c); }); }
function phoneKey(p){ var d=String(p||'').replace(/\D/g,''); return d.length>=10?d.slice(-10):(d.length>=8?d:''); }
function famCreate(o){
  S.families=S.families||[]; S.famSeq=(S.famSeq||0)+1;
  var f={id:'fam'+S.famSeq,agency_id:(S.agency&&S.agency.id)||'',code:'FAM-'+('000'+S.famSeq).slice(-4),name:(o.name||'Nueva familia').trim(),phone:o.phone||'',email:o.email||'',tags:[],personality:'',prefs:'',notes:[],past:[],created:NOW()};
  S.families.push(f); return f;
}
/* al crear un viaje: lo suma a una familia existente (mismo teléfono o elegida desde la ficha) o crea una nueva */
function linkFamily(c,o){
  var f=o&&o.famId?fam(o.famId):null, existing=!!f;
  if(!f&&c.phone){ var k=phoneKey(c.phone); if(k) f=(S.families||[]).filter(function(x){return phoneKey(x.phone)===k})[0]||null; existing=!!f; }
  if(!f) f=famCreate({name:c.name,phone:c.phone});
  c.famId=f.id; if(!f.phone&&c.phone) f.phone=c.phone; return {f:f,existing:existing};
}
function famRepeat(f){ return famTripsLive(f).length+(f.past||[]).length>1; }
function famChip(c){ var f=famOf(c); if(!f) return ''; return '<div class="row" style="gap:8px;margin:-4px 0 4px"><a class="chip" href="#familia-'+f.id+'" style="text-decoration:none">'+I('user')+' '+esc(f.code)+' · Ver ficha del cliente</a>'+(famRepeat(f)?'<span class="chip gold">Cliente que repite</span>':'')+'</div>'; }
function famBadge(c){ var f=famOf(c); return f&&famRepeat(f)?'<span class="chip gold" title="Ya viajó con la agencia">Repite</span>':''; }
function tripState(c){ var t=todayISO(); if(FU.isCancelled(c)) return ['Cancelado','bad']; return c.end<t?['Terminado','gray']:c.start<=t?['En viaje','ok']:['En preparación','warn']; }
function famLast(f){ var tr=famTripsLive(f).filter(function(c){return c.end<todayISO()}), pa=(f.past||[]).slice().sort(function(a,b){return (b.year||0)-(a.year||0)});
  var a=tr[0], b=pa[0]; if(a&&(!b||+a.end.slice(0,4)>=(b.year||0))) return destsLabel(a)+' · '+a.end.slice(0,4); return b?(b.dest||'Viaje')+' · '+(b.year||''):''; }

/* ---------- lista de clientes ---------- */
UI.ff='all'; UI.fo='nombre';
function famFields(f){
  var tr=famTrips(f);
  return [f.name,f.phone||'',f.email||'',(f.tags||[]).join(' '),f.prefs||'',f.personality||'',(f.notes||[]).map(function(n){return n.t}).join(' '),
    tr.map(function(c){ return destsLabel(c)+' '+hotelLine(c)+' '+c.travelers.map(function(t){return t.name}).join(' '); }).join(' '),(f.past||[]).map(function(p){ return (p.dest||'')+' '+(p.hotel||'')+' '+(p.year||''); }).join(' ')];
}
function famLatest(f){ var tr=famTripsLive(f), t=todayISO(); if(!tr.length) tr=famTrips(f); var up=tr.filter(function(c){return c.end>=t}).sort(function(a,b){return a.start.localeCompare(b.start)})[0]; return up||tr[0]||null; }
function famList(){
  var q=(UI.fq||'').trim(), t=todayISO();
  var L=(S.families||[]).filter(function(f){
    if(q&&!FU.match(q,famFields(f),f.code)) return false;
    var tr=famTrips(f), up=tr.some(function(c){return c.end>=t});
    if(UI.ff==='rep') return famRepeat(f);
    if(UI.ff==='contactar'){ var n=famNext(f); return !!((n&&(n.late||n.today||n.soon))||famRecontact(f)); }
    if(UI.ff==='prox') return up;
    if(UI.ff==='sinprox') return !up;
    return true; });
  L.sort(function(a,b){
    if(UI.fo==='ultimo'){ var la=famLatest(a), lb=famLatest(b); return (lb?lb.start:'').localeCompare(la?la.start:'')||a.name.localeCompare(b.name); }
    if(UI.fo==='contacto'){ var na=FU.cleanNext(a.next), nb=FU.cleanNext(b.next); if(!na!==!nb) return na?-1:1; if(na&&nb) return na.date.localeCompare(nb.date); }
    return a.name.localeCompare(b.name); });
  return L;
}
function vClientes(){
  var pills=[['all','Todas'],['prox','Con viaje próximo'],['sinprox','Sin viaje próximo'],['rep','Repiten'],['contactar','Para contactar']], n=(S.families||[]).length;
  return '<main class="wrap"><section class="sec"><div class="sec-h"><div><span class="eyebrow">Solo para la agencia</span><h3>'+I('users')+' Clientes y familias</h3><p>Cada familia tiene un código único y una ficha con sus viajes, gustos y notas, para recordar cómo fue la última vez cuando quieran volver a viajar.</p></div><button class="btn" data-famnew="1">'+I('plus')+' Nueva familia</button></div>'+
   '<div class="cltool"><input type="text" id="fam-q" placeholder="Nombre, código (FAM-0001), teléfono o destino…" aria-label="Buscar familia" value="'+esc(UI.fq||'')+'"><div class="pills">'+pills.map(function(p){ return '<button class="pill'+(UI.ff===p[0]?' on':'')+'" data-ff="'+p[0]+'">'+p[1]+'</button>'; }).join('')+'</div>'+
   '<select id="fam-o" aria-label="Orden"><option value="nombre"'+(UI.fo==='nombre'?' selected':'')+'>Orden: nombre A–Z</option><option value="ultimo"'+(UI.fo==='ultimo'?' selected':'')+'>Orden: último viaje</option><option value="contacto"'+(UI.fo==='contacto'?' selected':'')+'>Orden: próximo contacto</option></select></div>'+
   '<div class="tiny muted" id="fam-count" style="margin:-6px 0 12px">'+famCount(famList().length,n)+'</div><div class="grid g2" id="fam-grid">'+famGrid(famList())+'</div></section></main>';
}
function famCount(k,n){ return k===n?n+(n===1?' familia':' familias'):k+' de '+n+' familias'; }
function refreshFams(){ var g=$('#fam-grid'); if(!g){ render(); return; } var L=famList(); g.innerHTML=famGrid(L); var c=$('#fam-count'); if(c) c.textContent=famCount(L.length,(S.families||[]).length); document.querySelectorAll('[data-ff]').forEach(function(p){ p.classList.toggle('on',p.getAttribute('data-ff')===UI.ff); }); }
function famGrid(L){
  if(!L.length) return '<div class="empty" style="grid-column:1/-1">No hay familias con ese criterio.</div>';
  return L.map(function(f){ var tr=famTrips(f), last=famLast(f), lt=famLatest(f), rc=famRecontact(f);
    return '<a class="card ccard" href="#familia-'+f.id+'" style="text-decoration:none;color:inherit"><div class="row between" style="align-items:flex-start"><div style="min-width:0"><h4 style="font-size:17px;font-weight:800">'+esc(f.name)+'</h4><div class="muted small" style="margin-top:4px">'+(f.phone?esc(f.phone):'Sin teléfono')+'</div></div><span class="chip">'+esc(f.code)+'</span></div>'+
     '<div class="row" style="gap:6px;margin-top:10px;flex-wrap:wrap">'+(lt?stageChip(lt):'')+'<span class="chip gray">'+tr.length+(tr.length===1?' viaje cargado':' viajes cargados')+((f.past||[]).length?' + '+f.past.length+' anterior'+(f.past.length===1?'':'es'):'')+'</span>'+(famRepeat(f)?'<span class="chip gold">Cliente que repite</span>':'')+nextChip(f)+(rc&&!famNext(f)?'<span class="chip gold">'+I('heart')+' Buen momento para escribirle</span>':'')+(f.tags||[]).slice(0,3).map(function(t){return '<span class="chip">'+esc(t)+'</span>'}).join('')+'</div>'+
     (last?'<div class="tiny muted" style="margin-top:8px">Último viaje: '+esc(last)+'</div>':'')+'</a>'; }).join('');
}

/* ---------- ficha de la familia ---------- */
function vFamilia(){
  var f=fam(UI.famId); if(!f) return '<main class="wrap"><div class="empty">Ficha no encontrada. <a href="#clientes">Volver a clientes</a></div></main>';
  var tr=famTrips(f), past=(f.past||[]).slice().sort(function(a,b){return (b.year||0)-(a.year||0)});
  var h='<main class="wrap"><div style="display:flex;flex-direction:column;gap:14px"><div class="row between" style="align-items:flex-start;gap:12px"><div><a href="#clientes" class="small" style="font-weight:700;text-decoration:none">'+I('back')+' Clientes</a><h2 style="font-size:26px;font-weight:900;margin-top:6px">'+esc(f.name)+'</h2><div class="row" style="gap:8px;margin-top:6px;flex-wrap:wrap"><span class="chip">'+I('key')+' '+esc(f.code)+'</span>'+(famRepeat(f)?'<span class="chip gold">Cliente que repite</span>':'')+'<span class="chip gray">Solo la agencia ve esta ficha</span></div></div><button class="btn" data-famtrip="'+f.id+'">'+I('plus')+' Nuevo viaje para esta familia</button></div>';
  h+=famFollowHtml(f);
  /* cómo es */
  h+='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Para acordarte</span><h3>'+I('user')+' Cómo es este cliente</h3><p>Lo que conviene recordar: gustos, cómo le gusta que le hablen, qué le importa. Son tus notas, no datos oficiales.</p></div></div>'+
   '<div class="grid g2" style="gap:12px"><div><label class="f" for="fm-name">Nombre de la familia</label><input type="text" id="fm-name" value="'+esc(f.name)+'"></div><div><label class="f" for="fm-phone">Teléfono / WhatsApp</label><input type="text" id="fm-phone" value="'+esc(f.phone)+'"></div><div><label class="f" for="fm-email">Email</label><input type="text" id="fm-email" value="'+esc(f.email||'')+'"></div><div><label class="f" for="fm-tags">Etiquetas (separadas por coma)</label><input type="text" id="fm-tags" value="'+esc((f.tags||[]).join(', '))+'" placeholder="Ej: viaja con chicos, VIP, cumpleaños en viaje"></div>'+
   '<div style="grid-column:1/-1"><label class="f" for="fm-pers">Cómo es / cómo tratarlo</label><textarea id="fm-pers" rows="3" placeholder="Ej: Laura decide todo; le gusta tener el plan cerrado con tiempo. Prefiere WhatsApp a llamadas.">'+esc(f.personality||'')+'</textarea></div>'+
   '<div style="grid-column:1/-1"><label class="f" for="fm-prefs">Gustos y preferencias de viaje</label><textarea id="fm-prefs" rows="3" placeholder="Ej: Hoteles chicos, no les gustan las filas, comen tarde, siempre piden mesa cerca de los personajes.">'+esc(f.prefs||'')+'</textarea></div></div>'+
   '<div class="row" style="margin-top:12px"><button class="btn" data-famsave="'+f.id+'">'+I('check')+' Guardar ficha</button></div></section>';
  /* viajes */
  h+='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Historial</span><h3>'+I('calendar')+' Viajes con la agencia</h3></div></div>';
  h+=tr.length?'<div class="blist">'+tr.map(function(c){ var st=tripState(c); return '<div class="bit"><span class="bci">'+I('calendar')+'</span><div class="bim"><div class="row between" style="gap:10px;align-items:flex-start"><div style="min-width:0"><b>'+esc(destsLabel(c))+'</b><div class="tiny muted">'+esc(fmtShort(c.start))+' → '+esc(fmtShort(c.end))+(hotelLine(c)?' · '+esc(hotelLine(c)):'')+' · '+c.travelers.length+' viajeros</div></div><span class="chip '+st[1]+'">'+st[0]+'</span></div><div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">'+stageChip(c)+(c.post&&c.post.rating?'<span class="chip gold">'+IF('star')+' '+c.post.rating+'/5</span>':'')+'<a class="btn line sm" href="#cliente-'+c.id+'">Abrir viaje</a></div></div></div>'; }).join('')+'</div>':'<div class="empty">Todavía no hay viajes cargados para esta familia.</div>';
  h+='<h4 style="font:900 15px var(--fh);margin-top:18px">Viajes anteriores</h4><div class="tiny muted">Viajes que hicieron antes de usar esta app (con la agencia o por su cuenta): sirven para saber qué les gustó.</div>';
  h+=past.length?'<div class="blist">'+past.map(function(p){ return '<div class="bit"><span class="bci">'+I('pin')+'</span><div class="bim"><div class="row between" style="gap:10px"><div><b>'+esc(p.dest||'Viaje')+(p.year?' · '+esc(String(p.year)):'')+'</b>'+(p.hotel?'<div class="tiny muted">'+esc(p.hotel)+'</div>':'')+'</div><button class="btn danger sm" data-famdelpast="'+f.id+'|'+p.id+'" aria-label="Eliminar viaje anterior">'+I('trash')+'</button></div>'+(p.notes?'<div class="small" style="margin-top:4px">'+esc(p.notes)+'</div>':'')+'</div></div>'; }).join('')+'</div>':'';
  h+='<div class="grid g2" style="gap:10px;margin-top:12px"><div><label class="f" for="fm-pd">Destino</label><input type="text" id="fm-pd" placeholder="Ej: Cancún"></div><div><label class="f" for="fm-py">Año</label><input type="number" id="fm-py" min="1990" max="2100" placeholder="Ej: 2024"></div><div><label class="f" for="fm-ph">Hotel</label><input type="text" id="fm-ph"></div><div><label class="f" for="fm-pn">Cómo les fue / qué les gustó</label><input type="text" id="fm-pn"></div></div><div class="row" style="margin-top:10px"><button class="btn line" data-famaddpast="'+f.id+'">'+I('plus')+' Agregar viaje anterior</button></div></section>';
  /* recordar para el próximo viaje */
  var lastT=tr.filter(function(c){return c.travelers.length})[0], al=lastT?lastT.travelers.filter(function(t){return (t.allergies||'').trim()}):[];
  if(al.length) h+='<section class="sec" style="border-color:var(--warn-line)"><div class="sec-h"><div><span class="eyebrow">Al armar el próximo viaje</span><h3>'+I('shield')+' Alergias que figuraban</h3></div></div><div class="notice warn">'+I('shield')+'<div>'+al.map(function(t){ return '<b>'+esc(t.name)+'</b>: '+esc(t.allergies); }).join(' · ')+'<br><span class="small">Es lo que había en el último viaje. Confirmalo de nuevo con el cliente: las alergias y dietas pueden cambiar.</span></div></div></section>';
  /* notas */
  var notes=f.notes||[];
  h+='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Solo para la agencia</span><h3>'+I('chat')+' Notas internas</h3></div></div><div class="row" style="gap:8px;align-items:flex-start"><textarea id="fm-note" rows="2" placeholder="Ej: Prefieren que les mande 2 opciones, no 5. Cumplen 15 años de casados en el viaje." style="flex:1 1 260px"></textarea><button class="btn" data-famnote="'+f.id+'">'+I('plus')+' Agregar nota</button></div>';
  h+=notes.length?'<div class="hist">'+notes.map(function(n){ return '<div class="hrow k-nota"><span class="hdot">'+I('chat')+'</span><div class="hb"><div>'+esc(n.t)+'</div><div class="tiny muted">'+esc(ago(n.at))+' · <a href="#" data-famdelnote="'+f.id+'|'+n.id+'">Borrar</a></div></div></div>'; }).join('')+'</div>':'<div class="empty" style="margin-top:10px">Todavía no hay notas.</div>';
  return h+'</section></div></main>';
}
function famSave(id){
  var f=fam(id); if(!f) return; var gv=function(s){ return (($(s)||{}).value||'').trim(); };
  f.name=gv('#fm-name')||f.name; f.phone=gv('#fm-phone'); f.email=gv('#fm-email'); f.personality=gv('#fm-pers'); f.prefs=gv('#fm-prefs');
  f.next=FU.cleanNext({date:gv('#fm-next'),note:gv('#fm-nextnote')});
  f.tags=gv('#fm-tags').split(',').map(function(t){return t.trim()}).filter(function(t,i,a){return t&&a.indexOf(t)===i}).slice(0,12);
  save(); render(); toast('Ficha guardada');
}

/* ---------- destinos que vienen ---------- */
function soonHtml(){
  var it=S.interest||{};
  return '<div class="soon"><div class="rgh" style="margin:16px 0 8px"><div><b>Próximamente</b><div class="small muted">Más destinos van a sumarse con la misma agenda, presupuesto, pagos y ficha de cliente. Marcá el que más te interesa y lo priorizamos.</div></div></div><div class="grid g2" style="gap:8px">'+
   SOON_DESTS.map(function(d){ var on=!!it[d[0]]; return '<button class="btn line soonbtn'+(on?' on':'')+'" data-soon="'+d[0]+'" style="justify-content:space-between" aria-pressed="'+on+'"><span>'+I(d[2])+' '+d[1]+'</span><span class="chip '+(on?'ok':'gray')+'">'+(on?'Lo quiero primero':'Próximamente')+'</span></button>'; }).join('')+'</div></div>';
}

CLICK.push(
 {a:'data-ff', f:function(v){ UI.ff=v; refreshFams(); }},
 {a:'data-famtrip', f:function(v){ newTripModal(v); }},
 {a:'data-famsave', f:function(v){ famSave(v); }},
 {a:'data-famnote', f:function(v){ var f=fam(v), t=(($('#fm-note')||{}).value||'').trim(); if(!f) return; if(!t){ toast('Escribí la nota'); return; } f.notes=f.notes||[]; f.notes.unshift({id:uid(),t:t.slice(0,600),at:NOW(),by:'agus'}); save(); render(); }},
 {a:'data-famdelnote', f:function(v,t,at,e){ e.preventDefault(); var p=v.split('|'), f=fam(p[0]); if(!f) return; f.notes=(f.notes||[]).filter(function(n){return n.id!==p[1]}); save(); render(); }},
 {a:'data-famaddpast', f:function(v){ var f=fam(v), gv=function(s){ return (($(s)||{}).value||'').trim(); }; if(!f) return; var d=gv('#fm-pd'); if(!d){ toast('Poné el destino del viaje'); return; }
   f.past=f.past||[]; f.past.push({id:uid(),dest:d.slice(0,80),year:+gv('#fm-py')||0,hotel:gv('#fm-ph').slice(0,80),notes:gv('#fm-pn').slice(0,300)}); save(); render(); toast('Viaje anterior agregado'); }},
 {a:'data-famdelpast', f:function(v){ var p=v.split('|'), f=fam(p[0]); if(!f) return; f.past=(f.past||[]).filter(function(x){return x.id!==p[1]}); save(); render(); }},
 {a:'data-famnew',present:1, f:function(){ showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Clientes</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 14px">Nueva familia</h3><label class="f" for="fn-name">Nombre</label><input type="text" id="fn-name" placeholder="Ej: Familia Suárez"><label class="f" style="margin-top:12px" for="fn-phone">Teléfono / WhatsApp</label><input type="text" id="fn-phone"><div class="row" style="margin-top:16px"><button class="btn" data-famcreate="1">'+I('check')+' Crear</button><button class="btn line" data-close="1">Cancelar</button></div></div></div></div>'); var e=$('#fn-name'); if(e) e.focus(); }},
 {a:'data-famcreate',present:1, f:function(){ var n=(($('#fn-name')||{}).value||'').trim(); if(!n){ toast('Poné el nombre'); return; } var ph=(($('#fn-phone')||{}).value||'').trim(), k=phoneKey(ph);
   var dup=k&&(S.families||[]).filter(function(x){return phoneKey(x.phone)===k})[0]; if(dup){ closeModal(); toast('Ese teléfono ya es de '+dup.name+' ('+dup.code+')'); location.hash='familia-'+dup.id; return; }
   var f=famCreate({name:n,phone:ph}); save(); closeModal(); location.hash='familia-'+f.id; toast('Familia creada: '+f.code); }},
 {a:'data-soon', f:function(v,t){ S.interest=S.interest||{}; S.interest[v]=!S.interest[v]; save(); var b=t.closest('[data-soon]'), on=!!S.interest[v], nm=SOON_DESTS.filter(function(d){return d[0]===v})[0][1];
   b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); var ch=b.querySelector('.chip'); ch.className='chip '+(on?'ok':'gray'); ch.textContent=on?'Lo quiero primero':'Próximamente'; toast(on?'Anotado: '+nm+' primero':nm+': ya no está marcado'); }}
);
document.addEventListener('input',function(e){ var t=e.target; if(t&&t.id==='fam-q'){ UI.fq=t.value; refreshFams(); } });
