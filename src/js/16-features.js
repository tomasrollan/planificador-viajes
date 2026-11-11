/* ======================= funciones nuevas: sugerir agenda, copiar día y plantillas, calculadora del plan, mensajes de WhatsApp, formulario de ingreso, búsqueda de platos ======================= */
function fmodal(eyebrow,title,body){ showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1" aria-label="Cerrar">'+I('x')+'</button><div class="pad"><span class="eyebrow">'+eyebrow+'</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 12px;padding-right:40px">'+title+'</h3>'+body+'</div></div></div>'); }
function mealNm(k){ var m=MEALS.filter(function(x){return x[0]===k})[0]; return m?m[1]:k; }
function mealOkFn(r,m){ if(r.dest==='uor'){ if(!r.meals) return null; return r.meals.indexOf({breakfast:'B',lunch:'L',dinner:'D'}[m])>=0; } var x=Rules.mealServed((window.HORARIOS||{})[r.path],m); return x?x.ok:null; }
function usd(x){ return 'US$ '+Math.round(x).toLocaleString('es-AR'); }
function agentTools(c){
  return '<div class="row agtools"><button class="btn sm" data-sugg="1">'+I('sparkles')+' Sugerir agenda</button><button class="btn ice sm" data-copyday="1">'+I('copy')+' Copiar un día</button><button class="btn ice sm" data-tpl="1">'+I('list')+' Plantillas</button>'+(hasDest(c,'wdw')?'<button class="btn ice sm" data-plancalc="1">'+I('ticket')+' ¿Conviene el plan de Disney?</button>':'')+'<button class="btn wa sm" data-msgs="">'+I('chat')+' Mensajes</button></div>';
}
function undoable(c,msg){ var snap=JSON.stringify(c.days); toast(msg,{label:'Deshacer',fn:function(){ c.days=JSON.parse(snap); save(); render(); }}); }

/* ---------- 1) sugerir agenda ---------- */
function openSuggest(){
  var c=client(UI.cid); if(!c) return;
  var res=Suggest.suggest(c,R,{parkZone:PARKZONE,destOf:destOfPark,rid:RID,mealOk:mealOkFn}); UI.sug=res;
  var body='<p class="small muted" style="margin:0 0 12px">Propuestas armadas con reglas: parque del día, '+(hasDest(c,'wdw')?'plan de comidas y créditos, ':'')+'favoritos, '+(hasDest(c,'wdw')?'valoración':'platos destacados')+' y las preferencias del formulario. Nada se reserva ni se envía al cliente: quedan como «Idea» para que las revises.</p>';
  if(!res.picks.length){ body+='<div class="empty">No hay nada para sugerir ahora.</div>'; }
  else { body+=res.picks.map(function(p,i){ var r=RID[p.rid]; return '<label class="sugi"><input type="checkbox" class="sugchk" data-i="'+i+'" checked><div><b>'+esc(fmtDate(p.date))+' · '+esc(mealNm(p.meal))+'</b><div>'+esc(r.name)+'</div><div class="row" style="gap:5px;margin-top:4px">'+p.why.map(function(w){ return '<span class="chip '+(/difícil/.test(w)?'warn':'gray')+'">'+esc(w)+'</span>'; }).join('')+'</div></div></label>'; }).join('');
    if(hasDest(c,'wdw')&&c.plan!=='none') body+='<div class="tiny muted" style="margin-top:8px">Con estas propuestas se usarían '+res.credits.usedAfter+' de '+res.credits.total+' créditos por persona.</div>'; }
  if(res.skipped.length){ body+='<details style="margin-top:12px"><summary class="small" style="font-weight:700;cursor:pointer">'+res.skipped.length+' lugares que no pude completar</summary><div class="small muted" style="margin-top:6px">'+res.skipped.slice(0,12).map(function(s){ return '• '+esc(fmtDate(s.date))+(s.meal?' · '+esc(mealNm(s.meal)):'')+': '+esc(s.reason); }).join('<br>')+'</div></details>'; }
  if(res.picks.length) body+='<div class="row" style="margin-top:14px"><button class="btn" data-applysug="1">'+I('check')+' Agregar las marcadas</button><button class="btn line" data-close="1">Cancelar</button></div>';
  fmodal('Agenda sugerida','Propuesta para '+esc(c.name),body);
}
function applySuggest(){
  var c=client(UI.cid), res=UI.sug; if(!c||!res) return; var snap=JSON.stringify(c.days), n=0;
  [].forEach.call(document.querySelectorAll('.sugchk'),function(b){ if(!b.checked) return; var p=res.picks[+b.getAttribute('data-i')]; var d=c.days.filter(function(x){return x.date===p.date})[0]; if(!d||d.slots[p.meal]) return; var s=Templates.newSlot(p.rid); s.sug=true; d.slots[p.meal]=s; n++; });
  save(); closeModal(); render(); toast('Agregué '+n+(n===1?' comida':' comidas')+' como idea',{label:'Deshacer',fn:function(){ c.days=JSON.parse(snap); save(); render(); }});
}

/* ---------- 2) copiar un día y plantillas ---------- */
function openCopyDay(){
  var c=client(UI.cid); if(!c) return;
  var withC=c.days.filter(function(d){ return d.park||MEALS.some(function(m){return d.slots[m[0]]}); });
  if(!withC.length){ fmodal('Copiar un día','Todavía no hay nada para copiar','<div class="empty">Armá primero un día (parque y comidas) y después lo copiás a los otros.</div>'); return; }
  var body='<label class="f">Día a copiar</label><select id="cd-from">'+withC.map(function(d){ return '<option value="'+d.date+'">'+esc(fmtDate(d.date))+(d.park?' · '+esc(d.park):'')+'</option>'; }).join('')+'</select>'+
   '<label class="f" style="margin-top:12px">Copiar a</label><div class="cdlist">'+c.days.map(function(d){ return '<label class="sugi"><input type="checkbox" class="cdchk" value="'+d.date+'"><div><b>'+esc(fmtDate(d.date))+'</b><div class="small muted">'+esc(d.park||'Sin parque')+'</div></div></label>'; }).join('')+'</div>'+
   '<div class="tiny muted" style="margin:8px 0 0">Solo completa lugares vacíos: no pisa comidas que ya cargaste. Las copias quedan como «Idea», sin hora ni confirmación.</div><div class="row" style="margin-top:14px"><button class="btn" data-docopyday="1">'+I('check')+' Copiar</button><button class="btn line" data-close="1">Cancelar</button></div>';
  fmodal('Agenda','Copiar un día a otros',body);
}
function doCopyDay(){
  var c=client(UI.cid), from=$('#cd-from').value, tos=[].filter.call(document.querySelectorAll('.cdchk'),function(b){return b.checked}).map(function(b){return b.value});
  if(!tos.length){ toast('Elegí al menos un día de destino'); return; }
  var snap=JSON.stringify(c.days), r=Templates.copyDay(c,from,tos); save(); closeModal(); render();
  toast(r.copied?('Copiadas '+r.copied+(r.copied===1?' comida':' comidas')+(r.skipped?' · '+r.skipped+' ya estaban cargadas':'')):'No había lugares vacíos para copiar',r.copied?{label:'Deshacer',fn:function(){ c.days=JSON.parse(snap); save(); render(); }}:null);
}
function openTemplates(){
  var c=client(UI.cid); if(!c) return; var L=S.templates||[];
  var body='<p class="small muted" style="margin:0 0 12px">Guardá un viaje armado para reutilizarlo con otro cliente. Se aplica día con día y solo completa lugares vacíos.</p>'+
   (L.length?L.map(function(t){ var n=0; t.days.forEach(function(d){ n+=Object.keys(d.slots).length; }); return '<div class="card" style="box-shadow:none;padding:12px;margin-bottom:8px"><div class="row between"><div><b>'+esc(t.name)+'</b><div class="small muted">'+t.nights+' días · '+n+' comidas · '+esc((PLANS[t.plan]||PLANS.none).n)+'</div></div><div class="row" style="gap:6px"><button class="btn sm" data-tplapply="'+t.id+'">Aplicar</button><button class="btn danger sm" data-tpldel="'+t.id+'" aria-label="Borrar plantilla">'+I('trash')+'</button></div></div></div>'; }).join(''):'<div class="empty" style="margin-bottom:12px">Todavía no hay plantillas guardadas.</div>')+
   '<label class="f" style="margin-top:12px">Guardar este viaje como plantilla</label><div class="row" style="flex-wrap:nowrap"><input type="text" id="tpl-name" placeholder="Ej: 6 noches, plan base, 4 parques" style="flex:1"><button class="btn" data-tplsave="1">Guardar</button></div>';
  fmodal('Plantillas','Plantillas de agenda',body);
}

/* ---------- 3) calculadora del plan ---------- */
function calcBase(c){ var adults=c.travelers.filter(function(t){return t.type!=='niño'}).length, tc=PlanCalc.tableCostPerAdult(c,RID); return {adults:adults,kids:c.travelers.length-adults,tc:tc}; }
function openPlanCalc(){
  var c=client(UI.cid); if(!c) return; var b=calcBase(c), pk=c.plan==='premium'?'premium':'base';
  var body='<div class="grid g2" style="gap:12px"><div><label class="f">Plan a comparar</label><select id="pc-plan"><option value="base"'+(pk==='base'?' selected':'')+'>Plan base (Table-Service)</option><option value="premium"'+(pk==='premium'?' selected':'')+'>Plan premium (Deluxe)</option></select></div><div><label class="f">Adultos</label><input type="number" min="0" id="pc-adults" value="'+b.adults+'"></div><div><label class="f">Noches</label><input type="number" min="0" id="pc-nights" value="'+nights(c)+'"></div>'+
   '<div><label class="f">Comidas de mesa por adulto (US$)</label><input type="number" min="0" id="pc-table" value="'+Math.round(b.tc.cost)+'"></div><div><label class="f">Comida rápida y snacks por persona y noche (US$)</label><input type="number" min="0" id="pc-extras" value="'+PlanCalc.DEFAULT_EXTRAS+'"></div><div><label class="f">Precio plan base por adulto y noche (US$)</label><input type="number" step="0.01" min="0" id="pc-rt" value="'+PlanCalc.RATES.table+'"></div><div><label class="f">Precio plan premium por adulto y noche (US$)</label><input type="number" step="0.01" min="0" id="pc-rd" value="'+PlanCalc.RATES.deluxe+'"></div></div>'+
   '<div id="pc-out" style="margin-top:14px"></div><div class="notice" style="margin-top:12px">'+I('info')+'<div><b>Cómo se calcula:</b> las comidas de mesa salen de la agenda cargada ('+(b.tc.assumed?'todavía no hay agenda: se supone una comida de mesa por crédito del plan a un precio medio':b.tc.meals+' comidas')+', con los precios estimados por nivel de restaurante). El plan incluye además otras cosas (por ejemplo comida rápida y snacks): por eso se suma un supuesto por noche que podés cambiar. Los precios del plan son los '+esc(PlanCalc.RATES.asof)+'. Es una estimación para conversar con el cliente, no una cotización.'+(b.kids?' <b>Hay '+b.kids+(b.kids===1?' niño':' niños')+' que no se incluyen:</b> Disney publica otra tarifa para ellos.':'')+'</div></div><div class="row" style="margin-top:12px"><button class="btn wa" data-pccopy="1">'+I('copy')+' Copiar resumen</button></div>';
  fmodal('Plan de comidas','¿Conviene el plan?',body); updateCalc();
}
function readCalc(){
  var c=client(UI.cid), b=calcBase(c), v=function(id){ var e=$('#'+id); return e?parseFloat(e.value)||0:0; };
  return PlanCalc.compare({planKey:$('#pc-plan').value,adults:v('pc-adults'),nights:v('pc-nights'),tableCostPerAdult:v('pc-table'),tableMeals:b.tc.meals,extrasPerNight:v('pc-extras'),rates:{table:v('pc-rt'),deluxe:v('pc-rd')}});
}
function calcText(r){ return r.verdict==='plan'?'Con estos supuestos el plan cuesta '+usd(Math.abs(r.diff))+' menos que pagar aparte.':r.verdict==='sin_plan'?'Con estos supuestos pagar aparte cuesta '+usd(Math.abs(r.diff))+' menos que el plan.':r.verdict==='parecido'?'Con estos supuestos el costo es casi igual (diferencia menor al 5 %).':'Completá adultos y noches para comparar.'; }
function updateCalc(){
  var o=$('#pc-out'); if(!o) return; var r=readCalc();
  o.innerHTML='<div class="grid g2" style="gap:10px"><div class="card" style="box-shadow:none;padding:14px"><div class="tiny muted">Con plan de comidas</div><div style="font:900 22px var(--fh)">'+usd(r.planCost)+'</div></div><div class="card" style="box-shadow:none;padding:14px"><div class="tiny muted">Pagando aparte</div><div style="font:900 22px var(--fh)">'+usd(r.outOfPocket)+'</div></div></div><div class="notice '+(r.verdict==='plan'?'':'gold')+'" style="margin-top:10px">'+I('info')+'<div><b>'+esc(calcText(r))+'</b>'+(r.unusedCredits>0?'<br>Con la agenda actual quedarían <b>'+r.unusedCredits+'</b> créditos de mesa por persona sin usar: completar la agenda mejora el plan.':'')+'</div></div>';
}
function calcSummary(){ var c=client(UI.cid), r=readCalc(); return '*¿Conviene el plan de comidas? · '+c.name+'*\n'+r.adults+' adultos · '+r.nights+' noches\n• Con plan ('+(r.planKey==='premium'?'premium':'base')+'): '+usd(r.planCost)+'\n• Pagando aparte (comidas de mesa + comida rápida y snacks): '+usd(r.outOfPocket)+'\n'+calcText(r)+'\n\nEs una estimación orientativa (no incluye niños, bebidas alcohólicas ni propinas). Los precios pueden cambiar.'; }

/* ---------- 4) mensajes de WhatsApp ---------- */
function msgCtx(c){
  var w=resWindow(c), hard=[], reserved=[], uo=hasDest(c,'uor'), wd=hasDest(c,'wdw');
  c.days.forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots[m[0]], r=s&&RID[s.rid]; if(!r) return; if(r.diff===3&&s.state!=='reservada'&&hard.indexOf(r.name)<0) hard.push(r.name); if(s.state==='reservada') reserved.push({when:dayName(d.date)+' '+dayLong(d.date),meal:m[1],name:r.name,time:s.time,conf:s.conf}); }); });
  return {name:c.name,agency:S.agency.name,link:linkFor(c),pin:c.pin,start:fmtShort(c.start),end:fmtShort(c.end),hotel:hotelLine(c),wdw:wd,uor:uo,uorText:uo?uorAdvice(c).text:'',openDate:fmtShort(w.open),openTime:flToArg(w.open),tz:agencyTzName(),hard:hard.slice(0,4),reserved:reserved,allergies:algText(c)};
}
function waHref(c,text){ var ph=String(c.phone||'').replace(/\D/g,''); return 'https://wa.me/'+ph+'?text='+encodeURIComponent(text); }
function openMsgs(kind){
  var c=client(UI.cid); if(!c) return; kind=kind||'bienvenida'; var text=Messages.build(kind,msgCtx(c));
  var body='<label class="f">Mensaje</label><select id="ms-kind">'+Messages.KINDS.map(function(k){ return '<option value="'+k[0]+'"'+(k[0]===kind?' selected':'')+'>'+esc(k[1])+'</option>'; }).join('')+'</select><label class="f" style="margin-top:12px">Texto (editalo antes de enviar)</label><textarea id="ms-text" rows="10" style="width:100%">'+esc(text)+'</textarea>'+
   '<div class="row" style="margin-top:12px"><button class="btn" data-mscopy="1">'+I('copy')+' Copiar</button><a class="btn wa" id="ms-wa" target="_blank" rel="noopener" href="'+esc(waHref(c,text))+'">'+I('chat')+' Abrir WhatsApp</a></div><div class="tiny muted" style="margin-top:8px">'+(c.phone?'Se abre el chat con '+esc(c.phone)+'.':'Cargá el teléfono del cliente en «Datos del viaje» para abrir el chat directo; si no, WhatsApp te deja elegir el contacto.')+'</div>';
  fmodal('WhatsApp','Mensajes para '+esc(c.name),body);
}

/* ---------- 5) formulario de ingreso (cliente) ---------- */
var INTAKE_STYLES=[['P','Comidas con personajes'],['B','Buffet o estilo familiar'],['S','Shows o cenas con espectáculo']];
function intakeTravRow(t,i){ return '<div class="card itrow" style="box-shadow:none;padding:14px"><div class="grid g3" style="gap:10px"><div><label class="f">Nombre</label><input type="text" class="it-name" value="'+esc(t.name||'')+'"></div><div><label class="f">Tipo</label><select class="it-type"><option'+(t.type==='adulto'?' selected':'')+'>adulto</option><option'+(t.type==='niño'?' selected':'')+'>niño</option></select></div><div><label class="f">Alergias / dieta</label><input type="text" class="it-alg" value="'+esc(t.allergies||'')+'" placeholder="Ej: maní, gluten, vegetariano"></div></div><div style="margin-top:8px"><button class="btn danger sm" data-itdel="'+i+'">'+I('trash')+' Quitar</button></div></div>'; }
function intakeForm(c){
  var it=c.intake||{}, p=it.prefs||{}, trav=(it.travelers&&it.travelers.length?it.travelers:c.travelers.map(function(t){return {name:t.name,type:t.type,allergies:t.allergies};}));
  var done=!!(it.done);
  return '<section class="sec" id="intake"><div class="sec-h"><div><span class="eyebrow">Contanos de tu grupo</span><h3>'+I('user')+' Formulario del viaje</h3><p>Con estos datos '+esc(S.agency.name)+' arma tu agenda de comidas sin errores. Podés editarlo y volver a enviarlo.</p></div></div>'+
   (done?'<div class="notice" style="margin-bottom:14px;background:var(--ok-soft);border-color:var(--ok-line)">'+I('check')+'<div><b>Enviado el '+esc(new Date(it.at).toLocaleDateString('es-AR'))+'.</b> La agencia ya lo recibió. Si algo cambia, corregilo y enviá de nuevo.</div></div>':'')+
   '<label class="f">Tu WhatsApp o teléfono</label><input type="text" id="it-phone" inputmode="tel" value="'+esc(it.phone||c.phone||'')+'" placeholder="Ej: +54 9 11 1234 5678">'+
   '<h4 style="font:800 15px var(--fh);margin:18px 0 8px">Quiénes viajan</h4><div class="grid" id="it-trav">'+trav.map(intakeTravRow).join('')+'</div><div style="margin-top:8px"><button class="btn ice sm" data-itadd="1">'+I('plus')+' Agregar viajero</button></div>'+
   '<h4 style="font:800 15px var(--fh);margin:18px 0 8px">Qué les gusta</h4><div class="row" style="gap:8px">'+INTAKE_STYLES.map(function(s){ return '<label class="pill itst'+((p.styles||[]).indexOf(s[0])>=0?' on':'')+'" style="cursor:pointer"><input type="checkbox" class="it-style" value="'+s[0]+'"'+((p.styles||[]).indexOf(s[0])>=0?' checked':'')+' style="position:absolute;opacity:0;width:0;height:0"> '+s[1]+'</label>'; }).join('')+'</div>'+
   '<div class="grid g2" style="gap:12px;margin-top:12px"><div><label class="f">Presupuesto por comida (por persona)</label><select id="it-budget"><option value="2"'+(p.budget==='2'?' selected':'')+'>Económico (hasta US$ 35)</option><option value="3"'+(p.budget==='3'?' selected':'')+'>Medio (hasta US$ 60)</option><option value="4"'+((!p.budget||p.budget==='4')?' selected':'')+'>Sin límite</option></select></div><div><label class="f">Comidas o cocinas que NO les gustan</label><input type="text" id="it-avoid" value="'+esc(p.avoid||'')+'" placeholder="Ej: mariscos, picante"></div><div><label class="f">Cumpleaños o fecha especial</label><input type="text" id="it-occ" value="'+esc(p.occasion||'')+'" placeholder="Ej: cumple de Sofi"></div><div><label class="f">¿Qué día?</label><input type="date" id="it-occd" value="'+esc(p.occasionDate||'')+'"></div></div>'+
   '<label class="f" style="margin-top:12px">Ritmo del grupo (siestas, madrugadores, horarios de comida)</label><input type="text" id="it-rhythm" value="'+esc(p.rhythm||'')+'">'+
   '<label class="f" style="margin-top:12px">Movilidad u otras necesidades (cochecito, silla de ruedas, etc.)</label><input type="text" id="it-access" value="'+esc(p.access||'')+'">'+
   '<label class="f" style="margin-top:12px">Algo más que quieras contarnos</label><textarea id="it-notes" rows="3" style="width:100%">'+esc(p.notes||'')+'</textarea>'+
   '<div class="notice" style="margin-top:14px">'+I('shield')+'<div>Las alergias que cargues se usan para armar tus tarjetas en inglés y avisar a la agencia. Ningún restaurante puede garantizar un plato 100 % libre de alérgenos.</div></div>'+
   '<div class="row" style="margin-top:14px"><button class="btn" data-itsend="1">'+I('check')+' '+(done?'Enviar de nuevo':'Enviar a la agencia')+'</button></div></section>';
}
function readIntake(){
  var trav=[].map.call(document.querySelectorAll('#it-trav .itrow'),function(r){ return {name:r.querySelector('.it-name').value.trim(),type:r.querySelector('.it-type').value,allergies:r.querySelector('.it-alg').value.trim()}; }).filter(function(t){return t.name;});
  var v=function(id){ var e=$('#'+id); return e?e.value.trim():''; };
  return {done:true,at:NOW(),phone:v('it-phone'),travelers:trav,prefs:{styles:[].filter.call(document.querySelectorAll('.it-style'),function(b){return b.checked}).map(function(b){return b.value}),budget:v('it-budget'),avoid:v('it-avoid'),occasion:v('it-occ'),occasionDate:v('it-occd'),rhythm:v('it-rhythm'),access:v('it-access'),notes:v('it-notes')},reviewed:false};
}
function intakeSummaryText(it){ var p=it.prefs||{}, st=(p.styles||[]).map(function(x){ var s=INTAKE_STYLES.filter(function(y){return y[0]===x})[0]; return s?s[1]:x; });
  return 'Viajeros: '+(it.travelers||[]).map(function(t){ return t.name+' ('+t.type+(t.allergies?', '+t.allergies:'')+')'; }).join('; ')+'.'+(st.length?' Les gusta: '+st.join(', ').toLowerCase()+'.':'')+(p.avoid?' No les gusta: '+p.avoid+'.':'')+(p.occasion?' Fecha especial: '+p.occasion+(p.occasionDate?' ('+p.occasionDate+')':'')+'.':'')+(p.rhythm?' Ritmo: '+p.rhythm+'.':'')+(p.access?' Necesidades: '+p.access+'.':'')+(p.notes?' Notas: '+p.notes:''); }
function intakeBanner(c){
  if((c.intake&&c.intake.done)||parkCard(c)) return '';
  return '<section class="sec nxt"><span class="eyebrow">Para empezar</span><h3>Completá el formulario de tu viaje</h3><p>Contanos quiénes viajan, alergias y qué les gusta comer. Son 2 minutos y evita errores.</p><button class="btn" data-sub="viaje|form">'+I('user')+' Completar formulario</button></section>';
}
/* vista de la agencia: lo que cargó el cliente */
function intakeAgentCard(c){
  var it=c.intake;
  if(!it||!it.done) return '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Formulario del cliente</span><h3>'+I('user')+' Todavía no lo completó</h3><p>El cliente carga viajeros, alergias y preferencias desde su link. Esas preferencias mejoran las sugerencias de agenda.</p></div><button class="btn wa" data-msgs="datos">'+I('chat')+' Pedírselo por WhatsApp</button></div></section>';
  return '<section class="sec"><div class="sec-h"><div><span class="eyebrow">Formulario del cliente · '+esc(new Date(it.at).toLocaleDateString('es-AR'))+'</span><h3>'+I('user')+' Lo que cargó el cliente'+(it.reviewed?' <span class="chip ok">Revisado</span>':' <span class="chip warn">Sin revisar</span>')+'</h3></div></div><div class="small" style="line-height:1.6">'+esc(intakeSummaryText(it))+(it.phone?'<br>Teléfono: '+esc(it.phone):'')+'</div><div class="row" style="margin-top:12px"><button class="btn" data-itimport="1">'+I('check')+' Importar viajeros y teléfono al viaje</button>'+(it.reviewed?'':'<button class="btn line" data-itreviewed="1">Marcar como revisado</button>')+'</div><div class="tiny muted" style="margin-top:6px">Importar suma o actualiza viajeros por nombre; no borra los que ya tenés cargados.</div></section>';
}

/* ---------- 6) búsqueda de platos entre restaurantes ---------- */
var DS_IDX=null;
function dishIdx(){ if(!DS_IDX){ var tr=Translate.create(esData()); DS_IDX=DishSearch.build(R.map(function(r){ return {rid:r.id,name:r.name,zone:r.zone,path:r.path,mf:menuFull(r.path)}; }),tr); } return DS_IDX; }
function dishState(){ return UI.ds=UI.ds||{q:'',al:[],meal:'',zone:''}; }
function dishSection(c){
  var s=dishState(), al=DishSearch.ALLERGENS;
  if(c&&!hasDest(c,'wdw')) return '<section class="sec" id="dishsearch"><div class="sec-h"><div><span class="eyebrow">Buscá en los menús</span><h3>'+I('search')+' Buscar platos</h3></div></div><div class="notice gold">'+I('info')+'<div>La búsqueda de platos usa los menús publicados de Disney. Para Universal no copiamos menús: consultalos en la web oficial de cada restaurante (desde su ficha).</div></div></section>';
  var uoNote=(!c||hasDest(c,'uor'))?'<div class="notice gold" style="margin-bottom:12px">'+I('info')+'<div>Solo busca en los menús de <b>Disney</b>. Los menús de Universal no están cargados: se consultan en la web oficial.</div></div>':'';
  return '<section class="sec" id="dishsearch"><div class="sec-h"><div><span class="eyebrow">Buscá en todos los menús</span><h3>'+I('search')+' Buscar platos</h3><p>Escribí un plato o ingrediente en español o en inglés (por ejemplo «camarones», «pasta», «steak»).</p></div></div>'+uoNote+
   '<div class="sw"><input type="search" id="ds-q" placeholder="Ej: ravioli, camarones, pancakes…" value="'+esc(s.q)+'">'+I('search')+'</div>'+
   '<div class="grid g2" style="gap:10px;margin-top:10px"><select id="ds-meal"><option value="">Cualquier comida</option><option value="breakfast"'+(s.meal==='breakfast'?' selected':'')+'>Desayuno</option><option value="lunch"'+(s.meal==='lunch'?' selected':'')+'>Almuerzo</option><option value="dinner"'+(s.meal==='dinner'?' selected':'')+'>Cena</option></select><select id="ds-zone"><option value="">Todos los parques</option>'+Object.keys(ZONES).filter(function(k){ return ZONES[k].d==='wdw'; }).map(function(k){ return '<option value="'+k+'"'+(s.zone===k?' selected':'')+'>'+esc(ZONES[k].n)+'</option>'; }).join('')+'</select></div>'+
   '<div style="margin-top:12px"><div class="small" style="font-weight:700;margin-bottom:6px">'+I('shield')+' Solo platos que Disney marca aptos para alergias a:</div><div class="row" style="gap:6px">'+al.map(function(a){ return '<button class="pill'+(s.al.indexOf(a[0])>=0?' on':'')+'" data-dsal="'+a[0]+'" aria-pressed="'+(s.al.indexOf(a[0])>=0)+'">'+a[1]+'</button>'; }).join('')+'</div></div><div id="ds-res" style="margin-top:14px">'+dishResults()+'</div></section>';
}
function dishResults(){
  var s=dishState(); if(!s.q.trim()&&!s.al.length) return '<div class="empty">Escribí algo para buscar, o elegí una alergia para ver los platos que Disney marca como aptos.</div>';
  var res=DishSearch.search(dishIdx(),{q:s.q,allergens:s.al,meal:s.meal,zone:s.zone}), esOn=prefs().es!==false, lab={}; DishSearch.ALLERGENS.forEach(function(a){ lab[a[0]]=a[1]; });
  var h='';
  if(s.al.length) h+='<div class="notice" style="margin-bottom:12px;background:var(--ok-soft);border-color:var(--ok-line)">'+I('shield')+'<div><b>Resultados según las listas de alergias que publica Disney</b> (menús del '+esc(fmtShort('2026-11-10'))+'). Solo aparecen platos marcados aptos para <b>todas</b> las alergias elegidas. <b>No es una garantía:</b> las recetas cambian; avisá siempre la alergia al reservar y al mozo.</div></div>';
  if(!res.total) return h+'<div class="empty">Ningún plato coincide. Probá con otra palabra'+(s.al.length?' o quitá alguna alergia':'')+'.</div>';
  h+='<div class="tiny muted" style="margin-bottom:8px">'+res.total+(res.total===1?' plato':' platos')+' en '+res.restaurants+(res.restaurants===1?' restaurante':' restaurantes')+(res.groups.length<res.restaurants?' (mostrando los '+res.groups.length+' más relevantes)':'')+'</div><div class="grid g2">';
  res.groups.forEach(function(g){ h+='<div class="card dsg" style="box-shadow:none;padding:14px"><div class="row between" style="flex-wrap:nowrap"><div style="min-width:0"><b data-open="'+g.rid+'" style="cursor:pointer;font-family:var(--fh)">'+esc(g.rname)+'</b><div class="tiny muted">'+esc(ZONES[g.zone].n)+' · '+g.count+(g.count===1?' plato':' platos')+'</div></div><button class="btn ice sm" data-open="'+g.rid+'">Ver ficha</button></div><div class="mf'+(esOn?'':' noes')+'" style="margin-top:6px">'+g.items.map(function(it){
      return '<div class="it"><div><b>'+esc(it.n)+'</b>'+(it.es!==it.n?'<span class="es esn" lang="es">'+esc(it.es)+'</span>':'')+(it.d?(it.ed&&it.ed!==it.d?'<p class="es" lang="es">'+esc(it.ed)+'</p>':'')+'<p class="en">'+esc(it.d)+'</p>':'')+(it.alg&&it.alg.length?'<div class="tiny" style="color:var(--ok);font-weight:700;margin-top:3px">Disney lo marca apto para: '+esc(it.alg.map(function(a){return lab[a]}).join(', '))+'</div>':'')+'<div class="tiny muted">'+esc(it.menu)+' · '+esc(it.sec)+'</div></div>'+(it.p?'<div class="pr">'+esc(it.p)+'</div>':'')+'</div>'; }).join('')+(g.count>g.items.length?'<div class="tiny muted" style="padding-top:6px">+'+(g.count-g.items.length)+' más en la ficha</div>':'')+'</div></div>'; });
  return h+'</div>';
}
function refreshDish(){ var o=$('#ds-res'); if(o) o.innerHTML=dishResults(); }

/* ---------- eventos ---------- */
var _dsT=null;
document.addEventListener('input',function(e){ var t=e.target;
  if(t.id==='ds-q'){ dishState().q=t.value; clearTimeout(_dsT); _dsT=setTimeout(refreshDish,160); }
  else if(t.closest&&t.closest('#modalRoot')&&/^pc-/.test(t.id||'')) updateCalc();
  else if(t.id==='ms-text'){ var c=client(UI.cid), a=$('#ms-wa'); if(c&&a) a.setAttribute('href',waHref(c,t.value)); } });
document.addEventListener('change',function(e){ var t=e.target;
  if(t.id==='ds-meal'){ dishState().meal=t.value; refreshDish(); }
  else if(t.id==='ds-zone'){ dishState().zone=t.value; refreshDish(); }
  else if(t.id==='pc-plan') updateCalc();
  else if(t.id==='ms-kind'){ var c=client(UI.cid); if(c){ var tx=Messages.build(t.value,msgCtx(c)); $('#ms-text').value=tx; $('#ms-wa').setAttribute('href',waHref(c,tx)); } }
  else if(t.classList&&t.classList.contains('it-style')){ var l=t.closest('label'); if(l) l.classList.toggle('on',t.checked); } });
CLICK.push(
 {a:'data-sugg', f:function(){ openSuggest(); }},
 {a:'data-applysug', f:function(){ applySuggest(); }},
 {a:'data-copyday', f:function(){ openCopyDay(); }},
 {a:'data-docopyday', f:function(){ doCopyDay(); }},
 {a:'data-tpl', f:function(){ openTemplates(); }},
 {a:'data-tplsave', f:function(){ var c=client(UI.cid), nm=($('#tpl-name').value||'').trim(); if(!nm){ toast('Poné un nombre para la plantilla'); return; } var t=Templates.make(c,nm,uid,NOW()); t.agency_id=S.agency.id; S.templates=S.templates||[]; S.templates.unshift(t); save(); openTemplates(); toast('Plantilla guardada'); }},
 {a:'data-tplapply', f:function(v){ var c=client(UI.cid), t=(S.templates||[]).filter(function(x){return x.id===v})[0]; if(!t) return; var snap=JSON.stringify(c.days), r=Templates.apply(c,t); save(); closeModal(); render(); toast(r.applied?('Apliqué '+r.applied+(r.applied===1?' comida':' comidas')+(r.skipped?' · '+r.skipped+' ya estaban cargadas':'')):'No había lugares vacíos',r.applied?{label:'Deshacer',fn:function(){ c.days=JSON.parse(snap); save(); render(); }}:null); }},
 {a:'data-tpldel', f:function(v){ var i=(S.templates||[]).map(function(x){return x.id}).indexOf(v); if(i<0) return; var t=S.templates.splice(i,1)[0]; save(); openTemplates(); toast('Plantilla borrada',{label:'Deshacer',fn:function(){ S.templates.splice(i,0,t); save(); }}); }},
 {a:'data-plancalc', f:function(){ openPlanCalc(); }},
 {a:'data-pccopy', f:function(){ copy(calcSummary(),'Resumen copiado'); }},
 {a:'data-msgs',present:1, f:function(v){ openMsgs(v||'bienvenida'); }},
 {a:'data-mscopy', f:function(){ copy($('#ms-text').value,'Mensaje copiado'); }},
 {a:'data-itadd', f:function(){ var box=$('#it-trav'); box.insertAdjacentHTML('beforeend',intakeTravRow({name:'',type:'adulto',allergies:''},box.children.length)); }},
 {a:'data-itdel', f:function(v,t){ var r=t.closest('.itrow'); if(r) r.remove(); }},
 {a:'data-itsend', f:function(){ var c=client(UI.cid), it=readIntake(); if(!it.travelers.length){ toast('Agregá al menos un viajero'); return; } c.intake=it; if(it.phone&&!c.phone) c.phone=it.phone; var al=it.travelers.some(function(t){return t.allergies;});
    addCase({cid:c.id,title:'Formulario de ingreso completado',type:al?'Alergia / dieta':'Consulta',priority:al?'alta':'normal',text:intakeSummaryText(it)}); save(); render(); toast('Enviado a la agencia. ¡Gracias!'); }},
 {a:'data-itimport', f:function(){ var c=client(UI.cid), it=c.intake; if(!it) return; var n=0, a=0; (it.travelers||[]).forEach(function(t){ var ex=c.travelers.filter(function(x){return x.name.trim().toLowerCase()===t.name.toLowerCase()})[0]; if(ex){ ex.type=t.type; ex.allergies=t.allergies; n++; } else { c.travelers.push({id:'t'+(Date.now().toString(36))+a,name:t.name,type:t.type,allergies:t.allergies}); a++; } }); if(it.phone) c.phone=it.phone; it.reviewed=true; save(); render(); toast('Importado: '+a+' nuevos, '+n+' actualizados'); }},
 {a:'data-itreviewed', f:function(){ var c=client(UI.cid); if(c.intake){ c.intake.reviewed=true; save(); render(); } }},
 {a:'data-dsal', f:function(v){ var s=dishState(), i=s.al.indexOf(v); if(i>=0) s.al.splice(i,1); else s.al.push(v); var b=document.querySelector('[data-dsal="'+v+'"]'); if(b){ b.classList.toggle('on',i<0); b.setAttribute('aria-pressed',String(i<0)); } refreshDish(); }}
);
