/* Plantillas de agenda: copiar un día a otros, guardar un viaje como plantilla y aplicarla a otro cliente. Solo completan lugares vacíos. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Templates=factory(); })(typeof self!=='undefined'?self:this,function(){
  var MEALS=['breakfast','lunch','dinner'];
  function newSlot(rid){ return {rid:rid,state:'idea',time:'',conf:'',by:'agus',locked:false,note:''}; }
  function day(c,date){ return (c.days||[]).filter(function(d){return d.date===date;})[0]; }
  /* copia parque y comidas de un día a otros; no pisa comidas ya cargadas (a menos que overwrite) */
  function copyDay(c,from,tos,o){
    o=o||{}; var src=day(c,from); if(!src) return {copied:0,skipped:0};
    var copied=0, skipped=0;
    tos.forEach(function(t){ if(t===from) return; var d=day(c,t); if(!d) return;
      if(src.park&&(!d.park||o.overwrite)) d.park=src.park;
      MEALS.forEach(function(m){ var s=src.slots&&src.slots[m]; if(!s) return; if(d.slots[m]&&!o.overwrite){ skipped++; return; } if(d.slots[m]&&d.slots[m].locked){ skipped++; return; } d.slots[m]=newSlot(s.rid); copied++; }); });
    return {copied:copied,skipped:skipped};
  }
  function make(c,name,uid,now){
    return {id:uid(),name:String(name||'').trim()||'Plantilla',nights:(c.days||[]).length,plan:c.plan,created:now,
      days:(c.days||[]).map(function(d){ var o={park:d.park||'',slots:{}}; MEALS.forEach(function(m){ var s=d.slots&&d.slots[m]; if(s) o.slots[m]=s.rid; }); return o; })};
  }
  /* aplica por posición (día 1 con día 1…); los días que sobran en la plantilla se ignoran */
  function apply(c,tpl){
    var n=Math.min((c.days||[]).length,tpl.days.length), applied=0, skipped=0;
    for(var i=0;i<n;i++){ var d=c.days[i], t=tpl.days[i]; if(t.park&&!d.park) d.park=t.park;
      MEALS.forEach(function(m){ var rid=t.slots[m]; if(!rid) return; if(d.slots[m]){ skipped++; return; } d.slots[m]=newSlot(rid); applied++; }); }
    return {applied:applied,skipped:skipped,ignoredDays:Math.max(0,tpl.days.length-n)};
  }
  return {copyDay:copyDay,make:make,apply:apply,newSlot:newSlot};
});
