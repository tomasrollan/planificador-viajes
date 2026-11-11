const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(''+(process.env.HTML||require('path').join(__dirname,'../../planificador.html'))+'','utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://x/app.html?notour',pretendToBeVisual:true,beforeParse(w){w.addEventListener('error',e=>errs.push(e.message));w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};}});
const w=dom.window,d=w.document;const wait=()=>new Promise(r=>setTimeout(r,40));
const L=(...a)=>console.log(...a);
(async()=>{
 await wait();
 L('nav agente:',[...d.querySelectorAll('.hdr [data-go]')].map(x=>x.textContent.trim()).join(' | '));
 L('stats clickeables:',d.querySelectorAll('[data-statgo]').length,'cola:',d.querySelectorAll('[data-markres]').length);
 // reservas
 w.location.hash='reservas'; await wait();
 L('reservas: grupos',d.querySelectorAll('.rgh').length,'filas',d.querySelectorAll('.rrow').length);
 const mr=d.querySelector('[data-markres]'); L('markres btn',!!mr);
 if(mr){ mr.click(); await wait(); L('modal mr',!!d.querySelector('#mr-time'), d.querySelector('.modal').getAttribute('role'));
   d.querySelector('#mr-conf').value='ABC123'; d.querySelector('[data-savemr]').click(); await wait(); L('toast',(d.querySelector('.toast')||{}).textContent); }
 // cliente agente: grilla
 w.location.hash='cliente-c1'; await wait();
 L('grid:',!!d.querySelector('.gt'),'gcells',d.querySelectorAll('.gcell').length,'asum',!!d.querySelector('.asum'),'ics btn',!!d.querySelector('[data-ics]'));
 d.querySelector('[data-aview="cards"]').click(); await wait(); L('cards:',d.querySelectorAll('.day').length, 'mathd',!!d.querySelector('.mathd'));
 // ics
 let got=null; w.URL.createObjectURL=b=>{got=b;return 'blob:x'}; w.HTMLAnchorElement.prototype.click=function(){};
 d.querySelector('[data-ics]').click(); await wait(); L('ics blob',got&&got.size);
 // undo
 const cl=d.querySelector('[data-clearslot]'); L('clearslot btn',!!cl);
 // caso: contexto + QR
 w.location.hash='casos'; await wait(); const cs=d.querySelector('[data-opencase]'); if(cs){cs.click();await wait(); L('ctx',!!d.querySelector('.ctxb'),'qr',d.querySelectorAll('[data-qr]').length); const q=d.querySelector('[data-qr]'); if(q){q.click();L('ta',d.querySelector('#cm-text').value.slice(0,40));} d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true})); await wait(); L('esc cierra',!d.querySelector('#modalRoot'));}
 // portal cliente
 w.location.hash='cliente-c1'; await wait();
 const pv=d.querySelector('[data-viewas]'); if(pv){pv.click();await wait();}
 L('portal: dstrip',!!d.querySelector('.dstrip'),'nxt',!!d.querySelector('.nxt'));
 const fd=d.querySelector('[data-fakeday]'); L('fakeday btn',!!fd); if(fd){fd.click();await wait(); L('parkCard', !!d.querySelector('.nxt'), (d.querySelector('.nxt')||{}).textContent.slice(0,140));}
 w.location.hash='catalogo'; await wait(); L('fdet',!!d.querySelector('.fdet'));
 L('ERR',errs);
})();
