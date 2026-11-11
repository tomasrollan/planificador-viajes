const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(''+(process.env.HTML||require('path').join(__dirname,'../../planificador.html'))+'','utf8');const errs=[];
const dom=new JSDOM(html,{runScripts:'dangerously',url:'http://x/app.html?notour',pretendToBeVisual:true,beforeParse(w){w.addEventListener('error',e=>errs.push(e.message));w.scrollTo=()=>{}}});
const w=dom.window,d=w.document;const wait=()=>new Promise(r=>setTimeout(r,30));
const setv=(s,v,ev)=>{const e=d.querySelector(s);e.value=v;if(ev)e.dispatchEvent(new w.Event(ev,{bubbles:true}))};
(async()=>{
 w.location.hash='cliente-c1'; await wait();
 const eds=[...d.querySelectorAll('[data-edit]')]; console.log('slots editables',eds.length);
 for(const e of eds){ e.click(); await wait(); if(d.querySelector('#se-time')){ setv('#se-time','23:55','input'); console.log('23:55 ->',d.querySelector('#se-timewarn').textContent.slice(0,130)); setv('#se-time','18:00','input'); console.log('18:00 ->',d.querySelector('#se-timewarn').textContent.slice(0,110)); break;} d.querySelector('.x').click(); await wait(); }
 // picker almuerzo/desayuno: conteo de "No figura"
 d.querySelector('.x')&&d.querySelector('.x').click(); await wait();
 const adds=[...d.querySelectorAll('[data-add]')]; for(const k of ['breakfast','lunch']){ const a=adds.find(x=>x.getAttribute('data-add').endsWith(k)); if(a){a.click();await wait();const t=[...d.querySelectorAll('.modal [data-pick] .tiny')].filter(x=>/No figura/.test(x.textContent)).length;console.log(k,'sin esa comida:',t,'de',d.querySelectorAll('.modal [data-pick]').length);d.querySelector('.x').click();await wait();}}
 console.log('ERR',errs);
})();
