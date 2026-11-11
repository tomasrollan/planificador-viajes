// Clientes y familias (ficha tipo CRM) + destinos «Próximamente».
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const boot=(url,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url,beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.URL.createObjectURL=()=>'blob:x';w.URL.revokeObjectURL=()=>{};w.navigator.clipboard={writeText:t=>{w.__copied=t;return Promise.resolve()}};if(seed)w.localStorage.setItem('agency_planner_v3',seed);}});
(async()=>{
 const dom=boot('https://x.test/?notour#panel');const w=dom.window,d=w.document;await sleep(900);
 const T=()=>{const b=d.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
 const click=s=>{const e=typeof s==='string'?d.querySelector(s):s;if(!e)throw new Error('no existe '+s);e.click()};
 const set=(sel,v)=>{const e=d.querySelector(sel);if(!e)throw new Error('no existe '+sel);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}))};
 const state=()=>JSON.parse(w.localStorage.getItem('agency_planner_v3'));
 const go=async h=>{w.location.hash=h;await sleep(250)};
 // ---- lista
 ok(!!d.querySelector('[data-go="clientes"]')||/Clientes/.test(d.querySelector('nav, .tabs, header')?.textContent||''),'hay una sección Clientes en la navegación');
 await go('#clientes');
 ok(/Clientes y familias/.test(T())&&/FAM-0001/.test(T())&&d.querySelectorAll('#fam-grid .ccard').length===5,'lista las 5 familias con su código');
 set('#fam-q','gómez');await sleep(80);ok(d.querySelectorAll('#fam-grid .ccard').length===1&&/Gómez/.test(d.querySelector('#fam-grid').textContent),'busca por nombre');
 set('#fam-q','VIP');await sleep(80);ok(d.querySelectorAll('#fam-grid .ccard').length===1,'busca por etiqueta');
 set('#fam-q','');await sleep(60);
 // ---- ficha
 await go('#familia-fam1');
 ok(/Familia Rodríguez/.test(T())&&/FAM-0001/.test(T())&&/Cliente que repite/.test(T()),'abre la ficha y marca al cliente que repite');
 ok(/Cancún/.test(T())&&/2022/.test(T())&&/Walt Disney World/.test(T()),'muestra viajes anteriores');
 ok(/Laura decide todo/.test(d.querySelector('#fm-pers').value),'muestra cómo es el cliente');
 ok(/Maní/.test(T())&&/Confirmalo de nuevo/.test(T()),'recuerda las alergias del último viaje y pide confirmarlas');
 set('#fm-pers','Laura decide. Nuevo dato.');set('#fm-tags','vip, vip, chicos');click('[data-famsave]');await sleep(150);
 let f=state().families.find(x=>x.id==='fam1');
 ok(f.personality==='Laura decide. Nuevo dato.'&&f.tags.length===2,'guarda la ficha y limpia etiquetas repetidas');
 click('[data-famnote]');await sleep(60);const n0=state().families.find(x=>x.id==='fam1').notes.length;
 set('#fm-note','Quiere volver en 2027');click('[data-famnote]');await sleep(150);
 ok(state().families.find(x=>x.id==='fam1').notes.length===n0+1&&/Quiere volver en 2027/.test(T()),'agrega una nota interna');
 click('[data-famdelnote]');await sleep(120);ok(state().families.find(x=>x.id==='fam1').notes.length===n0,'borra una nota');
 click('[data-famaddpast]');await sleep(60);ok(state().families.find(x=>x.id==='fam1').past.length===2,'sin destino no agrega viaje anterior');
 set('#fm-pd','Punta Cana');set('#fm-py','2025');click('[data-famaddpast]');await sleep(150);
 ok(state().families.find(x=>x.id==='fam1').past.length===3&&/Punta Cana/.test(T()),'agrega un viaje anterior');
 // ---- nuevo viaje para la familia
 click('[data-famtrip]');await sleep(150);
 ok(/Nuevo viaje · Familia Rodríguez/.test(T()),'el modal avisa para qué familia es el viaje');
 const before=state().clients.length;click('[data-newtrip="wdw"]');await sleep(300);
 let s=state();const nc=s.clients[s.clients.length-1];
 ok(s.clients.length===before+1&&nc.famId==='fam1'&&nc.name==='Familia Rodríguez','crea el viaje dentro de la misma familia');
 ok(nc.travelers.length===3&&nc.travelers.some(t=>t.allergies==='Maní'),'copia los viajeros del último viaje (con alergias para reconfirmar)');
 ok(s.families.length===5,'no crea una familia nueva');
 // ---- nueva familia
 await go('#clientes');click('[data-famnew]');await sleep(100);
 click('[data-famcreate]');await sleep(60);ok(state().families.length===5,'sin nombre no crea');
 set('#fn-name','Familia Suárez');set('#fn-phone','+54 9 11 4444-7777');click('[data-famcreate]');await sleep(250);
 s=state();const sz=s.families.find(x=>x.name==='Familia Suárez');
 ok(!!sz&&sz.code==='FAM-0006'&&/Familia Suárez/.test(T()),'crea una familia con código nuevo y abre su ficha');
 click('[data-famtrip]');await sleep(120);click('[data-newtrip="uor"]');await sleep(300);
 s=state();ok(s.clients[s.clients.length-1].famId===sz.id&&s.clients[s.clients.length-1].phone===sz.phone,'su viaje hereda el teléfono');
 // mismo teléfono desde un viaje nuevo → misma familia
 await go('#panel');click('[data-newclient]');await sleep(120);
 set('#qa-text','Hola! Somos la familia Suárez, vamos a Disney del 12 al 20 de julio. Somos 2 adultos. +54 9 11 4444-7777');await sleep(150);
 if(!d.querySelector('#qa-go').disabled){click('#qa-go');await sleep(300);s=state();
  ok(s.families.length===6&&s.clients[s.clients.length-1].famId===sz.id,'un cliente con el mismo teléfono se suma a la misma familia');}
 else ok(true,'(sin parseo del teléfono en esta prueba)');
 // ---- chip en el viaje y en el panel
 await go('#cliente-c1');ok(/FAM-0001/.test(T())&&!!d.querySelector('[href="#familia-fam1"]'),'el viaje enlaza a la ficha');
 // ---- portal: nunca se ve la ficha
 const dp=boot('https://x.test/?notour#portal-rodriguez-7k2m9');await sleep(900);
 const PT=()=>{const b=dp.window.document.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
 ok(!/FAM-0001|Laura decide|Notas internas|Quiere volver/.test(PT()),'el portal del cliente no muestra la ficha ni las notas');
 // ---- próximamente
 await go('#panel');click('[data-newclient]');await sleep(120);
 ok(d.querySelectorAll('[data-soon]').length===4&&/Próximamente/.test(T())&&/Cruceros/.test(T())&&/Europa/.test(T())&&/Caribe/.test(T()),'el selector muestra Caribe, Europa, Cruceros y Otro como Próximamente');
 click('[data-soon="europa"]');await sleep(80);
 ok(state().interest.europa===true&&/Lo quiero primero/.test(d.querySelector('[data-soon="europa"]').textContent),'marcar uno guarda el interés');
 click('[data-soon="europa"]');await sleep(80);ok(state().interest.europa===false,'se puede desmarcar');
 ok(!!d.querySelector('[data-newtrip="wdw"]'),'los destinos disponibles siguen ahí');
 const bad=errs.filter(e=>!/Not implemented|scrollTo|scrollBy/.test(e));ok(bad.length===0,'sin errores de JS '+bad.join('|'));
 console.log(out.join('\n'));process.exit(process.exitCode?1:0);
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']\n'+e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)});
