// Build: ensambla src/ + data/ en un único HTML autocontenido y valida los datos.
// Uso: node build.js            -> planificador.html
//      OUT=/ruta.html node build.js
const fs=require('fs'),path=require('path'),vm=require('vm');
const R=__dirname,rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const ISO=/^\d{4}-\d{2}-\d{2}$/;

/* ---------- datos ---------- */
const sb={window:{}};vm.createContext(sb);
vm.runInContext(rd('data/catalog.js'),sb);vm.runInContext(rd('data/menus.js'),sb);vm.runInContext(rd('data/catalog-uor.js'),sb);
const UOR=sb.window.CATALOG_UOR||[];const CATALOG=sb.window.CATALOG,META=sb.window.CATALOG_META,MENUS=sb.window.MENUS;
const PHOTOS=JSON.parse(rd('data/photos.json')),MF=JSON.parse(rd('data/menusfull.json')),HOR=JSON.parse(rd('data/horarios.json')),ES=JSON.parse(rd('data/es.json'));

/* ---------- validación ---------- */
const errors=[],warns=[];
const today=new Date().toISOString().slice(0,10);
const ids=new Map();
CATALOG.forEach((a,i)=>{const p=a[0],id=p.split('/')[1];
  if(ids.has(id))errors.push('id duplicado: '+id);ids.set(id,p);
  if(!a[1])errors.push('sin nombre: '+p);
  if(![2,3,4].includes(a[6]))errors.push('tier inválido: '+p);
  if(!a[12])warns.push('sin imagen en catálogo: '+p);
});
const uids=new Set();
UOR.forEach(o=>{if(!o.id||!/^uor-/.test(o.id))errors.push('Universal: id inválido '+o.id);if(uids.has(o.id)||ids.has(o.id))errors.push('Universal: id duplicado '+o.id);uids.add(o.id);
  if(!o.name)errors.push('Universal: sin nombre '+o.id);if(![2,3,4].includes(o.tier))errors.push('Universal: tier inválido '+o.id);if(![1,2,3].includes(o.diff))errors.push('Universal: diff inválido '+o.id);
  if(!['US','IA','EU','CW','UH'].includes(o.zone))errors.push('Universal: zona inválida '+o.id);if(!['web','resy','opentable','walkup'].includes(o.book))errors.push('Universal: canal de reserva inválido '+o.id);
  if(!o.desc||o.desc.length<20)errors.push('Universal: sin descripción '+o.id);});
const paths=new Set(CATALOG.map(a=>a[0]));
ids.forEach((p,id)=>{const ph=PHOTOS[id];if(!ph||!(ph.a||ph.d))warns.push('sin foto: '+id);if(!HOR.data[p]||!(HOR.data[p].m||[]).length)warns.push('sin horarios: '+id);});
Object.keys(MF).forEach(k=>{
  if(!paths.has(k))errors.push('menú de un restaurante que no está en el catálogo: '+k);
  const m=MF[k];if(!ISO.test(m.at||''))errors.push('menú sin fecha (at): '+k);else if(m.at>today)errors.push('menú con fecha futura: '+k+' '+m.at);
  if(!m.menus||!m.menus.length)warns.push('menú vacío: '+k);
  (m.menus||[]).forEach(mm=>[...mm.sections,...(mm.alerg||[])].forEach(s=>s.items.forEach(it=>{if(!it.n)errors.push('plato sin nombre en '+k);})));
});
paths.forEach(p=>{if(!MF[p])warns.push('sin menú completo: '+p)});
Object.keys(MENUS).forEach(k=>{if(!paths.has(k))errors.push('MENUS: restaurante inexistente '+k)});
if(!ISO.test(HOR.at))errors.push('horarios sin fecha');
Object.keys(HOR.data).forEach(k=>{if(!paths.has(k))errors.push('horarios: restaurante inexistente '+k)});
Object.keys(HOR.data).forEach(k=>{const h=HOR.data[k];if(h.d&&h.d.length!==7)errors.push('horarios: '+k+' no tiene 7 días')});
if(!ES.names||!ES.terms||!ES.alg)errors.push('es.json incompleto');
console.log('validación: '+CATALOG.length+' restaurantes Disney + '+UOR.length+' Universal · '+Object.keys(MF).length+' menús · '+errors.length+' errores · '+warns.length+' avisos');
warns.slice(0,12).forEach(w=>console.log('  aviso:',w));if(warns.length>12)console.log('  …y '+(warns.length-12)+' avisos más');
if(errors.length){errors.forEach(e=>console.error('  ERROR:',e));process.exit(1)}

/* ---------- ensamblado ---------- */
// Los datos grandes van en <script type="application/json">: el navegador no los parsea hasta que el código los pide.
const safe=t=>t.replace(/<\//g,'<\\/').replace(/<!--/g,'<\\u0021--').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
const block=(id,obj,attrs)=>'<script type="application/json" id="d-'+id+'"'+(attrs||'')+'>'+safe(JSON.stringify(obj))+'</script>\n';
let blocks=block('photos',PHOTOS)+block('horarios',{data:HOR.data,at:HOR.at,week:HOR.week})+block('es',ES);
Object.keys(MF).forEach((k,i)=>{blocks+='<script type="application/json" id="d-mf'+i+'" data-mf="'+k+'">'+safe(JSON.stringify(MF[k]))+'</script>\n'});
const LIBFIRST=['dates.js','rules.js','universal.js','html.js','translate.js'];   // módulos de los que dependen otros: van primero
const libFiles=fs.readdirSync(path.join(R,'lib')).filter(f=>f.endsWith('.js')).sort();
const lib=LIBFIRST.concat(libFiles.filter(f=>LIBFIRST.indexOf(f)<0)).map(f=>rd('lib/'+f)).join('\n');
const data=[ lib,
  'window.JDATA=function(id){var e=document.getElementById("d-"+id);return e?JSON.parse(e.textContent):null};',
  'window.PHOTOS=JDATA("photos")||{};', rd('data/catalog.js'), rd('data/menus.js'), rd('data/catalog-uor.js'),
  '(function(){var h=JDATA("horarios")||{};window.HORARIOS=h.data||{};window.HORARIOS_AT=h.at;window.HORARIOS_WEEK=h.week;})();' ].join('\n');
const js=fs.readdirSync(path.join(R,'src/js')).filter(f=>f.endsWith('.js')).sort().map(f=>rd('src/js/'+f)).join('');
const html=rd('src/index.html').replace('/*__CSS__*/',()=>rd('src/styles/app.css')).replace('/*__DATA__*/',()=>data).replace('/*__JS__*/',()=>js).replace('<!--__BLOCKS__-->',()=>blocks);
let finalHtml=html;
if(process.env.CSP==='1'){   // CSP estricta para hospedaje propio (no se usa en el visor de artifacts, que inyecta su propio script)
  const crypto=require('crypto');const hashes=[];finalHtml.replace(/<script>([\s\S]*?)<\/script>/g,(m,c)=>{hashes.push("'sha256-"+crypto.createHash('sha256').update(c).digest('base64')+"'");return m});
  const csp="default-src 'none'; script-src "+hashes.join(' ')+"; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data: https:; connect-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'";
  finalHtml=finalHtml.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="'+csp+'">');
}
const out=process.env.OUT||path.join(R,'planificador.html');
fs.writeFileSync(out,finalHtml);
console.log('ok '+path.basename(out)+' '+(html.length/1048576).toFixed(2)+' MB (código '+(js.length/1024|0)+' KB, datos '+(data.length/1048576).toFixed(2)+' MB)');
