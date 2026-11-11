const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#',beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};}});
const w=dom.window,d=w.document;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const hasChip=t=>[...d.querySelectorAll('.chip')].some(c=>c.textContent.trim()===t);
const click=s=>{const e=typeof s==='string'?d.querySelector(s):s;if(!e)throw new Error('no existe '+s);e.click()};
const setv=(s,v)=>{const e=d.querySelector(s);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}))};
(async()=>{await sleep(600);
 // ---- agente: cliente nuevo sin comidas
 w.location.hash='#cliente-c3';await sleep(200);
 ok(!!d.querySelector('[data-sugg]')&&!!d.querySelector('[data-plancalc]')&&!!d.querySelector('[data-msgs]'),'barra de herramientas de la agente');
 // 1) sugerir
 click('[data-sugg]');await sleep(100);
 ok(/Propuesta para/.test(d.body.textContent),'abre propuesta');
 const chk=d.querySelectorAll('.sugchk').length;ok(chk===0,'Gómez no tiene parques cargados: nada para sugerir (avisa)');
 ok(/no pude completar/.test(d.body.textContent),'explica qué no pudo completar');
 click('[data-close]');
 // armar parques y sugerir
 for(const [i,pk] of ['Magic Kingdom','EPCOT','Hollywood Studios'].entries()){const s=d.querySelectorAll('select[data-park]')[i];s.value=pk;s.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(60);}
 click('[data-sugg]');await sleep(100);
 const n1=d.querySelectorAll('.sugchk').length;ok(n1>=3,'propone comidas para los días con parque ('+n1+')');
 click('[data-applysug]');await sleep(150);
 ok(hasChip('Sugerido'),'marca las comidas como Sugerido');
 const S1=JSON.parse(w.localStorage.getItem('agency_planner_v3')||'null');
 // deshacer
 const tb=[...d.querySelectorAll('.toast .tbtn')];ok(tb.length>0,'hay botón deshacer');click(tb[tb.length-1]);await sleep(150);ok(!hasChip('Sugerido'),'deshacer quita lo sugerido');
 click('[data-sugg]');await sleep(100);click('[data-applysug]');await sleep(150);
 // 2) copiar día y plantillas
 click('[data-copyday]');await sleep(100);
 const boxes=[...d.querySelectorAll('.cdchk')];ok(boxes.length>=5,'lista de días destino');boxes[4].checked=true;click('[data-docopyday]');await sleep(150);
 ok(/Copiadas/.test(d.body.textContent),'copió un día');
 click('[data-tpl]');await sleep(100);setv('#tpl-name','Plantilla de prueba');click('[data-tplsave]');await sleep(150);
 ok(/Plantilla de prueba/.test(d.body.textContent),'guarda plantilla');
 click('[data-close]');
 // aplicar en otro cliente
 w.location.hash='#cliente-c2';await sleep(200);click('[data-tpl]');await sleep(100);
 ok(/Plantilla de prueba/.test(d.body.textContent),'la plantilla está disponible para otro cliente');
 click('[data-tplapply]');await sleep(150);ok(/Apliqué/.test(d.body.textContent),'aplica plantilla');
 // 3) calculadora
 click('[data-plancalc]');await sleep(100);
 ok(/Con plan de comidas/.test(d.body.textContent)&&/Pagando aparte/.test(d.body.textContent),'muestra la comparación');
 const before=d.querySelector('#pc-out').textContent;setv('#pc-extras','200');await sleep(50);ok(d.querySelector('#pc-out').textContent!==before,'se recalcula al editar supuestos');
 click('[data-close]');
 // 4) mensajes
 click('[data-msgs]');await sleep(100);
 ok(/Hola Pareja Pérez/.test(d.querySelector('#ms-text').value),'mensaje con el nombre');
 setv('#ms-kind','apertura');await sleep(50);ok(/abren el/.test(d.querySelector('#ms-text').value)&&/hs \(/.test(d.querySelector('#ms-text').value),'cambia a apertura con hora local');
 ok(/wa\.me\//.test(d.querySelector('#ms-wa').getAttribute('href')),'link de WhatsApp');
 click('[data-close]');
 // 5) formulario del cliente
 w.location.hash='#cliente-c1';await sleep(200);click('[data-tab="datos"]');await sleep(100);
 ok(/Todavía no lo completó/.test(d.body.textContent),'la agente ve que falta el formulario');
 w.location.hash='#portal-rodriguez-7k2m9';await sleep(200);
 setv('#pin','482915');click('[data-unlock]');await sleep(200);
 ok(/Completá el formulario/.test(d.body.textContent),'banner en la agenda del cliente');
 click('[data-sub="viaje|form"]');await sleep(150);ok(!!d.querySelector('#intake'),'formulario visible');
 setv('#it-phone','+54 9 11 5555 1234');click('[data-itadd]');
 const rows=d.querySelectorAll('#it-trav .itrow');rows[rows.length-1].querySelector('.it-name').value='Abuela Rosa';rows[rows.length-1].querySelector('.it-alg').value='Sin sal';
 const st=d.querySelector('.it-style[value="P"]');st.checked=true;st.dispatchEvent(new w.Event('change',{bubbles:true}));setv('#it-avoid','mariscos');
 click('[data-itsend]');await sleep(200);
 ok(/Enviado el/.test(d.body.textContent),'confirma envío');
 w.location.hash='#cliente-c1';await sleep(200);click('[data-tab="datos"]');await sleep(100);
 ok(/Abuela Rosa/.test(d.body.textContent)&&/Sin revisar/.test(d.body.textContent),'la agente ve lo cargado');
 click('[data-itimport]');await sleep(150);
 const st2=JSON.parse(w.localStorage.getItem('agency_planner_v3'));const c1=st2.clients.find(c=>c.id==='c1');
 ok(c1.travelers.some(t=>t.name==='Abuela Rosa')&&c1.phone.indexOf('5555')>=0&&c1.intake.reviewed,'importó viajero y teléfono');
 ok(st2.cases.some(k=>k.cid==='c1'&&/Formulario de ingreso/.test(k.title)),'creó un caso para la agencia');
 ok(st2.v===6&&Array.isArray(st2.templates)&&st2.templates.length===1,'estado v6 con plantilla guardada');
 // las preferencias del formulario alimentan la sugerencia
 const cl=c1;ok(cl.intake.prefs.avoid==='mariscos'&&cl.intake.prefs.styles.indexOf('P')>=0,'preferencias guardadas');
 // 6) búsqueda de platos
 w.location.hash='#catalogo';await sleep(200);click('[data-sub="cat|dishes"]');await sleep(150);
 ok(!!d.querySelector('#ds-q'),'pantalla de búsqueda de platos');
 setv('#ds-q','camarones');await sleep(400);ok(d.querySelectorAll('.dsg').length>0,'encuentra platos en español');
 setv('#ds-q','shrimp');await sleep(400);ok(d.querySelectorAll('.dsg').length>0,'y en inglés');
 setv('#ds-q','');click('[data-dsal="gluten"]');await sleep(300);
 ok(d.querySelectorAll('.dsg').length>3&&/según las listas de alergias que publica Disney/.test(d.body.textContent),'filtro de alergias con aviso');
 ok(/Disney lo marca apto para/.test(d.body.textContent),'muestra para qué alergias es apto');
 click('[data-dsal="peanut"]');click('[data-dsal="sesame"]');await sleep(300);ok(/Ningún plato|plato/.test(d.body.textContent),'combina alérgenos');
 click('.dsg [data-open]');await sleep(150);ok(!!d.querySelector('#modalRoot .modal'),'abre la ficha del restaurante');
 console.log(out.join('\n'));console.log('ERR',JSON.stringify(errs));process.exit(errs.length||process.exitCode?1:0);
})().catch(e=>{console.log(out.join('\n'));console.log('EXC',e.message);process.exit(1)});
