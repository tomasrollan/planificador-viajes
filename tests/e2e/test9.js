const {JSDOM}=require('jsdom');const fs=require('fs');
const file=process.argv[2]||''+(process.env.HTML||require('path').join(__dirname,'../../planificador.html'))+'';
const html=fs.readFileSync(file,'utf8');const errs=[];
const t0=Date.now();
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://x/app.html?notour',pretendToBeVisual:true,beforeParse(w){w.addEventListener('error',e=>errs.push(e.message));w.scrollTo=()=>{};w.Element.prototype.scrollIntoView=()=>{};}});
const w=dom.window,d=w.document;const wait=()=>new Promise(r=>setTimeout(r,40));const L=(...a)=>console.log(...a);
(async()=>{
 await wait();L('arranque (parse+eval+render) ms:',Date.now()-t0);
 const st=JSON.parse(w.localStorage.getItem('agency_planner_v3')||'null');L('schema guardado:',st&&st.v,'agency_id:',st&&st.agency&&st.agency.id,'cliente agency_id:',st&&st.clients[0].agency_id);
 // abrir restaurante con menú
 w.location.hash='catalogo';await wait();
 const card=d.querySelector('[data-open="le-cellier-steakhouse"]')||d.querySelector('[data-open]');L('card',!!card);
 card.click();await wait();
 const mf=d.querySelector('.mf');L('menú cargado:',!!mf,'platos:',d.querySelectorAll('.mf .it').length,'filas es:',d.querySelectorAll('.mf .es').length);
 const n1=d.querySelector('.mf .it .esn');L('nombre ES:',n1&&n1.textContent,'| EN:',n1&&n1.parentNode.querySelector('b').textContent);
 const p1=d.querySelector('.mf .it p.es');L('desc ES:',p1&&p1.textContent.slice(0,90));
 L('aviso orientativo:',/orientativa/.test(d.querySelector('.estog').textContent),'botón on:',d.querySelector('[data-esview]').classList.contains('on'));
 // alternar
 d.querySelector('[data-esview]').click();await wait();
 L('tras apagar -> noes:',d.querySelector('.mf').classList.contains('noes'),'pref:',JSON.stringify(JSON.parse(w.localStorage.getItem('agency_planner_prefs'))));
 // reabrir: recuerda la elección
 d.querySelector('[data-close]').click();await wait();card.click();await wait();
 L('reabierto recuerda noes:',d.querySelector('.mf').classList.contains('noes'));
 d.querySelector('[data-esview]').click();await wait();L('prendido otra vez:',!d.querySelector('.mf').classList.contains('noes'));
 // buscador sigue funcionando en español e inglés
 const mq=d.querySelector('#mq');mq.value='camarones';mq.dispatchEvent(new w.Event('input',{bubbles:true}));await wait();
 const vis=[...d.querySelectorAll('.mf .it')].filter(x=>x.style.display!=='none'&&!x.hidden);L('búsqueda "camarones" visibles:',vis.length,'de',d.querySelectorAll('.mf .it').length);
 // alergias traducidas
 const alg=[...d.querySelectorAll('.mf p.es')].map(x=>x.textContent).filter(x=>/Para alergias a/.test(x))[0];L('frase alergia:',alg&&alg.slice(-80));
 d.querySelector('[data-close]').click();await wait();
 // ajustes: zona horaria
 w.location.hash='';await wait();const sb=d.querySelector('[data-settings]');
 if(sb){sb.click();await wait();const sel=d.querySelector('#st-tz');L('select tz:',!!sel,sel&&sel.value);sel.value='Europe/Madrid|España';d.querySelector('[data-savesettings]').click();await wait();
   const s2=JSON.parse(w.localStorage.getItem('agency_planner_v3'));L('tz guardada:',s2.agency.tz,s2.agency.tzName);
   w.location.hash='reservas';await wait();const abre=[...d.querySelectorAll('.rgh small,.rgh .small')].map(x=>x.textContent).slice(0,2);L('abren:',abre.join(' || '));}
 L('ERR',errs);
})();
