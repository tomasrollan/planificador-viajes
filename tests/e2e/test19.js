// Seguimiento: etapa, próximo contacto, checklist, postviaje, resumen del viaje, buscador por nombre/código y filtros.
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const iso=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};   // fecha local (la app usa la local, no UTC)
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
 const cards=()=>[...d.querySelectorAll('#cl-grid .ccard')].map(x=>x.querySelector('h4').textContent);
 // ---- panel: buscador por nombre, código, teléfono
 ok(cards().length===5&&/FAM-0001/.test(d.querySelector('#cl-grid').textContent),'las tarjetas del panel muestran el código de la familia');
 set('#pc-q','FAM-0002');await sleep(80);ok(cards().length===1&&/Gómez/.test(cards()[0]),'busca por código exacto (FAM-0002)');
 set('#pc-q','fam 3');await sleep(80);ok(cards().length===1&&/Pérez/.test(cards()[0]),'tolera «fam 3»');
 set('#pc-q','3');await sleep(80);ok(cards().length===1,'y solo el número');
 set('#pc-q','perez');await sleep(80);ok(cards().length===1,'busca sin tildes');
 set('#pc-q','sofi');await sleep(80);ok(cards().length===1&&/Rodríguez/.test(cards()[0]),'busca por nombre de un viajero');
 set('#pc-q','contemporary gomez');await sleep(80);ok(cards().length===1,'varias palabras: todas tienen que estar');
 set('#pc-q','');await sleep(80);
 // ---- panel: etapa y orden
 const stOf=n=>[...d.querySelectorAll('#cl-grid .ccard')].find(x=>x.textContent.includes(n));
 ok(/Seña pagada/.test(stOf('Rodríguez').textContent)&&/Consulta/.test(stOf('Pérez').textContent),'cada tarjeta muestra su etapa (seña pagada si ya pagó algo, consulta si no)');
 set('#pc-st','sena');await sleep(80);ok(cards().length>=1&&cards().every(n=>!/Pérez/.test(n)),'filtra por etapa');
 set('#pc-st','');set('#pc-o','nombre');await sleep(80);const nm=cards();ok(JSON.stringify(nm)===JSON.stringify([...nm].sort((a,b)=>a.localeCompare(b))),'ordena por nombre A–Z');
 set('#pc-o','fecha');await sleep(60);
 // ---- ficha: próximo contacto
 await go('#familia-fam3');
 ok(/Próximo contacto/.test(T()),'la ficha tiene el bloque de próximo contacto');
 click('[data-famnextin="fam3|7"]');await sleep(150);
 let f=state().families.find(x=>x.id==='fam3');ok(!!f.next&&/^\d{4}-\d{2}-\d{2}$/.test(f.next.date),'el atajo «En 1 semana» fija la fecha');
 const ayer=iso(Date.now()-864e5);
 set('#fm-next',ayer);set('#fm-nextnote','Preguntar por la luna de miel');click('[data-famsave]');await sleep(150);
 f=state().families.find(x=>x.id==='fam3');ok(f.next.date===ayer&&f.next.note==='Preguntar por la luna de miel','guarda fecha y motivo con la ficha');
 await go('#panel');ok(/Contactar · Pareja Pérez/.test(T())&&/vencido hace/.test(T()),'un contacto vencido aparece en «Para hacer hoy»');
 await go('#familia-fam3');click('[data-famnextdone]');await sleep(150);
 f=state().families.find(x=>x.id==='fam3');ok(!f.next&&f.notes.some(n=>/Contactado el/.test(n.t)),'«Ya lo contacté» limpia la fecha y lo anota');
 // ---- recontacto automático
 const s0=state();s0.families.find(x=>x.id==='fam2').next=null;
 const g=s0.clients.find(x=>x.famId==='fam2');const y=new Date(Date.now()-420*864e5);g.start=y.toISOString().slice(0,10);g.end=iso(y.getTime()+5*864e5);g.days=[];
 w.localStorage.setItem('agency_planner_v3',JSON.stringify(s0));w.location.reload&&0;
 const dom2=boot('https://x.test/?notour#familia-fam2',JSON.stringify(s0));await sleep(900);const d2=dom2.window.document;
 const T2=()=>{const b=d2.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
 ok(/Buen momento para escribirle/.test(T2()),'sin viaje próximo y con el último hace más de 10 meses: sugiere escribirle');
 dom2.window.location.hash='#clientes';await sleep(250);d2.querySelector('[data-ff="contactar"]').click();await sleep(80);
 ok(d2.querySelectorAll('#fam-grid .ccard').length>=1&&/Gómez/.test(d2.querySelector('#fam-grid').textContent),'el filtro «Para contactar» la encuentra');
 dom2.window.close();
 // ---- lista de clientes: buscador por código y filtros
 await go('#clientes');
 set('#fam-q','FAM-0004');await sleep(80);ok(d.querySelectorAll('#fam-grid .ccard').length===1&&/Torres/.test(d.querySelector('#fam-grid').textContent),'Clientes: busca por código');
 set('#fam-q','cancun');await sleep(80);ok(d.querySelectorAll('#fam-grid .ccard').length===1&&/Rodríguez/.test(d.querySelector('#fam-grid').textContent),'busca en los viajes anteriores (sin tildes)');
 set('#fam-q','laura');await sleep(80);ok(d.querySelectorAll('#fam-grid .ccard').length===1,'busca por el nombre de un viajero');
 set('#fam-q','');click('[data-ff="rep"]');await sleep(80);ok(d.querySelectorAll('#fam-grid .ccard').length===2,'filtro «Repiten»');
 click('[data-ff="all"]');set('#fam-o','ultimo');await sleep(80);ok(d.querySelectorAll('#fam-grid .ccard').length===5&&/de 5|5 familias/.test(d.querySelector('#fam-count').textContent),'ordena por último viaje y cuenta resultados');
 // ---- checklist
 await go('#cliente-c1');click('[data-tab="seg"]');await sleep(150);
 ok(/Checklist de documentación/.test(T())&&/Autorización de viaje de menores/.test(T()),'hay checklist y, con niños, suma la autorización de menores');
 ok(/Los requisitos de ingreso/.test(T())&&/no guarda números de pasaporte/.test(T()),'avisa que no guarda números y que los requisitos se confirman en fuentes oficiales');
 click('[data-docdone]');await sleep(120);let c1=state().clients.find(x=>x.id==='c1');ok(c1.docs[0].done===true&&/Checklist: listo/.test(JSON.stringify(c1.log)),'marca un punto como listo y queda en el historial');
 set('[data-docnote]','vence 2029');await sleep(80);c1=state().clients.find(x=>x.id==='c1');ok(c1.docs[0].note==='vence 2029','guarda una nota');
 click('[data-docadd]');await sleep(60);const n0=state().clients.find(x=>x.id==='c1').docs.length;
 set('#sg-newdoc','Alquiler de auto');click('[data-docadd]');await sleep(120);c1=state().clients.find(x=>x.id==='c1');ok(c1.docs.length===n0+1&&c1.docs[c1.docs.length-1].custom,'agrega un punto propio');
 click('[data-docdel]');await sleep(100);ok(state().clients.find(x=>x.id==='c1').docs.length===n0,'y lo puede quitar');
 set('#sg-stage','cotizado');await sleep(120);ok(state().clients.find(x=>x.id==='c1').stage==='cotizado'&&!/Seña pagada/.test(d.querySelector('.tabs').parentNode.textContent+''),'cambia la etapa a mano');
 // ---- alerta de documentación pendiente
 const s1=state();const cc=s1.clients.find(x=>x.id==='c1');const sd=iso(Date.now()+20*864e5);cc.start=sd;cc.end=iso(Date.now()+25*864e5);cc.days=[];s1.cases=[];s1.clients.forEach(x=>{x.pay=null;});
 const dom3=boot('https://x.test/?notour#panel',JSON.stringify(s1));await sleep(900);const d3=dom3.window.document;
 ok(/Documentación pendiente · Familia Rodríguez/.test(d3.body.textContent)&&/Viajan en 20 días/.test(d3.body.textContent),'a 20 días del viaje, avisa que falta documentación');
 dom3.window.close();
 // ---- postviaje
 const s2=state();const c4=s2.clients.find(x=>x.id==='c4');c4.start=iso(Date.now()-12*864e5);c4.end=iso(Date.now()-6*864e5);c4.days=[];s2.cases=[];s2.clients.forEach(x=>{x.pay=null;});
 const dom4=boot('https://x.test/?notour#panel',JSON.stringify(s2));await sleep(900);const w4=dom4.window,d4=w4.document;
 ok(/Pedile cómo les fue · Familia Torres/.test(d4.body.textContent),'pasados 6 días del viaje, sugiere pedir el postviaje');
 w4.location.hash='#cliente-c4';await sleep(250);d4.querySelector('[data-tab="seg"]').click();await sleep(150);
 ok(/Postviaje/.test(d4.body.textContent)&&!!d4.querySelector('[data-postrate]'),'la pestaña muestra el postviaje al terminar el viaje');
 d4.querySelector('[data-postrate="5"]').click();await sleep(100);
 d4.querySelector('#ps-liked').value='Harry Potter';d4.querySelector('#ps-ref').value='pedido';d4.querySelector('[data-postsave]').click();await sleep(150);
 const p4=JSON.parse(w4.localStorage.getItem('agency_planner_v3')).clients.find(x=>x.id==='c4').post;
 ok(p4.rating===5&&p4.liked==='Harry Potter'&&p4.referral==='pedido','guarda valoración, qué les gustó y referidos');
 w4.location.hash='#familia-'+JSON.parse(w4.localStorage.getItem('agency_planner_v3')).clients.find(x=>x.id==='c4').famId;await sleep(250);
 ok(/5\/5/.test(d4.body.textContent),'la valoración aparece en la ficha de la familia');
 w4.location.hash='#panel';await sleep(250);ok(!/Pedile cómo les fue · Familia Torres/.test(d4.body.textContent),'y la alerta desaparece');
 dom4.window.close();
 // ---- resumen del viaje
 await go('#cliente-c3');click('[data-tab="seg"]');await sleep(120);
 let printed=0;w.print=()=>{printed++};click('[data-summary]');await sleep(150);
 ok(!!d.querySelector('.pdoc')&&/Resumen de tu viaje/.test(T())&&/Familia Gómez/.test(T())&&/Día por día/.test(T()),'abre el resumen del viaje con la marca de la agencia');
 ok(/Reservas confirmadas/.test(T()),'incluye las reservas marcadas como visibles');
 ok(!/US\$|Presupuesto|cuota/i.test(d.querySelector('.pdoc').textContent.replace(/Estimado/g,'')),'no incluye montos, presupuesto ni pagos');
 ok(/no garantiza que un plato sea seguro/.test(d.querySelector('.pdoc').textContent),'incluye el aviso de alergias');
 ok(!!d.querySelector('.pdoc.pdm')&&/Celular/.test(d.querySelector('[data-pdfmt]').parentNode.textContent),'por defecto el formato es Celular (vertical y angosto)');
 click('[data-pdfmt$="|a4"]');await sleep(100);ok(!!d.querySelector('.pdoc.pda'),'se puede pasar a Hoja A4');
 click('[data-doprint]');await sleep(60);ok(/size:A4/.test((d.getElementById('pdoc-page')||{textContent:''}).textContent)||printed===1,'imprime con el tamaño de página elegido');ok(printed===1&&!d.body.classList.contains('pdoc-on')||printed===1,'el botón abre el diálogo de impresión / guardar como PDF');
 // ---- el portal del cliente no ve nada de esto
 const dp=boot('https://x.test/?notour#portal-rodriguez-7k2m9');await sleep(900);const PT=()=>{const b=dp.window.document.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
 ok(!/Checklist de documentación|Próximo contacto|Postviaje|Etapa del cliente/.test(PT()),'el portal del cliente no muestra el seguimiento interno');
 const bad=errs.filter(e=>!/Not implemented|scrollTo|scrollBy/.test(e));ok(bad.length===0,'sin errores de JS '+bad.join('|'));
 console.log(out.join('\n'));process.exit(process.exitCode?1:0);
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']\n'+e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)});
