// Guía de uso: aparece sola una vez por rol, se puede saltear, reabrir con «?» y se adapta al modo del cliente.
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const boot=(url,seed)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url,beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};if(seed)Object.keys(seed).forEach(k=>w.localStorage.setItem(k,seed[k]));}});
const TX=d=>{const b=d.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
(async()=>{
 // ---- agencia: aparece sola
 let dom=boot('https://x.test/#panel');let w=dom.window,d=w.document;await sleep(1200);
 ok(!!d.querySelector('.modal.tour')&&/Guía para la agencia · 1 de 10/.test(TX(d)),'la guía de la agencia aparece sola al entrar (10 pasos)');
 ok(/primero los clientes/.test(TX(d)),'primer paso: clientes primero');
 d.querySelector('[data-tourgo="1"]').click();await sleep(50);ok(/2 de 10/.test(TX(d))&&/WhatsApp/.test(TX(d)),'Siguiente avanza (alta desde WhatsApp)');
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));await sleep(50);ok(/3 de 10/.test(TX(d))&&/Clientes y fichas/.test(TX(d)),'flecha derecha avanza (ficha de clientes)');
 for(const [i,re] of [[5,/Presupuesto y comprobantes/],[6,/Pagos y cuotas/]]){d.querySelector('[data-tourgo="'+i+'"]').click();await sleep(40);ok(re.test(TX(d)),'la guía explica: '+re.source);}
 d.querySelector('[data-tourgo="1"]').click();await sleep(40);ok(/Cruceros/.test(TX(d))&&/Próximamente|que vienen/.test(TX(d)),'la guía menciona los destinos que vienen');
 d.querySelector('[data-tourgo="7"]').click();await sleep(40);ok(/Resumen del viaje \(PDF\)/.test(TX(d))&&/checklist/i.test(TX(d)),'la guía explica el seguimiento y el resumen');
 d.querySelector('[data-tourgo="8"]').click();await sleep(40);ok(/Mis reservas y comprobantes/.test(TX(d))&&/Mis pagos/.test(TX(d)),'la guía cuenta lo que ve el cliente');
 d.querySelector('[data-tourgo="2"]').click();await sleep(40);
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));await sleep(50);ok(/2 de 10/.test(TX(d)),'flecha izquierda retrocede');
 for(let i=0;i<8;i++){d.querySelector('.modal.tour .btn:not(.line)').click();await sleep(30);}
 ok(/10 de 10/.test(TX(d))&&/Ctrl\+K/.test(TX(d))&&/¡Listo!/.test(TX(d)),'último paso con atajos y botón «¡Listo!»');
 d.querySelector('.modal.tour .btn:not(.line)').click();await sleep(50);
 ok(!d.querySelector('.modal.tour'),'«¡Listo!» cierra');
 ok(JSON.parse(w.localStorage.getItem('agency_tour_v1')).agus===1,'queda guardado que ya la vio');
 w.location.hash='#casos';await sleep(150);w.location.hash='#panel';await sleep(700);
 ok(!d.querySelector('.modal.tour'),'no vuelve a aparecer al navegar');
 d.querySelector('[data-tour]').click();await sleep(80);
 ok(!!d.querySelector('.modal.tour')&&/1 de 10/.test(TX(d)),'el botón «?» la reabre desde el principio');
 d.querySelector('[data-tourskip]').click();await sleep(50);ok(!d.querySelector('.modal.tour'),'cerrar con la X');
 const st=JSON.parse(w.localStorage.getItem('agency_planner_v3'));
 const c1=st.clients.find(c=>c.id==='c1'),c2=st.clients.find(c=>c.mode==='view');
 dom.window.close();
 // ---- recarga con lo ya visto: no aparece
 dom=boot('https://x.test/#panel',{agency_tour_v1:'{"agus":1}'});w=dom.window;d=w.document;await sleep(1000);
 ok(!d.querySelector('.modal.tour'),'quien ya la vio no la recibe de nuevo');
 dom.window.close();
 // ---- cliente: aparece tras ingresar el PIN, con texto según el modo
 const mk=async(client)=>{
  const seed={agency_tour_v1:'{"agus":1}',agency_planner_v3:JSON.stringify(st)};
  const dm=boot('https://x.test/#portal-'+client.token,seed);const ww=dm.window,dd=ww.document;await sleep(900);
  ok(!dd.querySelector('.modal.tour'),'antes del PIN no aparece nada ('+client.name+')');
  dd.querySelector('#pin').value=client.pin;dd.querySelector('[data-unlock]').click();await sleep(900);
  return dm;};
 let dc=await mk(c1);let dd=dc.window.document;
 ok(!!dd.querySelector('.modal.tour')&&/Guía de uso · 1 de 6/.test(TX(dd)),'tras el PIN, el cliente ve su guía (6 pasos)');
 ok(/proponés las comidas/.test(TX(dd)),'modo colaborativo: «proponés las comidas»');
 dd.querySelector('[data-tourgo="2"]').click();await sleep(50);
 ok(/no garantiza/.test(TX(dd)),'paso de alergias con el aviso de que la app no garantiza seguridad');
 dd.querySelector('[data-tourgo="4"]').click();await sleep(50);
 ok(/Mis reservas y comprobantes/.test(TX(dd))&&/Mis pagos/.test(TX(dd)),'paso de reservas y pagos (si la agencia los compartió)');
 dd.querySelector('[data-tourskip]').click();await sleep(50);
 ok(!!dd.querySelector('[data-tour]'),'el cliente tiene el botón «?»');
 dc.window.close();
 dc=await mk(c2);dd=dc.window.document;
 ok(/Tu agencia arma la agenda/.test(TX(dd)),'modo solo ver: «Tu agencia arma la agenda»');
 dc.window.close();
 // ---- vista previa de la agencia: no se dispara sola
 const dp=boot('https://x.test/#panel',{agency_tour_v1:'{"agus":1}'});await sleep(900);const dpd=dp.window.document;
 dpd.querySelector('[data-viewas]').click();await sleep(900);
 ok(!dpd.querySelector('.modal.tour'),'«Ver como cliente» no dispara la guía del cliente');
 dpd.querySelector('[data-tour]').click();await sleep(80);ok(/Guía de uso/.test(TX(dpd)),'pero el «?» sí la muestra');
 dp.window.close();
 console.log(out.join('\n'));console.log(errs.length?'ERRORES JS: '+errs.join(' | '):'');console.log(out.some(x=>x.startsWith('FAIL'))||errs.length?'FALLAS':'test16 OK');process.exit(process.exitCode||0);
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']\n'+e.stack);process.exit(1)});
