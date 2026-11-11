// Herramientas de la agencia: buscador global, sesión de reservas, respuestas rápidas, historial, duplicar, alta rápida y datos del catálogo.
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#',beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});
const w=dom.window,d=w.document;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const T=()=>{const b=d.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
const click=s=>{const e=typeof s==='string'?d.querySelector(s):s;if(!e)throw new Error('no existe '+s);e.click()};
const typeIn=(sel,v)=>{const e=d.querySelector(sel);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}))};
const state=()=>JSON.parse(w.localStorage.getItem('agency_planner_v3'));
(async()=>{await sleep(700);
 // ---- buscador global
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}));await sleep(100);
 ok(!!d.querySelector('#cp-q'),'Ctrl+K abre el buscador');
 typeIn('#cp-q','torres');await sleep(50);
 ok(/Familia Torres/.test(d.querySelector('#cp-list').textContent),'encuentra clientes');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));await sleep(250);
 ok(/#cliente-c4/.test(w.location.hash),'Enter abre al cliente');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}));await sleep(80);
 typeIn('#cp-q','mythos');await sleep(50);
 ok(/Mythos/.test(d.querySelector('#cp-list').textContent)&&/Restaurante/.test(d.querySelector('#cp-list').textContent),'encuentra restaurantes de Universal');
 d.querySelector('#cp-q').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await sleep(50);
 ok(!d.querySelector('#cp-q'),'Esc cierra');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}));await sleep(80);
 typeIn('#cp-q','sesion');await sleep(50);
 ok(/sesión de reservas/i.test(d.querySelector('#cp-list').textContent),'encuentra acciones');
 click('#cp-list .cprow');await sleep(250);
 ok(w.location.hash==='#sesion'&&/Sesión de reservas/.test(T()),'la acción abre la sesión de reservas');
 // ---- sesión de reservas
 ok(/Se pueden reservar ya \(/.test(T()),'muestra las disponibles ya');
 click('[data-sesmode="all"]');await sleep(100);
 ok(/Reserva 1 de \d+/.test(T())&&!!d.querySelector('.sescard'),'todas las pendientes: arma una tarjeta por vez');
 const first=d.querySelector('.sesname').textContent, key=d.querySelector('[data-sessave]').getAttribute('data-sessave');
 ok(/Mesa:/.test(T())&&/Personas/.test(T()),'muestra mesa y personas');
 ok(!!d.querySelector('.sescard a[target="_blank"]'),'link al sitio oficial');
 const [cid,date,meal]=key.split('|');
 d.querySelector('#ses-conf').value='ZZ-123';
 click('[data-sessave]');await sleep(100);
 ok(state().clients.find(c=>c.id===cid).days.find(x=>x.date===date).slots[meal].state==='por_reservar'&&/hora/i.test(T()),'sin hora no guarda y avisa');
 d.querySelector('#ses-time').value='19:30';
 click('[data-sessave]');await sleep(150);
 const s1=state().clients.find(c=>c.id===cid).days.find(x=>x.date===date).slots[meal];
 ok(s1.state==='reservada'&&s1.time==='19:30'&&s1.conf==='ZZ-123','guardar deja la comida reservada con hora y confirmación');
 ok(d.querySelector('.sesname')&&d.querySelector('.sesname').textContent!==first||/Terminaste|No hay/.test(T()),'pasa a la siguiente');
 if(d.querySelector('[data-sesskip]')){const k2=d.querySelector('[data-sesskip]').getAttribute('data-sesskip');click('[data-sesskip]');await sleep(80);ok(!d.querySelector('[data-sessave]')||d.querySelector('[data-sessave]').getAttribute('data-sessave')!==k2,'saltear muestra otra');
   if(d.querySelector('[data-sesno]')){const k3=d.querySelector('[data-sesno]').getAttribute('data-sesno');click('[data-sesno]');await sleep(80);const p=k3.split('|');const s3=state().clients.find(c=>c.id===p[0]).days.find(x=>x.date===p[1]).slots[p[2]];ok(/Sin lugar/.test(s3.note)&&s3.state==='por_reservar','«No había lugar» anota y no marca reservada');}}
 // ---- historial del cliente
 w.location.hash='#cliente-'+cid;await sleep(200);click('[data-tab="hist"]');await sleep(100);
 ok(/Reservó/.test(T())&&/ZZ-123/.test(T()),'el historial registra la reserva');
 d.querySelector('#hist-note').value='Pidió mesa cerca del show';click('[data-addnote]');await sleep(100);
 ok(/Pidió mesa cerca del show/.test(T()),'agrega una nota interna');
 ok(state().clients.find(c=>c.id===cid).log.some(e=>e.kind==='nota'),'la nota queda guardada');
 click('[data-delnote]');await sleep(80);ok(!/Pidió mesa cerca del show/.test(T()),'borra la nota');
 // ---- duplicar
 const nBefore=state().clients.length;click('[data-dupclient]');await sleep(200);
 const st=state();ok(st.clients.length===nBefore+1,'duplicar crea un cliente nuevo');
 const dup=st.clients[st.clients.length-1],orig=st.clients.find(c=>c.id===cid);
 ok(/copia/.test(dup.name)&&dup.pin!==orig.pin&&dup.token!==orig.token,'con PIN y link propios');
 ok(dup.travelers.length===1&&!dup.travelers[0].allergies&&!dup.phone,'no copia viajeros, alergias ni teléfono');
 ok(dup.days.every(x=>['breakfast','lunch','dinner'].every(m=>!x.slots[m]||(x.slots[m].state==='idea'&&!x.slots[m].conf))),'las comidas quedan como ideas sin confirmación');
 // ---- respuestas rápidas
 w.location.hash='#casos';await sleep(200);
 click('[data-opencase]');await sleep(150);
 ok(d.querySelectorAll('.qrp [data-qr]').length===9,'9 respuestas rápidas');
 click('.qrp [data-qr]');await sleep(50);
 ok(/Hola /.test(d.querySelector('#cm-text').value)&&!/\{/.test(d.querySelector('#cm-text').value),'completa el nombre y no deja llaves');
 click('.modal .x');await sleep(50);
 // ---- alta rápida desde WhatsApp
 w.location.hash='#panel';await sleep(200);click('[data-newclient]');await sleep(100);
 ok(!!d.querySelector('#qa-text')&&d.querySelector('#qa-go').disabled,'el modal ofrece pegar un mensaje (botón apagado sin texto)');
 typeIn('#qa-text','Hola Agus! Somos la familia Pérez, vamos a Universal del 12 al 20 de julio de 2027. Somos 2 adultos y 2 chicos. Mi cel es 11 5555-1234. Mi hija es alérgica al maní. Nos alojamos en el Cabana Bay.');await sleep(50);
 ok(/Familia Pérez/.test(d.querySelector('#qa-prev').textContent)&&/Universal/.test(d.querySelector('#qa-prev').textContent)&&/alergias/i.test(d.querySelector('#qa-prev').textContent),'muestra lo que entendió, con aviso de alergias');
 ok(!d.querySelector('#qa-go').disabled,'se habilita crear');
 click('#qa-go');await sleep(250);
 const nc=state().clients[state().clients.length-1];
 ok(nc.name==='Familia Pérez'&&JSON.stringify(nc.dests)==='["uor"]'&&nc.start==='2027-07-12'&&nc.end==='2027-07-20'&&nc.phone==='11 5555-1234','crea el cliente con lo detectado');
 ok(nc.travelers.length===4&&nc.travelers.filter(t=>t.type==='niño').length===2,'viajeros: 2 adultos y 2 niños');
 ok(/Cabana Bay/.test(nc.hotelU),'detecta el hotel de Universal');
 ok(/maní/.test(nc.notes)&&nc.travelers.every(t=>!t.allergies),'la alergia va a la nota, no a un viajero');
 ok(/#cliente-/.test(w.location.hash)&&state().clients.length>=2,'abre el cliente creado');
 // viaje combinado
 w.location.hash='#panel';await sleep(150);click('[data-newclient]');await sleep(80);
 typeIn('#qa-text','Somos los Gómez, Disney y Universal del 3 al 14 de agosto de 2027, 2 adultos');await sleep(50);click('#qa-go');await sleep(250);
 const nb=state().clients[state().clients.length-1];
 ok(JSON.stringify(nb.dests)==='["wdw","uor"]'&&nb.segs&&nb.segs.wdw.start==='2027-08-03'&&nb.segs.uor.end==='2027-08-14'&&nb.segs.wdw.end===nb.segs.uor.start,'viaje combinado con tramos que cubren todas las fechas');
 // ---- datos del catálogo
 w.location.hash='#panel';await sleep(200);
 ok(!!d.querySelector('#fresh')&&/Menús de Disney/.test(d.querySelector('#fresh').textContent)&&/al día/i.test(d.querySelector('#fresh').textContent),'panel con el estado de los datos del catálogo (al día)');
 // con la fecha corrida 70 días, aparece el aviso
 // con el reloj 70 días adelante, aparece el aviso y la tarea
 const later=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#panel',beforeParse(w2){const real=w2.Date.now.bind(w2.Date);w2.Date.now=()=>real()+70*864e5;w2.scrollTo=()=>{};w2.HTMLElement.prototype.scrollBy=()=>{};}});
 await sleep(700);const d2=later.window.document;const T2=()=>{const b=d2.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
 ok(/desactualizado/i.test(T2())&&d2.querySelector('#fresh').open,'con datos de más de 60 días avisa «desactualizado» y abre el detalle');
 ok(/Datos del catálogo para refrescar/.test(T2())||/Y \d+ más en Casos y Reservas/.test(T2()),'aparece en «Para hacer hoy» (o queda en «Y N más» si hay cosas más urgentes, como cuotas vencidas)');
 later.window.close();
 console.log(out.join('\n'));console.log(errs.length?'ERRORES JS: '+errs.join(' | '):'');console.log(out.some(x=>x.startsWith('FAIL'))||errs.length?'FALLAS':'test15 OK');
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']\n'+e.stack);process.exitCode=1});
