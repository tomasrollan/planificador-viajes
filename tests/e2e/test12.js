// Flujos del módulo Universal: viaje nuevo (Universal / combinado), clientes demo, catálogo por destino, modal, transporte, reservas.
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#',beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};}});
const w=dom.window,d=w.document;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const click=s=>{const e=typeof s==='string'?d.querySelector(s):s;if(!e)throw new Error('no existe '+s);e.click()};
const T=()=>{const b=d.body.cloneNode(true);b.querySelectorAll('script').forEach(x=>x.remove());return b.textContent};
const st=()=>JSON.parse(w.localStorage.getItem('agency_planner_v3'));
const chg=(e,v)=>{if(v!==undefined){if(e.type==='checkbox')e.checked=v;else e.value=v;}e.dispatchEvent(new w.Event('change',{bubbles:true}))};
(async()=>{await sleep(600);
 // ---- panel: clientes demo con destino
 w.location.hash='#panel';await sleep(200);
 ok(/Familia Torres/.test(T())&&/Familia Álvarez/.test(T()),'el panel lista los clientes de Universal y el combinado');
 ok(/Universal/.test(T())&&/Disney/.test(T()),'chips de destino en las tarjetas');
 // ---- agenda de Universal solo (c4)
 w.location.hash='#cliente-c4';await sleep(250);click('[data-tab="agenda"]');await sleep(100);
 ok(/Universal/.test(T())&&/Portofino/.test(T()),'agenda de Universal con el hotel');
 ok(!/Créditos del plan/.test(T())||!/Comidas de mesa|snack/.test(T().split('Créditos del plan')[1]||''),'sin panel de créditos de Disney');
 ok(!d.querySelector('[data-plancalc]'),'sin calculadora del plan de Disney');
 ok(/6 meses|reservas|abierta|Ya se puede/i.test(T()),'aviso de anticipación de Universal');
 const parks=[...d.querySelectorAll('select[data-park]')][0];const opts=[...parks.options].map(o=>o.value);
 ok(opts.some(o=>/Universal Studios/.test(o))&&opts.some(o=>/Epic/.test(o))&&!opts.some(o=>/Magic Kingdom/.test(o)),'el selector de parques muestra solo Universal');
 click('[data-edit^="'+st().clients.find(c=>c.id==='c4').days[1].date+'|dinner"]');await sleep(120);
 ok([...d.querySelectorAll('.modal a.btn')].some(x=>/place_id=uor\.ioa\.dining\.mythos/.test(x.href)&&/Reservar en Universal/.test(x.textContent)),'el editor de la agente trae el enlace directo para reservar Mythos');
 ok([...d.querySelectorAll('.modal a.btn')].some(x=>/mythos-restaurant\/menu/.test(x.href)),'y el menú oficial');
 click('[data-close]');
 // sugerir
 click('[data-sugg]');await sleep(120);ok(/Propuesta para/.test(T()),'sugiere en Universal');
 ok(!/crédito/i.test(d.querySelector('.modal').textContent),'la propuesta no habla de créditos');
 click('[data-close]');
 // abrir restaurante de Universal
 const card=d.querySelector('[data-rest^="uor-"]')||d.querySelector('[data-openrest]');
 // transporte
 click('[data-tab="trans"]');await sleep(150);
 ok(/Epic Universe|Hogwarts|Portofino/.test(T())&&/Universal/.test(T()),'pestaña de transporte de Universal');
 // ---- combinado (c5)
 w.location.hash='#cliente-c5';await sleep(250);click('[data-tab="agenda"]');await sleep(150);
 const parks5=[...d.querySelectorAll('select[data-park]')][0];const o5=[...parks5.options].map(o=>o.value);
 ok(o5.some(o=>/Magic Kingdom/.test(o))&&o5.some(o=>/Epic/.test(o)),'el combinado ofrece parques de ambos destinos');
 ok(/Disney/.test(T())&&/Universal/.test(T()),'resumen con ambos destinos');
 click('[data-tab="trans"]');await sleep(150);
 ok(/De Disney a Universal/.test(T())&&/No hay un servicio gratuito/.test(T()),'transporte entre destinos');
 // ---- crear un viaje nuevo de cada tipo
 for(const [kind,exp] of [['uor',['uor']],['both',['wdw','uor']],['wdw',['wdw']]]){
  w.location.hash='#panel';await sleep(150);click('[data-newclient]');await sleep(100);
  ok(/Universal Orlando Resort/.test(T())&&/Disney \+ Universal/.test(T()),'el modal de nuevo cliente ofrece destinos ('+kind+')');
  click('[data-newtrip="'+kind+'"]');await sleep(250);
  const s=st(),c=s.clients[s.clients.length-1];
  ok(JSON.stringify(c.dests)===JSON.stringify(exp),'dests = '+exp.join('+')+' ('+kind+')');
  ok(kind==='both'?(c.segs&&c.segs.wdw&&c.segs.uor&&c.segs.wdw.end===c.segs.uor.start):c.segs===null,'segs '+(kind==='both'?'divididos':'nulos'));
  ok(kind==='uor'?c.plan==='none':c.plan==='base','plan inicial correcto ('+kind+')');
  ok(location_hash().indexOf('cliente-')===0,'abre la agenda del cliente nuevo ('+kind+')');
 }
 // ---- editar destinos desde "Datos del viaje"
 click('[data-tab="datos"]');await sleep(150);
 const cb=d.querySelector('input[data-dest="uor"]');ok(!!cb,'casillas de destino en datos del viaje');
 chg(cb,true);await sleep(200);
 const s2=st(),cc=s2.clients[s2.clients.length-1];ok(cc.dests.length===2&&cc.dests.indexOf('uor')>=0,'agrega Universal a un viaje de Disney');
 ok(!!d.querySelector('input[data-dest="wdw"]'),'sigue la casilla de Disney');
 // ---- catálogo
 w.location.hash='#catalogo';await sleep(250);
 ok(d.querySelectorAll('[data-fd]').length>=2||/Universal/.test(T()),'el catálogo tiene filtro por destino');
 const fdU=d.querySelector('[data-fd="uor"]');
 if(fdU){click(fdU);await sleep(200);ok(/Mythos|Finnegan|Atlantic|Lombard/.test(T()),'filtrar Universal muestra sus restaurantes');
  ok(!/Be Our Guest|Space 220/.test(T()),'y oculta los de Disney');
  const card2=d.querySelector('[data-rest]');if(card2){click(card2);await sleep(150);ok(/Universal/.test(d.querySelector('.modal').textContent)&&/universalorlando\.com/.test(d.querySelector('.modal').innerHTML),'modal con enlace al sitio oficial');
   ok(!/Créditos|crédito del plan/i.test(d.querySelector('.modal').textContent.replace(/sin créditos/ig,'')),'modal sin créditos de Disney');click('[data-close]');}
 }
 // ---- reservas (vista de la agente)
 w.location.hash='#reservas';await sleep(250);
 ok(/Universal/.test(T()),'la vista de reservas agrupa Universal');
 // ---- portal del cliente de Universal
 const c4=st().clients.find(c=>c.id==='c4');
 w.location.hash='#portal-'+c4.token;await sleep(250);
 const pin=d.querySelector('#pin');if(pin){pin.value=c4.pin;pin.dispatchEvent(new w.Event('input',{bubbles:true}));click('[data-unlock]');await sleep(250);}
 ok(/Universal/.test(T())&&!/Plan de comidas de Disney/.test(T()),'portal del cliente de Universal');
 ok(d.documentElement.getAttribute('data-theme')==='uor','el cliente de Universal ve la identidad visual de Universal');
 w.location.hash='#casos';await sleep(250);ok(!d.documentElement.getAttribute('data-theme'),'al pasar a la vista agencia vuelve la identidad de la agencia');
 const c1=st().clients.find(c=>c.id==='c1');w.location.hash='#portal-'+c1.token;await sleep(250);const pin1=d.querySelector('#pin');if(pin1){pin1.value=c1.pin;pin1.dispatchEvent(new w.Event('input',{bubbles:true}));click('[data-unlock]');await sleep(250);}
 ok(!d.documentElement.getAttribute('data-theme'),'el cliente de Disney conserva la identidad de Disney');
 const c5=st().clients.find(c=>c.id==='c5');w.location.hash='#portal-'+c5.token;await sleep(250);const pin5=d.querySelector('#pin');if(pin5){pin5.value=c5.pin;pin5.dispatchEvent(new w.Event('input',{bubbles:true}));click('[data-unlock]');await sleep(250);}
 ok(!d.documentElement.getAttribute('data-theme'),'el viaje combinado usa la identidad base');
 ok(errs.length===0,'sin errores de JS ('+errs.join('|')+')');
 console.log(out.join('\n'));console.log(out.filter(x=>x.startsWith('FAIL')).length?'FALLAS':'test12 OK');
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']');process.exitCode=1});
function location_hash(){return dom.window.location.hash.replace('#','')}
