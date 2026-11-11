/* Reglas de negocio puras (sin DOM, sin estado global): créditos del plan, costo estimado, permisos, horarios, cola de reservas.
   Se testean directamente en Node (tests/rules.test.js) y la app las usa tal cual. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(require('./dates.js')); else root.Rules=factory(root.Dates); })(typeof self!=='undefined'?self:this,function(Dates){
  var MEALS=['breakfast','lunch','dinner'];
  var PLANS={none:{n:'Sin plan de comidas',per:0},base:{n:'Plan base (Table-Service)',per:1},premium:{n:'Plan premium (Deluxe Table-Service)',per:2}};
  var PRICE_EST={2:25,3:47,4:70};                       // USD por adulto por comida, según nivel de precio del restaurante
  var MEALKEY={breakfast:['Desayuno','Brunch'],lunch:['Almuerzo','Brunch'],dinner:['Cena']};
  var RES_DAYS=60;                                      // las reservas abren 60 días antes de la llegada (huéspedes de resorts Disney)

  /* destinos del viaje: 'wdw' (Walt Disney World) y/o 'uor' (Universal Orlando). Los viajes anteriores son solo Disney. */
  function dests(c){ return (c&&c.dests&&c.dests.length)?c.dests:['wdw']; }
  function hasDest(c,d){ return dests(c).indexOf(d)>=0; }
  /* fechas de estadía de un destino: en un viaje combinado cada destino puede tener las suyas (c.segs); si no, las del viaje */
  function range(c,d){ var g=c.segs&&c.segs[d]; return (g&&g.start&&g.end&&g.end>=g.start)?{start:g.start,end:g.end}:{start:c.start,end:c.end}; }
  /* créditos que cuesta una comida en un restaurante (el desayuno puede costar distinto) */
  function creditsOf(r,meal){ return (meal==='breakfast'&&r.cb!=null)?r.cb:r.c; }
  function slots(c){ var out=[]; (c.days||[]).forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots&&d.slots[m]; if(s) out.push({date:d.date,meal:m,slot:s}); }); }); return out; }
  function countSlots(c){ return slots(c).length; }
  /* plan = todas las comidas agendadas; commit = las que ya no son "idea" */
  function usedCredits(c,rid){ var plan=0,commit=0; slots(c).forEach(function(x){ var r=rid[x.slot.rid]; if(!r) return; var k=creditsOf(r,x.meal); plan+=k; if(x.slot.state!=='idea') commit+=k; }); return {plan:plan,commit:commit}; }
  function planTotal(c){ if(!hasDest(c,'wdw')) return 0; var p=PLANS[c.plan]||PLANS.none, g=range(c,'wdw'); return p.per*Dates.nights(g.start,g.end); }
  function creditsLeft(c,rid){ var tot=planTotal(c), u=usedCredits(c,rid); return {total:tot,used:u.plan,left:Math.max(0,tot-u.plan),over:Math.max(0,u.plan-tot),pct:tot?Math.min(100,Math.round(u.plan/tot*100)):0,commit:u.commit}; }
  /* costo estimado sin plan: precio por nivel × viajeros */
  function estimate(c,rid,dest){ var tot=0, ad=(c.travelers&&c.travelers.length)||1; slots(c).forEach(function(x){ var r=rid[x.slot.rid]; if(r&&(!dest||(r.dest||'wdw')===dest)) tot+=PRICE_EST[r.tier]||25; }); return tot*ad; }
  /* permisos: la agencia puede todo; el cliente depende del modo (view/collab/auto) y de si la comida ya está reservada */
  function canEdit(role,c,slot){ if(role==='agus') return true; if(c.mode==='view') return false; if(c.mode==='auto') return true; if(slot&&slot.state==='reservada') return false; return true; }
  function canAdd(role,c){ return role==='agus'||c.mode!=='view'; }
  /* estado con el que nace una comida nueva según quién la agrega */
  function newSlotState(role,c){ if(role==='agus') return 'por_reservar'; if(role==='cliente'&&c.mode==='auto') return 'por_reservar'; return 'idea'; }
  function progress(c){ var cap=(c.days||[]).length*3, f=0, r=0, p=0; slots(c).forEach(function(x){ f++; if(x.slot.state==='reservada') r++; if(x.slot.state==='por_reservar') p++; }); return {cap:cap,filled:f,res:r,pend:p,pct:cap?Math.round(f/cap*100):0}; }
  function emptySlots(c){ var out=[]; (c.days||[]).forEach(function(d){ MEALS.forEach(function(m){ if(!(d.slots&&d.slots[m])) out.push({date:d.date,meal:m}); }); }); return out; }
  /* ventana de reservas: abre RES_DAYS antes, 6:00 AM de Florida */
  function resWindow(c,now){ var open=Dates.addDays(range(c,'wdw').start,-RES_DAYS); return {open:open,passed:Dates.windowOpened(open,now)}; }
  /* horarios publicados (H = entrada de HORARIOS del restaurante) */
  function mealServed(H,meal){ if(!H||!H.m||!H.m.length) return null; var hit=H.m.filter(function(m){return MEALKEY[meal].indexOf(m[0])>=0})[0]; return hit?{ok:true,from:hit[1],to:hit[2]}:{ok:false}; }
  function dayHours(H,date){ if(!H||!H.d) return null; var v=H.d[Dates.dowMon(date)]; return v||null; }
  function timeStatus(H,date,t){ var v=dayHours(H,date); if(!v) return null; var a=v.split('-'); return {from:a[0],to:a[1],out:!!(t&&(t<a[0]||t>a[1]))}; }
  function algList(c){ return (c.travelers||[]).filter(function(t){ return (t.allergies||'').trim(); }); }
  function algText(c){ return algList(c).map(function(t){ return t.name+' ('+t.allergies.trim()+')'; }).join(', '); }
  /* cola de reservas pendientes de todos los clientes */
  function queue(clients,rid){ var q=[]; clients.forEach(function(c){ (c.days||[]).forEach(function(d){ MEALS.forEach(function(m){ var s=d.slots&&d.slots[m]; if(s&&s.state==='por_reservar'&&rid[s.rid]) q.push({c:c,d:d,m:m,s:s,r:rid[s.rid]}); }); }); }); return q; }
  /* SLA de un caso */
  function isOpen(k){ return k.status!=='resuelto'; }
  function dueInfo(k,now){ if(!isOpen(k)) return {t:'Resuelto',cls:'ok',late:false}; var left=k.due-now, a=Math.abs(left), h=Math.round(a/36e5), lab=h<24?h+' h':Math.round(h/24)+' d';
    return left<0?{t:'Vencido hace '+lab,cls:'bad',late:true}:{t:'Vence en '+lab,cls:left<6*36e5?'warn':'gray',late:false}; }
  return {MEALS:MEALS,PLANS:PLANS,PRICE_EST:PRICE_EST,MEALKEY:MEALKEY,RES_DAYS:RES_DAYS,creditsOf:creditsOf,dests:dests,hasDest:hasDest,range:range,slots:slots,countSlots:countSlots,usedCredits:usedCredits,planTotal:planTotal,creditsLeft:creditsLeft,estimate:estimate,canEdit:canEdit,canAdd:canAdd,newSlotState:newSlotState,progress:progress,emptySlots:emptySlots,resWindow:resWindow,mealServed:mealServed,dayHours:dayHours,timeStatus:timeStatus,algList:algList,algText:algText,queue:queue,isOpen:isOpen,dueInfo:dueInfo};
});
