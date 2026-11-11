const assert=require('assert'),fs=require('fs'),T=require('../lib/translate.js');let n=0;const eq=(a,b,m)=>{assert.strictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
const ES=JSON.parse(fs.readFileSync(__dirname+'/../data/es.json','utf8')),M=JSON.parse(fs.readFileSync(__dirname+'/../data/menusfull.json','utf8'));
const t=T.create(ES);
eq(t.name('Canadian Cheddar Cheese Soup'),'Sopa de queso cheddar canadiense');eq(t.name('Nombre que no existe'),'Nombre que no existe','sin entrada = queda igual');
eq(t.desc(''),'');eq(t.desc('Lemon, Mignonette, Cocktail Sauce').length>0,true);
eq(t.desc('Chicken, Rice (For Egg, Fish/Shellfish, Peanut/Tree Nut, Sesame Allergies)'),t.desc('Chicken, Rice')+' (Para alergias a: huevo, pescado/mariscos, maní/frutos secos y sésamo)','frase de alergia traducida literalmente, al final');
eq(t.split('a, b (c, d), e').length,3,'no corta dentro de paréntesis');
// cobertura sobre los datos reales: ningún plato rompe, y la mayoría de los términos tiene traducción o es nombre propio/préstamo
let items=0,withDesc=0,changedN=0,changedD=0,algUntranslated=0;
for(const k in M)M[k].menus.forEach(m=>[...m.sections,...(m.alerg||[])].forEach(s=>s.items.forEach(it=>{items++;const nn=t.name(it.n);if(nn!==it.n)changedN++;if(it.d){withDesc++;const d=t.desc(it.d);ok(typeof d==='string');if(d!==it.d)changedD++;
  (it.d.match(T.ALG)||[]).forEach(p=>{if(!ES.alg[p.trim()])algUntranslated++})}})));
console.log('platos',items,'| con descripción',withDesc,'| nombre traducido',changedN,'('+Math.round(changedN/items*100)+'%) | descripción traducida',changedD,'('+Math.round(changedD/withDesc*100)+'%) | frases de alergia sin traducir',algUntranslated);
eq(algUntranslated,0);ok(changedD/withDesc>0.9,'cobertura de descripciones > 90%');ok(changedN/items>0.8,'cobertura de nombres > 80%');
console.log('translate.test: '+n+' verificaciones OK');
