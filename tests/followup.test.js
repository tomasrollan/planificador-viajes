const assert=require('assert'),F=require('../lib/followup.js');let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++};
const today='2027-03-10';
// etapa
eq(F.stage({start:'2027-02-01',end:'2027-02-08'},today,true),'postviaje');eq(F.stage({start:'2027-03-08',end:'2027-03-15'},today,false),'viajando');
eq(F.stage({start:'2027-06-01',end:'2027-06-08'},today,false),'consulta');eq(F.stage({start:'2027-06-01',end:'2027-06-08'},today,true),'sena');
eq(F.stage({start:'2027-06-01',end:'2027-06-08',stage:'cotizado'},today,true),'cotizado','lo que eligió la agencia manda antes del viaje');
eq(F.stage({start:'2027-06-01',end:'2027-06-08',stage:'viajando'},today,false),'consulta','no se puede forzar «en viaje» antes de tiempo');
eq(F.stageLabel('sena'),'Seña pagada');eq(F.stageLabel('x'),'');
// próximo contacto
eq(F.cleanNext({date:'2027-03-12',note:'  llamar '}),{date:'2027-03-12',note:'llamar'});eq(F.cleanNext({date:'mañana'}),null);eq(F.cleanNext(null),null);
eq(F.nextState({next:{date:'2027-03-09'}},today).late,true);eq(F.nextState({next:{date:'2027-03-10'}},today).today,true);eq(F.nextState({next:{date:'2027-03-15'}},today).soon,true);eq(F.nextState({next:{date:'2027-05-01'}},today).soon,false);eq(F.nextState({},today),null);
// recontacto
eq(F.recontact([{end:'2026-01-10'}],today,false).months,14);eq(F.recontact([{end:'2026-12-10'}],today,false),null,'muy reciente');
eq(F.recontact([{end:'2026-01-10'},{end:'2027-08-01'}],today,false),null,'tiene un viaje próximo');eq(F.recontact([{end:'2026-01-10'}],today,true),null,'ya tiene próximo contacto');eq(F.recontact([],today,false),null);
// checklist
const kids={travelers:[{type:'adulto'},{type:'niño'}]},adults={travelers:[{type:'adulto'}]};
eq(F.defaultDocs(kids).some(d=>d.id==='menores'),true);eq(F.defaultDocs(adults).some(d=>d.id==='menores'),false);
eq(F.defaultDocs(adults).every(d=>!d.done),true);eq(F.docs({}).length,F.defaultDocs({}).length);
let c={start:'2027-04-01',travelers:[{type:'adulto'}]};c.docs=F.defaultDocs(c);c.docs[0].done=true;
eq(F.docsSummary(c).done,1);eq(F.docsSummary(c).pending,F.docs(c).length-1);
eq(F.docsAlert(c,today).days,22);eq(F.docsAlert({start:'2027-09-01',docs:c.docs},today),null,'falta mucho');eq(F.docsAlert({start:'2027-03-01',docs:c.docs},today),null,'ya viajó');
c.docs.forEach(d=>d.done=true);eq(F.docsAlert(c,today),null,'todo listo');
// postviaje
eq(F.cleanPost({rating:9,referral:'xx'}),{rating:0,liked:'',improve:'',referral:'pendiente',at:0});eq(F.cleanPost({rating:4.4,liked:' bien ',referral:'pedido'}).rating,4);eq(F.cleanPost(null),null);
eq(F.postAlert({end:'2027-03-09'},today),null,'muy pronto');eq(F.postAlert({end:'2027-03-05'},today).days,5);eq(F.postAlert({end:'2026-12-01'},today),null,'muy viejo');eq(F.postAlert({end:'2027-03-05',post:{rating:5}},today),null,'ya cargado');
// búsqueda
eq(F.codeNum('FAM-0012'),12);eq(F.codeNum('fam 12'),12);eq(F.codeNum('12'),12);eq(F.codeNum('#7'),7);eq(F.codeNum('Pérez'),null);eq(F.codeNum('fam-12x'),null);
eq(F.match('FAM-0003',['Pareja Pérez'],'FAM-0003'),true);eq(F.match('3',['Pareja Pérez'],'FAM-0003'),true);eq(F.match('fam-4',['Pareja Pérez'],'FAM-0003'),false);
eq(F.match('perez',['Pareja Pérez','Disney'],'FAM-0001'),true,'sin tildes');eq(F.match('pareja disney',['Pareja Pérez','Disney'],''),true,'todas las palabras');eq(F.match('pareja cancún',['Pareja Pérez','Disney'],''),false);eq(F.match('',['x'],''),true);
console.log('followup.test.js: '+n+' verificaciones OK');
