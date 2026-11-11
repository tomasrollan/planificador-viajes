/* ======================= Presupuesto del viaje (solo agencia) =======================
   c.budget = {total, cur:'USD', cats:{categoria:meta}, share:false, autoMeals:false}
   c.items  = [{id,cat,title,date,amount,status,paid,conf,file,visible,credits,slotRef,note,at,by}]
   Los archivos (PDF o imagen) se guardan en este navegador (IndexedDB) hasta que haya servidor. */
var BC=Budget;
UI.bd={f:'all',edit:null,file:null,rm:false};

/* ---------- archivos: IndexedDB con respaldo en memoria ---------- */
var Files=(function(){
  var memF={}, dbp=null;
  function db(){
    if(dbp) return dbp;
    dbp=new Promise(function(res,rej){
      try{ if(typeof indexedDB==='undefined'||!indexedDB){ rej(new Error('sin indexedDB')); return; }
        var rq=indexedDB.open('agency_files',1); rq.onupgradeneeded=function(){ rq.result.createObjectStore('f'); };
        rq.onsuccess=function(){ res(rq.result); }; rq.onerror=function(){ rej(rq.error); }; }catch(e){ rej(e); }
    });
    return dbp;
  }
  function tx(mode,fn){ return db().then(function(d){ return new Promise(function(res,rej){ var t=d.transaction('f',mode), r=fn(t.objectStore('f')); t.oncomplete=function(){ res(r&&r.result); }; t.onerror=function(){ rej(t.error); }; t.onabort=function(){ rej(t.error); }; }); }); }
  return {
    put:function(id,blob){ memF[id]=blob; return tx('readwrite',function(s){ return s.put(blob,id); }).then(function(){ return true; },function(){ return false; }); },
    get:function(id){ if(memF[id]) return Promise.resolve(memF[id]); return tx('readonly',function(s){ return s.get(id); }).then(function(b){ if(b) memF[id]=b; return b||null; },function(){ return null; }); },
    del:function(id){ delete memF[id]; return tx('readwrite',function(s){ return s.delete(id); }).then(function(){ return true; },function(){ return false; }); },
    keys:function(){ return tx('readonly',function(s){ return s.getAllKeys(); }).then(function(k){ return k||[]; },function(){ return []; }); },
    has:function(id){ return !!memF[id]; }
  };
})();
/* limpia archivos que ya no usa ningún ítem (por ejemplo, de ítems eliminados) */
function filesGc(){
  var keep={}; S.clients.forEach(function(c){ (c.items||[]).forEach(function(i){ if(i.file&&i.file.id) keep[i.file.id]=1; }); ((c.pay&&c.pay.plan)||[]).forEach(function(q){ if(q.file&&q.file.id) keep[q.file.id]=1; }); });
  Files.keys().then(function(ks){ ks.forEach(function(k){ if(!keep[k]) Files.del(k); }); });
}
function openFile(id,name){
  Files.get(id).then(function(b){
    if(!b){ toast('Este archivo no está en este dispositivo. Pedíselo a la agencia.'); return; }
    var u=URL.createObjectURL(b), a=document.createElement('a'); a.href=u; a.target='_blank'; a.rel='noopener'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(u); },120000);
  });
}

/* ---------- cálculos del cliente ---------- */
function budHasPlan(c){ return hasDest(c,'wdw')&&c.plan&&c.plan!=='none'; }
function budAuto(c){
  var b=c.budget, out=[]; if(!b||!b.autoMeals) return out;
  var ad=c.travelers.filter(function(t){return t.type!=='niño'}).length||c.travelers.length;
  if(hasDest(c,'wdw')){
    if(budHasPlan(c)){
      var g=Rules.range(c,'wdw'), n=Dates.nights(g.start,g.end), r=PlanCalc.compare({planKey:c.plan,nights:n,adults:ad});
      if(r.planCost>0) out.push({id:'auto-plan',auto:true,cat:'comida',title:'Plan de comidas Disney · '+ad+(ad===1?' adulto':' adultos')+' · '+n+' noches',amount:r.planCost,status:'estimado',credits:0,note:'Calculado con la tarifa por adulto y por noche; los niños tienen otra tarifa, cargala como ítem aparte.'});
    } else { var e=estimate(c,'wdw'); if(e>0) out.push({id:'auto-wdw',auto:true,cat:'comida',title:'Comidas de mesa en Disney (según la agenda)',amount:e,status:'estimado',credits:0,note:'Estimado por persona según el rango de precios de cada restaurante, sin bebidas ni propina.'}); }
  }
  if(hasDest(c,'uor')){ var u=estimate(c,'uor'); if(u>0) out.push({id:'auto-uor',auto:true,cat:'comida',title:'Comidas de mesa en Universal (según la agenda)',amount:u,status:'estimado',credits:0,note:'Estimado por persona según el rango de precios de cada restaurante, sin bebidas ni propina.'}); }
  return out;
}
function budRows(c){ return (c.items||[]).concat(budAuto(c)); }
function budSum(c){ return BC.summary(c.budget||{},budRows(c)); }
function budCredits(c){ return budHasPlan(c)?BC.creditsSummary(c.items,Rules.planTotal(c),usedCredits(c).plan):null; }
function docsVisible(c){ return (c.items||[]).some(function(i){return i.visible})||!!(c.budget&&c.budget.share&&BC.hasBudget(c)); }

/* ---------- piezas visuales ---------- */
function budBar(s,mini){
  var label=s.total?BC.money(s.committed)+' de '+BC.money(s.total)+' ('+s.usedPct+'%)':'Sin presupuesto definido';
  return '<div class="bbar lv-'+s.level+(mini?' mini':'')+'" role="img" aria-label="'+esc(label)+'"><i class="bc" style="width:'+s.pctConf+'%"></i><i class="be" style="width:'+s.pctEst+'%"></i></div>';
}
function budState(s){ return s.level==='over'?'<b class="blv over">Te pasás por '+BC.money(s.over)+'</b>':'<b class="blv '+s.level+'">Disponible '+BC.money(s.available)+'</b>'; }
/* tarjeta del cliente en el panel */
function budCard(c,pg){
  var chip='<span class="chip gray" title="Comidas elegidas en la agenda">'+I('utensils')+' '+pg.filled+' de '+pg.cap+' comidas</span>';
  if(BC.hasBudget(c)){ var s=budSum(c);
    return '<a class="bcard" href="#cliente-'+c.id+'" data-openpres="'+c.id+'"><div class="row between" style="align-items:baseline"><span class="tiny muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.05em">Presupuesto</span>'+chip+'</div>'+budBar(s)+'<div class="row between small" style="margin-top:6px"><span>'+BC.money(s.committed)+' de '+BC.money(s.total)+'</span>'+budState(s)+'</div>'+'</a>'; }
  var any=(c.items||[]).length;
  return '<div class="bcard empty"><div class="row between" style="align-items:center"><a href="#cliente-'+c.id+'" data-openpres="'+c.id+'" class="lnk" style="font-weight:800">'+I('plus')+' Definir presupuesto</a>'+chip+'</div>'+(any?'<div class="tiny muted" style="margin-top:6px">Comprometido: '+BC.money(budSum(c).committed)+'</div>':'')+'</div>';
}

/* ---------- pestaña Presupuesto ---------- */
function budgetPanel(c){
  var s=budSum(c), b=c.budget, has=BC.hasBudget(c), rows=budRows(c), items=c.items||[];
  var h='<section class="sec bud"><div class="sec-h"><div><span class="eyebrow">Solo para la agencia</span><h3>'+I('bag')+' Presupuesto del viaje</h3><p>Cargá cada reserva con su costo y el PDF de la confirmación. La barra se actualiza sola. Todo en dólares (US$).</p></div>'+
    '<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" data-bdnew="'+c.id+'">'+I('plus')+' Agregar ítem</button>'+(has?'<button class="btn line" data-bdedit="'+c.id+'">Editar total y metas</button>':'')+'</div></div>';
  if(!has){
    h+='<div class="notice gold">'+I('info')+'<div><b>Todavía no hay un presupuesto total.</b> Cargalo para ver la barra y cuánto queda disponible. Podés seguir cargando ítems igual.</div></div>'+
      '<div class="row" style="gap:8px;align-items:flex-end;margin-top:12px;flex-wrap:wrap"><div style="flex:1 1 220px"><label class="f" for="bd-new-total">Presupuesto total del cliente (US$)</label><input type="text" inputmode="decimal" id="bd-new-total" placeholder="Ej: 8000"></div><button class="btn" data-bdcreate="'+c.id+'">Definir presupuesto</button></div>';
  } else {
    h+='<div class="bhead">'+budBar(s)+'<div class="blegend"><span><i class="lg c"></i>Confirmado</span><span><i class="lg e"></i>Estimado</span><span><i class="lg r"></i>Libre</span></div></div>'+
      '<div class="bkpis"><div class="bk"><span>Presupuesto</span><b>'+BC.money(s.total)+'</b></div><div class="bk"><span>Comprometido</span><b>'+BC.money(s.committed)+'</b><em>'+s.usedPct+'%</em></div><div class="bk '+(s.level==='over'?'bad':s.level==='warn'?'warn':'ok')+'"><span>'+(s.level==='over'?'Te pasás por':'Disponible')+'</span><b>'+BC.money(s.level==='over'?s.over:s.available)+'</b></div><div class="bk"><span>Confirmado</span><b>'+BC.money(s.confirmed)+'</b></div><div class="bk"><span>Estimado</span><b>'+BC.money(s.estimated)+'</b><em>sin confirmar</em></div></div>';
    if(s.level==='over') h+='<div class="notice bad">'+I('info')+'<div>Con lo cargado se supera el presupuesto por <b>'+BC.money(s.over)+'</b>. Hablalo con el cliente antes de confirmar más.</div></div>';
    else if(s.level==='warn') h+='<div class="notice warn">'+I('info')+'<div>Ya se usó el <b>'+s.usedPct+'%</b> del presupuesto: quedan <b>'+BC.money(s.available)+'</b>.</div></div>';
    var cats=BC.CATS.filter(function(k){ var x=s.byCat[k.k]; return x.total>0||x.target>0; });
    if(cats.length) h+='<div class="bcats">'+cats.map(function(k){ var x=s.byCat[k.k], d=x.target>0?x.target:(s.committed||1), pc=Math.min(100,x.confirmed/d*100), pe=Math.min(100-pc,x.estimated/d*100), lv=x.over>0?'over':(x.target>0&&x.pct>=90?'warn':'ok');
      return '<div class="bcat"><span class="bci">'+I(k.ic)+'</span><div class="bcm"><div class="row between"><b>'+esc(k.n)+'</b><span class="small">'+BC.money(x.total)+(x.target>0?' <span class="muted">de '+BC.money(x.target)+'</span>':'')+'</span></div><div class="bbar mini lv-'+lv+'"><i class="bc" style="width:'+Math.round(pc*10)/10+'%"></i><i class="be" style="width:'+Math.round(pe*10)/10+'%"></i></div>'+(x.over>0?'<div class="tiny" style="color:var(--bad)">Se pasa de la meta por '+BC.money(x.over)+'</div>':'')+'</div></div>'; }).join('')+'</div>';
    var cr=budCredits(c);
    if(cr) h+='<div class="cbox" style="margin-top:14px"><div class="ic">'+I('utensils')+'</div><div style="flex:1"><div class="k">Créditos del plan de comidas (por persona)</div><div class="v"><b>'+cr.left+'</b> / '+cr.total+' disponibles'+(cr.over?' · <span style="color:var(--rose)">te pasás por '+cr.over+'</span>':'')+'</div><div class="meter'+(cr.over?' over':'')+'"><i style="width:'+cr.pct+'%"></i></div><div class="tiny muted" style="margin-top:4px">Usados en ítems cargados: '+cr.used+(cr.planned>cr.used?' · en la agenda hay '+cr.planned+' créditos planificados':'')+'. Cargá los créditos en cada ítem de restaurante.</div></div></div>';
    h+='<div class="bopts"><label><input type="checkbox" id="bd-auto"'+(b.autoMeals?' checked':'')+'> <span>Sumar automáticamente '+(budHasPlan(c)?'el costo del plan de comidas':'las comidas de mesa estimadas de la agenda')+'<span class="tiny muted" style="display:block;font-weight:500">Si cargás las comidas como ítems, dejalo apagado para no contarlas dos veces.</span></span></label>'+
      '<label><input type="checkbox" id="bd-share"'+(b.share?' checked':'')+'> <span>Mostrarle la barra de presupuesto al cliente<span class="tiny muted" style="display:block;font-weight:500">El cliente ve el total y lo comprometido, nunca los montos de cada ítem.</span></span></label></div>';
  }
  /* ítems */
  var f=UI.bd.f, list=rows.filter(function(r){ return f==='all'||r.cat===f; });
  list.sort(function(a,b){ return (a.date||'9999').localeCompare(b.date||'9999')||(a.at||0)-(b.at||0); });
  var present=BC.CATS.filter(function(k){ return rows.some(function(r){return r.cat===k.k}); });
  h+='<div class="row between" style="margin-top:18px;flex-wrap:wrap;gap:8px"><h4 style="font:900 15px var(--fh)">Ítems cargados ('+rows.length+')</h4><div class="row" style="gap:8px">'+(rows.length?'<button class="btn line sm" data-bdcopy="'+c.id+'">'+I('copy')+' Copiar resumen</button><button class="btn line sm" data-bdcsv="'+c.id+'">Exportar CSV</button>':'')+'</div></div>';
  if(rows.length>1) h+='<div class="pills" style="margin:10px 0"><button class="pill'+(f==='all'?' on':'')+'" data-bdf="all">Todos</button>'+present.map(function(k){ return '<button class="pill'+(f===k.k?' on':'')+'" data-bdf="'+k.k+'">'+esc(k.n)+'</button>'; }).join('')+'</div>';
  if(!rows.length) h+='<div class="empty" style="margin-top:10px">Todavía no cargaste nada. Agregá el hotel, las entradas o una reserva con su PDF.</div>';
  else h+='<div class="blist">'+list.map(function(r){ return budItemRow(c,r); }).join('')+(list.length?'':'<div class="empty">No hay ítems con este filtro.</div>')+'</div>';
  if(items.some(function(i){return i.file})) h+='<div class="notice gold" style="margin-top:12px">'+I('info')+'<div><b>Los PDF se guardan solo en este navegador.</b> Todavía no hay servidor: no entran en la copia de seguridad ni los ve el cliente desde su celular. Mandáselos por WhatsApp. Cuando conectemos el almacenamiento en la nube se suben solos.</div></div>';
  return h+'</section>';
}
function budItemRow(c,r){
  var k=BC.catOf(r.cat), conf=r.status==='confirmado';
  var chips='<span class="chip '+(conf?'ok':'warn')+'">'+(conf?'Confirmado':'Estimado')+'</span>'+(r.credits>0?'<span class="chip gold">'+r.credits+' crédito'+(r.credits===1?'':'s')+'</span>':'')+(r.auto?'<span class="chip gray">Automático</span>':'')+(r.visible?'<span class="chip gray" title="El cliente lo ve en Mi viaje">'+I('user')+' Visible</span>':'')+(r.file?'<button class="chip lnkchip" data-bdfile="'+c.id+'|'+r.id+'" title="'+esc(r.file.name)+'">'+I('ext')+' '+esc(r.file.name.length>22?r.file.name.slice(0,19)+'…':r.file.name)+' · '+BC.sizeLabel(r.file.size)+'</button>':'');
  return '<div class="bit'+(r.auto?' auto':'')+'"><span class="bci">'+I(k.ic)+'</span><div class="bim"><div class="row between" style="align-items:flex-start;gap:10px"><div style="min-width:0"><b>'+esc(r.title)+'</b><div class="tiny muted">'+esc(k.n)+(r.date?' · '+esc(fmtShort(r.date)):'')+(r.conf?' · Conf. '+esc(r.conf):'')+'</div></div><div class="bamt">'+(r.amount>0?BC.money(r.amount):'<span class="muted">sin monto</span>')+'</div></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px">'+chips+'</div>'+(r.note?'<div class="tiny muted" style="margin-top:4px">'+esc(r.note)+'</div>':'')+
    (r.auto?'':'<div class="row" style="gap:6px;margin-top:8px"><button class="btn line sm" data-bditem="'+c.id+'|'+r.id+'">Editar</button><button class="btn danger sm" data-bddel="'+c.id+'|'+r.id+'">'+I('trash')+' Eliminar</button></div>')+'</div></div>';
}

/* ---------- modales ---------- */
function openItemModal(cid,id){
  var c=client(cid); if(!c) return; var it=id?(c.items||[]).filter(function(x){return x.id===id})[0]:null; UI.bd.edit=it?it.id:null; UI.bd.file=null; UI.bd.rm=false;
  var v=it||{cat:'hotel',title:'',date:'',amount:'',status:'estimado',paid:false,conf:'',credits:0,visible:false,note:'',file:null};
  var plan=budHasPlan(c);
  var h='<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Presupuesto · '+esc(c.name)+'</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 14px">'+(it?'Editar ítem':'Agregar ítem')+'</h3>'+
   '<div class="grid g2" style="gap:12px"><div><label class="f" for="bi-cat">Tipo</label><select id="bi-cat">'+BC.CATS.map(function(k){ return '<option value="'+k.k+'"'+(v.cat===k.k?' selected':'')+'>'+esc(k.n)+'</option>'; }).join('')+'</select></div>'+
   '<div><label class="f" for="bi-status">Estado</label><select id="bi-status"><option value="estimado"'+(v.status==='estimado'?' selected':'')+'>Estimado (precio de referencia)</option><option value="confirmado"'+(v.status==='confirmado'?' selected':'')+'>Confirmado (ya reservado)</option></select></div>'+
   '<div style="grid-column:1/-1"><label class="f" for="bi-title">Título</label><input type="text" id="bi-title" maxlength="120" value="'+esc(v.title)+'" placeholder="Ej: Hotel Contemporary · 7 noches"></div>'+
   '<div><label class="f" for="bi-amount">Monto total (US$)</label><input type="text" inputmode="decimal" id="bi-amount" value="'+(v.amount?esc(String(v.amount).replace('.',',')):'')+'" placeholder="Ej: 2450"></div>'+
   '<div><label class="f" for="bi-date">Fecha</label><input type="date" id="bi-date" value="'+esc(v.date||'')+'"></div>'+
   '<div><label class="f" for="bi-conf">N.º de confirmación</label><input type="text" id="bi-conf" maxlength="40" value="'+esc(v.conf||'')+'"></div>'+
   
   (plan?'<div id="bi-credrow"'+(v.cat==='comida'?'':' hidden')+'><label class="f" for="bi-credits">Créditos del plan que usa (por persona)</label><input type="number" id="bi-credits" min="0" max="99" value="'+(v.credits||0)+'"><div class="tiny muted">Suma contra los créditos disponibles del cliente. 1 por comida de mesa, 2 en shows y cenas especiales.</div></div>':'')+
   '</div>'+
   '<label class="f" style="margin-top:12px" for="bi-file">Comprobante (PDF o imagen, hasta 10 MB)</label>'+(it&&it.file?'<div class="row" id="bi-curfile" style="gap:8px;margin-bottom:6px"><span class="chip">'+I('ext')+' '+esc(it.file.name)+'</span><button class="btn line sm" data-bdrmfile="1">Quitar</button></div>':'')+'<input type="file" id="bi-file" accept=".pdf,image/*"><div class="tiny muted" style="margin-top:4px">Se guarda solo en este navegador hasta que haya servidor.</div>'+
   '<label class="small" style="display:flex;gap:8px;align-items:flex-start;margin-top:12px;font-weight:600"><input type="checkbox" id="bi-vis"'+(v.visible?' checked':'')+' style="margin-top:3px"> <span>Que el cliente lo vea en «Mi viaje»<span class="tiny muted" style="display:block;font-weight:500">Ve el título, la fecha y el código. Nunca el monto.</span></span></label>'+
   '<label class="f" style="margin-top:12px" for="bi-note">Nota interna</label><textarea id="bi-note" rows="2" maxlength="300">'+esc(v.note||'')+'</textarea>'+
   '<div class="row" style="margin-top:16px"><button class="btn" data-bdsave="'+c.id+'">'+I('check')+' Guardar</button><button class="btn line" data-close="1">Cancelar</button></div></div></div></div>';
  showModal(h); var el=$('#bi-title'); if(el) el.focus();
}
function openBudgetEdit(cid){
  var c=client(cid); if(!c) return; var b=c.budget||{total:0,cats:{}};
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Presupuesto · '+esc(c.name)+'</span><h3 style="font-size:20px;font-weight:900;margin:4px 0 14px">Total y metas por categoría</h3>'+
   '<label class="f" for="bd-total">Presupuesto total (US$)</label><input type="text" inputmode="decimal" id="bd-total" value="'+(b.total?esc(String(b.total).replace('.',',')):'')+'">'+
   '<div class="tiny muted" style="margin:14px 0 6px"><b>Metas por categoría</b> (opcional): sirven para avisarte cuando una categoría se pasa. Dejalas vacías si no las necesitás.</div><div class="grid g2" style="gap:10px">'+BC.CATS.map(function(k){ var t=(b.cats||{})[k.k]; return '<div><label class="f" for="bd-t-'+k.k+'">'+esc(k.n)+'</label><input type="text" inputmode="decimal" id="bd-t-'+k.k+'" value="'+(t?esc(String(t).replace('.',',')):'')+'"></div>'; }).join('')+'</div>'+
   '<div class="row" style="margin-top:16px"><button class="btn" data-bdsavebudget="'+c.id+'">'+I('check')+' Guardar</button><button class="btn line" data-close="1">Cancelar</button>'+(c.budget?'<button class="btn danger" style="margin-left:auto" data-bdclear="'+c.id+'">Quitar presupuesto</button>':'')+'</div></div></div></div>');
}

/* ---------- acciones ---------- */
function budInit(c,total){ c.budget=c.budget||{total:0,cur:'USD',cats:{},share:false,autoMeals:false}; c.budget.total=total; c.items=c.items||[]; }
function budCreate(cid){
  var c=client(cid), t=BC.parseAmount(($('#bd-new-total')||{}).value); if(!c) return; if(!(t>0)){ toast('Poné un monto mayor a cero'); return; }
  budInit(c,t); logAct(cid,'Presupuesto definido: '+BC.money(t),'evento'); save(); render(); toast('Presupuesto definido');
}
function budSaveTotal(cid){
  var c=client(cid); if(!c) return; var t=BC.parseAmount(($('#bd-total')||{}).value); if(!(t>0)){ toast('Poné un total mayor a cero'); return; }
  var prev=c.budget&&c.budget.total; budInit(c,t); var cats={}, bad='';
  BC.CATS.forEach(function(k){ var el=$('#bd-t-'+k.k), raw=el?el.value.trim():''; if(!raw) return; var m=BC.parseAmount(raw); if(m===null) bad=k.n; else if(m>0) cats[k.k]=m; });
  if(bad){ toast('La meta de «'+bad+'» no es un número'); return; }
  c.budget.cats=cats; logAct(cid,prev?'Presupuesto total: '+BC.money(prev)+' → '+BC.money(t):'Presupuesto definido: '+BC.money(t),'evento'); save(); closeModal(); render(); toast('Presupuesto guardado');
}
function itemSave(cid){
  var c=client(cid); if(!c) return; var old=UI.bd.edit?(c.items||[]).filter(function(i){return i.id===UI.bd.edit})[0]:null, gv=function(s){ var e=$(s); return e?e.value:''; };
  var o={id:old?old.id:'',cat:gv('#bi-cat'),title:gv('#bi-title'),date:gv('#bi-date'),amount:gv('#bi-amount'),status:gv('#bi-status'),paid:false,conf:gv('#bi-conf'),credits:gv('#bi-credits'),visible:!!($('#bi-vis')||{}).checked,note:gv('#bi-note'),at:old?old.at:NOW(),by:old?old.by:'agus',file:UI.bd.rm?null:(old?old.file:null)};
  if(old&&old.slotRef) o.slotRef=old.slotRef;
  var r=BC.cleanItem(o,NOW(),'agus'); if(!r.ok){ toast(r.errors[0]); return; } var it=r.item; if(old&&old.slotRef) it.slotRef=old.slotRef;
  var f=UI.bd.file; if(f){ var err=BC.checkFile(f); if(err){ toast(err); return; } it.file={id:'f'+uid()+uid(),name:f.name,size:f.size,type:f.type||''}; }
  function done(msg){
    c.items=c.items||[]; if(old) c.items[c.items.indexOf(old)]=it; else c.items.push(it);
    logAct(cid,'Presupuesto: '+(old?'editó':'agregó')+' «'+it.title+'»'+(it.amount?' ('+BC.money(it.amount)+', '+it.status+')':''),it.status==='confirmado'?'reserva':'evento'); save(); UI.bd.edit=null; UI.bd.file=null; closeModal(); render(); toast(msg||(old?'Ítem actualizado':'Ítem agregado'));
  }
  if(f) Files.put(it.file.id,f).then(function(ok){ done(ok?'':'Ítem guardado, pero el archivo quedó solo en memoria: se pierde al cerrar la pestaña'); }); else done();
}
function itemDel(cid,id){
  var c=client(cid); if(!c) return; var i=(c.items||[]).map(function(x){return x.id}).indexOf(id); if(i<0) return; var it=c.items.splice(i,1)[0];
  logAct(cid,'Presupuesto: eliminó «'+it.title+'»','evento'); save(); render();
  toast('Ítem eliminado',{label:'Deshacer',fn:function(){ c.items.splice(Math.min(i,c.items.length),0,it); logAct(cid,'Presupuesto: recuperó «'+it.title+'»','evento'); save(); render(); }});
}
/* una reserva hecha en la sesión de reservas puede sumar su costo y sus créditos */
function budFromSlot(c,d,mealKey,r,conf,cost,credits){
  if(!(cost>0)&&!(credits>0)) return;
  c.items=c.items||[]; var ref=d.date+'|'+mealKey, cur=c.items.filter(function(i){return i.slotRef===ref})[0];
  var o=BC.cleanItem({id:cur?cur.id:'',cat:'comida',title:r.name+' · '+fmtShort(d.date)+' '+mealLabel(mealKey),date:d.date,amount:cost||0,status:'confirmado',paid:false,conf:conf,credits:credits||0,visible:cur?cur.visible:false,note:cur?cur.note:'',file:cur?cur.file:null,at:cur?cur.at:NOW(),by:'agus'},NOW(),'agus').item; o.slotRef=ref;
  if(cur) c.items[c.items.indexOf(cur)]=o; else c.items.push(o);
}
function budCopy(cid){ var c=client(cid); if(!c) return; copy(BC.shareText(c.name,budSum(c),budRows(c)),'Resumen copiado: pegalo en WhatsApp'); }
function budCsv(cid){ var c=client(cid); if(!c) return; downloadFile('presupuesto-'+(c.name||'cliente').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+todayISO()+'.csv','﻿'+BC.toCsv(budRows(c)),'text/csv'); }

CLICK.push(
 {a:'data-openpres', f:function(v,t,at,e){ UI.tab='pres'; }},
 {a:'data-bdnew', f:function(v){ openItemModal(v,null); }},
 {a:'data-bditem', f:function(v){ var p=v.split('|'); openItemModal(p[0],p[1]); }},
 {a:'data-bddel', f:function(v){ var p=v.split('|'); itemDel(p[0],p[1]); }},
 {a:'data-bdsave', f:function(v){ itemSave(v); }},
 {a:'data-bdedit', f:function(v){ openBudgetEdit(v); }},
 {a:'data-bdsavebudget', f:function(v){ budSaveTotal(v); }},
 {a:'data-bdcreate', f:function(v){ budCreate(v); }},
 {a:'data-bdclear', f:function(v){ var c=client(v); if(!c) return; var prev=c.budget; c.budget=null; logAct(v,'Presupuesto: quitó el total','evento'); save(); closeModal(); render(); toast('Presupuesto quitado',{label:'Deshacer',fn:function(){ c.budget=prev; save(); render(); }}); }},
 {a:'data-bdrmfile', f:function(v,t){ UI.bd.rm=true; UI.bd.file=null; var e=$('#bi-curfile'); if(e) e.remove(); }},
 {a:'data-bdfile', f:function(v){ var p=v.split('|'), c=client(p[0]), it=c&&(c.items||[]).filter(function(i){return i.id===p[1]})[0]; if(it&&it.file) openFile(it.file.id,it.file.name); }},
 {a:'data-bdf', f:function(v){ UI.bd.f=v; render(); }},
 {a:'data-bdcopy', f:function(v){ budCopy(v); }},
 {a:'data-bdcsv', f:function(v){ budCsv(v); }}
);
document.addEventListener('change',function(e){
  var t=e.target; if(!t||!t.id) return;
  if(t.id==='bi-cat'){ var cr=$('#bi-credrow'); if(cr) cr.hidden=t.value!=='comida'; }
  else if(t.id==='bi-file'){ var f=t.files&&t.files[0]; if(!f){ UI.bd.file=null; return; } var err=BC.checkFile(f); if(err){ toast(err); t.value=''; UI.bd.file=null; return; } UI.bd.file=f; }
  else if(t.id==='bd-auto'||t.id==='bd-share'){ var c=client(UI.cid); if(!c||!c.budget) return;
    if(t.id==='bd-auto'){ c.budget.autoMeals=t.checked; logAct(c.id,'Presupuesto: '+(t.checked?'suma':'dejó de sumar')+' las comidas automáticas','evento'); }
    else { c.budget.share=t.checked; logAct(c.id,'Presupuesto: '+(t.checked?'se lo muestra':'ya no se lo muestra')+' al cliente','evento'); }
    save(); render(); }
});

/* ---------- lo que ve el cliente en «Mi viaje» ---------- */
function clientDocs(c){
  var vis=(c.items||[]).filter(function(i){return i.visible}).sort(function(a,b){ return (a.date||'9999').localeCompare(b.date||'9999'); });
  var h='<section class="sec"><div class="sec-h"><div><span class="eyebrow">Tu viaje</span><h3>'+I('check')+' Mis reservas y comprobantes</h3><p>Lo que tu agente ya dejó cargado. Si falta algo, pedíselo por «Pedidos».</p></div></div>';
  if(c.budget&&c.budget.share&&BC.hasBudget(c)){ var s=budSum(c); h+='<div class="card" style="box-shadow:none;margin-bottom:12px"><div class="row between"><b style="font-family:var(--fh)">Presupuesto del viaje</b><span class="small">'+BC.money(s.committed)+' de '+BC.money(s.total)+'</span></div>'+budBar(s)+'<div class="tiny muted" style="margin-top:6px">'+(s.level==='over'?'Con lo cargado hasta ahora se supera el presupuesto: tu agente va a hablar con vos.':'Disponible: '+BC.money(s.available)+'. Incluye lo confirmado y lo estimado.')+'</div></div>'; }
  if(!vis.length) return h+'<div class="empty">Todavía no hay reservas para mostrar.</div></section>';
  h+='<div class="blist">'+vis.map(function(r){ var k=BC.catOf(r.cat), conf=r.status==='confirmado';
    return '<div class="bit"><span class="bci">'+I(k.ic)+'</span><div class="bim"><b>'+esc(r.title)+'</b><div class="tiny muted">'+esc(k.n)+(r.date?' · '+esc(fmtShort(r.date)):'')+'</div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip '+(conf?'ok':'warn')+'">'+(conf?'Confirmada':'En proceso')+'</span>'+(r.conf?'<span class="chip gray">Código '+esc(r.conf)+'</span>':'')+(r.file?'<button class="chip lnkchip" data-bdfile="'+c.id+'|'+r.id+'">'+I('ext')+' Ver comprobante</button>':'')+'</div></div></div>'; }).join('')+'</div>';
  return h+'</section>';
}
