// Cancelar, reactivar y eliminar un viaje desde el panel de la agencia.
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const boot=url=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url,beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};}});
(async()=>{
 const dom=boot('https://x.test/?notour#panel');const w=dom.window,d=w.document;await sleep(900);
 const T=()=>{const b=d.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
 const click=s=>{const e=typeof s==='string'?d.querySelector(s):s;if(!e)throw new Error('no existe '+s);e.click()};
 const set=(sel,v)=>{const e=d.querySelector(sel);if(!e)throw new Error('no existe '+sel);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}))};
 const state=()=>JSON.parse(w.localStorage.getItem('agency_planner_v3'));
 const go=async h=>{w.location.hash=h;await sleep(250)};
 const cards=()=>[...d.querySelectorAll('#cl-grid .ccard')].map(x=>x.querySelector('h4').textContent);
 const n0=state().clients.length;
 ok(cards().length===n0,'el panel arranca con todos los viajes ('+n0+')');
 // ---- cancelar
 await go('#cliente-c1');click('[data-tab="datos"]');await sleep(150);
 ok(/Cancelar o eliminar el viaje/.test(T()),'la pestaña Datos tiene la zona para cancelar o eliminar');
 const name=state().clients.find(x=>x.id==='c1').name;
 click('[data-cx-ask="c1"]');await sleep(100);
 ok(!!d.querySelector('#cx-reason')&&/Lo postergaron/.test(d.querySelector('#cx-reason').textContent),'el modal pide el motivo');
 set('#cx-reason','nopago');set('#cx-note','No pagó la seña');click('[data-cx-do="c1"]');await sleep(200);
 let c=state().clients.find(x=>x.id==='c1');
 ok(c.cancel&&c.cancel.reason==='nopago'&&c.cancel.note==='No pagó la seña'&&c.cancel.at>0,'guarda motivo, nota y fecha');
 ok(c.log.some(e=>/Canceló el viaje: No pagó/.test(e.t)),'queda en el historial');
 ok(/Viaje cancelado/.test(T())&&d.querySelector('[data-cx-reopen="c1"]'),'se ve el cartel de cancelado con el botón de reactivar');
 // ---- fuera del panel, filtros y alertas
 await go('#panel');
 ok(!cards().includes(name),'no aparece en la lista por defecto');
 set('#pc-st','cancelado');await sleep(80);ok(cards().length===1&&cards()[0]===name&&d.querySelector('#cl-grid .ccard.cancelled'),'el filtro «Cancelados» lo muestra');
 set('#pc-st','');set('#pc-q',name.split(' ')[0]);await sleep(80);ok(cards().includes(name),'buscándolo por nombre sí aparece');
 set('#pc-q','');await sleep(60);
 const m=T().match(/Clientes con viaje\s*(\d+)/);ok(m&&+m[1]===n0-1,'la estadística de clientes no lo cuenta');
 // ---- reactivar
 await go('#cliente-c1');click('[data-cx-reopen="c1"]');await sleep(200);
 c=state().clients.find(x=>x.id==='c1');ok(!c.cancel&&c.log.some(e=>/Reactivó el viaje/.test(e.t)),'reactivar limpia la cancelación y lo anota');
 await go('#panel');ok(cards().includes(name),'vuelve a la lista');
 // ---- deshacer desde el aviso
 await go('#cliente-c1');click('[data-tab="datos"]');await sleep(100);click('[data-cx-ask="c1"]');await sleep(100);click('[data-cx-do="c1"]');await sleep(200);
 ok(!!state().clients.find(x=>x.id==='c1').cancel,'cancelado de nuevo');click('[data-undo]');await sleep(200);
 ok(!state().clients.find(x=>x.id==='c1').cancel,'«Deshacer» lo reactiva');
 // ---- eliminar
 const k0=state().cases.filter(k=>k.cid==='c1').length;
 await go('#cliente-c1');click('[data-tab="datos"]');await sleep(100);
 click('[data-cx-del="c1"]');await sleep(100);ok(/No se puede deshacer/.test(T())&&d.querySelector('[data-cx-delok="c1"]'),'pide confirmación antes de borrar');
 ok(state().clients.length===n0,'todavía no borró nada');
 click('[data-cx-delok="c1"]');await sleep(250);
 const s=state();ok(s.clients.length===n0-1&&!s.clients.find(x=>x.id==='c1'),'el viaje se elimina');
 ok(!s.cases.some(k=>k.cid==='c1'),'y también sus pedidos ('+k0+')');
 ok(/#clientes|#panel/.test(w.location.hash)||w.location.hash==='#clientes','vuelve a la lista');
 const bad=errs.filter(e=>!/Not implemented|scrollTo|scrollBy/.test(e));ok(bad.length===0,'sin errores de JS '+bad.join('|'));
 console.log(out.join('\n'));process.exit(process.exitCode?1:0);
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']\n'+e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)});
