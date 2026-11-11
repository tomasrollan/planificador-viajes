// Presupuesto del viaje: barra en el panel, pestaña, ítems con PDF, créditos Disney, compartir y vista del cliente.
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
 const cl=id=>state().clients.find(c=>c.id===id);
 const open=async(id)=>{w.location.hash='#cliente-'+id;await sleep(200);click('[data-tab="pres"]');await sleep(120);};
 // ---- panel
 const card=name=>[...d.querySelectorAll('.ccard')].find(x=>x.textContent.includes(name));
 ok(!!card('Rodríguez').querySelector('.bbar')&&/Presupuesto/.test(card('Rodríguez').textContent)&&/US\$ 8\.000/.test(card('Rodríguez').textContent),'la tarjeta muestra la barra de presupuesto con lo comprometido y el total');
 ok(/Disponible US\$/.test(card('Rodríguez').textContent),'y cuánto queda disponible');
 ok(!card('Rodríguez').querySelector('.cprog')&&/\d+ de \d+ comidas/.test(card('Rodríguez').textContent),'las comidas quedan como dato secundario');
 ok(!card('Pérez').querySelector('.bbar')&&/Definir presupuesto/.test(card('Pérez').textContent),'sin presupuesto: invita a definirlo');
 // ---- definir presupuesto desde la tarjeta
 click(card('Pérez').querySelector('[data-openpres]'));await sleep(250);
 ok(/Presupuesto del viaje/.test(T())&&/Todavía no hay un presupuesto total/.test(T()),'abre la pestaña Presupuesto del cliente');
 click('[data-bdcreate]');await sleep(60);ok(!cl('c2').budget,'sin monto no crea nada');
 set('#bd-new-total','5.000');click('[data-bdcreate]');await sleep(120);
 ok(cl('c2').budget.total===5000&&/US\$ 5\.000/.test(T()),'define el total de 5.000');
 // ---- agregar ítem
 click('[data-bdnew]');await sleep(80);
 ok(!!d.querySelector('.modal #bi-title')&&!d.querySelector('#bi-credrow'),'modal de ítem; sin plan de comidas no hay campo de créditos');
 click('[data-bdsave]');await sleep(60);ok((cl('c2').items||[]).length===0&&!!d.querySelector('.toast'),'sin título no guarda');
 set('#bi-title','Disney\'s Polynesian · 6 noches');set('#bi-cat','hotel');set('#bi-amount','1.200,50');set('#bi-status','confirmado');
 ok(!d.querySelector('#bi-paidrow').hidden,'al confirmar aparece «Ya está pagado»');
 d.querySelector('#bi-paid').checked=true;set('#bi-conf','POLY-123');d.querySelector('#bi-vis').checked=true;
 click('[data-bdsave]');await sleep(150);
 let it=cl('c2').items[0];
 ok(it&&it.amount===1200.5&&it.status==='confirmado'&&it.paid&&it.conf==='POLY-123'&&it.visible&&it.cat==='hotel','guarda el ítem con monto, estado, pago, código y visibilidad');
 ok(/US\$ 1\.200,50/.test(T())&&d.querySelector('.bbar')&&/Confirmado/.test(T()),'el monto impacta en la barra y en los KPIs');
 ok(cl('c2').log.some(e=>/Presupuesto: agregó/.test(e.t)),'queda en el historial');
 // ---- estimado, sin monto y filtros
 click('[data-bdnew]');await sleep(60);set('#bi-title','Entradas 4 días');set('#bi-cat','parques');set('#bi-amount','900');click('[data-bdsave]');await sleep(120);
 ok(cl('c2').items.length===2&&d.querySelectorAll('.bit').length===2,'segundo ítem (estimado)');
 ok(/Por pagar/.test(T())&&d.querySelectorAll('.bk').length===5,'KPIs: presupuesto, comprometido, disponible, confirmado, por pagar');
 click('[data-bdf="parques"]');await sleep(80);ok(d.querySelectorAll('.bit').length===1&&/Entradas/.test(d.querySelector('.bit').textContent),'el filtro por tipo funciona');
 click('[data-bdf="all"]');await sleep(60);
 // ---- PDF
 click('[data-bdnew]');await sleep(60);set('#bi-title','Cena show');set('#bi-amount','150');set('#bi-cat','excursion');
 const big=new w.File([new Uint8Array(4)],'grande.pdf',{type:'application/pdf'});Object.defineProperty(big,'size',{value:11*1048576});
 const fi=d.querySelector('#bi-file');Object.defineProperty(fi,'files',{value:[big],configurable:true});fi.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(40);
 ok(/10 MB/.test([...d.querySelectorAll('.toast')].pop().textContent),'rechaza archivos de más de 10 MB');
 const exe=new w.File([new Uint8Array(4)],'virus.exe',{type:'application/x-msdownload'});Object.defineProperty(fi,'files',{value:[exe],configurable:true});fi.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(40);
 ok(/PDF o im/.test([...d.querySelectorAll('.toast')].pop().textContent),'rechaza tipos que no son PDF ni imagen');
 const pdf=new w.File([new Uint8Array([37,80,68,70])],'confirmacion.pdf',{type:'application/pdf'});Object.defineProperty(fi,'files',{value:[pdf],configurable:true});fi.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(40);
 click('[data-bdsave]');await sleep(300);
 it=cl('c2').items.find(x=>x.title==='Cena show');
 ok(it&&it.file&&it.file.name==='confirmacion.pdf'&&it.file.size===4&&it.file.id,'adjunta el PDF al ítem');
 ok(d.querySelector('.lnkchip')&&/confirmacion\.pdf/.test(T())&&/solo en este navegador/.test(T()),'se ve el adjunto y el aviso de que vive solo en este navegador');
 ok(!JSON.stringify(state()).includes('JVBER'),'el contenido del archivo no va al estado guardado');
 // ---- quitar archivo al editar
 click('[data-bditem="c2|'+it.id+'"]');await sleep(80);ok(!!d.querySelector('#bi-curfile'),'al editar muestra el archivo actual');click('[data-bdrmfile]');click('[data-bdsave]');await sleep(150);
 ok(!cl('c2').items.find(x=>x.id===it.id).file,'se puede quitar el archivo');
 // ---- eliminar y deshacer
 const n0=cl('c2').items.length;click('[data-bddel="c2|'+it.id+'"]');await sleep(80);
 ok(cl('c2').items.length===n0-1,'elimina el ítem');click('[data-undo]');await sleep(80);ok(cl('c2').items.length===n0,'«Deshacer» lo recupera');
 // ---- pasarse del presupuesto
 click('[data-bdedit]');await sleep(60);set('#bd-total','2.000');set('#bd-t-hotel','1.000');click('[data-bdsavebudget]');await sleep(120);
 ok(d.querySelector('.bbar.lv-over')&&/Te pasás por/.test(T())&&/Se pasa de la meta/.test(T()),'si se pasa: barra roja, aviso y meta de categoría superada');
 w.location.hash='#panel';await sleep(200);ok(card('Pérez').querySelector('.bbar.lv-over')&&/Te pasás por/.test(card('Pérez').textContent),'el panel también lo marca');
 // ---- créditos Disney (solo con plan)
 await open('c3');
 ok(/Créditos del plan de comidas/.test(T()),'cliente con plan: se ve el cuadro de créditos');
 const before=cl('c3').items.filter(x=>x.credits>0).reduce((a,x)=>a+x.credits,0);
 click('[data-bdnew]');await sleep(60);ok(!!d.querySelector('#bi-credrow')&&d.querySelector('#bi-credrow').hidden,'campo de créditos oculto salvo en restaurantes');
 set('#bi-cat','comida');ok(!d.querySelector('#bi-credrow').hidden,'se muestra al elegir restaurante');set('#bi-title','Cinderella\'s Royal Table');set('#bi-credits','2');click('[data-bdsave]');await sleep(150);
 ok(cl('c3').items.reduce((a,x)=>a+(x.credits||0),0)===before+2&&new RegExp('Usados en ítems cargados: '+(before+2)).test(T()),'los créditos impactan en la disponibilidad');
 ok(/Plan de comidas Disney/.test(T())&&/Automático/.test(T()),'el costo del plan entra como fila automática');
 click('[data-bdnew]');await sleep(60);set('#bi-cat','hotel');set('#bi-credits','5');set('#bi-title','Hotel extra');click('[data-bdsave]');await sleep(120);
 ok(cl('c3').items.find(x=>x.title==='Hotel extra').credits===0,'los créditos solo cuentan en restaurantes');
 // ---- automático on/off
 const comm=()=>cl('c3');d.querySelector('#bd-auto').checked=false;d.querySelector('#bd-auto').dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(100);
 ok(comm().budget.autoMeals===false&&!/Plan de comidas Disney ·/.test(T()),'apagar lo automático saca la fila');
 // ---- copiar y CSV
 click('[data-bdcopy]');await sleep(60);ok(/Resumen del presupuesto · Familia Gómez/.test(w.__copied||'')&&/Disponible: US\$/.test(w.__copied),'copia el resumen para WhatsApp');
 // ---- cliente de solo Universal sin plan: sin créditos
 await open('c4');ok(!/Créditos del plan de comidas/.test(T()),'Universal no muestra créditos');
 // ---- compartir con el cliente
 click('[data-tab="pres"]');
 const c3=cl('c3');d.querySelector('#bd-share') ;
 // ---- sesión de reservas: costo y créditos
 w.location.hash='#sesion';await sleep(250);if(d.querySelector('[data-sesmode="all"]')){click('[data-sesmode="all"]');await sleep(120);}
 const hasCost=!!d.querySelector('#ses-cost');ok(hasCost,'la sesión de reservas tiene «Sumar al presupuesto»');
 if(hasCost){const cur=d.querySelector('[data-sessave]').getAttribute('data-sessave').split('|')[0];const nb=(cl(cur).items||[]).length;set('#ses-time','19:00');set('#ses-conf','ZZ9');if(d.querySelector('#ses-cost'))set('#ses-cost','85');click('[data-sessave]');await sleep(150);
  const ni=cl(cur).items.filter(x=>x.slotRef);ok(ni.length>=1&&ni[ni.length-1].amount===85&&ni[ni.length-1].conf==='ZZ9'&&ni[ni.length-1].status==='confirmado','la reserva guardada crea el ítem con costo y confirmación');}
 // ---- duplicar cliente limpia el presupuesto
 await open('c3');click('[data-dupclient="c3"]');await sleep(200);
 const cp=state().clients.find(x=>/copia/.test(x.name));ok(cp&&!cp.budget&&(cp.items||[]).length===0,'duplicar un cliente no copia presupuesto ni ítems');
 ok(errs.length===0,'sin errores de JS ('+errs.join('|')+')');
 // ---- vista del cliente
 console.log(out.join('\n'));console.log(process.exitCode?'test17 FALLA':'test17 OK');
 // el cliente (portal) en otro navegador
 const seed=w.localStorage.getItem('agency_planner_v3');const g=JSON.parse(seed).clients.find(x=>x.id==='c3');
 const dm=boot('https://x.test/?notour#portal-'+g.token,seed);const ww=dm.window,dd=ww.document;await sleep(900);
 dd.querySelector('#pin').value=g.pin;dd.querySelector('[data-unlock]').click();await sleep(900);
 const TT=()=>{const b=dd.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
 dd.querySelector('[data-ptab="viaje"]').click();await sleep(120);
 const o2=[];const ok2=(c,m)=>{o2.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
 ok2(!!dd.querySelector('[data-sub="viaje|docs"]'),'el cliente ve «Mis reservas» en Mi viaje (tiene ítems visibles)');
 dd.querySelector('[data-sub="viaje|docs"]').click();await sleep(120);
 ok2(/Mis reservas y comprobantes/.test(TT())&&/Contemporary/.test(TT())&&/Código WDW-90312/.test(TT()),'lista títulos, fechas y códigos');
 ok2(!!dd.querySelector('.blist')&&!/US\$|3\.?400|1\.?620/.test(dd.querySelector('.blist').textContent),'nunca muestra el monto de cada ítem');
 ok2(!/Fireworks Dessert Party/.test(TT()),'no muestra lo que no se marcó como visible');
 ok2(/Presupuesto del viaje/.test(TT())&&!!dd.querySelector('.bbar'),'muestra la barra porque la agencia la compartió');
 const st2=JSON.parse(ww.localStorage.getItem('agency_planner_v3'));st2.clients.find(x=>x.id==='c3').budget.share=false;ww.localStorage.setItem('agency_planner_v3',JSON.stringify(st2));
 console.log(o2.join('\n'));process.exit(process.exitCode?1:0);
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']\n'+e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)});
