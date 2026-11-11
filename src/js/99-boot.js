/* Datos de la demo: si el navegador ya tenía la demo anterior (solo Disney), suma los viajes de Universal una única vez. */
(function ensureUniversalDemo(){
  try{
    var ids=S.clients.map(function(c){return c.id});
    if(S.uorDemoSeeded||ids.indexOf('c1')<0||ids.indexOf('c2')<0||ids.indexOf('c3')<0) return;
    if(S.clients.some(function(c){return hasDest(c,'uor')})){ S.uorDemoSeeded=true; save(); return; }
    var d=Repo.migrate(demo()); d.clients.forEach(function(c){ if(c.id==='c4'||c.id==='c5') S.clients.push(c); });
    d.cases.forEach(function(k){ if((k.cid==='c4'||k.cid==='c5')&&!S.cases.some(function(x){return x.num===k.num})) S.cases.push(k); });
    S.seq=Math.max(S.seq||0,d.seq||0); S.uorDemoSeeded=true; save();
  }catch(e){}
})();
render();
