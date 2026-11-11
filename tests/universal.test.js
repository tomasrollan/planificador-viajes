// Tests del módulo Universal Orlando: reglas de destinos, anticipación de reservas, sugerencias sin créditos y datos del catálogo.
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const Rules=require('../lib/rules.js'),Suggest=require('../lib/suggest.js'),Universal=require('../lib/universal.js'),Messages=require('../lib/messages.js'),Repo=require('../lib/repo.js');
let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
const ctx={window:{}};vm.createContext(ctx);
['catalog.js','catalog-uor.js'].forEach(f=>vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/'+f),'utf8'),ctx));
const R=ctx.window.CATALOG.map(a=>({dest:'wdw',id:a[0].split('/')[1],path:a[0],name:a[1],zone:a[2],area:a[3],cuisine:a[4],flags:a[5]||'',tier:a[6],c:a[7],cb:a[8],cu:!!a[9],rating:a[10],diff:a[11]}));
ctx.window.CATALOG_UOR.forEach(o=>R.push({dest:'uor',id:o.id,path:'',name:o.name,zone:o.zone,area:o.area,cuisine:o.cuisine,flags:o.flags||'',tier:o.tier,c:0,cb:null,cu:false,rating:null,diff:o.diff,hot:!!o.hot,book:o.book,meals:o.meals||''}));
const RID={};R.forEach(r=>RID[r.id]=r);
const PZ={'Magic Kingdom':'MK','EPCOT':'EP','Hollywood Studios':'HS','Animal Kingdom':'AK','Disney Springs':'DS'};Object.assign(PZ,Universal.PARKZONE);
const destOf=p=>Universal.isPark(p)?'uor':'wdw';
const mealOk=(r,m)=>r.dest==='uor'?(r.meals?r.meals.indexOf({breakfast:'B',lunch:'L',dinner:'D'}[m])>=0:null):null;
const days=(a,k)=>Array.from({length:k},(_,i)=>({date:Repo&&require('../lib/dates.js').addDays(a,i),park:'',slots:{breakfast:null,lunch:null,dinner:null}}));
const mk=(over)=>Object.assign({id:'c',plan:'none',dests:['uor'],start:'2027-03-14',end:'2027-03-19',travelers:[{id:'t1',type:'adulto',allergies:''},{id:'t2',type:'niño',allergies:''}],favs:{},days:days('2027-03-14',5)},over||{});

// ---- datos del catálogo de Universal
const U=ctx.window.CATALOG_UOR;
eq(U.length,31,'31 restaurantes de servicio de mesa');
eq(new Set(U.map(o=>o.id)).size,U.length,'ids únicos');
ok(U.every(o=>/^uor-/.test(o.id)&&['US','IA','EU','CW','UH'].includes(o.zone)&&[2,3,4].includes(o.tier)&&[1,2,3].includes(o.diff)&&Universal.BOOK[o.book]&&o.desc.length>30),'campos válidos');
ok(!U.some(o=>R.some(r=>r.dest==='wdw'&&r.id===o.id)),'sin choques de id con Disney');
eq(U.filter(o=>o.zone==='EU').length,2,'Epic Universe: Atlantic y Blue Dragon');
eq(U.filter(o=>o.zone==='CW').length,11,'CityWalk');
ok(U.every(o=>!/https?:\/\//.test(o.desc)),'sin enlaces dentro de las descripciones');
ok(/solo_enlaces/.test(ctx.window.CATALOG_UOR_META.contentMode),'modo de contenido: solo enlaces');

// enlaces oficiales por restaurante (capturados desde la web oficial)
const LK=ctx.window.CATALOG_UOR_LINKS||{};
eq(Object.keys(LK).length,26,'26 restaurantes con enlace oficial');
ok(Object.keys(LK).every(k=>U.some(o=>o.id===k)),'cada enlace pertenece a un restaurante del catálogo');
ok(Object.values(LK).every(v=>/^https?:\/\/(www\.universalorlando\.com|resy\.com|www\.opentable\.com|opentable\.com)\//.test(v.r)),'enlaces de reserva a dominios oficiales o a Resy/OpenTable');
ok(!Object.values(LK).some(v=>/[?&](session|token|cookie)/i.test(v.r)),'sin datos de sesión en los enlaces');
eq(LK['uor-mythos-restaurant'].r,'https://www.universalorlando.com/dining/en/us/login?place_id=uor.ioa.dining.mythos_restaurant');

// ---- destinos y rangos
eq(Rules.dests({}),['wdw'],'viajes viejos = Disney');ok(Rules.hasDest({dests:['uor']},'uor')&&!Rules.hasDest({dests:['uor']},'wdw'));
let c=mk();eq(Rules.planTotal(Object.assign(c,{plan:'base'})),0,'Universal solo: sin créditos aunque el plan diga base');
c=mk({dests:['wdw','uor'],plan:'base',segs:{wdw:{start:'2027-03-14',end:'2027-03-17'},uor:{start:'2027-03-17',end:'2027-03-19'}}});
eq(Rules.range(c,'wdw'),{start:'2027-03-14',end:'2027-03-17'});eq(Rules.range(c,'uor').start,'2027-03-17');
eq(Rules.planTotal(c),3,'combo: el plan de Disney cuenta solo las noches de Disney (3)');
eq(Rules.resWindow(c,Date.UTC(2030,0,1)).open,'2027-01-13','la ventana de Disney sale de la llegada a Disney');
c=mk({dests:['wdw','uor'],plan:'base',start:'2027-03-14',end:'2027-03-19',segs:{wdw:{start:'2027-03-14',end:'2027-03-10'}}});
eq(Rules.range(c,'wdw'),{start:'2027-03-14',end:'2027-03-19'},'rango inválido: se usa el del viaje');
// estimado por destino
c=mk({dests:['wdw','uor'],plan:'none'});c.days[0].slots.dinner={rid:'liberty-tree-tavern',state:'idea'};c.days[1].slots.dinner={rid:'uor-mythos-restaurant',state:'idea'};
eq(Rules.estimate(c,RID,'uor'),Rules.PRICE_EST[3]*2,'estimado solo de Universal (tier 3 × 2 personas)');
eq(Rules.estimate(c,RID,'wdw'),Rules.PRICE_EST[3]*2,'estimado solo de Disney');
eq(Rules.estimate(c,RID),Rules.PRICE_EST[3]*4,'estimado total');
eq(Rules.usedCredits(c,RID).plan,1,'los restaurantes de Universal no gastan créditos');

// ---- anticipación para reservar
function A(start,today){return Universal.advice(mk({start,end:'2028-01-01',dests:['uor']}),today)}
eq(A('2027-06-14','2026-11-11').state,'lejos','a más de 180 días: pronto');
eq(A('2027-03-14','2026-11-11').daysTo,123,'cuenta los días hasta la estadía en Universal');
eq(Universal.advice(mk({start:'2027-05-20',end:'2027-05-25'}),'2026-11-11').state,'lejos');
eq(Universal.advice(mk({start:'2027-03-14',end:'2027-03-19'}),'2026-11-11').state,'abierta','entre 60 y 180 días: ya se puede reservar');
eq(Universal.advice(mk({start:'2027-01-10',end:'2027-01-15'}),'2026-11-11').state,'cerca','entre 14 y 60 días: reservar ya los difíciles');
eq(Universal.advice(mk({start:'2026-11-20',end:'2026-11-25'}),'2026-11-11').state,'urgente','menos de 14 días');
eq(Universal.advice(mk({start:'2026-11-01',end:'2026-11-25'}),'2026-11-11').state,'en_viaje','ya empezó');
ok(/6 meses/.test(Universal.advice(mk({start:'2027-09-10',end:'2027-09-15'}),'2026-11-11').text),'explica que Universal deja reservar ~6 meses antes');
eq(Universal.advice(mk({dests:['wdw','uor'],start:'2027-03-14',end:'2027-03-24',segs:{uor:{start:'2027-03-20',end:'2027-03-24'}}}),'2026-11-11').start,'2027-03-20','usa la estadía de Universal en un combo');

// ---- sugerir agenda en Universal
c=mk({plan:'premium'});c.days[0].park='Universal Studios Florida';c.days[1].park='Islands of Adventure';c.days[2].park='Epic Universe';c.days[3].park='Volcano Bay';c.days[4].park=Universal.REST_PARK;
let r=Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk});
eq(r.picks.length,5,'una mesa por día aunque el plan de Disney sea premium (no aplica en Universal)');
ok(r.picks.every(p=>RID[p.rid].dest==='uor'),'solo restaurantes de Universal');
eq(r.picks.every(p=>p.meal==='dinner'),true,'cena primero');
ok(['US','CW'].includes(RID[r.picks[0].rid].zone),'día de Studios: Studios o CityWalk');ok(['IA','CW'].includes(RID[r.picks[1].rid].zone),'día de Islands');eq(RID[r.picks[2].rid].zone,'EU','día de Epic: solo restaurantes de Epic');
ok(['CW','UH'].includes(RID[r.picks[3].rid].zone)&&['CW','UH'].includes(RID[r.picks[4].rid].zone),'Volcano Bay y día libre: CityWalk u hoteles');
eq(new Set(r.picks.map(p=>p.rid)).size,5,'sin repetidos');
ok(!r.picks.some(p=>p.why.some(w=>/crédito/.test(w))),'sin motivos de créditos');
ok(r.picks.some(p=>p.why.some(w=>/Destacado|difícil/.test(w))),'explica por qué (destacado/difícil)');
eq(JSON.stringify(Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk})),JSON.stringify(r),'determinístico');
// Epic Universe solo tiene 2 mesas: un 3er día en Epic no puede completarse
c=mk({days:days('2027-03-14',3)});c.days.forEach(d=>d.park='Epic Universe');r=Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk});
eq(r.picks.length,2,'Epic Universe: 2 restaurantes, 2 propuestas');eq(r.skipped.length,1,'el tercer día no tiene más opciones');
// la cena de Marvel es solo cena
ok(mealOk(RID['uor-marvel-character-dinner'],'lunch')===false&&mealOk(RID['uor-marvel-character-dinner'],'dinner')===true,'Marvel: solo cena');
// presupuesto (maxTier del formulario)
c=mk({days:days('2027-03-14',1),intake:{prefs:{budget:'2'}}});c.days[0].park='Islands of Adventure';r=Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk});
ok(r.picks.length===1&&RID[r.picks[0].rid].tier<=2,'respeta el presupuesto económico');
// cocinas a evitar
c=mk({days:days('2027-03-14',1),intake:{prefs:{avoid:'italiana'}}});c.days[0].park='Universal Studios Florida';
for(const x of Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk}).picks) ok(!/italian/i.test(RID[x.rid].cuisine));
// favoritos
c=mk({days:days('2027-03-14',1),favs:{t1:['uor-finnegans-bar-and-grill'],t2:['uor-finnegans-bar-and-grill']}});c.days[0].park='Universal Studios Florida';
eq(Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk}).picks[0].rid,'uor-finnegans-bar-and-grill','los favoritos suben');
// combo: Disney con plan y Universal sin plan en el mismo viaje
c=mk({dests:['wdw','uor'],plan:'premium',start:'2027-03-14',end:'2027-03-19',segs:{wdw:{start:'2027-03-14',end:'2027-03-16'},uor:{start:'2027-03-16',end:'2027-03-19'}},days:days('2027-03-14',5)});
c.days[0].park='Magic Kingdom';c.days[3].park='Epic Universe';r=Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk});
eq(r.picks.filter(p=>p.date==='2027-03-14').length,2,'Disney con plan premium: 2 comidas de mesa en el día');eq(r.picks.filter(p=>p.date==='2027-03-17').length,1,'Universal: 1');
ok(r.picks.filter(p=>p.date==='2027-03-14').every(p=>RID[p.rid].dest==='wdw'&&Rules.creditsOf(RID[p.rid],p.meal)>0),'Disney respeta el plan');
// ---- los viajes de Disney no cambiaron
c=mk({dests:undefined,plan:'base',start:'2027-03-14',end:'2027-03-19',days:days('2027-03-14',5)});delete c.dests;c.days[0].park='Magic Kingdom';
r=Suggest.suggest(c,R,{parkZone:PZ,destOf,rid:RID,mealOk});eq(r.picks.length,1);ok(RID[r.picks[0].rid].zone==='MK'&&RID[r.picks[0].rid].dest==='wdw');

// ---- mensajes
const X={name:'Fam',agency:'Ag',link:'L',pin:'1',start:'14 mar 2027',end:'19 mar 2027',openDate:'13 ene 2027',openTime:'8:00',tz:'Argentina',hard:['Mythos'],reserved:[],allergies:''};
const d0=Messages.build('apertura',X);ok(/abren el 13 ene 2027 a las 8:00/.test(d0)&&!/Universal/.test(d0),'Disney solo: mensaje igual que antes');
const u0=Messages.build('apertura',Object.assign({},X,{wdw:false,uor:true,uorText:'Ya se puede reservar.'}));ok(/Universal: no hay un día de apertura fijo\. Ya se puede reservar/.test(u0)&&!/abren el 13 ene/.test(u0),'Universal solo');
const b0=Messages.build('apertura',Object.assign({},X,{wdw:true,uor:true,uorText:'Ya se puede reservar.'}));ok(/Disney: las reservas de comidas abren el 13 ene 2027/.test(b0)&&/Universal: no hay/.test(b0)&&/Mythos/.test(b0),'combo: ambos');
ok(/app oficial de Universal Orlando/.test(Messages.build('prevuelo',Object.assign({},X,{wdw:false,uor:true}))),'prevuelo Universal');
ok(/My Disney Experience y Universal Orlando/.test(Messages.build('prevuelo',Object.assign({},X,{wdw:true,uor:true}))),'prevuelo combo');
ok(/My Disney Experience/.test(Messages.build('prevuelo',X))&&!/Universal/.test(Messages.build('prevuelo',X)),'prevuelo Disney igual que antes');

// ---- migración de esquema
const m=Repo.migrate({v:5,agency:{name:'A',id:'x',tz:'America/Argentina/Buenos_Aires'},clients:[{id:'a'},{id:'b',dests:['uor'],hotelU:'H',cardUSD:200}],cases:[],templates:[]});
eq(m.v,Repo.SCHEMA);eq(Repo.SCHEMA,7);eq(m.clients[0].dests,['wdw']);eq(m.clients[0].cardUSD,0);eq(m.clients[0].hotelU,'');eq(m.clients[0].segs,null);eq(m.clients[1].dests,['uor']);eq(m.clients[1].cardUSD,200,'no pisa lo ya cargado');
console.log('universal.test.js: '+n+' verificaciones OK');
