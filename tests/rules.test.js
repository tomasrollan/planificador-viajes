const assert=require('assert'),R=require('../lib/rules.js'),D=require('../lib/dates.js');let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
const RID={a:{id:'a',c:1,cb:null,tier:3},b:{id:'b',c:2,cb:1,tier:4},c:{id:'c',c:0,cb:null,tier:2}};
const days=[{date:'2027-03-14',slots:{breakfast:{rid:'b',state:'idea'},lunch:null,dinner:{rid:'a',state:'reservada'}}},{date:'2027-03-15',slots:{breakfast:null,lunch:{rid:'c',state:'por_reservar'},dinner:{rid:'b',state:'por_reservar'}}}];
const cl={start:'2027-03-14',end:'2027-03-19',plan:'base',mode:'collab',travelers:[{name:'A',allergies:'Maní'},{name:'B',allergies:'  '},{name:'C'}],days};
// créditos
eq(R.creditsOf(RID.b,'breakfast'),1,'el desayuno puede costar distinto');eq(R.creditsOf(RID.b,'dinner'),2);eq(R.creditsOf(RID.c,'lunch'),0,'sin plan = 0');
eq(R.usedCredits(cl,RID),{plan:1+1+0+2,commit:1+2},'plan cuenta todo; commit excluye ideas');
eq(R.planTotal(cl),5,'base: 1 crédito por noche × 5 noches');eq(R.planTotal({...cl,plan:'premium'}),10);eq(R.planTotal({...cl,plan:'none'}),0);
let cr=R.creditsLeft(cl,RID);eq([cr.total,cr.used,cr.left,cr.over],[5,4,1,0]);eq(cr.pct,80);
cr=R.creditsLeft({...cl,end:'2027-03-16'},RID);eq([cr.total,cr.left,cr.over,cr.pct],[2,0,2,100],'te pasás por 2');
eq(R.estimate({...cl,plan:'none'},RID),(47+70+25+70)*3,'precio por nivel × 3 viajeros');eq(R.estimate({days:[],travelers:[]},RID),0);
// permisos
eq(R.canEdit('agus',{mode:'view'},{state:'reservada'}),true);eq(R.canEdit('cliente',{mode:'view'},null),false);eq(R.canEdit('cliente',{mode:'auto'},{state:'reservada'}),true);
eq(R.canEdit('cliente',{mode:'collab'},{state:'reservada'}),false,'collab: lo reservado queda bloqueado');eq(R.canEdit('cliente',{mode:'collab'},{state:'idea'}),true);
eq(R.canAdd('cliente',{mode:'view'}),false);eq(R.canAdd('cliente',{mode:'collab'}),true);eq(R.canAdd('agus',{mode:'view'}),true);
eq(R.newSlotState('agus',cl),'por_reservar');eq(R.newSlotState('cliente',{mode:'auto'}),'por_reservar');eq(R.newSlotState('cliente',{mode:'collab'}),'idea');
// progreso y huecos
eq(R.progress(cl),{cap:6,filled:4,res:1,pend:2,pct:67});eq(R.emptySlots(cl).length,2);eq(R.countSlots(cl),4);
// ventana de reservas: 60 días antes, 6:00 AM Florida
const w=R.resWindow(cl,Date.UTC(2027,0,1));eq(w.open,'2027-01-13');eq(w.passed,false);eq(R.resWindow(cl,D.instantAt('2027-01-13',6,0,'America/New_York')).passed,true);
eq(R.resWindow(cl,D.instantAt('2027-01-13',5,59,'America/New_York')).passed,false);
// horarios
const H={m:[['Almuerzo','11:00','14:55'],['Cena','15:00','21:00']],d:['11:00-21:00','11:00-21:00','11:00-21:00','11:00-17:55','11:00-17:55','11:00-21:00','11:00-17:55']};
eq(R.mealServed(H,'dinner'),{ok:true,from:'15:00',to:'21:00'});eq(R.mealServed(H,'breakfast'),{ok:false});eq(R.mealServed({m:[]},'lunch'),null);eq(R.mealServed(['Brunch'],'x'),null);
eq(R.dayHours(H,'2027-03-15'),'11:00-21:00','lunes');eq(R.dayHours(H,'2027-03-18'),'11:00-17:55','jueves');eq(R.dayHours(H,'2027-03-21'),'11:00-17:55','domingo');
eq(R.timeStatus(H,'2027-03-18','18:30'),{from:'11:00',to:'17:55',out:true});eq(R.timeStatus(H,'2027-03-18','12:00').out,false);eq(R.timeStatus(H,'2027-03-18','').out,false);eq(R.timeStatus(null,'2027-03-18','12:00'),null);
// alergias
eq(R.algList(cl).length,1);eq(R.algText(cl),'A (Maní)');
// cola
eq(R.queue([cl],RID).map(x=>x.r.id),['c','b']);
// SLA
const now=1e12;eq(R.dueInfo({status:'resuelto'},now),{t:'Resuelto',cls:'ok',late:false});eq(R.dueInfo({status:'nuevo',due:now-5*36e5},now),{t:'Vencido hace 5 h',cls:'bad',late:true});
eq(R.dueInfo({status:'nuevo',due:now+3*36e5},now).cls,'warn');eq(R.dueInfo({status:'nuevo',due:now+50*36e5},now),{t:'Vence en 2 d',cls:'gray',late:false});
console.log('rules.test: '+n+' verificaciones OK');
