const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(''+(process.env.HTML||require('path').join(__dirname,'../../planificador.html'))+'','utf8');
const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://x/app.html?notour',pretendToBeVisual:true,beforeParse(w){w.addEventListener('error',e=>errs.push(e.message));w.navigator.clipboard={writeText:()=>Promise.resolve()};w.HTMLElement.prototype.scrollBy=function(){};}});
const w=dom.window,d=w.document;
const click=s=>{const e=d.querySelector(s);if(!e){errs.push('no existe '+s);return}e.click()};
const wait=()=>new Promise(r=>setTimeout(r,30));
const log=m=>console.log(m);
const setv=(s,v)=>{const e=d.querySelector(s);if(!e){errs.push('no existe '+s);return}e.value=v;};
const fire=(s,ev)=>{const e=d.querySelector(s);e.dispatchEvent(new w.Event(ev,{bubbles:true}));};
(async()=>{
 log('panel stats: '+[...d.querySelectorAll('.stat')].map(x=>x.textContent).join(' | '));
 log('nav tabs: '+[...d.querySelectorAll('.navtabs button')].map(x=>x.textContent.trim()).join(' / '));
 click('[data-go="casos"]'); await wait();
 log('hash: '+w.location.hash+' kpis: '+[...d.querySelectorAll('.kpi')].map(x=>x.textContent).join(' | '));
 log('board cols: '+d.querySelectorAll('.col').length+' cards: '+d.querySelectorAll('.kc').length);
 click('[data-cview="list"]'); await wait(); log('list rows: '+d.querySelectorAll('tr.rowlink[data-opencase]').length);
 click('[data-cfam="c1"]'); await wait(); log('filtro familia c1 -> filas: '+d.querySelectorAll('tr.rowlink[data-opencase]').length);
 click('[data-cfam="c1"]'); await wait();
 setv('#cf-q','alergia'); fire('#cf-q','input'); log('búsqueda alergia -> '+d.querySelectorAll('#caseList tr.rowlink').length);
 setv('#cf-q',''); fire('#cf-q','input');
 setv('#cf-prio','urgente'); fire('#cf-prio','change'); await wait(); log('prio urgente -> '+d.querySelectorAll('#caseList tr.rowlink').length);
 setv('#cf-prio',''); fire('#cf-prio','change'); await wait();
 click('[data-cview="board"]'); await wait();
 click('.kc[data-opencase]'); await wait(); log('modal caso: '+(d.querySelector('.modal h3')||{}).textContent);
 setv('#cm-text','Respuesta de prueba'); click('[data-reply$="|msg"]'); await wait();
 const kid=d.querySelector('[data-solve]').getAttribute('data-solve');
 log('tras responder, estado chip: '+[...d.querySelectorAll('.modal .chip')].map(x=>x.textContent).join(',')+' mensajes: '+d.querySelectorAll('.msg').length);
 click('[data-solve]'); await wait(); log('resuelto, toast: '+(d.querySelector('.toast')||{}).textContent);
 click('[data-newcase]'); await wait(); setv('#nc-title','Caso nuevo test'); click('[data-savenew]'); await wait(); log('nuevo caso, total cards: '+d.querySelectorAll('.kc').length);
 click('[data-settings]'); await wait(); setv('#st-name','Mi Agencia'); click('[data-savesettings]'); await wait(); log('marca: '+d.querySelector('.hdr h1').textContent);
 w.location.hash='cliente-c1'; await wait(); click('[data-tab="pedidos"]'); await wait(); log('casos de c1: '+d.querySelectorAll('.kc').length);
 // portal cliente
 w.location.hash='portal-rodriguez-7k2m9'; await wait(); setv('#pin','482915'); click('[data-unlock]'); await wait();
 log('eyebrow: '+d.querySelector('.hdr .eyebrow').textContent+' tabs: '+[...d.querySelectorAll('.ptabs-top button')].map(x=>x.textContent.trim()).join('/'));
 click('[data-ptab="ayuda"]'); await wait(); log('mis pedidos: '+d.querySelectorAll('.kc').length);
 setv('#rq-text','Quiero cambiar el almuerzo'); click('[data-clireq]'); await wait(); log('tras enviar: '+d.querySelectorAll('.kc').length);
 click('.kc[data-opencase]'); await wait(); log('modal cliente sin notas internas: '+!d.querySelector('.msg.nota')+' | selects: '+d.querySelectorAll('.modal select').length);
 click('[data-close].x'); await wait();
 // reserva bloqueada -> pedir cambio crea caso
 click('[data-ptab="agenda"]'); await wait(); click('[data-edit]'); await wait();
 const sr=d.querySelector('[data-sendreq]'); if(sr){ setv('#rq','mover a las 18'); sr.click(); await wait(); log('cambio -> casos totales: '+S()); }
 function S(){ return JSON.parse(w.localStorage.getItem('agency_planner_v3')).cases.length; }
 // carrusel
 w.location.hash='catalogo'; await wait(); log('cards: '+d.querySelectorAll('.rc').length+' con carrusel: '+d.querySelectorAll('.rc .ph.car').length+' sin foto: '+d.querySelectorAll('.rc .ph .fb').length);
 log('ERRORES: '+JSON.stringify(errs)); process.exit(0);
})();
