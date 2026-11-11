const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const Rules=require('../lib/rules.js'),Suggest=require('../lib/suggest.js'),PlanCalc=require('../lib/plancalc.js'),Templates=require('../lib/templates.js'),Messages=require('../lib/messages.js'),DishSearch=require('../lib/dishsearch.js'),Translate=require('../lib/translate.js');
let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
// catálogo real
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/catalog.js'),'utf8'),ctx);
const R=ctx.window.CATALOG.map(a=>({id:a[0].split('/')[1],path:a[0],name:a[1],zone:a[2],area:a[3],cuisine:a[4],flags:a[5]||'',tier:a[6],c:a[7],cb:a[8],cu:!!a[9],rating:a[10],diff:a[11]}));
const RID={};R.forEach(r=>RID[r.id]=r);
const PZ={'Magic Kingdom':'MK','EPCOT':'EP','Hollywood Studios':'HS','Animal Kingdom':'AK','Disney Springs':'DS'};
const mkc=(over)=>Object.assign({id:'c',plan:'base',start:'2027-03-14',end:'2027-03-19',travelers:[{id:'t1',type:'adulto',allergies:''},{id:'t2',type:'niño',allergies:''}],favs:{},
  days:['14','15','16','17','18'].map(d=>({date:'2027-03-'+d,park:'',slots:{breakfast:null,lunch:null,dinner:null}}))},over||{});
// ---- sugerir agenda
let c=mkc();c.days[0].park='Magic Kingdom';c.days[1].park='EPCOT';c.days[2].park='';c.days[3].park='Día de descanso / hoteles';
let r=Suggest.suggest(c,R,{parkZone:PZ,rid:RID});
eq(r.picks.length,3,'plan base: una cena por día con parque (el día sin parque se salta)');
ok(r.skipped.some(s=>s.date==='2027-03-16'&&/parque/.test(s.reason)),'avisa que falta parque');
eq(r.picks[0].meal,'dinner');ok(RID[r.picks[0].rid].zone==='MK');ok(RID[r.picks[1].rid].zone==='EP');ok(RID[r.picks[2].rid].zone==='RS');
ok(r.picks.every(p=>Rules.creditsOf(RID[p.rid],p.meal)>0),'solo restaurantes que aceptan el plan');
eq(new Set(r.picks.map(p=>p.rid)).size,r.picks.length,'sin repetidos');
eq(JSON.stringify(Suggest.suggest(c,R,{parkZone:PZ,rid:RID})),JSON.stringify(r),'determinístico');
// no pisa lo cargado y respeta créditos
c.days[0].slots.dinner={rid:'liberty-tree-tavern',state:'reservada',time:'19:00',conf:'X',by:'agus',locked:true};
r=Suggest.suggest(c,R,{parkZone:PZ,rid:RID});ok(!r.picks.some(p=>p.date==='2027-03-14'),'no toca días ya completos');
const tot=Rules.planTotal(c);ok(r.credits.usedAfter<=tot,'no se pasa de los créditos');
// favoritos suben posiciones
c=mkc({favs:{t1:['toledo']}});c.days[1].park='EPCOT';let rf=Suggest.suggest(c,R,{parkZone:PZ,rid:RID});ok(rf.picks.length===1);
const favId=R.filter(x=>x.zone==='EP'&&x.c>0).sort((a,b)=>(b.rating||6)-(a.rating||6))[1];c=mkc({favs:{t1:[favId.id],t2:[favId.id]}});c.days[1].park='EPCOT';
eq(Suggest.suggest(c,R,{parkZone:PZ,rid:RID}).picks[0].rid,favId.id,'un favorito con 2 votos gana');
// plan premium: dos por día; sin plan: una; horarios y presupuesto
c=mkc({plan:'premium'});c.days[0].park='Hollywood Studios';eq(Suggest.suggest(c,R,{parkZone:PZ,rid:RID}).picks.length,2);
c=mkc({plan:'none'});c.days[0].park='EPCOT';c.intake={prefs:{budget:'3'}};r=Suggest.suggest(c,R,{parkZone:PZ,rid:RID});ok(r.picks.every(p=>RID[p.rid].tier<=3),'respeta presupuesto');
c=mkc({plan:'none'});c.days[0].park='EPCOT';r=Suggest.suggest(c,R,{parkZone:PZ,rid:RID,mealOk:()=>false});eq(r.picks.length,0);ok(r.skipped.filter(s=>s.meal==='dinner').length===1,'sin candidatos');
c=mkc({plan:'none'});c.days[0].park='EPCOT';c.intake={prefs:{avoid:'italiana, japonesa'}};
// evitar cocinas: ninguna sugerida contiene las palabras (en minúsculas sin acentos)
c.intake.prefs.avoid='american';r=Suggest.suggest(c,R,{parkZone:PZ,rid:RID});ok(r.picks.every(p=>!/american/i.test(RID[p.rid].cuisine+RID[p.rid].name)),'evita cocinas indicadas');
// ---- calculadora
let k=PlanCalc.compare({planKey:'base',adults:2,nights:5,tableCostPerAdult:200,extrasPerNight:20});
eq(k.planCost,998.7);eq(k.outOfPocket,600);ok(k.verdict==='sin_plan','sin plan conviene más');ok(k.diff>0);
k=PlanCalc.compare({planKey:'premium',adults:2,nights:5,tableCostPerAdult:900,extrasPerNight:60});eq(k.planCost,1630.1);eq(k.verdict,'plan','con mucho gasto conviene el plan');
k=PlanCalc.compare({planKey:'base',adults:0,nights:5,tableCostPerAdult:0});eq(k.verdict,'sin_datos');
k=PlanCalc.compare({planKey:'base',adults:2,nights:5,tableCostPerAdult:100,tableMeals:2});eq(k.credits,5);eq(k.unusedCredits,3);
const cc=mkc();eq(PlanCalc.tableCostPerAdult(cc,RID).assumed,true);cc.days[0].slots.dinner={rid:'toledo'};ok(PlanCalc.tableCostPerAdult(cc,RID).cost>0&&!PlanCalc.tableCostPerAdult(cc,RID).assumed);
// ---- plantillas
c=mkc();c.days[0].park='EPCOT';c.days[0].slots.lunch={rid:'toledo',state:'reservada',conf:'Z',locked:true};c.days[0].slots.dinner={rid:'via-napoli',state:'reservada'};
let cp=Templates.copyDay(c,'2027-03-14',['2027-03-15','2027-03-16']);eq(cp.copied,4);eq(c.days[1].park,'EPCOT');eq(c.days[1].slots.dinner.state,'idea','la copia nace como idea');eq(c.days[1].slots.dinner.conf,'','sin confirmación');
c.days[3].slots.dinner={rid:'x'};cp=Templates.copyDay(c,'2027-03-14',['2027-03-17']);eq(cp.copied,1);eq(cp.skipped,1);cp=Templates.copyDay(c,'2027-03-14',['2027-03-17']);eq(cp.skipped,2,'no pisa');
let id=0;const tpl=Templates.make(c,'  7 noches  ',()=>'t'+(++id),1);eq(tpl.name,'7 noches');eq(tpl.nights,5);eq(tpl.days[0].slots.lunch,'toledo');
const c2=mkc({id:'c2'});c2.days[0].slots.dinner={rid:'otro'};let ap=Templates.apply(c2,tpl);ok(ap.applied>0&&ap.skipped===1);eq(c2.days[0].slots.dinner.rid,'otro');eq(c2.days[0].park,'EPCOT');
const c3=mkc({id:'c3',days:mkc().days.slice(0,2)});ap=Templates.apply(c3,tpl);eq(ap.ignoredDays,3);
// ---- mensajes
const X={name:'Laura',agency:'Agus',link:'https://x/#portal-1',pin:'123456',start:'14 mar',end:'19 mar',openDate:'12 ene',openTime:'8:00',tz:'Argentina',hard:['Be Our Guest'],allergies:'Laura (Maní)',reserved:[{when:'dom 14',meal:'Cena',name:'Liberty Tree',time:'19:10',conf:'E4F7'}]};
Messages.KINDS.forEach(([kd])=>{const t=Messages.build(kd,X);ok(t.length>40&&/Laura/.test(t),kd);ok(!/undefined|\[object/.test(t),kd+' sin basura')});
ok(/123456/.test(Messages.build('bienvenida',X)));ok(/8:00 hs/.test(Messages.build('apertura',X)));ok(/E4F7/.test(Messages.build('confirmacion',X)));ok(/Todavía no/.test(Messages.build('confirmacion',Object.assign({},X,{reserved:[]}))));
// ---- búsqueda de platos con datos reales
eq(DishSearch.allergensOf('(For Egg, Fish/Shellfish, Peanut/Tree Nut, Sesame Allergies)').sort(),['egg','fish','peanut','sesame','shellfish','treenut']);
eq(DishSearch.allergensOf('x (For Gluten/Wheat, Egg, Fish, Milk Allergies)').sort(),['egg','fish','gluten','milk']);
eq(DishSearch.allergensOf('(For Peanut Allergies)'),['peanut']);eq(DishSearch.allergensOf('sin leyenda'),null);
const MF=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/menusfull.json'),'utf8')),ES=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/es.json'),'utf8'));
const entries=R.map(r=>({rid:r.id,name:r.name,zone:r.zone,path:r.path,mf:MF[r.path]}));
const idx=DishSearch.build(entries,Translate.create(ES));ok(idx.length>3000,'índice grande');
let s1=DishSearch.search(idx,{q:'steak'});ok(s1.total>10&&s1.groups.length>3,'busca en inglés');
let s2=DishSearch.search(idx,{q:'camarones'});ok(s2.total>0,'busca en español (traducción)');
ok(s2.groups[0].items.every(i=>DishSearch.norm(i.hay).indexOf('camaron')>=0));
let s3=DishSearch.search(idx,{q:'',allergens:['gluten']});ok(s3.total>20,'solo con alérgeno');ok(s3.groups.every(g=>g.items.every(i=>i.isAlg&&i.alg.indexOf('gluten')>=0)),'todos marcados aptos');
let s4=DishSearch.search(idx,{q:'',allergens:['gluten','peanut','sesame']});ok(s4.total<=s3.total&&s4.groups.every(g=>g.items.every(i=>['gluten','peanut','sesame'].every(a=>i.alg.indexOf(a)>=0))),'exige todos los alérgenos');
eq(DishSearch.search(idx,{q:''}).empty,true);ok(DishSearch.search(idx,{q:'steak',zone:'EP'}).groups.every(g=>g.zone==='EP'));
ok(DishSearch.search(idx,{q:'pancake',meal:'dinner'}).total<=DishSearch.search(idx,{q:'pancake'}).total);
ok(!idx.some(i=>/^guests must/i.test(i.n)),'sin avisos como platos');
console.log('features.test: '+n+' verificaciones OK');
