/* Pagos del viaje (cobranza), sin dependencias del navegador (se prueba directo en Node).
   Es distinto del presupuesto: el presupuesto es lo que el cliente quiere gastar; los pagos son lo que el cliente le paga a la agencia
   por el viaje, en una o varias cuotas. Todo en dólares (US$).
   c.pay = {price, share, plan:[{id,n,due,amount,paidAt,method,file,note}]}. Una cuota está pagada cuando tiene paidAt. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Payments=factory(); })(typeof self!=='undefined'?self:this,function(){
  var METHODS=[['transferencia','Transferencia'],['efectivo','Efectivo'],['tarjeta','Tarjeta'],['mercadopago','Mercado Pago'],['otro','Otro']];
  var SOON=7;   // «vence pronto»: dentro de 7 días
  function round(x){ return Math.round((+x||0)*100)/100; }
  function pad(n){ return (n<10?'0':'')+n; }
  function iso(y,m,d){ return y+'-'+pad(m)+'-'+pad(d); }
  function isIso(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s||''); }
  function days(a,b){ return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/864e5); }
  function addDays(s,n){ var d=new Date(Date.parse(s+'T12:00:00Z')+n*864e5); return iso(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate()); }
  /* suma meses sin pasarse de fin de mes (31 ene + 1 mes = 28 feb) */
  function addMonths(s,n){ var y=+s.slice(0,4), m=+s.slice(5,7)-1+n, d=+s.slice(8,10); y+=Math.floor(m/12); m=((m%12)+12)%12;
    var last=new Date(Date.UTC(y,m+1,0)).getUTCDate(); return iso(y,m+1,Math.min(d,last)); }
  function parseAmount(s){
    if(typeof s==='number') return isFinite(s)&&s>=0?round(s):null;
    var t=String(s==null?'':s).toLowerCase().replace(/us\$|u\$s|usd|d[oó]lar(es)?|\$/g,'').replace(/\s+/g,'');
    if(!t||!/^[\d.,]+$/.test(t)) return null; var lc=t.lastIndexOf(','), ld=t.lastIndexOf('.');
    if(lc>=0&&ld>=0) t=lc>ld?t.replace(/\./g,'').replace(',','.'):t.replace(/,/g,'');
    else if(lc>=0){ var pc=t.split(','); t=(pc.length===2&&pc[1].length<=2)?pc[0]+'.'+pc[1]:t.replace(/,/g,''); }
    else if(ld>=0){ var pd=t.split('.'); t=(pd.length===2&&pd[1].length<=2)?t:t.replace(/\./g,''); }
    var n=parseFloat(t); return isFinite(n)&&n>=0?round(n):null;
  }
  function money(x){ var n=round(x), neg=n<0; n=Math.abs(n); var p=n.toFixed(2).split('.'), e=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.'); return (neg?'-':'')+'US$ '+e+(p[1]==='00'?'':','+p[1]); }
  function hasPlan(c){ return !!(c&&c.pay&&+c.pay.price>0&&(c.pay.plan||[]).length); }
  function hasPay(c){ return !!(c&&c.pay&&+c.pay.price>0); }

  /* Arma un plan: anticipo (opcional) + n cuotas iguales. Los centavos sobrantes van a la última cuota. */
  function schedule(o){
    var price=round(o.price), down=Math.min(price,round(o.down||0)), n=Math.max(1,Math.min(36,Math.floor(+o.n||1))), step=Math.max(1,Math.floor(+o.stepMonths||1));
    var out=[], rest=round(price-down), first=isIso(o.firstDue)?o.firstDue:null; if(!(price>0)||!first) return out;
    var per=Math.floor(rest/n*100)/100, sum=0;
    if(down>0) out.push({n:'Anticipo',due:isIso(o.downDue)?o.downDue:first,amount:down});
    if(rest>0){ for(var i=0;i<n;i++){ var a=i===n-1?round(rest-sum):per; sum=round(sum+a); out.push({n:n===1?'Saldo':'Cuota '+(i+1)+' de '+n,due:o.halfMonth?addDays(first,15*i):addMonths(first,step*i),amount:a}); } }
    return out;
  }
  function status(q,today){ if(q.paidAt) return 'pagada'; if(today&&isIso(q.due)){ var d=days(today,q.due); if(d<0) return 'vencida'; if(d<=SOON) return 'pronto'; } return 'pendiente'; }

  function summary(pay,today){
    pay=pay||{}; var price=round(pay.price), plan=pay.plan||[], paid=0, pending=0, overdue=0, nOver=0, sched=0, next=null, lastPaid=null;
    plan.forEach(function(q){ var a=round(q.amount); sched+=a; var st=status(q,today);
      if(st==='pagada'){ paid+=a; if(!lastPaid||q.paidAt>lastPaid) lastPaid=q.paidAt; }
      else { pending+=a; if(st==='vencida'){ overdue+=a; nOver++; } if(!next||(q.due||'9999')<(next.due||'9999')) next=q; } });
    paid=round(paid); pending=round(pending); sched=round(sched); overdue=round(overdue);
    var pct=price?Math.min(100,paid/price*100):0, pctPend=price?Math.min(100-pct,pending/price*100):0;
    return {price:price,scheduled:sched,paid:paid,pending:pending,overdue:overdue,nOverdue:nOver,toCollect:round(Math.max(0,price-paid)),unassigned:round(price-sched),
      pct:Math.round(pct),pctPaid:round(pct),pctPending:round(pctPend),next:next,nextDays:next&&isIso(next.due)&&today?days(today,next.due):null,
      done:price>0&&paid>=price,level:nOver?'over':(price>0&&paid>=price)?'done':'ok',count:plan.length,paidCount:plan.filter(function(q){return q.paidAt}).length};
  }

  function cleanQuota(o,fallbackN){
    var errs=[], amt=parseAmount(o.amount); if(!(amt>0)) errs.push('Poné un monto mayor a cero'); if(!isIso(o.due)) errs.push('Poné la fecha de vencimiento');
    var paidAt=isIso(o.paidAt)?o.paidAt:'';
    return {ok:!errs.length,errors:errs,quota:{id:o.id||('q'+Math.random().toString(36).slice(2,9)),n:String(o.n||fallbackN||'Cuota').trim().slice(0,40),due:isIso(o.due)?o.due:'',amount:amt||0,paidAt:paidAt,
      method:paidAt?String(o.method||'').slice(0,20):'',file:o.file&&o.file.id?{id:o.file.id,name:String(o.file.name||'').slice(0,120),size:+o.file.size||0,type:String(o.file.type||'')}:null,note:String(o.note||'').trim().slice(0,200)}};
  }
  function sortPlan(plan){ return plan.slice().sort(function(a,b){ return (a.due||'9999').localeCompare(b.due||'9999'); }); }

  /* «Para hacer hoy»: cuotas vencidas o que vencen en los próximos 5 días */
  function alerts(pay,today){
    var out=[]; ((pay&&pay.plan)||[]).forEach(function(q){ if(q.paidAt||!isIso(q.due)) return; var d=days(today,q.due); if(d<0||d<=5) out.push({q:q,days:d,late:d<0}); });
    return out.sort(function(a,b){ return a.days-b.days; });
  }
  function dueText(d){ return d<0?'venció hace '+(-d)+(d===-1?' día':' días'):d===0?'vence hoy':d===1?'vence mañana':'vence en '+d+' días'; }
  function ddmm(s){ return s.slice(8,10)+'/'+s.slice(5,7); }
  /* mensaje de recordatorio para WhatsApp */
  function reminder(name,q,today,extra){
    var d=days(today,q.due), t='Hola '+name+'! Te escribo por el viaje: la '+(/^cuota/i.test(q.n)?q.n.toLowerCase().replace(/^cuota/,'cuota'):q.n.toLowerCase())+' de '+money(q.amount)+' '+(d<0?'venció el '+ddmm(q.due):d===0?'vence hoy':'vence el '+ddmm(q.due))+'.';
    t+=' Cuando la hagas, mandame el comprobante por acá así lo registro.'; if(extra) t+='\n'+extra; return t;
  }
  function shareText(name,s,plan,today){
    var L=['*Pagos del viaje · '+name+'*','Precio: '+money(s.price)+' · Cobrado: '+money(s.paid)+' ('+s.pct+'%) · Falta: '+money(s.toCollect)];
    if(s.nOverdue) L.push('Vencido: '+money(s.overdue)+' ('+s.nOverdue+(s.nOverdue===1?' cuota':' cuotas')+')');
    L.push(''); sortPlan(plan).forEach(function(q){ var st=status(q,today); L.push('• '+q.n+' · '+ddmm(q.due||'0000-00-00')+' · '+money(q.amount)+' · '+(st==='pagada'?'pagada':st==='vencida'?'VENCIDA':'pendiente')); });
    return L.join('\n');
  }
  return {METHODS:METHODS,SOON:SOON,parseAmount:parseAmount,money:money,addMonths:addMonths,addDays:addDays,days:days,hasPlan:hasPlan,hasPay:hasPay,schedule:schedule,status:status,summary:summary,cleanQuota:cleanQuota,sortPlan:sortPlan,alerts:alerts,dueText:dueText,reminder:reminder,shareText:shareText};
});
