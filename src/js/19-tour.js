/* ======================= bienvenida / guía de uso (agencia y cliente) ======================= */
var TOUR_KEY='agency_tour_v1', _tourMem={};
function tourSeen(k){ try{ var t=JSON.parse(localStorage.getItem(TOUR_KEY)||'{}'); return !!t[k]||!!_tourMem[k]; }catch(e){ return !!_tourMem[k]; } }
function tourMark(k){ _tourMem[k]=1; try{ var t=JSON.parse(localStorage.getItem(TOUR_KEY)||'{}'); t[k]=1; localStorage.setItem(TOUR_KEY,JSON.stringify(t)); }catch(e){} }
function tourSteps(role){
  if(role==='agus') return [
    {ic:'users',t:'Tu panel: primero los clientes',p:'Cada tarjeta muestra el destino, cuándo viaja, la barra del presupuesto (lo comprometido contra lo que el cliente quiere gastar) y una línea de cobranza con las cuotas. Arriba de todo está «Para hacer hoy»: lo más urgente, incluidas las cuotas vencidas o por vencer.',tip:'Buscá por nombre u hotel, o filtrá por Disney, Universal o «con pendientes».'},
    {ic:'plus',t:'Cargá un cliente en segundos',p:'En «Nuevo cliente» elegís el destino (Disney, Universal o combinado) o pegás el mensaje de WhatsApp: la app lee destino, fechas, viajeros, teléfono y presupuesto, y vos revisás antes de crear. En el mismo selector ves los destinos que vienen: Caribe, Europa y Cruceros. Marcá el que más te interesa y lo priorizamos.',tip:'Si el mensaje menciona alergias, quedan en la nota del cliente: cargalas en cada viajero.'},
    {ic:'user',t:'Clientes y fichas: tu mini CRM',p:'En «Clientes» cada familia tiene un código (FAM-0001) y una ficha solo para la agencia: cómo es el cliente, gustos, etiquetas, notas internas y los viajes anteriores. Si el teléfono ya existe, el viaje nuevo se suma a la misma familia y copia los viajeros del último viaje. Los clientes que repiten se marcan solos.',tip:'El cliente nunca ve su ficha. Al reusar viajeros, reconfirmá alergias y edades: pueden haber cambiado.'},
    {ic:'calendar',t:'Armá la agenda de comidas',p:'Elegí el parque de cada día y las comidas. «Sugerir agenda» propone el resto con reglas y sin pisar lo que ya cargaste. También podés copiar un día o usar plantillas.',tip:'Cada comida pasa de «Idea» a «Para reservar» y a «Reservada», con hora y confirmación.'},
    {ic:'check',t:'Reservá sin perder el hilo',p:'Disney abre las reservas 60 días antes, a las 6:00 AM de Florida. Universal no tiene día fijo (aprox. 6 meses antes). La «Sesión de reservas» te lleva de a una, con las mesas difíciles primero y las alergias a la vista. Al confirmar podés anotar el costo y pasa directo al presupuesto.',tip:'Anotá hora y confirmación al terminar: el cliente lo ve enseguida.'},
    {ic:'bag',t:'Presupuesto y comprobantes',p:'En la pestaña «Presupuesto» cargás cuánto quiere gastar el cliente y después cada reserva (hotel, parques, comida, excursiones…) con su costo, estado, número de confirmación y PDF. La barra muestra lo comprometido y lo que queda disponible. Si tiene plan de comidas de Disney, sumás los créditos y ves cuántos le quedan.',tip:'Elegís qué reservas ve el cliente (sin montos). Por ahora los PDFs quedan en este navegador; cuando haya servidor se guardan en la nube.'},
    {ic:'ticket',t:'Pagos y cuotas',p:'«Pagos» es distinto del presupuesto: es lo que el cliente te paga por el viaje. Cargás el precio, armás el plan (anticipo y cuotas mensuales o cada 15 días) y marcás cada cuota como pagada con medio y comprobante. Las cuotas vencidas o próximas aparecen en «Para hacer hoy» y podés copiar el recordatorio para WhatsApp.',tip:'Por ahora todo en dólares (USD). Si no querés que el cliente lo vea, lo ocultás.'},
    {ic:'link',t:'Compartí con el cliente',p:'En «Link y PIN» está el acceso de cada cliente y un mensaje listo para WhatsApp. Elegís si solo mira, propone o arma y reserva solo. En su portal ve «Mis reservas y comprobantes» y «Mis pagos» si los compartís. «Ver como cliente» te muestra exactamente lo que ve él.'},
    {ic:'chat',t:'Casos, historial y atajos',p:'Los pedidos del cliente llegan a «Casos» (las alergias suben de prioridad) y tenés respuestas rápidas con los datos ya cargados. Cada viaje guarda su historial y cada familia sus notas internas.',tip:'Con Ctrl+K (⌘K en Mac) buscás cualquier cliente, ficha, caso o restaurante.'}
  ];
  var c=client(UI.cid)||{}, mode=c.mode==='view'?'Tu agencia arma la agenda y la va completando; vos mirás, marcás favoritos y avisás si querés cambios.':c.mode==='auto'?'Armás tus comidas vos mismo, y la agencia está para ayudarte si lo necesitás.':'Vos proponés las comidas que te gustan y la agencia hace las reservas.';
  return [
    {ic:'calendar',t:'Tu agenda de comidas',p:'Acá está tu viaje día por día, con el parque y las comidas de cada jornada. '+mode},
    {ic:'utensils',t:'Restaurantes y favoritos',p:'En «Restaurantes» ves fotos, menú, horarios y precios de cada lugar. Tocá el corazón para marcar favoritos de cada viajero: la agencia los tiene en cuenta.',tip:hasDest(c,'wdw')?'«Buscar platos» te deja encontrar un plato en todos los menús de Disney.':''},
    {ic:'shield',t:'Alergias y preferencias',p:'En «Mi viaje» completá el formulario con alergias, presupuesto y gustos. Ahí también tenés una tarjeta en inglés para mostrar en el restaurante.',tip:'Avisá siempre la alergia al reservar y al mozo: esta app no garantiza que un plato sea seguro.'},
    {ic:'check',t:'Cómo va cada comida',p:'Una comida pasa de «Idea» a «Para reservar» y a «Reservada». Cuando está reservada queda con su hora y número de confirmación; si necesitás cambiarla, pedilo desde ahí y la agencia lo gestiona.'},
    ].concat((docsVisible(c)||payVisible(c))?[{ic:'ticket',t:'Tus reservas y pagos',p:'En «Mi viaje» está «Mis reservas y comprobantes»: las reservas que la agencia ya confirmó, con su número de confirmación y el PDF para abrir.'+(payVisible(c)?' En «Mis pagos» ves cuánto pagaste, lo que falta y la fecha de cada cuota.':''),tip:'Guardá los comprobantes a mano durante el viaje. Si algo no coincide, avisale a la agencia desde «Pedidos».'}]:[]).concat([
    {ic:'chat',t:'¿Dudas? Preguntale a la agencia',p:'En «Pedidos» ves tus consultas y las respuestas. En cada restaurante y plato hay un botón para preguntar directo.',tip:'Los menús y precios pueden cambiar: confirmá siempre al reservar. Podés volver a ver esta guía con el botón «?» de arriba.'}
  ]);
}
function tourKey(){ return UI.role==='agus'?'agus':'c:'+((client(UI.cid)||{}).token||UI.cid); }
function tourHtml(){
  var T=UI.tour, st=T.steps[T.i], last=T.i===T.steps.length-1;
  return '<div class="mask" data-close="1"><div class="modal tour" role="dialog" aria-label="Cómo funciona"><button class="x" data-tourskip="1" aria-label="Cerrar">'+I('x')+'</button><div class="pad">'+
   '<div class="touric">'+I(st.ic)+'</div><span class="eyebrow">'+(T.role==='agus'?'Guía para la agencia':'Guía de uso')+' · '+(T.i+1)+' de '+T.steps.length+'</span>'+
   '<h3 class="tourt">'+esc(st.t)+'</h3><p class="tourp">'+esc(st.p)+'</p>'+(st.tip?'<div class="tourtip">'+I('sparkles')+'<span>'+esc(st.tip)+'</span></div>':'')+
   '<div class="tourdots">'+T.steps.map(function(_,i){ return '<button class="tdot'+(i===T.i?' on':'')+'" data-tourgo="'+i+'" aria-label="Paso '+(i+1)+'"></button>'; }).join('')+'</div>'+
   '<div class="row between" style="margin-top:16px"><button class="btn line" '+(last?'data-tourskip="1">Cerrar':(T.i?'data-tourgo="'+(T.i-1)+'">Atrás':'data-tourskip="1">Saltear'))+'</button><button class="btn" '+(last?'data-tourskip="1">¡Listo!':'data-tourgo="'+(T.i+1)+'">Siguiente')+'</button></div></div></div></div>';
}
function openTour(step){
  UI.tour={role:UI.role==='agus'?'agus':'cliente',i:step||0}; UI.tour.steps=tourSteps(UI.tour.role); tourMark(tourKey()); showModal(tourHtml());
}
function tourDraw(i){ UI.tour.i=Math.max(0,Math.min(UI.tour.steps.length-1,i)); showModal(tourHtml()); }
function maybeTour(){
  if(/notour/.test(location.search)||document.getElementById('modalRoot')) return;
  var ok=(UI.role==='agus'&&UI.route==='panel')||(UI.role==='cliente'&&UI.route==='portal'&&UI.cid&&UI.unlocked[UI.cid]&&!UI.preview);
  if(!ok||tourSeen(tourKey())) return;
  tourMark(tourKey()); setTimeout(function(){ if(!document.getElementById('modalRoot')) openTour(0); },400);
}
CLICK.push(
 {a:'data-tour',present:1, f:function(){ openTour(0); }},
 {a:'data-tourgo', f:function(v){ tourDraw(+v); }},
 {a:'data-tourskip',present:1, f:function(){ closeModal(); }}
);
document.addEventListener('keydown',function(e){ if(!document.querySelector('.modal.tour')||!UI.tour) return; if(e.key==='ArrowRight'){ tourDraw(UI.tour.i+1); } else if(e.key==='ArrowLeft'){ tourDraw(UI.tour.i-1); } });
