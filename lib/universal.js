/* Módulo Universal Orlando: parques, zonas del catálogo, canales de reserva y asesoramiento de anticipación.
   Universal NO tiene hoy un plan de comidas (lo discontinuó en 2021): no hay créditos, se estima en dólares y, si el paquete trae una tarjeta de comidas, se compara contra ella.
   Funciones puras (sin DOM) para poder testearlas en Node. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(require('./rules.js'),require('./dates.js')); else root.Universal=factory(root.Rules,root.Dates); })(typeof self!=='undefined'?self:this,function(Rules,Dates){
  var REST_PARK='Día libre: CityWalk / hoteles de Universal';
  var PARKS=['Universal Studios Florida','Islands of Adventure','Epic Universe','Volcano Bay',REST_PARK];
  /* en cada día de parque también se sugiere CityWalk (la puerta de Studios e Islands); Epic Universe está lejos y no tiene a pie */
  var PARKZONE={'Universal Studios Florida':['US','CW'],'Islands of Adventure':['IA','CW'],'Epic Universe':['EU'],'Volcano Bay':['CW','UH']};
  PARKZONE[REST_PARK]=['CW','UH'];
  var ZONES={US:'Universal Studios Florida',IA:'Islands of Adventure',EU:'Epic Universe',CW:'CityWalk',UH:'Hoteles de Universal'};
  /* cómo se reserva cada restaurante */
  var BOOK={web:'Online en la web oficial de Universal (o al (407) 224-3663)',resy:'Por Resy (también por teléfono en algunos hoteles)',opentable:'Por OpenTable (o por teléfono)',walkup:'No toma reservas: se llega y se espera mesa'};
  var BOOK_SHORT={web:'Reserva online',resy:'Reserva por Resy',opentable:'Reserva por OpenTable',walkup:'Sin reserva'};
  var WINDOW_DAYS=180;       // las guías indican que se puede reservar hasta ~6 meses antes (no hay una fecha fija de apertura ni cobro por no presentarse)
  /* ¿es un parque de Universal? */
  function isPark(p){ return PARKS.indexOf(p)>=0; }
  /* anticipación recomendada para reservar, según lo que falta para el inicio de la estadía en Universal */
  function advice(c,today){
    var g=Rules.range(c,'uor'), n=Dates.daysTo(g.start,today), st, txt;
    if(n<0){ st='en_viaje'; txt='El tramo de Universal ya empezó: las mesas que falten se piden directamente, con la disponibilidad del día.'; }
    else if(n>WINDOW_DAYS){ st='lejos'; txt='Todavía es pronto: según las guías, Universal permite reservar hasta unos 6 meses antes. Conviene mirar la disponibilidad desde '+Dates.short(Dates.addDays(g.start,-WINDOW_DAYS))+' y confirmarlo en la web oficial.'; }
    else if(n>60){ st='abierta'; txt='Ya se puede reservar. Para los restaurantes más buscados (Toothsome, Mythos, los de Epic Universe, la cena de Marvel) conviene hacerlo con 1 a 2 meses de anticipación o más.'; }
    else if(n>14){ st='cerca'; txt='Reservá ya los restaurantes más buscados. Para el resto, 1 a 2 semanas antes suele alcanzar fuera de temporada alta.'; }
    else { st='urgente'; txt='Faltan pocos días: mirá la disponibilidad ya mismo; si algo está lleno, probá un horario distinto o una alternativa de CityWalk.'; }
    return {state:st,daysTo:n,start:g.start,end:g.end,text:txt,windowDays:WINDOW_DAYS};
  }
  return {REST_PARK:REST_PARK,PARKS:PARKS,PARKZONE:PARKZONE,ZONES:ZONES,BOOK:BOOK,BOOK_SHORT:BOOK_SHORT,WINDOW_DAYS:WINDOW_DAYS,isPark:isPark,advice:advice};
});
