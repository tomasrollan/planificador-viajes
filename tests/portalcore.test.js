const assert=require('assert');let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++};const ok=(c,m)=>{assert.ok(c,m);n++};
(async()=>{
const P=await import('../supabase/functions/portal/core.mjs');
const base=()=>({id:'c1',agency_id:'ag_default',token:'tok',pin:'123456',name:'Fam',phone:'+54 11',mode:'collab',notes:'privado',log:[{t:'nota interna',kind:'nota',by:'agus'}],stage:'sena',next:{date:'2027-01-01',note:'x'},docs:[{id:'d1'}],post:{rating:5},famId:'fam1',
 travelers:[{id:'t1',name:'Laura',type:'adulto',allergies:'Maní'},{id:'t2',name:'Sofi',type:'niño',allergies:''}],
 days:[{date:'2027-03-14',park:'EPCOT',slots:{breakfast:null,lunch:{rid:'a',state:'reservada',time:'13:00',conf:'ABC',by:'agus',locked:true},dinner:{rid:'b',state:'idea',time:'',conf:'',by:'cliente'}}}],
 favs:{t1:['a']},intake:null,requests:[],
 budget:{total:1000,share:false},items:[{id:'i1',cat:'hotel',title:'Hotel',amount:500,visible:true,conf:'H1',file:{id:'f1',name:'h.pdf',type:'application/pdf',size:10},note:'interna'},{id:'i2',cat:'vuelo',title:'Vuelo',amount:300,visible:false,conf:'V9',file:{id:'f2',name:'v.pdf'}}],
 pay:{price:2000,share:true,plan:[{id:'q1',n:'Seña',due:'2027-01-01',amount:500,paidAt:'2026-12-01',method:'efectivo',note:'interna',file:{id:'f3',name:'r.pdf'}}]}});
// vista: lo privado no sale
const v=P.portalView(base(),[{id:'k1',cid:'c1',agency_id:'ag_default',thread:[{id:'m1',by:'cliente',kind:'msg',text:'hola'},{id:'m2',by:'agus',kind:'nota',text:'secreto'}]},{id:'k2',cid:'otro',thread:[]}],{name:'Agus',tagline:'t'});
const s=JSON.stringify(v);
['123456','privado','nota interna','famId','sena"','H1x'].forEach(t=>{ if(t!=='sena"'&&t!=='H1x') ok(s.indexOf(t)<0,'no debe filtrarse '+t); });
ok(!('pin' in v.client)&&!('notes' in v.client)&&!('log' in v.client)&&!('famId' in v.client)&&!('stage' in v.client)&&!('next' in v.client)&&!('docs' in v.client)&&!('post' in v.client)&&!('agency_id' in v.client),'campos privados fuera');
eq(v.client.token,'tok');eq(v.client.items.length,1,'solo ítems visibles');eq(v.client.items[0].file.id,'f1');ok(!('note' in v.client.items[0]),'sin nota interna');ok(!('budget' in v.client),'sin presupuesto si no se comparte');
eq(v.cases.length,1,'solo casos del viaje');eq(v.cases[0].thread.length,1,'sin notas internas');ok(!('agency_id' in v.cases[0]));
eq(v.client.pay.plan[0],{id:'q1',n:'Seña',due:'2027-01-01',amount:500,paidAt:'2026-12-01',file:{id:'f3',name:'r.pdf',type:'',size:0}},'cuota sin método ni nota');
// presupuesto compartido: montos de todos, comprobantes solo de visibles
const b2=base();b2.budget.share=true;const v2=P.portalView(b2,[],{});eq(v2.client.items.length,2);ok(!v2.client.items[1].file&&!v2.client.items[1].conf,'sin comprobante ni código de lo no visible');
// pay no compartido
const b3=base();b3.pay.share=false;ok(!('pay' in P.portalView(b3,[],{}).client));
// archivos permitidos
eq(Object.keys(P.visibleFileIds(base())).sort(),['f1','f3']);const b4=base();b4.pay.share=false;eq(Object.keys(P.visibleFileIds(b4)),['f1']);
// PIN
ok(P.pinOk(base(),'123456'));ok(P.pinOk(base(),' 123456 '));ok(!P.pinOk(base(),'123457'));ok(!P.pinOk(base(),''));ok(!P.pinOk({pin:''},''),'sin PIN guardado nunca entra');ok(!P.pinOk(null,'1'));
// bloqueo por intentos
const now=Date.now(),f=(m)=>({ok:false,at:new Date(now-m*60000).toISOString()});
ok(P.tooManyFails([f(1),f(2),f(3),f(4),f(5)],now));ok(!P.tooManyFails([f(1),f(2),f(3),f(4),f(20)],now));ok(!P.tooManyFails([f(1),f(2),f(3),f(4),{ok:true,at:new Date(now).toISOString()}],now));
// guardar: solo lista blanca
let r=P.applyPatch(base(),[],{fields:{name:'HACK',pin:'000000',mode:'auto',items:[],pay:null,notes:'x',favs:{t1:['z']}}});
eq(r.client.name,'Fam');eq(r.client.pin,'123456');eq(r.client.mode,'collab');eq(r.client.items.length,2);ok(r.client.pay,'pay intacto');eq(r.client.notes,'privado');eq(r.client.favs,{t1:['z']},'favs sí');
// viajeros: no suma ni saca, sí corrige alergias
r=P.applyPatch(base(),[],{fields:{travelers:[{id:'t1',name:'Laura',type:'niño',allergies:'Maní, soja'},{id:'t9',name:'Extra'}]}});
eq(r.client.travelers.length,2);eq(r.client.travelers[0].allergies,'Maní, soja');eq(r.client.travelers[0].type,'adulto','no cambia el tipo (afecta el costo)');
// días: reservada y locked no se tocan; modo view no escribe
const days=[{date:'2027-03-14',park:'MK',slots:{breakfast:{rid:'x',state:'reservada',conf:'FAKE'},lunch:null,dinner:{rid:'c',state:'por_reservar',time:'19:00'}}}];
r=P.applyPatch(base(),[],{fields:{days}});const d=r.client.days[0];
eq(d.slots.lunch.conf,'ABC','la reserva real no se pisa');eq(d.slots.lunch.state,'reservada');eq(d.slots.breakfast.state,'idea','el cliente no puede marcar reservada');eq(d.slots.breakfast.conf,'');eq(d.slots.dinner.rid,'c');eq(d.park,'MK');
const bv=base();bv.mode='view';r=P.applyPatch(bv,[],{fields:{days}});eq(r.client.days,bv.days);ok(r.rejected.indexOf('days:modo')>=0);
const ba=base();ba.mode='auto';r=P.applyPatch(ba,[],{fields:{days}});eq(r.client.days[0].slots.lunch.state,'reservada','en auto la reserva sigue protegida si ya está reservada');
// historial: solo agrega, siempre como cliente
r=P.applyPatch(base(),[],{logAppend:[{t:'Agregó un restaurante',by:'agus',kind:'nota'},{x:1}]});eq(r.client.log.length,2);eq(r.client.log[1].by,'cliente');eq(r.client.log[1].kind,'evento');eq(r.client.log[0].text===undefined,true);
// casos: mensaje nuevo en caso propio, caso nuevo, caso ajeno rechazado, no puede escribir como agencia
const kc={id:'k1',cid:'c1',status:'resuelto',thread:[{id:'m0',by:'agus',kind:'msg',text:'a'}]};
r=P.applyPatch(base(),[kc],{cases:[{id:'k1',thread:[{id:'m0',by:'cliente',kind:'msg',text:'dup'},{id:'m5',by:'cliente',kind:'msg',text:'nuevo'},{id:'m6',by:'agus',kind:'msg',text:'me hago pasar'},{id:'m7',by:'cliente',kind:'nota',text:'nota'}]}]});
eq(r.caseOps.length,1);eq(r.caseOps[0].data.thread.map(m=>m.id),['m0','m5']);eq(r.caseOps[0].data.status,'en_curso','reabre un caso resuelto');
r=P.applyPatch(base(),[{id:'k9',cid:'otro',thread:[]}],{cases:[{id:'k9',thread:[{id:'z',by:'cliente',kind:'msg',text:'x'}]}]});eq(r.caseOps.length,0);ok(r.rejected.indexOf('case:ajeno')>=0);
r=P.applyPatch(base(),[],{cases:[{id:'kn',title:'Pregunta',type:'Consulta',priority:'urgente!',status:'resuelto',cid:'otro',thread:[{id:'m1',by:'cliente',kind:'msg',text:'Hola'}]}]});
eq(r.caseOps[0].op,'insert');eq(r.caseOps[0].data.cid,'c1','siempre a su propio viaje');eq(r.caseOps[0].data.status,'nuevo');eq(r.caseOps[0].data.priority,'normal');eq(r.caseOps[0].data.source,'cliente');
// una cancelación es interna: nunca llega al portal
r=P.portalView(Object.assign(base(),{cancel:{reason:'nopago',note:'deuda',at:1}}),[],{name:'A'});eq(r.client.cancel,undefined,'el portal no ve el motivo de cancelación');
// tamaño y basura
r=P.applyPatch(base(),[],{fields:{favs:{a:'x'.repeat(300000)}}});ok(r.rejected.indexOf('favs:tamaño')>=0);r=P.applyPatch(base(),[],null);eq(r.client.name,'Fam');r=P.applyPatch(base(),[],{fields:{days:'no'}});ok(r.rejected.length>0);
console.log('portal core OK ('+n+' checks)');
})().catch(e=>{console.error(e);process.exit(1)});
