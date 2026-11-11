/* Sugerencia de agenda por reglas (sin IA): completa las comidas vacías de un viaje según parque del día, plan de comidas,
   créditos disponibles, favoritos, valoración y preferencias del formulario de ingreso. Nunca pisa una comida ya cargada. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(require('./rules.js')); else root.Suggest=factory(root.Rules); })(typeof self!=='undefined'?self:this,function(Rules){
  var REST_PARK='Día de descanso / hoteles';
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function votesOf(c){ var v={}; Object.keys(c.favs||{}).forEach(function(t){ (c.favs[t]||[]).forEach(function(id){ v[id]=(v[id]||0)+1; }); }); return v; }
  function avoidTokens(p){ return norm(p&&p.avoid).split(/[,;\n]+|\s+y\s+/).map(function(x){return x.trim();}).filter(function(x){return x.length>=3;}); }
  /* o: {parkZone:{parque:zona}, mealOk:function(r,meal)->true|false|null, rid:{id:r}} ; devuelve {picks,skipped,credits} */
  function suggest(c,R,o){
    o=o||{}; var PZ=o.parkZone||{}, destOf=o.destOf||function(){return 'wdw';}, mealOk=o.mealOk||function(){return null;}, rid=o.rid||{}; R.forEach(function(r){ rid[r.id]=rid[r.id]||r; });
    var plan=Rules.PLANS[c.plan]||Rules.PLANS.none, total=Rules.planTotal(c), usedCr=Rules.usedCredits(c,rid).plan;
    var used={}; Rules.slots(c).forEach(function(x){ used[x.slot.rid]=1; });
    var votes=votesOf(c), prefs=(c.intake&&c.intake.prefs)||{}, kids=(c.travelers||[]).some(function(t){return t.type==='niño';});
    var avoid=avoidTokens(prefs), maxTier=+prefs.budget||4, styles=prefs.styles||[];
    var order=['dinner','lunch'], picks=[], skipped=[];
    (c.days||[]).forEach(function(d){
      var zone=PZ[d.park]||(d.park===REST_PARK?'RS':undefined), zl=[].concat(zone||[]), dd=destOf(d.park), target=(dd==='wdw'&&plan.per>=2)?2:1;
      var have=order.filter(function(m){return d.slots&&d.slots[m];}).length, need=target-have;
      var empty=order.filter(function(m){return !(d.slots&&d.slots[m]);});
      if(need<=0||!empty.length) return;
      if(!d.park){ skipped.push({date:d.date,meal:null,reason:'Falta elegir el parque de este día'}); return; }
      if(!zone){ skipped.push({date:d.date,meal:null,reason:'Este día no tiene restaurantes asociados al parque elegido'}); return; }
      empty.slice(0,need).forEach(function(m){
        var cands=R.filter(function(r){
          if(zl.indexOf(r.zone)<0||used[r.id]) return false;
          if(mealOk(r,m)===false) return false;
          var cr=Rules.creditsOf(r,m), wd=(r.dest||'wdw')==='wdw';
          if(wd&&plan.per>0&&(cr===0||(total&&cr>total-usedCr))) return false;
          if(r.tier>maxTier) return false;
          var hay=norm(r.name+' '+r.cuisine); if(avoid.some(function(a){return hay.indexOf(a)>=0;})) return false;
          return true; });
        if(!cands.length){ skipped.push({date:d.date,meal:m,reason:(dd==='wdw'&&plan.per>0)?'Sin restaurantes que acepten el plan o alcancen los créditos':'Sin restaurantes disponibles para ese parque'}); return; }
        var scored=cands.map(function(r){ var s=(r.rating==null?6:r.rating)+(votes[r.id]||0)*2+(r.hot?1.5:0)+(zl.length>1&&r.zone===zl[0]?1:0);
          styles.forEach(function(st){ if(r.flags.indexOf(st)>=0) s+=1.5; });
          if(kids&&m==='dinner'&&r.flags.indexOf('P')>=0) s+=1;
          if(m==='lunch'&&r.tier>3) s-=0.5*(r.tier-3); if(m==='dinner') s+=0.2*r.tier;
          return {r:r,s:s}; }).sort(function(a,b){ return b.s-a.s||a.r.name.localeCompare(b.r.name); });
        var best=scored[0].r, why=[]; if(votes[best.id]) why.push('Favorito de '+votes[best.id]); if(best.rating!=null) why.push('Valoración '+best.rating.toFixed(1)); else if(best.hot) why.push('Destacado por las guías');
        var cr=Rules.creditsOf(best,m); if((best.dest||'wdw')==='wdw'&&plan.per>0) why.push(cr+(cr===1?' crédito':' créditos')); if(best.diff===3) why.push('Mesa difícil: reservar primero');
        picks.push({date:d.date,meal:m,rid:best.id,why:why,hard:best.diff===3}); used[best.id]=1; if((best.dest||'wdw')==='wdw') usedCr+=cr; });
    });
    return {picks:picks,skipped:skipped,credits:{total:total,usedAfter:usedCr}};
  }
  return {suggest:suggest,REST_PARK:REST_PARK,norm:norm};
});
