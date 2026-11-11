// Panel de la agencia: prioridades, clientes con buscador y filtros, cola resumida, casos con tablero primero.
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#',beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};}});
const w=dom.window,d=w.document;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const T=()=>{const b=d.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
const click=s=>{const e=typeof s==='string'?d.querySelector(s):s;if(!e)throw new Error('no existe '+s);e.click()};
const cards=()=>[...d.querySelectorAll('#cl-grid .ccard')].map(x=>x.querySelector('h4').textContent);
(async()=>{await sleep(600);
 w.location.hash='#panel';await sleep(250);
 const secs=[...d.querySelectorAll('main section h3')].map(x=>x.textContent.trim());
 ok(/Mis clientes/.test(secs[0])&&/Para hacer hoy/.test(secs[1])&&/Próximas reservas/.test(secs[2]),'orden: clientes primero, después para hacer hoy y reservas ('+secs.join(' | ')+')');
 ok(d.querySelectorAll('.trow').length>=2,'hay prioridades listadas');
 ok(!!d.querySelector('.trow [data-opencase]'),'los casos urgentes se abren desde el panel');
 click('.trow [data-opencase]');await sleep(150);ok(!!d.querySelector('.modal'),'abre el caso');click('[data-close]');
 ok(cards().length===5,'5 clientes');
 ok(cards()[0]==='Familia Rodríguez','ordena por fecha de viaje más próxima ('+cards()[0]+')');
 ok(/\d+ de \d+ comidas/.test(d.querySelector('.ccard').textContent)&&/Viaja en \d+ días/.test(d.querySelector('.ccard').textContent)&&!d.querySelector('.cprog'),'cada cliente muestra cuándo viaja y las comidas pasan a ser un dato chico (ya no la barra principal)');
 ok(d.querySelectorAll('.ccard .bbar').length===4&&/Definir presupuesto/.test(d.querySelector('.cgrid, .ccard').parentElement.textContent),'la barra principal de la tarjeta es el presupuesto (4 con presupuesto, 1 con «Definir presupuesto»)');
 ok(!d.querySelector('.cnext'),'sin titular de comidas que faltan');
 ok([...d.querySelectorAll('.ccard')].some(x=>/Universal: (aún es pronto|desde|ya se puede)/.test(x.textContent)),'los clientes de Universal muestran su estado de reserva');
 // búsqueda
 const q=d.querySelector('#pc-q');q.value='torres';q.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(80);
 ok(cards().length===1&&cards()[0]==='Familia Torres','el buscador filtra');
 ok(d.querySelector('#pc-q')===q,'el buscador conserva el foco (no se redibuja)');
 q.value='zzz';q.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(80);ok(/Ningún cliente coincide/.test(T()),'mensaje sin resultados');
 q.value='';q.dispatchEvent(new w.Event('input',{bubbles:true}));await sleep(80);
 // filtros
 click('[data-pf="uor"]');await sleep(80);ok(cards().length===2&&cards().indexOf('Familia Álvarez')>=0,'filtro Universal incluye el combinado');
 click('[data-pf="wdw"]');await sleep(80);ok(cards().length===4,'filtro Disney incluye el combinado');
 click('[data-pf="pend"]');await sleep(80);ok(cards().length>=1,'con pendientes');
 click('[data-pf="all"]');await sleep(80);
 // cola resumida
 ok(d.querySelectorAll('table.q tr').length<=6,'cola resumida a 5 filas');
 ok(!!d.querySelector('details.bkp'),'copia de seguridad plegada al final');
 // marcar reservada sigue andando desde el panel
 // clientes → editar datos desde el panel
 // reservas: Universal tiene su propia fecha de "se puede reservar desde"
 w.location.hash='#reservas';await sleep(250);
 const rg=[...d.querySelectorAll('.rgh b')].map(x=>x.textContent);
 ok(rg.some(x=>/^Abren el/.test(x))&&rg.some(x=>/^Universal Orlando · (se puede reservar desde el|ya se puede reservar)/.test(x)),'modo reserva: Disney por día de apertura y Universal por cuándo se puede reservar ('+rg.join(' / ')+')');
 ok(!/sin fecha fija/.test(T()),'ya no dice «sin fecha fija»');
 // casos: tablero antes que el análisis
 w.location.hash='#casos';await sleep(250);
 const html2=d.querySelector('main').innerHTML;
 ok(html2.indexOf('cf-q')>0&&html2.indexOf('cf-q')<html2.indexOf('Por familia'),'casos: filtros y tablero antes del análisis');
 ok(!!d.querySelector('details.an'),'análisis plegable');
 // agenda: sin medidor de créditos repetido
 w.location.hash='#cliente-c1';await sleep(250);
 ok(d.querySelectorAll('.credbox, .cbox').length<=1,'agenda: créditos una sola vez ('+d.querySelectorAll('.credbox, .cbox').length+')');
 ok(errs.length===0,'sin errores de JS ('+errs.join('|')+')');
 console.log(out.join('\n'));console.log(out.some(x=>x.startsWith('FAIL'))?'FALLAS':'test13 OK');
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']');process.exitCode=1});
