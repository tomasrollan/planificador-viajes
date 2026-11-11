const {JSDOM}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.env.HTML||require('path').join(__dirname,'../../planificador.html'),'utf8');
const errs=[];const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://x.test/?notour#',beforeParse(w){w.addEventListener('error',e=>errs.push(String(e.message)));w.scrollTo=()=>{};}});
const w=dom.window,d=w.document;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{await sleep(600);
 const out=[];const ok=(c,m)=>{out.push((c?'OK  ':'FAIL ')+m);if(!c)process.exitCode=1};
 ok(!!d.querySelector('[data-export]'),'botón exportar');ok(!!d.querySelector('#imp-file'),'input importar');
 // exportar: capturamos el texto que se descarga
 let saved=null;w.claude={use:()=>Promise.resolve({save:o=>{saved=o;return Promise.resolve()}})};
 d.querySelector('[data-export]').click();await sleep(100);
 ok(saved&&/^copia-planificador-\d{4}-\d\d-\d\d\.json$/.test(saved.filename),'nombre de archivo');
 const bk=JSON.parse(saved.data);ok(bk.app==='agus-planner'&&bk.state.clients.length===5,'contenido: 5 clientes');
 // modificamos el nombre de la agencia en la copia e importamos
 bk.state.agency.name='Agencia Importada';
 const file=new w.File([JSON.stringify(bk)],'c.json',{type:'application/json'});
 const inp=d.querySelector('#imp-file');Object.defineProperty(inp,'files',{value:[file],configurable:true});
 inp.dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(300);
 ok(/Reemplazar los datos actuales/.test(d.body.textContent),'pide confirmación');
 d.querySelector('[data-doimport]').click();await sleep(200);
 ok(/Agencia Importada/.test(d.body.textContent),'datos importados visibles');
 // archivo inválido
 const bad=new w.File(['{"hola":1}'],'x.json');Object.defineProperty(d.querySelector('#imp-file'),'files',{value:[bad],configurable:true});
 d.querySelector('#imp-file').dispatchEvent(new w.Event('change',{bubbles:true}));await sleep(300);
 ok(/no es una copia/.test(d.body.textContent),'rechaza archivo ajeno');
 console.log(out.join('\n'));console.log('ERR',JSON.stringify(errs));process.exit(errs.length?1:process.exitCode||0);
})();
