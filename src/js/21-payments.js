/* ======================= Pagos del viaje (cobranza) =======================
   Distinto del presupuesto: acá se registra lo que el cliente le paga a la agencia por el viaje, en una o varias cuotas.
   c.pay = {price, share, plan:[{id,n,due,amount,paidAt,method,file,note}]}  (US$). Los comprobantes usan el mismo almacén de archivos que el presupuesto. */
var PY=Payments;
UI.py={edit:null,file:null,rm:false};

function payToday(){ return todayISO(); }
function paySum(c){ return PY.summary(c.pay,payToday()); }
function payVisible(c){ return PY.hasPlan(c)&&c.pay.share!==false; }
function ddmmy(s){ return s?fmtShort(s):''; }
function payInit(c,price){ c.pay=c.pay||{price:0,share:true,plan:[]}; c.pay.price=price; c.pay.plan=c.pay.plan||[]; if(c.pay.share===undefined) c.pay.share=true; }
function payBar(s,mini){
  var label='Cobrado '+PY.money(s.paid)+' de '+PY.money(s.price);
  return '<div class="bbar lv-'+(s.level==='over'?'late':'ok')+(mini?' mini':'')+'" role="img" aria-label="'+esc(label)+'"><i class="bc" style="width:'+s.pctPaid+'%"></i><i class="be" style="width:'+s.pctPending+'%"></i></div>';
}
function payChip(q){
  var st=PY.status(q,payToday()), d=q.due?PY.days(payToday(),q.due):0;
  if(st==='pagada') return '<span class="chip ok">'+I('check')+' Pagada '+esc(ddmmy(q.paidAt))+(q.method?' · '+esc((PY.METHODS.filter(function(m){return m[0]===q.method})[0]||['',''])[1]):'')+'</span>';
  if(st==='vencida') return '<span class="chip bad">Vencida · '+esc(PY.dueText(d))+'</span>';
  if(st==='pronto') return '<span class="chip warn">'+esc(PY.dueText(d).replace(/^v/,'V'))+'</span>';
  return '<span class="chip gray">Pendiente</span>';
}

/* línea chica en la tarjeta del cliente del panel */
function payLine(c){
  if(!PY.hasPlan(c)) return '';
  var s=paySum(c), tail=s.done?'<span class="blv ok">Viaje pagado por completo</span>':s.nOverdue?'<b class="blv over">'+s.nOverdue+(s.nOverdue===1?' cuota vencida: ':' cuotas vencidas: ')+PY.money(s.overdue)+'</b>':s.next?'<span class="small">Próxima: <b>'+esc(ddmmy(s.next.due))+'</b> · '+PY.money(s.next.amount)+'</span>':'';
  return '<a class="bcard pcard" href="#cliente-'+c.id+'" data-openpay="'+c.id+'"><div class="row between" style="align-items:baseline"><span class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.05em">Cobranza</span><span class="small">'+PY.money(s.paid)+' de '+PY.money(s.price)+' ('+s.pct+'%)</span></div>'+payBar(s,true)+'<div style="margin-top:6px">'+tail+'</div></a>';
}
/* avisos para «Para hacer hoy» */
function payAlerts(){
  var out=[]; S.clients.forEach(function(c){ if(FU.isCancelled(c)) return; PY.alerts(c.pay,payToday()).forEach(function(a){
    out.push({p:a.late?1:4,ic:'bag',cls:a.late?'bad':'warn',t:(a.late?'Cuota vencida · ':'Cuota por vencer · ')+c.name,s:a.q.n+' · '+PY.money(a.q.amount)+' · '+PY.dueText(a.days),b:'<a class="btn sm" href="#cliente-'+c.id+'" data-openpay="'+c.id+'">Ver pagos</a>'}); }); });
  return out;
}

/* ---------- pestaña Pagos ---------- */
function payPanel(c){
  var pay=c.pay, has=PY.hasPay(c), s=paySum(c), t=payToday();
  var h='<section class="sec bud"><div class="sec-h"><div><span class="eyebrow">Solo para la agencia</span><h3>'+I('ticket')+' Pagos del viaje</h3><p>Lo que el cliente le paga a la agencia por el viaje, en una o varias cuotas. No es lo mismo que el presupuesto que quiere gastar. Todo en dólares (US$).</p></div>'+
   '<div class="row" style="gap:8px;flex-wrap:wrap">'+(has?'<button class="btn" data-pquota="'+c.id+'|">'+I('plus')+' Agregar cuota</button><button class="btn line" data-pnew="'+c.id+'">Rearmar plan</button>':'<button class="btn" data-pnew="'+c.id+'">'+I('plus')+' Armar plan de cobro</button>')+'</div></div>';
  if(!has) return h+'<div class="empty">Todavía no cargaste el precio del viaje. Armá el plan: precio, anticipo si hay y en cuántas cuotas se paga. Después marcás cada cuota como pagada y adjuntás el comprobante.</div></section>';
  h+='<div class="bhead">'+payBar(s)+'<div class="blegend"><span><i class="lg c"></i>Cobrado</span><span><i class="lg e"></i>Por cobrar (en cuotas)</span><span><i class="lg r"></i>Sin cuota asignada</span></div></div>'+
   '<div class="bkpis"><div class="bk"><span>Precio del viaje</span><b>'+PY.money(s.price)+'</b></div><div class="bk ok"><span>Cobrado</span><b>'+PY.money(s.paid)+'</b><em>'+s.pct+'%</em></div><div class="bk"><span>Falta cobrar</span><b>'+PY.money(s.toCollect)+'</b></div><div class="bk '+(s.nOverdue?'bad':'')+'"><span>Vencido</span><b>'+PY.money(s.overdue)+'</b>'+(s.nOverdue?'<em>'+s.nOverdue+(s.nOverdue===1?' cuota':' cuotas')+'</em>':'')+'</div><div class="bk"><span>Próxima cuota</span><b>'+(s.next?esc(ddmmy(s.next.due)):'—')+'</b>'+(s.next?'<em>'+PY.money(s.next.amount)+'</em>':'')+'</div></div>';
  if(s.nOverdue) h+='<div class="notice bad">'+I('info')+'<div>Hay <b>'+s.nOverdue+(s.nOverdue===1?' cuota vencida':' cuotas vencidas')+'</b> por '+PY.money(s.overdue)+'. Podés mandarle un recordatorio desde cada cuota.</div></div>';
  if(s.unassigned>0.009) h+='<div class="notice warn">'+I('info')+'<div>Las cuotas suman <b>'+PY.money(s.scheduled)+'</b> y el precio es <b>'+PY.money(s.price)+'</b>: faltan asignar <b>'+PY.money(s.unassigned)+'</b>.</div></div>';
  else if(s.unassigned<-0.009) h+='<div class="notice warn">'+I('info')+'<div>Las cuotas suman <b>'+PY.money(s.scheduled)+'</b>, o sea <b>'+PY.money(-s.unassigned)+'</b> más que el precio. Revisá los montos.</div></div>';
  if(BC.hasBudget(c)&&s.price>c.budget.total) h+='<div class="notice gold">'+I('info')+'<div>El precio del viaje supera el presupuesto que el cliente quiere gastar (<b>'+BC.money(c.budget.total)+'</b>) por <b>'+PY.money(s.price-c.budget.total)+'</b>.</div></div>';
  h+='<div class="bopts"><label><input type="checkbox" id="pay-share"'+(pay.share!==false?' checked':'')+'> <span>Que el cliente vea su plan de pagos en «Mi viaje»<span class="tiny muted" style="display:block;font-weight:500">Ve el precio, lo que pagó, las cuotas con su fecha y los comprobantes que cargues.</span></span></label></div>';
  h+='<div class="row between" style="margin-top:18px;flex-wrap:wrap;gap:8px"><h4 style="font:900 15px var(--fh)">Cuotas ('+pay.plan.length+')</h4><button class="btn line sm" data-pcopy="'+c.id+'">'+I('copy')+' Copiar resumen</button></div><div class="blist">';
  PY.sortPlan(pay.plan).forEach(function(q){ var st=PY.status(q,t), paid=st==='pagada', d=q.due?PY.days(t,q.due):0;
    h+='<div class="bit pq'+(paid?' paid':'')+'"><span class="bci">'+I(paid?'check':'clock')+'</span><div class="bim"><div class="row between" style="align-items:flex-start;gap:10px"><div style="min-width:0"><b>'+esc(q.n)+'</b><div class="tiny muted">Vence el '+esc(ddmmy(q.due))+(paid?'':' · '+esc(PY.dueText(d)))+'</div></div><div class="bamt">'+PY.money(q.amount)+'</div></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">'+payChip(q)+
      (q.file?'<button class="chip lnkchip" data-pqfile="'+c.id+'|'+q.id+'" title="'+esc(q.file.name)+'">'+I('ext')+' '+esc(q.file.name.length>22?q.file.name.slice(0,19)+'…':q.file.name)+' · '+BC.sizeLabel(q.file.size)+'</button>':'')+'</div>'+(q.note?'<div class="tiny muted" style="margin-top:4px">'+esc(q.note)+'</div>':'')+
      '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">'+(paid?'<button class="btn line sm" data-pundo="'+c.id+'|'+q.id+'">Deshacer pago</button>':'<button class="btn sm" data-ppaid="'+c.id+'|'+q.id+'">'+I('check')+' Marcar pagada</button><button class="btn wa sm" data-premind="'+c.id+'|'+q.id+'">'+I('chat')+' Recordar</button>')+'<button class="btn line sm" data-pquota="'+c.id+'|'+q.id+'">Editar</button><button class="btn danger sm" data-pdel="'+c.id+'|'+q.id+'">'+I('trash')+'</button></div></div></div>'; });
  h+='</div>';
  if(pay.plan.some(function(q){return q.file})) h+='<div class="notice gold" style="margin-top:12px">'+I('info')+'<div><b>Los comprobantes se guardan solo en este navegador.</b> Todavía no hay servidor: no entran en la copia de seguridad y el cliente no los puede bajar desde su celular. Cuando conectemos el almacenamiento en la nube se suben solos.</div></div>';
  return h+'</section>';
}

/* ---------- modales ---------- */
function planForm(){
  var gv=function(s){ var e=$(s); return e?e.value:''; }, ex=$('#pp-have');
  return {price:PY.parseAmount(gv('#pp-price')),down:PY.parseAmount(gv('#pp-down'))||0,downDue:gv('#pp-downdue'),n:gv('#pp-n'),firstDue:gv('#pp-first'),halfMonth:gv('#pp-every')==='half',keep:ex?+ex.value||0:0};
}
function planPreview(){
  var el=$('#pp-prev'); if(!el) return; var f=planForm(); if(!(f.price>0)){ el.textContent='Poné el precio del viaje para ver cómo queda.'; return; }
  var rest=PY.schedule({price:f.price-f.keep,down:f.keep?0:f.down,downDue:f.downDue,n:f.n,firstDue:f.firstDue,halfMonth:f.halfMonth});
  if(!rest.length){ el.textContent=f.price-f.keep<=0?'Ya está todo cubierto por lo pagado.':'Poné la fecha de la primera cuota.'; return; }
  var down=rest[0].n==='Anticipo'?rest.shift():null, sum=rest.length?rest[0].amount:0;
  el.innerHTML=(down?'Anticipo de <b>'+PY.money(down.amount)+'</b> + ':'')+(rest.length?'<b>'+rest.length+(rest.length===1?' cuota':' cuotas')+'</b> de '+PY.money(sum)+(rest.length>1&&rest[rest.length-1].amount!==sum?' (la última '+PY.money(rest[rest.length-1].amount)+')':'')+'. Última: '+esc(ddmmy(rest[rest.length-1].due)):'');
}
function openPlanModal(cid){
  var c=client(cid); if(!c) return; var pay=c.pay, paidSum=pay?PY.summary(pay,payToday()).paid:0, t=payToday();
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Pagos · '+esc(c.name)+'</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 14px">'+(pay&&pay.plan.length?'Rearmar el plan de cuotas':'Armar el plan de cobro')+'</h3>'+
   (paidSum>0?'<div class="notice">'+I('info')+'<div>Ya hay <b>'+PY.money(paidSum)+'</b> pagados. Se conservan; las cuotas que todavía no se pagaron se reemplazan por las nuevas.<input type="hidden" id="pp-have" value="'+paidSum+'"></div></div>':'')+
   '<div class="grid g2" style="gap:12px;margin-top:10px"><div><label class="f" for="pp-price">Precio total del viaje (US$)</label><input type="text" inputmode="decimal" id="pp-price" value="'+(pay&&pay.price?esc(String(pay.price).replace('.',',')):'')+'" placeholder="Ej: 8500"></div>'+
   (paidSum>0?'':'<div><label class="f" for="pp-down">Anticipo / seña (US$, opcional)</label><input type="text" inputmode="decimal" id="pp-down" placeholder="Ej: 1500"></div><div><label class="f" for="pp-downdue">Fecha del anticipo</label><input type="date" id="pp-downdue" value="'+t+'"></div>')+
   '<div><label class="f" for="pp-n">Cantidad de cuotas</label><input type="number" id="pp-n" min="1" max="36" value="6"></div><div><label class="f" for="pp-first">Vencimiento de la primera cuota</label><input type="date" id="pp-first" value="'+PY.addMonths(t,1)+'"></div><div><label class="f" for="pp-every">Se pagan</label><select id="pp-every"><option value="month">Una vez por mes</option><option value="half">Cada 15 días</option></select></div></div>'+
   '<div class="notice" style="margin-top:12px">'+I('info')+'<div id="pp-prev" aria-live="polite"></div></div>'+
   '<div class="row" style="margin-top:16px"><button class="btn" data-psaveplan="'+c.id+'">'+I('check')+' Guardar plan</button><button class="btn line" data-close="1">Cancelar</button></div></div></div></div>');
  planPreview();
}
function planSave(cid){
  var c=client(cid); if(!c) return; var f=planForm(); if(!(f.price>0)){ toast('Poné el precio del viaje'); return; }
  if(!/^\d{4}-\d{2}-\d{2}$/.test(f.firstDue)){ toast('Poné la fecha de la primera cuota'); return; }
  if(f.down>f.price){ toast('El anticipo no puede ser mayor que el precio'); return; }
  var paid=(c.pay?c.pay.plan:[]).filter(function(q){return q.paidAt}), paidSum=paid.reduce(function(a,q){return a+q.amount},0);
  var rest=PY.schedule({price:f.price-paidSum,down:paidSum?0:f.down,downDue:f.downDue,n:f.n,firstDue:f.firstDue,halfMonth:f.halfMonth});
  if(!rest.length&&f.price-paidSum>0){ toast('No pude armar las cuotas: revisá los datos'); return; }
  payInit(c,f.price); c.pay.plan=paid.concat(rest.map(function(q){ return PY.cleanQuota({n:q.n,due:q.due,amount:q.amount}).quota; }));
  logAct(cid,'Pagos: plan de '+PY.money(f.price)+' en '+c.pay.plan.length+(c.pay.plan.length===1?' pago':' pagos'),'evento'); save(); closeModal(); render(); toast('Plan de cobro guardado');
}
function openQuotaModal(cid,qid){
  var c=client(cid); if(!c) return; var q=qid?(c.pay.plan.filter(function(x){return x.id===qid})[0]):null; UI.py.edit=q?q.id:null;
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Pagos · '+esc(c.name)+'</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 14px">'+(q?'Editar cuota':'Agregar cuota')+'</h3>'+
   '<div class="grid g2" style="gap:12px"><div style="grid-column:1/-1"><label class="f" for="pq-n">Nombre</label><input type="text" id="pq-n" maxlength="40" value="'+esc(q?q.n:'Cuota extra')+'"></div><div><label class="f" for="pq-amount">Monto (US$)</label><input type="text" inputmode="decimal" id="pq-amount" value="'+(q?esc(String(q.amount).replace('.',',')):'')+'"></div><div><label class="f" for="pq-due">Vence el</label><input type="date" id="pq-due" value="'+esc(q?q.due:'')+'"></div></div>'+
   '<label class="f" style="margin-top:12px" for="pq-note">Nota interna</label><textarea id="pq-note" rows="2" maxlength="200">'+esc(q?q.note:'')+'</textarea><div class="row" style="margin-top:16px"><button class="btn" data-psavequota="'+c.id+'">'+I('check')+' Guardar</button><button class="btn line" data-close="1">Cancelar</button></div></div></div></div>');
}
function quotaSave(cid){
  var c=client(cid); if(!c) return; var old=UI.py.edit?c.pay.plan.filter(function(x){return x.id===UI.py.edit})[0]:null, gv=function(s){ return ($(s)||{}).value||''; };
  var r=PY.cleanQuota({id:old?old.id:'',n:gv('#pq-n'),due:gv('#pq-due'),amount:gv('#pq-amount'),paidAt:old?old.paidAt:'',method:old?old.method:'',file:old?old.file:null,note:gv('#pq-note')}); if(!r.ok){ toast(r.errors[0]); return; }
  if(old) c.pay.plan[c.pay.plan.indexOf(old)]=r.quota; else c.pay.plan.push(r.quota);
  logAct(cid,'Pagos: '+(old?'editó':'agregó')+' «'+r.quota.n+'» ('+PY.money(r.quota.amount)+')','evento'); save(); UI.py.edit=null; closeModal(); render(); toast(old?'Cuota actualizada':'Cuota agregada');
}
function openPaidModal(cid,qid){
  var c=client(cid), q=c&&c.pay.plan.filter(function(x){return x.id===qid})[0]; if(!q) return; UI.py.edit=q.id; UI.py.file=null; UI.py.rm=false;
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Pagos · '+esc(c.name)+'</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 4px">Marcar como pagada</h3><div class="muted small" style="margin-bottom:14px">'+esc(q.n)+' · '+PY.money(q.amount)+'</div>'+
   '<div class="grid g2" style="gap:12px"><div><label class="f" for="pp-paidat">Fecha de pago</label><input type="date" id="pp-paidat" value="'+payToday()+'"></div><div><label class="f" for="pp-method">Medio de pago</label><select id="pp-method">'+PY.METHODS.map(function(m){ return '<option value="'+m[0]+'">'+m[1]+'</option>'; }).join('')+'</select></div></div>'+
   '<label class="f" style="margin-top:12px" for="pq-file">Comprobante (PDF o imagen, hasta 10 MB)</label><input type="file" id="pq-file" accept=".pdf,image/*"><div class="tiny muted" style="margin-top:4px">Se guarda solo en este navegador hasta que haya servidor.</div>'+
   '<div class="row" style="margin-top:16px"><button class="btn" data-psavepaid="'+c.id+'">'+I('check')+' Guardar pago</button><button class="btn line" data-close="1">Cancelar</button></div></div></div></div>');
}
function paidSave(cid){
  var c=client(cid); if(!c) return; var q=c.pay.plan.filter(function(x){return x.id===UI.py.edit})[0]; if(!q) return; var d=($('#pp-paidat')||{}).value||'';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){ toast('Poné la fecha de pago'); return; }
  var f=UI.py.file; if(f){ var err=BC.checkFile(f); if(err){ toast(err); return; } }
  function done(msg){ q.paidAt=d; q.method=($('#pp-method')||{}).value||''; logAct(cid,'Pagos: cobró «'+q.n+'» ('+PY.money(q.amount)+')','reserva'); save(); UI.py.edit=null; UI.py.file=null; closeModal(); render(); toast(msg||'Pago registrado'); }
  if(f){ q.file={id:'f'+uid()+uid(),name:f.name,size:f.size,type:f.type||''}; Files.put(q.file.id,f).then(function(ok){ done(ok?'':'Pago registrado, pero el archivo quedó solo en memoria: se pierde al cerrar la pestaña'); }); } else done();
}
function quotaDel(cid,qid){
  var c=client(cid); if(!c) return; var i=c.pay.plan.map(function(x){return x.id}).indexOf(qid); if(i<0) return; var q=c.pay.plan.splice(i,1)[0];
  logAct(cid,'Pagos: eliminó «'+q.n+'»','evento'); save(); render();
  toast('Cuota eliminada',{label:'Deshacer',fn:function(){ c.pay.plan.splice(Math.min(i,c.pay.plan.length),0,q); logAct(cid,'Pagos: recuperó «'+q.n+'»','evento'); save(); render(); }});
}
function payFind(v){ var p=v.split('|'), c=client(p[0]); return {c:c,q:c&&c.pay?c.pay.plan.filter(function(x){return x.id===p[1]})[0]:null}; }

CLICK.push(
 {a:'data-openpay', f:function(){ UI.tab='pagos'; }},
 {a:'data-pnew', f:function(v){ openPlanModal(v); }},
 {a:'data-psaveplan', f:function(v){ planSave(v); }},
 {a:'data-pquota', f:function(v){ var p=v.split('|'); openQuotaModal(p[0],p[1]||''); }},
 {a:'data-psavequota', f:function(v){ quotaSave(v); }},
 {a:'data-ppaid', f:function(v){ var p=v.split('|'); openPaidModal(p[0],p[1]); }},
 {a:'data-psavepaid', f:function(v){ paidSave(v); }},
 {a:'data-pundo', f:function(v){ var x=payFind(v); if(!x.q) return; x.q.paidAt=''; x.q.method=''; logAct(x.c.id,'Pagos: deshizo el pago de «'+x.q.n+'»','evento'); save(); render(); toast('Pago deshecho'); }},
 {a:'data-pdel', f:function(v){ var p=v.split('|'); quotaDel(p[0],p[1]); }},
 {a:'data-premind', f:function(v){ var x=payFind(v); if(!x.q) return; copy(PY.reminder(x.c.name.replace(/^(Familia|Pareja)\s+/i,''),x.q,payToday()),'Recordatorio copiado: pegalo en WhatsApp'); }},
 {a:'data-pcopy', f:function(v){ var c=client(v); if(!c) return; copy(PY.shareText(c.name,paySum(c),c.pay.plan,payToday()),'Resumen copiado: pegalo en WhatsApp'); }},
 {a:'data-pqfile', f:function(v){ var x=payFind(v); if(x.q&&x.q.file) openFile(x.q.file.id,x.q.file.name); }}
);
document.addEventListener('input',function(e){ var t=e.target; if(t&&t.id&&/^pp-/.test(t.id)) planPreview(); });
document.addEventListener('change',function(e){
  var t=e.target; if(!t||!t.id) return;
  if(/^pp-/.test(t.id)) planPreview();
  else if(t.id==='pq-file'){ var f=t.files&&t.files[0]; if(!f){ UI.py.file=null; return; } var err=BC.checkFile(f); if(err){ toast(err); t.value=''; UI.py.file=null; return; } UI.py.file=f; }
  else if(t.id==='pay-share'){ var c=client(UI.cid); if(!c||!c.pay) return; c.pay.share=t.checked; logAct(c.id,'Pagos: '+(t.checked?'se lo muestra':'ya no se lo muestra')+' al cliente','evento'); save(); render(); }
});

/* ---------- lo que ve el cliente: «Mis pagos» ---------- */
function clientPays(c){
  var s=paySum(c), h='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Tu viaje</span><h3>'+I('ticket')+' Mis pagos</h3><p>El plan de pagos de tu viaje. Si hiciste un pago que no figura, mandale el comprobante a tu agente por «Pedidos».</p></div></div>'+
   '<div class="card" style="box-shadow:none;margin-bottom:12px"><div class="row between"><b style="font-family:var(--fh)">Pagaste '+PY.money(s.paid)+'</b><span class="small">de '+PY.money(s.price)+'</span></div>'+payBar(s)+'<div class="tiny muted" style="margin-top:6px">'+(s.done?'¡Tu viaje está pagado por completo!':'Falta pagar '+PY.money(s.toCollect)+(s.next?'. Próxima cuota: '+esc(ddmmy(s.next.due))+' ('+PY.money(s.next.amount)+').':'.'))+'</div></div><div class="blist">';
  PY.sortPlan(c.pay.plan).forEach(function(q){ var paid=!!q.paidAt;
    h+='<div class="bit"><span class="bci">'+I(paid?'check':'clock')+'</span><div class="bim"><div class="row between" style="gap:10px"><div><b>'+esc(q.n)+'</b><div class="tiny muted">Vence el '+esc(ddmmy(q.due))+'</div></div><div class="bamt">'+PY.money(q.amount)+'</div></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">'+payChip(q)+(q.file?'<button class="chip lnkchip" data-pqfile="'+c.id+'|'+q.id+'">'+I('ext')+' Ver comprobante</button>':'')+'</div></div></div>'; });
  return h+'</div></section>';
}
