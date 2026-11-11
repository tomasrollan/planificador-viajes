const assert=require('assert'),Repo=require('../lib/repo.js');let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
const mkStore=()=>{const m={};return {get:k=>m[k]||null,set:(k,v)=>{m[k]=JSON.parse(JSON.stringify(v))},m}};
const demo=()=>({v:3,agency:{name:'Agus'},seq:1000,clients:[{id:'c1',token:'t1',days:[]}],cases:[{id:'k1',cid:'c1',status:'nuevo'}]});
const PRIO={normal:['Normal','',120],urgente:['Urgente','bad',24]};
let uidn=0;const uid=()=>'id'+(++uidn);
// 1) primer arranque: sin datos guardados -> demo migrado
let st=mkStore(),r=Repo.create({storage:st,key:'k',demo});let S=r.load();
eq(S.v,Repo.SCHEMA);eq(S.agency.id,Repo.DEFAULT_AGENCY);eq(S.clients[0].agency_id,Repo.DEFAULT_AGENCY);eq(S.cases[0].agency_id,Repo.DEFAULT_AGENCY);eq(S.agency.tz,'America/Argentina/Buenos_Aires');
// 2) estado v3 guardado (sin agency_id) -> migra sin perder datos
st=mkStore();st.set('k',{v:3,agency:{name:'Otra'},seq:5,clients:[{id:'x',name:'Fam'}],cases:[]});r=Repo.create({storage:st,key:'k',demo});S=r.load();
eq(S.agency.name,'Otra');eq(S.clients[0].name,'Fam');eq(S.clients[0].agency_id,Repo.DEFAULT_AGENCY);eq(S.v,Repo.SCHEMA);
// 3) estado sin versión explícita (de antes) se trata como v3
st=mkStore();st.set('k',{agency:{name:'Vieja'},clients:[],cases:[]});S=Repo.create({storage:st,key:'k',demo}).load();eq(S.v,Repo.SCHEMA);eq(S.agency.name,'Vieja');
// 4) guardado por una versión más nueva -> no se pisa: arranca con demo pero sin sobrescribir hasta guardar
st=mkStore();st.set('k',{v:99,agency:{name:'Futura'},clients:[],cases:[]});r=Repo.create({storage:st,key:'k',demo});S=r.load();eq(S.agency.name,'Agus');eq(st.m.k.v,99,'no se toca el dato futuro al cargar');
// 5) datos corruptos -> demo
st=mkStore();st.set('k',{foo:1});S=Repo.create({storage:st,key:'k',demo}).load();ok(S.clients.length===1);
// 6) migrate es idempotente
const once=Repo.migrate(demo());eq(Repo.migrate(JSON.parse(JSON.stringify(once))),once);
// 7) casos y mensajes
st=mkStore();r=Repo.create({storage:st,key:'k',demo});S=r.load();
const k=r.addCase({cid:'c1',title:'Cambiar cena',priority:'urgente',text:'Hola',source:'cliente'},1000,uid,PRIO);
eq(k.num,1001);eq(k.agency_id,S.agency.id);eq(k.due,1000+24*36e5);eq(k.thread.length,1);eq(S.cases[0].id,k.id,'el caso nuevo va primero');eq(st.m.k.cases[0].id,k.id,'se persistió');
r.addMsg(k,'agus','nota','interna',2000,uid);eq(k.updated,1000,'una nota interna no cambia "updated"');r.addMsg(k,'agus','msg','respuesta',3000,uid);eq(k.updated,3000);
eq(r.casesOf('c1').length,2);eq(r.kase(k.id),k);eq(r.clientByToken('t1').id,'c1');eq(r.client('zzz'),undefined);
// 8) alta de cliente hereda agency_id; reset vuelve a demo
const c=r.addClient({id:'c9',token:'t9',days:[]});eq(c.agency_id,S.agency.id);ok(st.m.k.clients.some(x=>x.id==='c9'));
S=r.reset();eq(S.clients.length,1);
// 9) copia de respaldo: ida y vuelta, y rechazos
const bk=Repo.exportJSON(S,Date.UTC(2026,10,11));const pr=Repo.parseBackup(bk);
eq(pr.state,S);eq(pr.exported,'2026-11-11T00:00:00.000Z');eq(pr.clients,S.clients.length);
ok(Repo.parseBackup('{no json').error);ok(Repo.parseBackup('{"foo":1}').error,'sin marca de app');
ok(Repo.parseBackup(JSON.stringify({app:'agus-planner',state:{v:99,agency:{},clients:[],cases:[]}})).error,'versión futura');
ok(Repo.parseBackup(JSON.stringify({app:'agus-planner',state:{v:4}})).error,'incompleta');
const old3=Repo.parseBackup(JSON.stringify({app:'agus-planner',state:{v:3,agency:{name:'X'},clients:[{id:'a'}],cases:[]}}));eq(old3.state.v,Repo.SCHEMA);eq(old3.state.clients[0].agency_id,Repo.DEFAULT_AGENCY);
console.log('repo.test: '+n+' verificaciones OK');
// v7: familias
{const st3=mkStore();st3.set('k',{v:6,agency:{name:'X'},clients:[{id:'a',name:'Familia A',phone:'+54 9 11 5555-1234'},{id:'b',name:'Familia A (copia)',phone:'541155551234'},{id:'c',name:'Otra',phone:''},{id:'d',name:'Sin tel',phone:''}],cases:[]});
 const S7=Repo.create({storage:st3,key:'k',demo}).load();eq(S7.v,7);eq(S7.families.length,3,'el mismo teléfono es la misma familia; sin teléfono, una por viaje');eq(S7.clients[0].famId,S7.clients[1].famId);eq(S7.families[0].code,'FAM-0001');eq(S7.families[2].code,'FAM-0003');eq(S7.families[0].name,'Familia A');eq(S7.famSeq,3);
 const again=Repo.migrate(JSON.parse(JSON.stringify(S7)));eq(again.families.length,3,'migrar dos veces no duplica');}
