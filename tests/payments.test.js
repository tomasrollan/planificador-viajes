const assert=require('assert'),P=require('../lib/payments.js');let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++};
// fechas
eq(P.addMonths('2027-01-31',1),'2027-02-28');eq(P.addMonths('2028-01-31',1),'2028-02-29');eq(P.addMonths('2027-11-15',3),'2028-02-15');eq(P.addMonths('2027-12-10',1),'2028-01-10');eq(P.addDays('2027-02-27',3),'2027-03-02');eq(P.days('2027-03-01','2027-03-31'),30);
// plan
let pl=P.schedule({price:6000,down:1500,downDue:'2027-01-10',n:3,firstDue:'2027-02-10'});
eq(pl.length,4);eq(pl[0],{n:'Anticipo',due:'2027-01-10',amount:1500});eq(pl.map(q=>q.amount),[1500,1500,1500,1500]);eq(pl[3].n,'Cuota 3 de 3');eq(pl[3].due,'2027-04-10');
pl=P.schedule({price:1000,n:3,firstDue:'2027-02-28'});eq(pl.map(q=>q.amount),[333.33,333.33,333.34]);eq(+pl.reduce((a,q)=>a+q.amount,0).toFixed(2),1000);eq(pl[1].due,'2027-03-28');
pl=P.schedule({price:1000,n:1,firstDue:'2027-02-01'});eq(pl.length,1);eq(pl[0].n,'Saldo');eq(P.schedule({price:0,n:3,firstDue:'2027-02-01'}),[]);eq(P.schedule({price:100,n:2}),[]);
eq(P.schedule({price:1000,down:2000,n:2,firstDue:'2027-02-01'}).length,1,'anticipo no puede superar el precio');
pl=P.schedule({price:900,n:3,firstDue:'2027-02-01',halfMonth:true});eq(pl.map(q=>q.due),['2027-02-01','2027-02-16','2027-03-03']);
// estado
const today='2027-03-10';eq(P.status({due:'2027-03-01'},today),'vencida');eq(P.status({due:'2027-03-12'},today),'pronto');eq(P.status({due:'2027-04-30'},today),'pendiente');eq(P.status({due:'2027-03-01',paidAt:'2027-03-02'},today),'pagada');eq(P.status({due:'2027-03-10'},today),'pronto');
// resumen
const pay={price:6000,plan:[{id:'a',n:'Anticipo',due:'2027-01-10',amount:1500,paidAt:'2027-01-09'},{id:'b',n:'Cuota 1 de 3',due:'2027-03-01',amount:1500},{id:'c',n:'Cuota 2 de 3',due:'2027-04-01',amount:1500},{id:'d',n:'Cuota 3 de 3',due:'2027-05-01',amount:1500}]};
let s=P.summary(pay,today);eq(s.paid,1500);eq(s.pending,4500);eq(s.overdue,1500);eq(s.nOverdue,1);eq(s.toCollect,4500);eq(s.pct,25);eq(s.level,'over');eq(s.next.id,'b');eq(s.nextDays,-9);eq(s.unassigned,0);eq(s.paidCount,1);eq(Math.round(s.pctPaid+s.pctPending),100);
pay.plan[1].paidAt='2027-03-02';s=P.summary(pay,today);eq(s.level,'ok');eq(s.next.id,'c');eq(s.nextDays,22);
pay.plan.forEach(q=>q.paidAt='2027-03-02');s=P.summary(pay,today);eq(s.done,true);eq(s.level,'done');eq(s.next,null);eq(s.toCollect,0);
s=P.summary({price:6000,plan:[{due:'2027-05-01',amount:2000}]},today);eq(s.unassigned,4000);s=P.summary(null,today);eq(s.price,0);
eq(P.hasPlan({pay:{price:100,plan:[{}]}}),true);eq(P.hasPlan({pay:{price:100,plan:[]}}),false);eq(P.hasPay({pay:{price:100,plan:[]}}),true);eq(P.hasPay({}),false);
// cuota
let q=P.cleanQuota({n:'Cuota 1',due:'2027-05-01',amount:'1.250,50'});eq(q.ok,true);eq(q.quota.amount,1250.5);eq(q.quota.paidAt,'');eq(q.quota.method,'');
q=P.cleanQuota({due:'mal',amount:'x'});eq(q.ok,false);eq(q.errors.length,2);
q=P.cleanQuota({n:'A',due:'2027-05-01',amount:10,paidAt:'2027-05-02',method:'tarjeta'});eq(q.quota.method,'tarjeta');
// alertas y textos
eq(P.alerts({plan:[{due:'2027-03-01',amount:1},{due:'2027-03-14',amount:1},{due:'2027-03-30',amount:1},{due:'2027-03-02',amount:1,paidAt:'2027-03-02'}]},today).map(a=>a.days),[-9,4]);
eq(P.dueText(-1),'venció hace 1 día');eq(P.dueText(0),'vence hoy');eq(P.dueText(1),'vence mañana');eq(P.dueText(4),'vence en 4 días');
const r=P.reminder('Marcela',{n:'Cuota 2 de 6',due:'2027-03-15',amount:1250},today);assert(/Marcela/.test(r)&&/cuota 2 de 6/.test(r)&&/US\$ 1\.250/.test(r)&&/15\/03/.test(r)&&/comprobante/.test(r));n+=4;
assert(/venció el 01\/03/.test(P.reminder('A',{n:'Anticipo',due:'2027-03-01',amount:100},today)));n++;
const tx=P.shareText('Familia X',P.summary(pay,today),pay.plan,today);assert(/Pagos del viaje · Familia X/.test(tx)&&/Cobrado: US\$ 6\.000 \(100%\)/.test(tx));n+=2;
eq(P.money(1234.5),'US$ 1.234,50');eq(P.parseAmount('1.500'),1500);
console.log('ok payments · '+n+' comprobaciones');
