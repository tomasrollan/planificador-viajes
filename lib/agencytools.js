/* Herramientas de la agencia, sin dependencias del navegador (se prueban directo en Node):
   - parseIntake: lee un mensaje pegado de WhatsApp y propone los datos del viaje
   - macros / fill: respuestas rápidas con los datos del caso ya cargados
   - rank: búsqueda por texto para el buscador global (sin tildes, por palabras)
   - freshness: antigüedad de los datos del catálogo (menús, horarios, transporte, enlaces)
   - logAdd: historial por cliente */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.AgencyTools=factory(); })(typeof self!=='undefined'?self:this,function(){
  function norm(t){ return String(t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  var MONTHS={enero:1,ene:1,febrero:2,feb:2,marzo:3,mar:3,abril:4,abr:4,mayo:5,may:5,junio:6,jun:6,julio:7,jul:7,agosto:8,ago:8,septiembre:9,setiembre:9,sep:9,set:9,octubre:10,oct:10,noviembre:11,nov:11,diciembre:12,dic:12};
  var NUMW={un:1,una:1,uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8};
  var MON_RE='(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|setiembre|sep|set|octubre|oct|noviembre|nov|diciembre|dic)';
  function pad(n){ return (n<10?'0':'')+n; }
  function iso(y,m,d){ return y+'-'+pad(m)+'-'+pad(d); }
  function validDay(y,m,d){ var t=new Date(Date.UTC(y,m-1,d)); return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d; }
  function num(s){ s=String(s).toLowerCase(); return NUMW[s]!==undefined?NUMW[s]:parseInt(s,10); }

  /* ---- fechas: devuelve {start,end,span} o null. Sin año explícito, toma la próxima ocurrencia desde hoy. ---- */
  function parseDates(text,today){
    var t=norm(text), ty=+today.slice(0,4), tm=+today.slice(5,7), td=+today.slice(8,10), m, res=null;
    function nextYear(mo,d){ var y=ty; if(mo<tm||(mo===tm&&d<td)) y++; return y; }
    function yr(s){ var y=+s; return y<100?2000+y:y; }
    function mk(s,e){ if(!s||!e) return null; return {start:s,end:e}; }
    // ISO: 2027-07-12 ... 2027-07-20
    var isoAll=[],r=/(\d{4})-(\d{2})-(\d{2})/g; while((m=r.exec(t))){ if(validDay(+m[1],+m[2],+m[3])) isoAll.push(iso(+m[1],+m[2],+m[3])); }
    if(isoAll.length>=2){ return {start:isoAll[0],end:isoAll[1]}; }
    // "12 de julio al 20 de agosto (de 2027)"
    m=new RegExp('(\\d{1,2})\\s*(?:de\\s+)?'+MON_RE+'\\s*(?:de\\s+)?(\\d{4})?\\s*(?:al|hasta el|hasta|a|-)\\s*(?:el\\s+)?(\\d{1,2})\\s*(?:de\\s+)?'+MON_RE+'(?:\\s*(?:de|del)?\\s*(\\d{4}))?').exec(t);
    if(m){ var d1=+m[1],m1=MONTHS[m[2]],d2=+m[4],m2=MONTHS[m[5]]; var y1=m[3]?+m[3]:(m[6]?+m[6]-(m2<m1?1:0):nextYear(m1,d1)), y2=m[6]?+m[6]:(m2<m1?y1+1:y1);
      if(validDay(y1,m1,d1)&&validDay(y2,m2,d2)) res=mk(iso(y1,m1,d1),iso(y2,m2,d2)); }
    // "del 12 al 20 de julio (de 2027)"
    if(!res){ m=new RegExp('(\\d{1,2})\\s*(?:al|hasta el|hasta|a|-)\\s*(?:el\\s+)?(\\d{1,2})\\s*(?:de\\s+)'+MON_RE+'(?:\\s*(?:de|del)?\\s*(\\d{4}))?').exec(t);
      if(m){ var a=+m[1],b=+m[2],mo=MONTHS[m[3]],y=m[4]?+m[4]:nextYear(mo,a); if(validDay(y,mo,a)&&validDay(y,mo,b)&&b>=a) res=mk(iso(y,mo,a),iso(y,mo,b)); } }
    // "12/7/2027 al 20/7/2027", "12/07 al 20/07"
    if(!res){ m=/(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?\s*(?:al|hasta el|hasta|a|-)\s*(?:el\s+)?(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?/.exec(t);
      if(m){ var da=+m[1],ma=+m[2],db=+m[4],mb=+m[5], ya=m[3]?yr(m[3],ma,da):null, yb=m[6]?yr(m[6],mb,db):null;
        if(ya===null&&yb===null){ ya=nextYear(ma,da); yb=mb<ma?ya+1:ya; } else if(yb===null){ yb=mb<ma?ya+1:ya; } else if(ya===null){ ya=mb<ma?yb-1:yb; }
        if(validDay(ya,ma,da)&&validDay(yb,mb,db)) res=mk(iso(ya,ma,da),iso(yb,mb,db)); } }
    if(!res) return null;
    if(res.end<res.start) return null;
    return res;
  }

  /* ---- teléfono: primera secuencia de 8+ dígitos que no sea una fecha ---- */
  function parsePhone(text){
    var s=String(text||'').replace(/\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/g,' ').replace(/\d{4}-\d{2}-\d{2}/g,' ');
    var m=/(\+?\d[\d\s().-]{6,}\d)/.exec(s); if(!m) return '';
    var d=m[1].replace(/\D/g,''); if(d.length<8||d.length>15) return '';
    return m[1].replace(/\s+/g,' ').trim();
  }

  /* ---- viajeros: adultos y chicos ---- */
  function parseTravelers(text){
    var t=norm(text), ad=0, ch=0, m;
    var W='(\\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho)';
    var ra=new RegExp(W+'\\s+(?:adultos?|grandes)','g'); while((m=ra.exec(t))) ad+=num(m[1]);
    var rc=new RegExp(W+'\\s+(?:chicos?|ninos?|ninas?|nenes?|nenas?|menores|hijos?|hijas?|peques?|bebes?)','g'); while((m=rc.exec(t))) ch+=num(m[1]);
    if(!ad&&!ch&&/(?:una|la)\s+pareja/.test(t)) ad=2;
    if(!ad&&!ch){ m=new RegExp('somos\\s+'+W+'(?![\\d/])').exec(t); if(m){ ad=num(m[1]); } }
    return {adults:ad,kids:ch};
  }

  function parseName(text){
    var m=/familia\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'-]+(?:\s+(?:de\s+)?[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ'-]+)?)/.exec(text);
    if(m) return 'Familia '+m[1].trim().replace(/\s+(de)$/,'');
    m=/[Ss]omos\s+(?:los\s+|las\s+)?([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)\b/.exec(text); if(m&&!/^(Hola|Somos|Vamos|Quiero|Queremos)$/.test(m[1])) return 'Familia '+m[1];
    m=/(?:[Ss]oy|[Mm]e llamo|[Mm]i nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/.exec(text);
    if(m) return m[1];
    if(/pareja/i.test(text)){ var mp=/pareja\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)/.exec(text); return mp?'Pareja '+mp[1]:'Pareja'; }
    return '';
  }

  function parseDests(text){
    var t=norm(text), wdw=/disney|magic kingdom|epcot|animal kingdom|hollywood studios|walt disney|mickey/.test(t), uor=/universal|islands of adventure|epic universe|volcano bay|harry potter|hogwarts/.test(t);
    var d=[]; if(wdw) d.push('wdw'); if(uor) d.push('uor'); return d;
  }

  /* hotels: [{n:'Universal Cabana Bay Beach Resort',k:['cabana bay'],dest:'uor'}] */
  function parseHotel(text,hotels){
    var t=norm(text); for(var i=0;i<(hotels||[]).length;i++){ var h=hotels[i]; for(var j=0;j<h.k.length;j++){ if(t.indexOf(norm(h.k[j]))>=0) return {name:h.n,dest:h.dest}; } } return null;
  }

  function parsePlan(text){
    var t=norm(text); if(!/plan de comidas|dining plan|plan de comida|con plan/.test(t)) return '';
    if(/premium|deluxe/.test(t)) return 'premium'; return 'base';
  }

  /* frases con alergias o dietas: no se asignan a un viajero (no se sabe de quién son), van a la nota */
  function parseAllergyLines(text){
    var out=[]; String(text||'').split(/(?<=[.!?\n])\s+|\n/).forEach(function(s){ s=s.trim(); if(s&&/al[eé]rgic|alergia|cel[ií]ac|intoleran|sin gluten|sin tacc|vegetarian|vegan|lactosa|man[ií]|frutos secos|mariscos/i.test(s)) out.push(s.replace(/\s+/g,' ')); });
    return out.slice(0,4);
  }

  /* o: {today:'2026-11-11', hotels:[...]} -> propuesta de datos y qué se detectó / qué falta */
  function parseIntake(text,o){
    o=o||{}; var today=o.today||'2026-01-01', txt=String(text||'');
    var dests=parseDests(txt), dates=parseDates(txt,today), tv=parseTravelers(txt), hotel=parseHotel(txt,o.hotels), plan=parsePlan(txt), phone=parsePhone(txt), name=parseName(txt), alg=parseAllergyLines(txt);
    var found=[],missing=[];
    (dests.length?found:missing).push('destino'); (dates?found:missing).push('fechas'); ((tv.adults||tv.kids)?found:missing).push('viajeros'); (name?found:missing).push('nombre'); (phone?found:missing).push('teléfono');
    if(hotel) found.push('hotel'); if(plan) found.push('plan de comidas');
    return {name:name,dests:dests,start:dates&&dates.start||'',end:dates&&dates.end||'',phone:phone,adults:tv.adults,kids:tv.kids,hotel:hotel,plan:plan,allergyLines:alg,found:found,missing:missing,hasAny:found.length>0};
  }

  /* ---- respuestas rápidas ---- */
  var MACROS=[
    ['recibido','Recibimos tu pedido','Hola {nombre}! Recibimos tu pedido y ya lo estamos viendo. Te respondo en cuanto tenga novedades.'],
    ['reservado','Ya reservé','Hola {nombre}! Ya reservé {restaurante}{cuando}{hora}.{conf} Te lo dejé cargado en tu agenda.'],
    ['hora_no','Horario no disponible','Hola {nombre}! Para {restaurante}{cuando} ese horario no está disponible. ¿Te sirve otro cercano? Si me pasás un rango te busco lo mejor que haya.'],
    ['cambio','Cambio confirmado','Hola {nombre}! Listo, hice el cambio{cuandoDe} y ya figura actualizado en tu agenda.'],
    ['alergia','Alergia cargada','Hola {nombre}! Dejé cargada la alergia en la reserva de {restaurante}. Igual avisale al mozo apenas lleguen y pedí hablar con el chef o el gerente si hace falta.'],
    ['dato','Pedir un dato','Hola {nombre}! Para avanzar necesito que me confirmes este dato: '],
    ['reviso','Lo reviso hoy','Hola {nombre}! Lo reviso y te aviso hoy mismo.'],
    ['espera','Estoy esperando la apertura','Hola {nombre}! Las reservas de {restaurante} todavía no abren. Apenas abran las intento y te cuento cómo salió.'],
    ['cierre','Cerrar el caso','Hola {nombre}! Doy por resuelto este pedido. Si necesitás algo más, escribime por acá.']
  ];
  /* v: {nombre, restaurante, fecha, hora, conf} (todo opcional). Lo que falta se reemplaza por un texto neutro. */
  function fill(text,v){
    v=v||{}; var cuando=v.fecha?' del '+v.fecha:'', hora=v.hora?' a las '+v.hora+' hs':'', conf=v.conf?' Número de confirmación: '+v.conf+'.':'';
    var map={nombre:v.nombre||'', restaurante:v.restaurante||'el restaurante', cuando:cuando, hora:hora, conf:conf, cuandoDe:v.fecha?' de '+v.fecha:''};
    return String(text).replace(/\{(\w+)\}/g,function(_,k){ return map[k]!==undefined?map[k]:''; }).replace(/ +([.,!?])/g,'$1').replace(/\s+\./g,'.').replace(/  +/g,' ').replace(/Hola ! /,'Hola! ');
  }
  function macros(){ return MACROS.map(function(m){ return {id:m[0],label:m[1],text:m[2]}; }); }

  /* ---- buscador: cada palabra tiene que aparecer; puntúa inicio de palabra y orden ---- */
  function rank(items,q,limit){
    var words=norm(q).split(/\s+/).filter(Boolean); if(!words.length) return items.slice(0,limit||8);
    var out=[]; items.forEach(function(it,idx){ var hay=norm(it.text||it.label||''), score=0, ok=true;
      for(var i=0;i<words.length;i++){ var p=hay.indexOf(words[i]); if(p<0){ ok=false; break; } score+=(p===0||hay.charAt(p-1)===' ')?10:3; if(norm(it.label||'').indexOf(words[i])===0) score+=6; }
      if(ok) out.push({it:it,score:score+(it.boost||0),idx:idx}); });
    out.sort(function(a,b){ return b.score-a.score||a.idx-b.idx; });
    return out.slice(0,limit||8).map(function(x){ return x.it; });
  }

  /* ---- antigüedad de datos: items [{k,label,at}] ; warn a partir de warnDays, bad a partir de badDays ---- */
  function daysBetween(a,b){ return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/864e5); }
  function freshness(items,today,warnDays,badDays){
    warnDays=warnDays||30; badDays=badDays||60;
    return items.map(function(it){ if(!it.at) return {k:it.k,label:it.label,at:'',days:null,level:'unknown'};
      var d=daysBetween(it.at,today), lv=d>badDays?'bad':d>warnDays?'warn':'ok'; return {k:it.k,label:it.label,at:it.at,days:d,level:lv}; });
  }

  /* ---- historial por cliente (queda en c.log, máximo 200 entradas; la más nueva primero) ---- */
  function logAdd(c,entry,now){
    if(!c) return; c.log=c.log||[]; c.log.unshift({at:now,by:entry.by||'agus',kind:entry.kind||'evento',t:String(entry.t||'').slice(0,400)});
    if(c.log.length>200) c.log.length=200;
  }

  return {norm:norm,parseDates:parseDates,parsePhone:parsePhone,parseTravelers:parseTravelers,parseName:parseName,parseDests:parseDests,parseHotel:parseHotel,parsePlan:parsePlan,parseAllergyLines:parseAllergyLines,parseIntake:parseIntake,macros:macros,fill:fill,rank:rank,freshness:freshness,daysBetween:daysBetween,logAdd:logAdd};
});
