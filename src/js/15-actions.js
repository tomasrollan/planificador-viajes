/* ======================= acciones ======================= */
function setSlot(c,date,meal,rid,by){
  var d=c.days.filter(function(x){return x.date===date})[0]; var old=d.slots[meal];
  var st=Rules.newSlotState(UI.role,c);
  d.slots[meal]={rid:rid,state:old?old.state:st,time:old?old.time:'',conf:old?old.conf:'',by:by,locked:old?old.locked:false,note:old?old.note:''};
  save(); logAct(c.id,(old?'Cambió ':'Agregó ')+(RID[rid]?RID[rid].name:'una comida')+' · '+fmtShort(date)+' '+mealLabel(meal),'evento',by==='agus'?'agus':'cliente');
}
/* Tabla de acciones de click: se evalúa en orden (la primera que coincide gana).
   {a:'data-x'} coincide si el atributo existe y no está vacío; {a,present:1} si existe aunque esté vacío; {p:fn} es un predicado libre. */
var CLICK=[
 {a:'data-esview', f:function(v,t,at,e){ var mf=t.closest('.mf'), b=t.closest('[data-esview]'); if(!mf) return; var off=mf.classList.toggle('noes'); b.classList.toggle('on',!off); b.setAttribute('aria-pressed',String(!off)); setPref('es',!off); }},
 {a:'data-slide', f:function(v,t,at,e){ var trk=t.closest('.ph').querySelector('.trk'); trk.scrollBy({left:+v*trk.clientWidth,behavior:'smooth'}); }},
 {p:function(t){ return t.classList&&t.classList.contains('mask'); }, f:function(v,t,at,e){ closeModal(); }},
 {p:function(t){ return t.closest('[data-close-go]'); }, f:function(v,t,at,e){ closeModal(); }},
 {a:'data-pf', f:function(v,t,at,e){ UI.pf.f=v; refreshClients(); }},
 {a:'data-opendatos', f:function(v,t,at,e){ UI.tab='datos'; location.hash='cliente-'+v; }},
 {a:'data-opencase', f:function(v,t,at,e){ openCase(v); }},
 {a:'data-newcase',present:1, f:function(v,t,at,e){ openNewCase(at('data-newcase')); }},
 {a:'data-settings', f:function(v,t,at,e){ openSettings(); }},
 {a:'data-savesettings', f:function(v,t,at,e){ S.agency.name=($('#st-name').value||'').trim()||S.agency.name; S.agency.tagline=($('#st-tag').value||'').trim(); var tzv=($('#st-tz')||{}).value; if(tzv){ var tzp=tzv.split('|'); S.agency.tz=tzp[0]; S.agency.tzName=tzp[1]; } save(); closeModal(); render(); toast('Ajustes guardados'); }},
 {a:'data-cview', f:function(v,t,at,e){ UI.cf.view=v; render(); }},
 {a:'data-cfam', f:function(v,t,at,e){ UI.cf.cid=(UI.cf.cid===v?'':v); render(); }},
 {a:'data-savenew', f:function(v,t,at,e){ var nt=($('#nc-title').value||'').trim(); if(!nt){ toast('Poné un título'); return; } var nk=addCase({cid:$('#nc-cid').value,title:nt,type:$('#nc-type').value,priority:$('#nc-prio').value,text:($('#nc-text').value||'').trim(),source:'agencia'}); closeModal(); toast('Caso #'+nk.num+' creado'); render(); }},
 {a:'data-reply', f:function(v,t,at,e){ var pr=v.split('|'), kk=kase(pr[0]), tx2=($('#cm-text').value||'').trim(); if(!tx2){ toast('Escribí un mensaje'); return; } if(UI.role==='agus'){ addMsg(kk,'agus',pr[1],tx2); if(pr[1]==='msg'&&kk.status!=='resuelto') kk.status='esperando'; if(pr[1]==='msg'&&kk.status==='resuelto') kk.status='esperando'; } else { addMsg(kk,'cliente','msg',tx2); if(kk.status==='esperando'||kk.status==='resuelto') kk.status='en_curso'; } save(); render(); openCase(kk.id); }},
 {a:'data-solve', f:function(v,t,at,e){ var k2=kase(v); k2.status='resuelto'; k2.updated=NOW(); addMsg(k2,'agus','sis','Caso marcado como resuelto.'); logAct(k2.cid,'Resolvió el caso #'+k2.num+': '+k2.title,'caso'); save(); closeModal(); render(); toast('Caso resuelto'); }},
 {a:'data-reopen', f:function(v,t,at,e){ var k3=kase(v); k3.status='en_curso'; k3.updated=NOW(); save(); render(); openCase(v); }},
 {a:'data-clireq', f:function(v,t,at,e){ var c11=client(UI.cid), tt=($('#rq-text').value||'').trim(), ti=($('#rq-title').value||'').trim(); if(!tt){ toast('Escribí tu pedido'); return; } var nk2=addCase({cid:c11.id,title:ti||tt.slice(0,60),type:$('#rq-type').value,priority:$('#rq-urg').checked?'alta':'normal',text:tt}); toast('Pedido enviado. Te respondemos acá.'); render(); }},
 {p:function(t){ return t.closest('.modal .x'); }, f:function(v,t,at,e){ closeModal(); }},
 {a:'data-go',present:1, f:function(v,t,at,e){ UI.tab='agenda'; if(v==='catalogo'||v==='casos'||v==='reservas'){ location.hash=v; } else { location.hash=''; UI.route=v; render(); } }},
 {a:'data-role', f:function(v,t,at,e){ UI.role=v; UI.tab='agenda'; location.hash=''; render(); }},
 {a:'data-fz',present:1, f:function(v,t,at,e){ UI.filt.zone=at('data-fz'); refreshCat(); }},
 {a:'data-fd',present:1, f:function(v,t,at,e){ UI.filt.dest=at('data-fd'); UI.filt.zone=''; render(); }},
 {a:'data-newclient', f:function(v,t,at,e){ newTripModal(); }},
 {a:'data-newtrip', f:function(v,t,at,e){ createTrip(v); }},
 {a:'data-viewas', f:function(v,t,at,e){ UI.preview=true; UI.role='cliente'; UI.cid=v; UI.unlocked[v]=true; UI.tab='agenda'; location.hash='portal-'+client(v).token; }},
 {a:'data-tab', f:function(v,t,at,e){ UI.tab=v; render(); }},
 {a:'data-ptab', f:function(v,t,at,e){ UI.tab=v; render(); window.scrollTo(0,0); }},
 {a:'data-export', f:function(v,t,at,e){ downloadFile('copia-planificador-'+todayISO()+'.json',Repo.exportJSON(S),'application/json'); }},
 {a:'data-doimport', f:function(v,t,at,e){ var b=UI.imp; if(!b) return; S=b.state; repo.set(S); repo.save(); UI.imp=null; closeModal(); render(); toast('Copia importada'); }},
 {a:'data-resetdemo', f:function(v,t,at,e){ S=repo.reset(); toast('Datos de la demo restablecidos'); render(); }},
 {a:'data-markres', f:function(v,t,at,e){ var p=v.split('|'); openMarkRes(p[0],p[1],p[2]); }},
 {a:'data-copyshare', f:function(v,t,at,e){ copy(shareText(client(v)),'Plan copiado para WhatsApp'); }},
 {a:'data-copylink', f:function(v,t,at,e){ copy(linkFor(client(v)),'Link copiado'); }},
 {a:'data-copymsg', f:function(v,t,at,e){ copy(accessMsg(client(v)),'Mensaje copiado'); }},
 {a:'data-copytxt', f:function(v,t,at,e){ copy(decodeURIComponent(v),'Tarjeta copiada'); }},
 {a:'data-newpin', f:function(v,t,at,e){ client(v).pin=genPin(); save(); logAct(v,'Generó un nuevo PIN de acceso','evento'); toast('Nuevo PIN generado'); render(); }},
 {a:'data-savedatos', f:function(v,t,at,e){ var c3=client(UI.cid); c3.name=$('#d-name').value.trim()||c3.name; c3.destination=$('#d-dest').value; c3.phone=(($('#d-phone')||{}).value||'').trim(); var ns=$('#d-start').value, ne=$('#d-end').value; if(ns&&ne&&ne>=ns&&(ns!==c3.start||ne!==c3.end)){ var old={}; c3.days.forEach(function(d){old[d.date]=d}); c3.start=ns; c3.end=ne; c3.days=mkDays(ns,ne).map(function(d){return old[d.date]||d}); } readDestFields(c3); c3.mode=$('#d-mode').value; c3.notes=$('#d-notes').value; save(); logAct(c3.id,'Actualizó los datos del viaje','evento'); toast('Datos guardados'); render(); }},
 {a:'data-addtrav', f:function(v,t,at,e){ var c4=client(UI.cid); c4.travelers.push({id:uid(),name:'Viajero '+(c4.travelers.length+1),type:'adulto',allergies:''}); save(); render(); }},
 {a:'data-deltrav', f:function(v,t,at,e){ var c5=client(UI.cid); if(c5.travelers.length>1){ c5.travelers.splice(+v,1); save(); render(); } else toast('Tiene que quedar al menos un viajero'); }},
 {a:'data-unlock', f:function(v,t,at,e){ var c6=client(v), val=($('#pin').value||'').trim(); if(val===c6.pin){ UI.unlocked[v]=true; render(); } else { $('#pinerr').textContent='Código incorrecto. Revisalo o pedíselo a la agencia.'; } }},
 {a:'data-add', f:function(v,t,at,e){ var p3=v.split('|'); openPicker(UI.cid,p3[0],p3[1]); }},
 {a:'data-pick', f:function(v,t,at,e){ setSlot(client(PK.cid),PK.date,PK.meal,v,UI.role==='agus'?'agus':'cliente'); closeModal(); render(); toast('Agregado a la agenda'); }},
 {a:'data-edit', f:function(v,t,at,e){ var p4=v.split('|'); openSlotEditor(UI.cid,p4[0],p4[1]); }},
 {a:'data-repick', f:function(v,t,at,e){ var p5=v.split('|'); closeModal(); openPicker(UI.cid,p5[0],p5[1]); }},
 {a:'data-clearslot', f:function(v,t,at,e){ var p6=v.split('|'); var c8=client(UI.cid); var d8=c8.days.filter(function(x){return x.date===p6[0]})[0]; if(canEdit(c8,d8.slots[p6[1]])){ var old8=d8.slots[p6[1]]; d8.slots[p6[1]]=null; save(); logAct(c8.id,'Quitó '+(old8&&RID[old8.rid]?RID[old8.rid].name:'una comida')+' · '+fmtShort(p6[0])+' '+mealLabel(p6[1]),'evento'); closeModal(); render(); toast('Comida quitada',{label:'Deshacer',fn:function(){ d8.slots[p6[1]]=old8; save(); render(); }}); } }},
 {a:'data-saveslot', f:function(v,t,at,e){ var p7=v.split('|'); var c9=client(UI.cid); var d9=c9.days.filter(function(x){return x.date===p7[0]})[0]; var s9=d9.slots[p7[1]]; var oldSt9=s9.state, oldT9=s9.time, oldC9=s9.conf; s9.state=$('#se-state').value; s9.time=$('#se-time').value; s9.conf=$('#se-conf').value; s9.note=$('#se-note').value; if(UI.role==='agus'){ s9.locked=!!$('#se-lock').checked; } s9.by=UI.role==='agus'?'agus':'cliente'; save(); if(oldSt9!==s9.state||oldT9!==s9.time||oldC9!==s9.conf) logAct(c9.id,(RID[s9.rid]?RID[s9.rid].name:'Comida')+' · '+fmtShort(p7[0])+' '+mealLabel(p7[1])+': '+STATES[s9.state][0]+(s9.time?' a las '+s9.time:'')+(s9.conf?' (conf. '+s9.conf+')':''),oldSt9!==s9.state&&s9.state==='reservada'?'reserva':'evento'); closeModal(); render(); toast('Guardado'); }},
 {a:'data-undo',present:1, f:function(v,t,at,e){ if(UI.undo){ UI.undo(); UI.undo=null; } var tt=$('.toast'); if(tt) tt.remove(); }},
 {a:'data-jump', f:function(v,t,at,e){ var el=document.getElementById('day-'+v); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }},
 {a:'data-ics', f:function(v,t,at,e){ var ci=client(v); if(ci) downloadFile('itinerario-'+(ci.name||'viaje').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.ics',icsFor(ci),'text/calendar'); }},
 {a:'data-print',present:1, f:function(v,t,at,e){ try{ window.print(); }catch(e){ toast('Este navegador no permite imprimir desde acá'); } }},
 {a:'data-aview', f:function(v,t,at,e){ UI.aview=v; render(); }},
 {a:'data-fakeday',present:1, f:function(v,t,at,e){ var cf=client(UI.cid); if(UI.fakeToday){ UI.fakeToday=null; } else if(cf){ UI.fakeToday=(cf.days[1]||cf.days[0]).date; } UI.tab='agenda'; render(); window.scrollTo(0,0); }},
 {a:'data-alq',present:1, f:function(v,t,at,e){ document.querySelectorAll('.alq').forEach(function(x){ x.open=true; }); var a1=document.querySelector('.alq'); if(a1&&a1.scrollIntoView) a1.scrollIntoView({behavior:'smooth',block:'center'}); else toast('Este restaurante no publica opciones para alergias: consultalo con la agencia'); }},
 {a:'data-statgo', f:function(v,t,at,e){ if(v==='casos') location.hash='casos'; else if(v==='reservas') location.hash='reservas'; else { var el2=document.getElementById('clientes'); if(el2) el2.scrollIntoView({behavior:'smooth'}); } }},
 {a:'data-savemr', f:function(v,t,at,e){ var pm=v.split('|'); var cm=client(pm[0]); var dm=cm.days.filter(function(x){return x.date===pm[1]})[0]; var sm=dm.slots[pm[2]]; sm.state='reservada'; sm.time=$('#mr-time').value; sm.conf=($('#mr-conf').value||'').trim(); sm.locked=!!$('#mr-lock').checked; sm.by='agus'; save(); logAct(cm.id,'Reservó '+(RID[sm.rid]?RID[sm.rid].name:'')+' · '+fmtShort(pm[1])+' '+mealLabel(pm[2])+(sm.time?' a las '+sm.time:'')+(sm.conf?' (conf. '+sm.conf+')':''),'reserva'); closeModal(); render(); toast('Reserva guardada'); }},
 {a:'data-qr', f:function(v,t,at,e){ var pr=v.split('|'), mm=AT.macros().filter(function(x){return x.id===pr[0]})[0], kk=kase(pr[1]), ta=$('#cm-text'); if(ta&&mm&&kk){ var tx=AT.fill(mm.text,macroVars(kk)); ta.value=(ta.value?ta.value+'\n':'')+tx; ta.focus(); } }},
 {a:'data-sub', f:function(v,t,at,e){ var q9=v.split('|'); if(q9[0]==='cat'){ UI.csub=q9[1]; render(); return; } UI.tab=q9[0]; if(q9[0]==='rest') UI.rsub=q9[1]; else UI.vsub=q9[1]; render(); window.scrollTo(0,0); }},
 {a:'data-mdiet', f:function(v,t,at,e){ UI.mdiet=UI.mdiet||{}; UI.mdiet[v]=!UI.mdiet[v]; var bt=t.closest('[data-mdiet]'); if(bt) bt.classList.toggle('on',!!UI.mdiet[v]); applyMenuFilter(); }},
 {a:'data-ask', f:function(v,t,at,e){ var a0=ASKREG[+v]; if(a0) openAsk(a0); }},
 {a:'data-askgen',present:1, f:function(v,t,at,e){ openAsk({topic:'transporte'}); }},
 {a:'data-sendask',present:1, f:function(v,t,at,e){ sendAsk(); }},
 {a:'data-sendreq', f:function(v,t,at,e){ var p8=v.split('|'); var c10=client(UI.cid); var tx=($('#rq').value||'').trim(); if(!tx){ toast('Escribí qué querés cambiar'); return; } var d10=c10.days.filter(function(x){return x.date===p8[0]})[0], s10=d10&&d10.slots[p8[1]], r10=s10&&RID[s10.rid]; addCase({cid:c10.id,title:'Cambio de reserva'+(r10?': '+r10.name:'')+' · '+fmtDate(p8[0]),type:'Cambio de reserva',priority:'normal',text:tx,ref:{date:p8[0],slot:p8[1]}}); closeModal(); toast('Pedido enviado a '+S.agency.name); render(); }},
 {p:function(t){ return t.closest('[data-fav]'); }, f:function(v,t,at,e){ var id=t.closest('[data-fav]').getAttribute('data-fav'); var cl=client(UI.cid); if(cl){ var w=who(cl); var a=cl.favs[w]=cl.favs[w]||[]; var i=a.indexOf(id); if(i>=0) a.splice(i,1); else a.push(id); save(); if($('#modalRoot')) modalRest(id,{c:cl}); else refreshCat(); } }},
 {a:'data-addto', f:function(v,t,at,e){ var cl2=client(UI.cid); closeModal(); var opts=''; cl2.days.forEach(function(d){ MEALS.forEach(function(m){ if(!d.slots[m[0]]) opts+='<option value="'+d.date+'|'+m[0]+'">'+fmtDate(d.date)+' · '+m[1]+'</option>'; }); });
    showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Agendar</span><h3 style="padding-right:40px;font-size:19px;font-weight:900;margin:4px 0 12px">'+esc(RID[v].name)+'</h3><label class="f">¿Qué día y comida?</label>'+(opts?'<select id="addsel">'+opts+'</select><div class="row" style="margin-top:14px"><button class="btn" data-doadd="'+v+'">'+I('check')+' Agregar</button></div>':'<div class="empty">No hay lugares libres en la agenda.</div>')+'</div></div></div>'); }},
 {a:'data-doadd', f:function(v,t,at,e){ var sel=$('#addsel').value.split('|'); setSlot(client(UI.cid),sel[0],sel[1],v,UI.role==='agus'?'agus':'cliente'); closeModal(); render(); toast('Agregado a la agenda'); }},
 {a:'data-open', f:function(v,t,at,e){ modalRest(v,{c:(UI.route==='portal'||UI.route==='cliente')?client(UI.cid):null}); }}
];
document.addEventListener('click',function(e){
  var t=e.target; function at(a){ var n=t.closest('['+a+']'); return n?n.getAttribute(a):null; }
  for(var i=0;i<CLICK.length;i++){ var h=CLICK[i], v=null;
    if(h.p){ if(!h.p(t)) continue; }
    else { v=at(h.a); if(h.present?v===null:!v) continue; }
    h.f(v,t,at,e); return;
  }
});
document.addEventListener('keydown',function(e){ var mr=$('#modalRoot'); if(!mr) return; if(e.key==='Escape'){ closeModal(); return; } if(e.key==='Tab'){ var f=[].slice.call(mr.querySelectorAll('a[href],button:not([disabled]),input,select,textarea')).filter(function(x){return x.offsetParent!==null}); if(!f.length) return; var a=document.activeElement, mo=mr.querySelector('.modal'); if(e.shiftKey&&(a===f[0]||a===mo)){ e.preventDefault(); f[f.length-1].focus(); } else if(!e.shiftKey&&a===f[f.length-1]){ e.preventDefault(); f[0].focus(); } } });
document.addEventListener('input',function(e){ var t=e.target; if(t.id==='mr-time'&&UI.se){ var r7=RID[UI.se.rid], w7=$('#mr-warn'); if(r7&&w7) w7.innerHTML=timeWarnHtml(r7,UI.se.date,t.value); } if(t.id==='mq') applyMenuFilter(); if(t.id==='se-time'&&UI.se){ var r8=RID[UI.se.rid], w8=$('#se-timewarn'); if(r8&&w8) w8.innerHTML=timeWarnHtml(r8,UI.se.date,t.value); } });
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.id==='imp-file'){ var fl=t.files&&t.files[0]; if(!fl) return; var rd=new FileReader(); rd.onload=function(){ var r=Repo.parseBackup(String(rd.result||'')); t.value=''; if(r.error){ toast(r.error); return; } UI.imp=r; var when=r.exported?new Date(r.exported).toLocaleString('es-AR'):'fecha desconocida'; showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Importar copia</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 10px">¿Reemplazar los datos actuales?</h3><p class="small">La copia es del '+esc(when)+' y trae '+r.clients+' clientes y '+r.cases+' casos. Se pierde lo que hay ahora en este navegador.</p><div class="row" style="margin-top:14px"><button class="btn" data-doimport="1">'+I('check')+' Reemplazar</button><button class="btn line" data-close="1">Cancelar</button></div></div></div></div>'); }; rd.onerror=function(){ toast('No se pudo leer el archivo'); }; rd.readAsText(fl); return; }
  if(t.id==='f-tipo'){ UI.filt.tipo=t.value; refreshCat(); } else if(t.id==='f-cred'){ UI.filt.cred=t.value; refreshCat(); } else if(t.id==='f-tier'){ UI.filt.tier=t.value; refreshCat(); } else if(t.id==='f-sort'){ UI.filt.sort=t.value; refreshCat(); } else if(t.id==='f-rated'){ UI.filt.onlyRated=t.checked; refreshCat(); }
  else if(t.id==='who'){ UI.who=t.value; render(); }
  else if(t.id==='cf-cid'){ UI.cf.cid=t.value; render(); } else if(t.id==='cf-prio'){ UI.cf.prio=t.value; render(); } else if(t.id==='cf-st'){ UI.cf.st=t.value; render(); } else if(t.id==='cf-type'){ UI.cf.type=t.value; render(); }
  else if(t.hasAttribute('data-case')){ var kc=kase(t.getAttribute('data-case')); if(t.id==='cs-st'){ kc.status=t.value; addMsg(kc,'agus','sis','Estado: '+CST[t.value][0]+'.'); } else if(t.id==='cs-prio'){ kc.priority=t.value; kc.due=kc.created+PRIO[t.value][2]*36e5; } else if(t.id==='cs-type'){ kc.type=t.value; } kc.updated=NOW(); save(); render(); openCase(kc.id); }
  else if(t.hasAttribute('data-park')){ var c=client(UI.cid); c.days.filter(function(x){return x.date===t.getAttribute('data-park')})[0].park=t.value; save(); render(); }
  else if(t.hasAttribute('data-tv')){ var p=t.getAttribute('data-tv').split('|'); client(UI.cid).travelers[+p[0]][p[1]]=t.value; save(); }
  else if(t.hasAttribute('data-dest')){ var cd=client(UI.cid); readDestFields(cd); if(setDests(cd,t.getAttribute('data-dest'),t.checked)){ save(); } render(); }
});
document.addEventListener('input',function(e){
  var t=e.target;
  if(t.id==='q'){ UI.filt.q=t.value; refreshCat(); }
  else if(t.id==='pc-q'){ UI.pf.q=t.value; refreshClients(); }
  else if(t.id==='cf-q'){ UI.cf.q=t.value; refreshCases(); }
  else if(t.id==='pkq'){ PK.q=t.value; drawPicker(); }
  else if(t.hasAttribute('data-tv')){ var p=t.getAttribute('data-tv').split('|'); client(UI.cid).travelers[+p[0]][p[1]]=t.value; save(); }
});
function refreshCat(){ var cat=$('#cat'); if(!cat){ render(); return; } var c=(UI.route==='portal')?client(UI.cid):null; cat.innerHTML=catalogGrid({c:c}); document.querySelectorAll('[data-fz]').forEach(function(p){ p.classList.toggle('on',p.getAttribute('data-fz')===UI.filt.zone); }); }
document.addEventListener('scroll',function(e){ var tr=e.target; if(!tr||!tr.classList||!tr.classList.contains('trk')) return; var i=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth)); var d=tr.parentNode.querySelectorAll('.dts i'); for(var x=0;x<d.length;x++) d[x].classList.toggle('on',x===i); },true);
window.addEventListener('hashchange',function(){ closeModal(); render(); });
document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeModal(); if(e.key==='Enter'&&e.target.id==='pin'){ var b=$('[data-unlock]'); if(b) b.click(); } });
