/* ======================= Seguimiento: etapa, próximo contacto, checklist, postviaje y resumen del viaje (solo agencia) ======================= */
var FU=Followup; UI.seg={doc:null};
function fuToday(){ return todayISO(); }
function paidSome(c){ try{ return !!(PY.hasPlan(c)&&paySum(c).paid>0); }catch(e){ return false; } }
function stageOf(c){ return FU.stage(c,fuToday(),paidSome(c)); }
function stageChip(c){ var k=stageOf(c), cls=k==='cancelado'?'bad':k==='viajando'?'ok':k==='postviaje'?'gray':k==='consulta'?'gray':k==='cotizado'?'warn':'ok'; return '<span class="chip '+cls+'" title="Etapa del cliente">'+esc(FU.stageLabel(k))+'</span>'; }
function famNext(f){ return FU.nextState(f,fuToday()); }
function famRecontact(f){ return FU.recontact(famTripsLive(f).map(function(c){return {end:c.end}}).concat((f.past||[]).filter(function(p){return p.year}).map(function(p){return {end:p.year+'-12-31'}})),fuToday(),!!FU.cleanNext(f.next)); }
function nextText(n){ return n.late?'vencido hace '+(-n.days)+(n.days===-1?' día':' días'):n.today?'hoy':'en '+n.days+(n.days===1?' día':' días'); }
function nextChip(f){ var n=famNext(f); if(!n) return ''; return '<span class="chip '+(n.late?'bad':n.today||n.soon?'warn':'gray')+'" title="Próximo contacto">'+I('bell')+' Contactar '+esc(nextText(n))+'</span>'; }

/* ---------- alertas para «Para hacer hoy» ---------- */
function seguimientoAlerts(){
  var it=[], t=fuToday();
  (S.families||[]).forEach(function(f){
    var n=famNext(f); if(n&&(n.late||n.today||n.days<=2)) it.push({p:n.late?2:3,ic:'bell',cls:n.late?'bad':'warn',t:'Contactar · '+f.name,s:(n.note?n.note+' · ':'')+nextText(n),b:'<a class="btn sm" href="#familia-'+f.id+'">Abrir ficha</a>'});
    else if(!n){ var r=famRecontact(f); if(r) it.push({p:7,ic:'heart',cls:'',t:'Buen momento para escribirle · '+f.name,s:'Volvieron hace '+r.months+' meses: ¿les proponés un viaje nuevo?',b:'<a class="btn ice sm" href="#familia-'+f.id+'">Abrir ficha</a>'}); } });
  S.clients.forEach(function(c){
    var da=FU.docsAlert(c,t); if(da) it.push({p:da.days<=14?2:4,ic:'shield',cls:da.days<=14?'bad':'warn',t:'Documentación pendiente · '+c.name,s:'Viajan en '+da.days+(da.days===1?' día':' días')+' · faltan '+da.pending+' de '+da.total+' puntos del checklist',b:'<a class="btn sm" href="#cliente-'+c.id+'" data-openseg="'+c.id+'">Ver checklist</a>'});
    var pa=FU.postAlert(c,t); if(pa) it.push({p:5,ic:'chat',cls:'',t:'Pedile cómo les fue · '+c.name,s:'Volvieron hace '+pa.days+' días. Su opinión y un referido valen oro.',b:'<a class="btn ice sm" href="#cliente-'+c.id+'" data-openseg="'+c.id+'">Cargar postviaje</a>'}); });
  return it;
}

/* ---------- pestaña Seguimiento del viaje ---------- */
function segPanel(c){
  var t=fuToday(), eff=stageOf(c), auto=(eff==='viajando'||eff==='postviaje'), ds=FU.docsSummary(c), L=FU.docs(c);
  var h='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Seguimiento</span><h3>'+I('list')+' Etapa del cliente</h3><p>Para saber en qué punto está cada cliente. Cuando empieza y termina el viaje, se actualiza sola.</p></div><button class="btn" data-summary="'+c.id+'">'+I('ticket')+' Resumen del viaje (PDF)</button></div>'+
   '<div class="row" style="gap:10px;flex-wrap:wrap;align-items:center"><label class="f" for="sg-stage" style="margin:0">Etapa</label><select id="sg-stage" data-sgstage="'+c.id+'"'+(auto?' disabled':'')+'>'+FU.STAGES.filter(function(x){return x[0]!=='viajando'&&x[0]!=='postviaje'}).map(function(x){ return '<option value="'+x[0]+'"'+(eff===x[0]?' selected':'')+'>'+x[1]+'</option>'; }).join('')+(auto?'<option selected>'+esc(FU.stageLabel(eff))+'</option>':'')+'</select>'+stageChip(c)+(auto?'<span class="tiny muted">Automática según las fechas del viaje</span>':'')+'</div></section>';
  h+='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Antes de viajar</span><h3>'+I('shield')+' Checklist de documentación</h3><p>Solo marcás si cada cosa está lista. La app no guarda números de pasaporte ni de documentos.</p></div><div class="chip '+(ds.pending?'warn':'ok')+'">'+ds.done+' de '+ds.total+' listos</div></div>'+
   '<div class="meter" style="margin-bottom:12px"><i style="width:'+ds.pct+'%"></i></div>'+
   '<div class="blist">'+L.map(function(d){ return '<div class="bit'+(d.done?' paid':'')+'"><button class="btn '+(d.done?'':'line ')+'sm" data-docdone="'+c.id+'|'+d.id+'" aria-pressed="'+!!d.done+'" aria-label="Marcar como listo">'+I('check')+'</button><div class="bim"><div class="row between" style="gap:8px"><b>'+esc(d.label)+'</b>'+(d.custom?'<button class="btn danger sm" data-docdel="'+c.id+'|'+d.id+'" aria-label="Quitar">'+I('trash')+'</button>':'')+'</div><input type="text" class="docnote" data-docnote="'+c.id+'|'+d.id+'" value="'+esc(d.note||'')+'" placeholder="Nota (opcional): ej. vence en 2028, falta el de Sofi" aria-label="Nota"></div></div>'; }).join('')+'</div>'+
   '<div class="row" style="margin-top:12px;gap:8px"><input type="text" id="sg-newdoc" placeholder="Agregar otro punto, ej: Alquiler de auto" style="flex:1 1 240px"><button class="btn line" data-docadd="'+c.id+'">'+I('plus')+' Agregar</button></div>'+
   '<div class="notice" style="margin-top:12px">'+I('info')+'<div class="small">Los requisitos de ingreso (visa, autorización electrónica, vigencia del pasaporte, menores) cambian según nacionalidad y fecha. Confirmalos siempre en fuentes oficiales; este checklist es solo un recordatorio.</div></div></section>';
  var ended=c.end<t, p=c.post||{rating:0,liked:'',improve:'',referral:'pendiente'};
  h+='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Después del viaje</span><h3>'+I('heart')+' Postviaje</h3><p>'+(ended?'Anotá cómo les fue: queda en la ficha de la familia para el próximo viaje.':'Se habilita cuando termina el viaje.')+'</p></div></div>';
  if(ended){
    h+='<div class="row" style="gap:6px;align-items:center;margin-bottom:10px" role="group" aria-label="Valoración"><span class="small muted" style="margin-right:6px">¿Cómo les fue?</span>'+[1,2,3,4,5].map(function(n){ return '<button class="btn '+(p.rating>=n?'gold':'line')+' sm" data-postrate="'+n+'" aria-label="'+n+' de 5" aria-pressed="'+(p.rating===n)+'">'+IF('star')+'</button>'; }).join('')+'</div>'+
     '<div class="grid g2" style="gap:12px"><div><label class="f" for="ps-liked">Qué les gustó</label><textarea id="ps-liked" rows="2">'+esc(p.liked||'')+'</textarea></div><div><label class="f" for="ps-improve">Qué mejorarían</label><textarea id="ps-improve" rows="2">'+esc(p.improve||'')+'</textarea></div><div><label class="f" for="ps-ref">Referidos</label><select id="ps-ref">'+FU.REFERRAL.map(function(x){ return '<option value="'+x[0]+'"'+(p.referral===x[0]?' selected':'')+'>'+x[1]+'</option>'; }).join('')+'</select></div></div>'+
     '<div class="row" style="margin-top:12px"><button class="btn" data-postsave="'+c.id+'">'+I('check')+' Guardar postviaje</button></div>'; }
  return h+'</section>';
}
function docsOf(c){ if(!c.docs) c.docs=FU.defaultDocs(c); return c.docs; }

/* ---------- resumen del viaje (PDF desde el navegador) ---------- */
var PDF_FMT={cel:{n:'Celular',page:'size:110mm 195mm;margin:7mm'},a4:{n:'Hoja A4',page:'size:A4;margin:14mm'}};
function summaryDoc(c,fmt){
  var items=(c.items||[]).filter(function(i){return i.visible}).sort(function(a,b){return (a.date||'9').localeCompare(b.date||'9')});
  var h='<div class="pdoc '+(fmt==='a4'?'pda':'pdm')+'"><div class="pdh"><div><div class="pdag">'+esc(S.agency.name)+'</div><div class="pdsub">Resumen de tu viaje</div></div><div class="pdcode">'+(famOf(c)?esc(famOf(c).code):'')+'</div></div>'+
   '<h1>'+esc(c.name)+'</h1><div class="pdmeta"><div><b>Destino</b><span>'+esc(destsLabel(c))+'</span></div><div><b>Fechas</b><span>'+esc(fmtShort(c.start))+' al '+esc(fmtShort(c.end))+' · '+nights(c)+' noches</span></div>'+(hotelLine(c)?'<div><b>Alojamiento</b><span>'+esc(hotelLine(c))+'</span></div>':'')+'<div><b>Viajeros</b><span>'+esc(c.travelers.map(function(t){return t.name}).join(', '))+'</span></div></div>';
  if(items.length) h+='<h2>Reservas confirmadas</h2>'+items.map(function(i){ return '<div class="pdres"><div class="pdrt">'+esc(i.title)+'</div><div class="pdrs">'+(i.date?esc(fmtShort(i.date)):'Sin fecha')+' · '+(i.status==='confirmado'?'Confirmado':'Estimado')+(i.conf?' · <b>Confirmación: '+esc(i.conf)+'</b>':'')+'</div></div>'; }).join('');
  var rows=c.days.map(function(d){ var ms=MEALS.map(function(m){ var s=d.slots[m[0]],r=s&&RID[s.rid]; return r?'<li><b>'+m[1]+':</b> '+esc(r.name)+(s.time?' · '+esc(s.time):'')+' <span class="pdst '+(s.state==='reservada'?'ok':'')+'">'+STATES[s.state][0]+(s.conf?' · conf. '+esc(s.conf):'')+'</span></li>':''; }).join('');
    return (ms||d.park)?'<div class="pdday"><div class="pddn">'+esc(dayName(d.date))+' '+esc(dayLong(d.date))+(d.park?' · '+esc(d.park):'')+'</div>'+(ms?'<ul>'+ms+'</ul>':'<div class="tiny muted">Sin comidas definidas todavía</div>')+'</div>':''; }).join('');
  h+='<h2>Día por día</h2>'+(rows||'<p class="muted small">Todavía no hay agenda cargada.</p>');
  h+='<div class="pdfoot"><b>Importante</b><br>Los horarios, menús y precios pueden cambiar: confirmá siempre al reservar y al llegar al restaurante. Si alguien tiene una alergia o dieta especial, avisá al hacer la reserva y al mozo; esta información no garantiza que un plato sea seguro.<div class="tiny" style="margin-top:8px">Preparado por '+esc(S.agency.name)+' · '+esc(fmtShort(fuToday()))+'</div></div></div>';
  return h;
}
function openSummary(cid,fmt){
  var c=client(cid); if(!c) return; fmt=fmt||UI.seg.fmt||'cel'; UI.seg.fmt=fmt;
  showModal('<div class="mask" data-close="1"><div class="modal docm"><button class="x noprint" data-close="1">'+I('x')+'</button><div class="pad"><div class="noprint" style="padding-right:44px"><div class="row" style="gap:8px;align-items:center;margin:0 0 10px"><span class="small muted">Formato:</span>'+Object.keys(PDF_FMT).map(function(k){ return '<button class="pill'+(fmt===k?' on':'')+'" data-pdfmt="'+c.id+'|'+k+'">'+PDF_FMT[k].n+'</button>'; }).join('')+'</div><div class="row" style="gap:8px;margin:0 0 8px"><button class="btn" data-doprint="1">'+I('ticket')+' Imprimir / Guardar como PDF</button><button class="btn line" data-close="1">Cerrar</button></div><div class="tiny muted" style="margin-bottom:12px">'+(fmt==='cel'?'«Celular» arma páginas angostas y verticales con letra grande, pensadas para leer y compartir por WhatsApp.':'«Hoja A4» es para imprimir en papel.')+' En el cuadro de impresión elegí «Guardar como PDF». No incluye montos ni pagos.</div></div>'+summaryDoc(c,fmt)+'</div></div></div>');
}
function doPrint(){
  var st=document.createElement('style'); st.id='pdoc-page'; st.textContent='@page{'+PDF_FMT[UI.seg.fmt||'cel'].page+'}'; document.head.appendChild(st);
  document.body.classList.add('pdoc-on');
  var done=function(){ document.body.classList.remove('pdoc-on'); var x=document.getElementById('pdoc-page'); if(x) x.remove(); window.removeEventListener('afterprint',done); };
  window.addEventListener('afterprint',done); try{ window.print(); }catch(e){ done(); }
}

/* ---------- acciones ---------- */
CLICK.push(
 {a:'data-openseg', f:function(v){ UI.tab='seg'; }},
 {a:'data-summary', f:function(v){ openSummary(v); }},
 {a:'data-pdfmt', f:function(v){ var p=v.split('|'); openSummary(p[0],p[1]); }},
 {a:'data-doprint',present:1, f:function(){ doPrint(); }},
 {a:'data-docdone', f:function(v){ var p=v.split('|'), c=client(p[0]); if(!c) return; var d=docsOf(c).filter(function(x){return x.id===p[1]})[0]; if(!d) return; d.done=!d.done; logAct(c.id,'Checklist: '+(d.done?'listo':'pendiente')+' · '+d.label.slice(0,60),'evento'); save(); render(); }},
 {a:'data-docdel', f:function(v){ var p=v.split('|'), c=client(p[0]); if(!c) return; c.docs=docsOf(c).filter(function(x){return x.id!==p[1]}); save(); render(); }},
 {a:'data-docadd', f:function(v){ var c=client(v), el=$('#sg-newdoc'), tx=((el||{}).value||'').trim(); if(!c) return; if(!tx){ toast('Escribí qué querés agregar'); return; } docsOf(c).push({id:'x'+uid(),label:tx.slice(0,120),done:false,note:'',custom:true}); save(); render(); }},
 {a:'data-postrate', f:function(v){ var c=client(UI.cid); if(!c) return; c.post=FU.cleanPost(Object.assign({},c.post||{},{rating:+v,at:NOW()})); c.post.rating=+v; save(); render(); }},
 {a:'data-postsave', f:function(v){ var c=client(v); if(!c) return; var g=function(s){ return (($(s)||{}).value||''); }; c.post=FU.cleanPost({rating:(c.post||{}).rating||0,liked:g('#ps-liked'),improve:g('#ps-improve'),referral:g('#ps-ref'),at:NOW()}); logAct(c.id,'Postviaje cargado'+(c.post.rating?' ('+c.post.rating+'/5)':''),'evento'); save(); render(); toast('Postviaje guardado'); }},
 {a:'data-famnextin', f:function(v,t,at,e){ var p=v.split('|'), f=fam(p[0]); if(!f) return; var d=new Date(Date.parse(fuToday()+'T12:00:00Z')+(+p[1])*864e5).toISOString().slice(0,10); f.next={date:d,note:(($('#fm-nextnote')||{}).value||(f.next&&f.next.note)||'').trim().slice(0,200)}; save(); render(); toast('Próximo contacto: '+fmtShort(d)); }},
 {a:'data-famnextdone', f:function(v){ var f=fam(v); if(!f||!f.next) return; f.notes=f.notes||[]; f.notes.unshift({id:uid(),t:'Contactado el '+fmtShort(fuToday())+(f.next.note?' · '+f.next.note:''),at:NOW(),by:'agus'}); f.next=null; save(); render(); toast('Listo: queda anotado en las notas'); }}
);
document.addEventListener('change',function(e){ var t=e.target; if(!t) return;
  if(t.id==='pc-st'){ UI.pf.st=t.value; refreshClients(); return; } if(t.id==='pc-o'){ UI.pf.o=t.value; refreshClients(); return; } if(t.id==='fam-o'){ UI.fo=t.value; refreshFams(); return; }
  if(t.hasAttribute&&t.hasAttribute('data-sgstage')){ var c=client(t.getAttribute('data-sgstage')); if(c){ c.stage=t.value; logAct(c.id,'Etapa: '+FU.stageLabel(t.value),'evento'); save(); render(); } }
  else if(t.hasAttribute&&t.hasAttribute('data-docnote')){ var p=t.getAttribute('data-docnote').split('|'), cc=client(p[0]); if(cc){ var d=docsOf(cc).filter(function(x){return x.id===p[1]})[0]; if(d){ d.note=t.value.trim().slice(0,160); save(); } } }
});

/* ---------- ficha de la familia: bloque de seguimiento ---------- */
function famFollowHtml(f){
  var n=famNext(f), r=famRecontact(f), nn=f.next||{date:'',note:''};
  var h='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Seguimiento</span><h3>'+I('bell')+' Próximo contacto</h3><p>Te avisa en «Para hacer hoy» cuando llega la fecha.</p></div>'+(n?'<span class="chip '+(n.late?'bad':n.today||n.soon?'warn':'gray')+'">'+(n.late?'Vencido':n.today?'Hoy':'En '+n.days+' días')+'</span>':'')+'</div>';
  if(r) h+='<div class="notice gold" style="margin-bottom:12px">'+I('heart')+'<div><b>Buen momento para escribirle.</b> Hace '+r.months+' meses que volvieron y no tienen otro viaje cargado. Elegí cuándo contactarlo.</div></div>';
  h+='<div class="grid g2" style="gap:12px"><div><label class="f" for="fm-next">Fecha</label><input type="date" id="fm-next" value="'+esc(nn.date||'')+'"></div><div><label class="f" for="fm-nextnote">Para qué</label><input type="text" id="fm-nextnote" value="'+esc(nn.note||'')+'" placeholder="Ej: preguntarle por las vacaciones de invierno"></div></div>'+
   '<div class="row" style="margin-top:10px;gap:8px;flex-wrap:wrap"><span class="small muted">Atajos:</span><button class="btn line sm" data-famnextin="'+f.id+'|7">En 1 semana</button><button class="btn line sm" data-famnextin="'+f.id+'|30">En 1 mes</button><button class="btn line sm" data-famnextin="'+f.id+'|180">En 6 meses</button>'+(n?'<button class="btn sm" data-famnextdone="'+f.id+'">'+I('check')+' Ya lo contacté</button>':'')+'</div><div class="tiny muted" style="margin-top:8px">La fecha se guarda con «Guardar ficha».</div></section>';
  return h;
}
