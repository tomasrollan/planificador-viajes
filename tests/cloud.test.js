const assert=require('assert'),C=require('../lib/cloud.js');let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++};const ok=(c,m)=>{assert.ok(c,m);n++};
// servidor falso: misma semántica que push_records (rev, conflicto, "gone") y pull por updated_at
function server(){ const rows={};let t=Date.parse('2027-01-01T00:00:00Z');const tick=()=>new Date(t+=1000).toISOString();
  return {rows,fail:false,
   pull(since){ if(this.fail) throw new Error('sin red'); return Object.keys(rows).map(k=>Object.assign({},rows[k])).filter(r=>!since||r.updated_at>since).map(r=>JSON.parse(JSON.stringify(r))); },
   push(items){ if(this.fail) throw new Error('sin red'); return items.map(it=>{ const k=it.kind+'/'+it.id, cur=rows[k];
     if(!cur){ if(it.base_rev) return {kind:it.kind,id:it.id,status:'conflict',gone:true}; rows[k]={kind:it.kind,id:it.id,data:it.data||{},rev:1,deleted:!!it.deleted,updated_at:tick()}; return {kind:it.kind,id:it.id,status:'ok',rev:1}; }
     if(cur.rev!==(it.base_rev||0)) return {kind:it.kind,id:it.id,status:'conflict',rev:cur.rev,data:JSON.parse(JSON.stringify(cur.data)),deleted:cur.deleted};
     if(it.data) cur.data=JSON.parse(JSON.stringify(it.data)); cur.deleted=!!it.deleted; cur.rev++; cur.updated_at=tick(); return {kind:it.kind,id:it.id,status:'ok',rev:cur.rev}; }); } }; }
function device(srv,S,saved){ const d={S:S,changes:0}; d.eng=C.createEngine(Object.assign({get:()=>d.S,transport:{pull:s=>srv.pull(s),push:i=>srv.push(i)},onChange:()=>d.changes++},saved||{})); return d; }
const mk=()=>({v:7,agency:{id:'ag',name:'A'},seq:1000,famSeq:0,templates:[],families:[],clients:[],cases:[]});
(async()=>{
// split / assemble
const S0=mk();S0.clients.push({id:'c1',name:'X',b:1,a:2});S0.cases.push({id:'k1',cid:'c1'});S0.families.push({id:'f1'});const sp=C.split(S0);
eq(Object.keys(sp).sort(),['case/k1','client/c1','family/f1','meta/state']);ok(!/clients/.test(sp['meta/state']),'meta no lleva las listas');
eq(C.split({clients:[{id:'c1',a:2,b:1,name:'X'}],cases:[],families:[]})['client/c1'],sp['client/c1'],'el orden de las claves no importa (jsonb las reordena)');
// merge3
eq(C.merge3({a:1,b:1},{a:2,b:1},{a:1,b:9}),{a:2,b:9},'cada lado conserva lo suyo');
eq(C.merge3({a:1},{a:2},{a:3}),{a:2},'si cambiaron los dos, gana el local');
eq(C.merge3({log:[{id:1,at:1}]},{log:[{id:1,at:1},{id:2,at:3}]},{log:[{id:1,at:1},{id:3,at:2}]}).log.map(x=>x.id),[1,3,2],'las listas se unen y ordenan por fecha');
eq(C.merge3({seq:1000},{seq:1003},{seq:1005},'meta').seq,1005,'contador: el mayor');
eq(C.merge3({a:1},{},{a:1}),{},'borrar un campo local se respeta');
// primera subida
const srv=server();const A=device(srv,mk());A.S.clients.push({id:'c1',name:'Rodríguez',days:[1]});A.S.cases.push({id:'k1',cid:'c1',thread:[]});
eq(A.eng.pending(),3,'cliente + caso + meta');let r=await A.eng.sync();ok(r.ok&&r.sent===3&&A.eng.pending()===0,'subió todo');eq(srv.rows['client/c1'].rev,1);
r=await A.eng.sync();eq(r.sent,0,'sin cambios no sube nada');
A.S.clients[0].name='Rodríguez ✓';eq(A.eng.pending(),1);await A.eng.sync();eq(srv.rows['client/c1'].rev,2);eq(srv.rows['client/c1'].data.name,'Rodríguez ✓');
// segundo dispositivo baja todo
const B=device(srv,mk());await B.eng.sync();eq(B.S.clients.length,1);eq(B.S.clients[0].name,'Rodríguez ✓');eq(B.S.cases.length,1);eq(B.eng.pending(),0);
// edición en distintos campos del mismo registro, ambos offline → se fusiona
A.S.clients[0].hotel='H';B.S.clients[0].phone='11';
await A.eng.sync();await B.eng.sync();await A.eng.sync();
eq([B.S.clients[0].hotel,B.S.clients[0].phone],['H','11'],'B conserva lo suyo y recibe lo de A');eq([A.S.clients[0].hotel,A.S.clients[0].phone],['H','11'],'A recibe lo de B');eq(srv.rows['client/c1'].data.phone,'11');
// mismo campo: gana el que sube último (local)
A.S.clients[0].hotel='A-hotel';B.S.clients[0].hotel='B-hotel';await A.eng.sync();await B.eng.sync();await A.eng.sync();
eq(srv.rows['client/c1'].data.hotel,'B-hotel');eq(A.S.clients[0].hotel,'B-hotel');
// mensajes en el mismo caso desde dos lados: no se pierde ninguno
A.S.cases[0].thread.push({id:'m1',at:10,text:'a'});B.S.cases[0].thread.push({id:'m2',at:20,text:'b'});await A.eng.sync();await B.eng.sync();await A.eng.sync();
eq(srv.rows['case/k1'].data.thread.map(m=>m.id),['m1','m2']);eq(A.S.cases[0].thread.length,2);
// alta en uno aparece en el otro (casos nuevos arriba)
B.S.cases.unshift({id:'k2',cid:'c1',thread:[]});await B.eng.sync();await A.eng.sync();eq(A.S.cases.map(k=>k.id),['k2','k1']);
// borrado en uno se propaga; si el otro lo había cambiado, el cambio gana (no se pierde trabajo)
A.S.families.push({id:'f1',name:'F'});await A.eng.sync();await B.eng.sync();eq(B.S.families.length,1);
A.S.families=[];await A.eng.sync();await B.eng.sync();eq(B.S.families.length,0,'el borrado llegó');
B.S.families.push({id:'f2',name:'F2'});await B.eng.sync();await A.eng.sync();A.S.families=[];B.S.families[0].name='F2 editada';await A.eng.sync();await B.eng.sync();await A.eng.sync();
eq(srv.rows['family/f2'].deleted,false,'el cambio le ganó al borrado');eq(A.S.families[0].name,'F2 editada');
// volver a crear lo borrado
A.S.families=[];await A.eng.sync();await B.eng.sync();A.S.families.push({id:'f2',name:'otra vez'});await A.eng.sync();eq(srv.rows['family/f2'].data.name,'otra vez');eq(srv.rows['family/f2'].deleted,false);
// sin red: no rompe, queda pendiente, y se recupera
srv.fail=true;A.S.clients[0].name='offline';r=await A.eng.sync();ok(!r.ok&&r.pending>=1,'reporta error y pendientes');srv.fail=false;r=await A.eng.sync();ok(r.ok&&r.pending===0);eq(srv.rows['client/c1'].data.name,'offline');
// el estado del motor se puede guardar y retomar (cerrar y abrir la app)
const snap=JSON.parse(JSON.stringify(A.eng.snapshot()));const A2=device(srv,JSON.parse(JSON.stringify(A.S)),snap);eq(A2.eng.pending(),0,'retoma sin pendientes');r=await A2.eng.sync();eq(r.sent,0);
// registro que el servidor perdió ("gone") se vuelve a crear
delete srv.rows['client/c1'];A.S.clients[0].name='recreado';await A.eng.sync();eq(srv.rows['client/c1'].data.name,'recreado');
// casos del portal con num 0 reciben número
const S3=mk();S3.seq=1007;S3.cases=[{id:'a',num:0},{id:'b',num:1006},{id:'c',num:0}];eq(C.fixCaseNums(S3),2);eq(S3.cases.map(k=>k.num),[1009,1006,1008].map((v,i)=>i===0?1009:v),'');eq(S3.seq,1009);
// importar lo local a una nube vacía y entrada de un tercer dispositivo
const srv2=server(),D=device(srv2,mk());D.S.clients.push({id:'c9',name:'Demo'});D.eng.adoptAll();await D.eng.sync();const E=device(srv2,C.emptyState('Agus'));await E.eng.sync();eq(E.S.clients[0].name,'Demo');eq(E.S.agency.name,'A','la agencia viaja en meta');
eq(C.emptyState('Agus').clients,[]);
console.log('cloud OK ('+n+' checks)');
})().catch(e=>{console.error(e);process.exit(1)});
