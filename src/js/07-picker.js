/* ======================= picker de restaurante ======================= */
var PK={cid:null,date:null,meal:null,q:'',zonePref:true};
function openPicker(cid,date,meal){ PK={cid:cid,date:date,meal:meal,q:'',zonePref:true}; drawPicker(); }
function drawPicker(){
  var c=client(PK.cid), d=c.days.filter(function(x){return x.date===PK.date})[0]; var pz=PARKZONE[d.park];
  var q=PK.q.toLowerCase();
  var L=R.filter(function(r){return !q||(r.name+' '+r.cuisine).toLowerCase().indexOf(q)>=0});
  L.sort(function(a,b){ var ap=(PK.zonePref&&pz&&a.zone===pz)?1:0, bp=(PK.zonePref&&pz&&b.zone===pz)?1:0; return bp-ap||(b.rating==null?-1:b.rating)-(a.rating==null?-1:a.rating); });
  var mealName=MEALS.filter(function(m){return m[0]===PK.meal})[0][1];
  var items=L.slice(0,40).map(function(r){ var inPark=pz&&r.zone===pz;
    return '<div class="sl" style="cursor:pointer;margin-bottom:8px;flex-direction:row;align-items:center" data-pick="'+r.id+'"><div class="th" style="width:64px;height:48px">'+(thumbUri(r)?'<img loading="lazy" decoding="async" alt="" src="'+thumbUri(r)+'">':I('utensils'))+'</div><div style="flex:1;min-width:0"><div class="nm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(r.name)+'</div><span class="small muted">'+esc(ZONES[r.zone].n)+' · '+esc(r.cuisine)+'</span>'+(inPark?'<div class="tiny" style="color:var(--ok);font-weight:700">En el parque del día</div>':'')+mealLine(r,PK.meal)+'</div><div style="text-align:right;display:flex;flex-direction:column;gap:4px;align-items:flex-end"><span class="chip gold">'+IF('star')+' '+stars(r.rating)+'</span>'+tsChip(r,PK.meal)+'</div></div>'; }).join('');
  var h='<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Agendar</span><h3 style="padding-right:40px;font-size:19px;font-weight:900;margin-bottom:4px">'+mealName+' · '+dayName(PK.date)+' '+dayLong(PK.date)+'</h3>'+
   '<div class="small muted" style="margin-bottom:12px">'+(d.park?'Parque del día: <b>'+esc(d.park)+'</b>. Primero van los de esa zona.':'Todavía no hay parque elegido para este día.')+'</div>'+
   '<div class="sw" style="margin-bottom:12px"><input type="search" id="pkq" placeholder="Buscar..." value="'+esc(PK.q)+'">'+I('search')+'</div>'+items+'</div></div></div>';
  showModal(h); var i=$('#pkq'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); }
}
function openSlotEditor(cid,date,meal){
  var c=client(cid), d=c.days.filter(function(x){return x.date===date})[0], s=d.slots[meal]; var r=s&&RID[s.rid]; if(!s) return;
  UI.se={rid:s.rid,date:date}; var ed=canEdit(c,s); var isAgus=UI.role==='agus'; var lockedForClient=!isAgus&&c.mode==='collab'&&s.state==='reservada';
  var mn=MEALS.filter(function(m){return m[0]===meal})[0][1];
  var h='<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">'+mn+' · '+fmtDate(date,true)+'</span><h3 style="padding-right:40px;font-size:20px;font-weight:900;margin:4px 0 14px">'+esc(r.name)+'</h3>';
  if(isAgus){ var bu=r.dest==='uor'?(r.rurl||UOR_URL):'https://disneyworld.disney.go.com/dining/'+r.path+'/', mu=r.dest==='uor'?r.murl:'https://disneyworld.disney.go.com/dining/'+r.path+'/menus/'; h+='<div class="row" style="gap:8px;margin:-6px 0 14px"><a class="btn ice sm" target="_blank" rel="noopener" href="'+esc(bu)+'">'+I('ext')+' Reservar en '+(r.dest==='uor'?'Universal':'Disney')+'</a>'+(mu?'<a class="btn line sm" target="_blank" rel="noopener" href="'+esc(mu)+'">'+I('ext')+' Menú oficial</a>':'')+'</div>'; }
  if(lockedForClient){
    h+='<div class="notice">'+I('lock')+'<div>Esta reserva ya está confirmada. Si querés cambiarla, pedile el cambio a Agus.</div></div><div style="margin:12px 0"><label class="f">Hora y confirmación</label><div><b>'+esc(s.time||'—')+'</b> · Conf. <b>'+esc(s.conf||'—')+'</b></div></div><label class="f">Pedir un cambio</label><textarea id="rq" placeholder="Ej: ¿podemos pasarla a las 18:00?"></textarea><div class="row" style="margin-top:12px"><button class="btn" data-sendreq="'+date+'|'+meal+'">Enviar pedido a Agus</button></div>';
  } else if(ed){
    h+='<div class="grid g2" style="gap:14px"><div><label class="f">Estado</label><select id="se-state">'+Object.keys(STATES).filter(function(k){return isAgus||c.mode==='auto'||k!=='reservada'}).map(function(k){return '<option value="'+k+'"'+(s.state===k?' selected':'')+'>'+STATES[k][0]+'</option>'}).join('')+'</select></div>'+
     '<div><label class="f">Hora de la reserva</label><input type="time" id="se-time" value="'+esc(s.time||'')+'"><div id="se-timewarn" class="tiny" style="margin-top:4px">'+timeWarnHtml(r,date,s.time)+'</div></div>'+
     '<div><label class="f">N.º de confirmación</label><input type="text" id="se-conf" value="'+esc(s.conf||'')+'" placeholder="'+(r.dest==='uor'?'Código de la reserva':'Código de Disney')+'"></div>'+
     '<div><label class="f">Notas</label><input type="text" id="se-note" value="'+esc(s.note||'')+'" placeholder="Ej: mesa afuera, cumpleaños…"></div></div>';
    if(isAgus) h+='<label class="small" style="display:flex;gap:8px;align-items:center;margin-top:14px;font-weight:600"><input type="checkbox" id="se-lock"'+(s.locked?' checked':'')+'> Bloquear para el cliente (en modo colaborativo solo podrá pedir cambios)</label>';
    h+='<div class="row" style="margin-top:16px"><button class="btn" data-saveslot="'+date+'|'+meal+'">Guardar</button><button class="btn line" data-repick="'+date+'|'+meal+'">'+I('refresh')+' Cambiar restaurante</button><button class="btn danger" data-clearslot="'+date+'|'+meal+'">'+I('trash')+' Quitar</button></div>';
    if(!isAgus&&c.mode==='collab') h+='<div class="tiny muted" style="margin-top:12px">En modo colaborativo tus cambios quedan como propuesta: Agus hace la reserva real.</div>';
  } else {
    h+='<div class="notice">'+I('lock')+'<div>Solo Agus puede modificar la agenda de este viaje.</div></div>';
  }
  h+='</div></div></div>'; showModal(h);
}

