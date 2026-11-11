/* Búsqueda de platos entre todos los restaurantes. Busca en inglés y en español (con la traducción por diccionario).
   El filtro por alergias usa SOLO las listas "allergy-friendly" que Disney publica con la leyenda "(For … Allergies)":
   un plato aparece si Disney lo marca apto para todos los alérgenos elegidos. No es una garantía. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.DishSearch=factory(); })(typeof self!=='undefined'?self:this,function(){
  var ALLERGENS=[['gluten','Gluten / trigo'],['egg','Huevo'],['fish','Pescado'],['shellfish','Mariscos'],['milk','Leche'],['peanut','Maní'],['treenut','Frutos secos'],['sesame','Sésamo'],['soy','Soja']];
  var PHRASE=/\((?:for |contains )?[^()]*allerg[^()]*\)/i, SKIP=/^(guests?\s+must|please\s+speak|speak\s+to)/i;
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  /* leyenda de alergias -> lista de alérgenos para los que Disney marca el plato; null si no trae leyenda */
  function allergensOf(d){
    var m=PHRASE.exec(d||''); if(!m) return null; var t=m[0].toLowerCase().replace(/\s*\/\s*/g,'/'), out=[];
    if(/gluten|wheat/.test(t)) out.push('gluten'); if(/\begg/.test(t)) out.push('egg'); if(/\bsoy/.test(t)) out.push('soy'); if(/\bmilk/.test(t)) out.push('milk'); if(/sesame/.test(t)) out.push('sesame');
    if(/\bfish/.test(t)) out.push('fish'); if(/shellfish/.test(t)) out.push('shellfish');
    if(/peanut/.test(t)) out.push('peanut'); if(/tree/.test(t)) out.push('treenut');
    return out;
  }
  function mealOf(n){ n=String(n||'').toLowerCase(); if(/brunch/.test(n)) return 'brunch'; if(/breakfast/.test(n)) return 'breakfast'; if(/lunch/.test(n)) return 'lunch'; if(/dinner|evening/.test(n)) return 'dinner'; return 'other'; }
  /* entries: [{rid,name,zone,path,mf:{at,menus:[{n,sections,alerg}]}}]; tr: {name,desc} (Translate.create) */
  function build(entries,tr){
    var idx=[];
    entries.forEach(function(e){ if(!e.mf||!e.mf.menus) return;
      e.mf.menus.forEach(function(m){ var meal=mealOf(m.n);
        function add(sections,isAlg){ (sections||[]).forEach(function(sec){ (sec.items||[]).forEach(function(it){ if(!it.n||SKIP.test(it.n)) return;
          var es=tr?tr.name(it.n):it.n, ed=tr&&it.d?tr.desc(it.d):(it.d||'');
          idx.push({rid:e.rid,rname:e.name,zone:e.zone,menu:m.n,meal:meal,sec:sec.n,n:it.n,d:it.d||'',p:it.p||'',es:es,ed:ed,alg:isAlg?allergensOf(it.d):null,isAlg:isAlg,
            hay:norm(it.n+' '+(it.d||'')+' '+es+' '+ed), nh:norm(it.n+' '+es)}); }); }); }
        add(m.sections,false); add(m.alerg,true); }); });
    return idx;
  }
  function mealOk(item,meal){ if(!meal) return true; if(item.meal==='other') return true; if(item.meal==='brunch') return meal==='breakfast'||meal==='lunch'; return item.meal===meal; }
  /* o: {q, allergens:[], meal, zone, maxGroups, perGroup} */
  function search(idx,o){
    var toks=norm(o.q).split(/\s+/).filter(Boolean), al=o.allergens||[], maxG=o.maxGroups||40, perG=o.perGroup||5;
    if(!al.length&&!toks.join('').length) return {empty:true,total:0,groups:[]};
    var by={}, total=0;
    for(var i=0;i<idx.length;i++){ var it=idx[i];
      if(al.length){ if(!it.isAlg||!it.alg) continue; var ok=true; for(var k=0;k<al.length;k++){ if(it.alg.indexOf(al[k])<0){ ok=false; break; } } if(!ok) continue; } else if(it.isAlg) continue;
      if(o.zone&&it.zone!==o.zone) continue; if(!mealOk(it,o.meal)) continue;
      var sc=0, hit=true; for(var j=0;j<toks.length;j++){ if(it.hay.indexOf(toks[j])<0){ hit=false; break; } sc+=it.nh.indexOf(toks[j])>=0?2:1; } if(!hit) continue;
      total++; var g=by[it.rid]||(by[it.rid]={rid:it.rid,rname:it.rname,zone:it.zone,items:[],count:0,best:0}); g.count++; if(sc>g.best) g.best=sc; if(g.items.length<perG||sc>g.items[g.items.length-1].sc) { g.items.push({it:it,sc:sc}); g.items.sort(function(a,b){return b.sc-a.sc;}); if(g.items.length>perG) g.items.pop(); } }
    var groups=Object.keys(by).map(function(r){ var g=by[r]; g.items=g.items.map(function(x){return x.it;}); return g; }).sort(function(a,b){ return b.best-a.best||b.count-a.count||a.rname.localeCompare(b.rname); });
    return {empty:false,total:total,restaurants:groups.length,groups:groups.slice(0,maxG)};
  }
  return {ALLERGENS:ALLERGENS,allergensOf:allergensOf,build:build,search:search,norm:norm};
});
