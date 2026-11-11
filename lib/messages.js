/* Mensajes listos para WhatsApp, con los datos del cliente ya cargados. La agente los puede editar antes de copiarlos. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Messages=factory(); })(typeof self!=='undefined'?self:this,function(){
  var KINDS=[['bienvenida','Bienvenida con link y código'],['datos','Pedir alergias y preferencias'],['agenda','Agenda lista para revisar'],['apertura','Aviso de apertura de reservas'],['confirmacion','Reservas confirmadas'],['alergias','Recordatorio de alergias'],['prevuelo','Antes de viajar']];
  function first(n){ return String(n||'').trim(); }
  function build(kind,x){
    var hi='Hola '+first(x.name)+'! ', sign='\n\n'+(x.agency||'');
    switch(kind){
      case 'bienvenida': return hi+'Armé tu planificador de viaje. Entrá con este link:\n'+x.link+'\nTu código de acceso: '+x.pin+'\n\nAhí vas a ver tu agenda, los restaurantes, la guía de alergias y podés mandarme pedidos.'+sign;
      case 'datos': return hi+'Para armarte las comidas del viaje necesito conocerlos mejor. Entrá a tu link ('+x.link+'), tocá «Mi viaje» y completá el «Formulario»: quiénes viajan, alergias o dietas, qué tipo de comida les gusta y si hay algún cumpleaños o fecha especial.\nCódigo de acceso: '+x.pin+'\nEs rápido y me ayuda a no equivocarme con lo importante.'+sign;
      case 'agenda': return hi+'Te dejé lista la agenda de comidas para que la revises: '+x.link+'\nMirala con calma y contame qué cambiarías. Los restaurantes marcados «Idea» todavía no están reservados; cuando abra la ventana de reservas los voy confirmando.'+sign;
      case 'apertura': { var wd=x.wdw!==false, tail=(x.hard&&x.hard.length?'\nEmpiezo por los más difíciles: '+x.hard.join(', ')+'.':'')+'\nApenas las confirme te paso los números y horarios.';
        if(wd&&!x.uor) return hi+'Te aviso que las reservas de comidas de tu viaje ('+x.start+' al '+x.end+') abren el '+x.openDate+' a las '+x.openTime+' hs ('+x.tz+').'+tail+sign;
        var o=[]; if(wd) o.push('Disney: las reservas de comidas abren el '+x.openDate+' a las '+x.openTime+' hs ('+x.tz+').'); if(x.uor) o.push('Universal: no hay un día de apertura fijo. '+(x.uorText||'Se reserva con anticipación, online o por teléfono.'));
        return hi+'Te cuento cómo van las reservas de comidas de tu viaje ('+x.start+' al '+x.end+'):\n'+o.map(function(t){return '• '+t;}).join('\n')+tail+sign; }
      case 'confirmacion': return hi+(x.reserved&&x.reserved.length?'Ya tengo confirmadas estas reservas:\n'+x.reserved.map(function(r){ return '• '+r.when+' · '+r.meal+': '+r.name+(r.time?' '+r.time+' hs':'')+(r.conf?' (conf. '+r.conf+')':''); }).join('\n')+'\n\nPodés verlas también en tu link: '+x.link:'Todavía no tengo reservas confirmadas para tu viaje. Apenas las haga te escribo.')+sign;
      case 'alergias': return hi+'Sobre las alergias'+(x.allergies?' ('+x.allergies+')':'')+': ya las tengo anotadas para pedir las reservas. En tu link, «Mi viaje» → «Alergias», tenés una tarjeta en inglés para mostrar en el restaurante. Avisá siempre al llegar y confirmá con el mozo antes de comer. Ningún restaurante puede garantizar que un plato esté 100 % libre de alérgenos.'+sign;
      case 'prevuelo': { var apps=(x.wdw!==false&&x.uor)?'las apps My Disney Experience y Universal Orlando':(x.wdw===false?'la app oficial de Universal Orlando':'la app My Disney Experience'); return hi+'Falta poco para el viaje! Dos cosas para ir haciendo: descargá '+apps+' y vinculá tu reserva de hotel, tus entradas y las reservas de comidas con sus números de confirmación; y revisá tu agenda en '+x.link+'\nCualquier cambio, escribime.'+sign; }
    }
    return '';
  }
  return {KINDS:KINDS,build:build};
});
