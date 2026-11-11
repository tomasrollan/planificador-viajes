// Un navegador con la demo anterior (solo Disney) recibe los viajes de Universal una sola vez, sin tocar lo ya cargado.
const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
const boot=(ls)=>new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#panel',beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollBy=()=>{};if(ls)w.localStorage.setItem('agency_planner_v3',ls);}});
(async()=>{
 let a=boot();await sleep(600);
 // armar un estado "anterior": sin c4/c5/caso 1008 ni la marca, con un cambio del usuario
 const s=JSON.parse(a.window.localStorage.getItem('agency_planner_v3'));
 s.clients=s.clients.filter(c=>c.id!=='c4'&&c.id!=='c5');s.cases=s.cases.filter(k=>k.num!==1008);delete s.uorDemoSeeded;
 s.clients.find(c=>c.id==='c1').name='Familia Rodríguez (editada)';
 const old=JSON.stringify(s);a.window.close();
 let b=boot(old);await sleep(700);const d=b.window.document;
 const names=[...d.querySelectorAll('#cl-grid .ccard h4')].map(x=>x.textContent);
 ok(names.some(n=>/Torres/.test(n))&&names.some(n=>/Álvarez/.test(n)),'aparecen los clientes de Universal en una demo anterior ('+names.join(', ')+')');
 ok(names.some(n=>/editada/.test(n)),'no pisa lo que ya estaba cargado');
 ok([...d.querySelectorAll('[data-pf]')].length===4,'filtros de destino en el panel');
 const st=JSON.parse(b.window.localStorage.getItem('agency_planner_v3'));
 ok(st.clients.length===5&&st.uorDemoSeeded===true&&st.cases.filter(k=>k.num===1008).length===1,'queda guardado una sola vez');
 const snapshot=b.window.localStorage.getItem('agency_planner_v3');b.window.close();
 let c=boot(snapshot);await sleep(600);const st2=JSON.parse(c.window.localStorage.getItem('agency_planner_v3'));
 ok(st2.clients.length===5,'al recargar no se duplican');
 // si la agente borró a Torres, no vuelve
 st2.clients=st2.clients.filter(x=>x.id!=='c4');c.window.close();
 let e=boot(JSON.stringify(st2));await sleep(600);const st3=JSON.parse(e.window.localStorage.getItem('agency_planner_v3'));
 ok(st3.clients.length===4&&!st3.clients.some(x=>x.id==='c4'),'un cliente borrado no reaparece');
 // el catálogo de Universal se ve igual
 e.window.location.hash='#catalogo';await sleep(250);
 ok(!!e.window.document.querySelector('[data-fd="uor"]'),'el catálogo tiene el filtro de Universal');
 console.log(out.join('\n'));console.log(out.some(x=>x.startsWith('FAIL'))?'FALLAS':'test14 OK');
})().catch(e=>{console.log(out.join('\n'));console.log('ERR ['+e.message+']');process.exitCode=1});
