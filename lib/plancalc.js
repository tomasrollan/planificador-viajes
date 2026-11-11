/* Calculadora "¿conviene el plan de comidas?". Compara lo que cuesta el plan con lo que valdrían las mismas comidas pagadas aparte.
   Solo adultos: Disney publica otro precio para niños que hay que cargar a mano. Todo supuesto es editable por la agente. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(require('./rules.js'),require('./dates.js')); else root.PlanCalc=factory(root.Rules,root.Dates); })(typeof self!=='undefined'?self:this,function(Rules,Dates){
  var RATES={table:99.87,deluxe:163.01,asof:'precios 2027 por adulto y por noche publicados por Disney (relevados en nov 2026)'};
  var DEFAULT_EXTRAS=20, DEFAULT_MEAL=47;    // supuestos: comida rápida + snacks por persona y noche; precio medio de una comida de mesa (nivel $$$)
  /* gasto de mesa por adulto según la agenda cargada; si no hay agenda, se supone una comida de mesa por crédito del plan */
  function tableCostPerAdult(c,rid){
    var sl=Rules.slots(c), tot=0, n=0; sl.forEach(function(x){ var r=rid[x.slot.rid]; if(r){ tot+=Rules.PRICE_EST[r.tier]||25; n++; } });
    if(n) return {cost:tot,meals:n,assumed:false};
    var cr=Rules.planTotal(c); return {cost:cr*DEFAULT_MEAL,meals:cr,assumed:true};
  }
  function compare(o){
    var rates=o.rates||RATES, planKey=o.planKey==='premium'?'premium':'base', nights=Math.max(0,+o.nights||0), adults=Math.max(0,+o.adults||0);
    var rate=planKey==='premium'?rates.deluxe:rates.table, extras=o.extrasPerNight==null?DEFAULT_EXTRAS:Math.max(0,+o.extrasPerNight);
    var planCost=round(rate*nights*adults), perAdult=(+o.tableCostPerAdult||0)+extras*nights, outOfPocket=round(perAdult*adults), diff=round(planCost-outOfPocket);
    var credits=(Rules.PLANS[planKey].per||0)*nights, unused=Math.max(0,credits-(o.tableMeals||0));
    var verdict=planCost? (Math.abs(diff)<=planCost*0.05?'parecido':(diff<0?'plan':'sin_plan')):'sin_datos';
    return {planKey:planKey,rate:rate,nights:nights,adults:adults,planCost:planCost,outOfPocket:outOfPocket,diff:diff,verdict:verdict,credits:credits,unusedCredits:unused,extrasPerNight:extras};
  }
  function round(x){ return Math.round(x*100)/100; }
  return {compare:compare,tableCostPerAdult:tableCostPerAdult,RATES:RATES,DEFAULT_EXTRAS:DEFAULT_EXTRAS,DEFAULT_MEAL:DEFAULT_MEAL};
});
