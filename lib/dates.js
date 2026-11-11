/* Fechas y zonas horarias. Todo en "días calendario" (YYYY-MM-DD) para que no dependa de la zona del dispositivo.
   Se usa en el navegador (window.Dates) y en tests de Node (require). */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Dates=factory(); })(typeof self!=='undefined'?self:this,function(){
  var DEFAULT_TZ='America/Argentina/Buenos_Aires', PARK_TZ='America/New_York';
  var MS=864e5;
  function utc(iso){ return Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10)); }
  function iso(ms){ var d=new Date(ms); return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0'); }
  function addDays(s,n){ return iso(utc(s)+n*MS); }
  function diffDays(a,b){ return Math.round((utc(b)-utc(a))/MS); }          // b - a
  function nights(a,b){ return Math.max(1,diffDays(a,b)); }
  function dow(s){ return new Date(utc(s)).getUTCDay(); }                      // 0=domingo
  function dowMon(s){ return (dow(s)+6)%7; }                                   // 0=lunes
  function fmt(s,o){ return new Date(utc(s)+12*36e5).toLocaleDateString('es-AR',Object.assign({timeZone:'UTC'},o)); }
  function cap(t){ return t.charAt(0).toUpperCase()+t.slice(1); }
  function full(s,long){ return fmt(s,long?{weekday:'long',day:'numeric',month:'long'}:{weekday:'short',day:'numeric',month:'short'}); }
  function dayName(s){ return cap(fmt(s,{weekday:'long'})); }
  function dayLong(s){ return fmt(s,{day:'numeric',month:'long'}); }
  function short(s){ return fmt(s,{day:'numeric',month:'short',year:'numeric'}); }
  /* fecha de hoy (YYYY-MM-DD) en una zona horaria dada */
  function todayIn(tz,now){ return new Intl.DateTimeFormat('en-CA',{timeZone:tz||DEFAULT_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now==null?Date.now():now)); }
  function daysTo(s,today){ return diffDays(today,s); }                         // >0 futuro
  function ageText(s,today){ var n=-daysTo(s,today); return n<=0?'hoy':(n===1?'hace 1 día':'hace '+n+' días'); }
  /* instante (ms UTC) en que en la zona `tz` son las hh:mm del día `s`; tolera el cambio de horario de verano */
  function instantAt(s,hh,mm,tz){
    var y=+s.slice(0,4),m=+s.slice(5,7)-1,d=+s.slice(8,10);
    var guess=Date.UTC(y,m,d,hh,mm||0), f=new Intl.DateTimeFormat('en-US',{timeZone:tz,hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
    for(var k=0;k<3;k++){ var p={}; f.formatToParts(new Date(guess)).forEach(function(x){ p[x.type]=x.value; });
      var seen=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute); var want=Date.UTC(y,m,d,hh,mm||0); if(seen===want) return guess; guess+=want-seen; }
    return guess;
  }
  /* "6:00 AM en Florida" -> hora local de la agencia. Devuelve {time:'8:00', dayShift:-1|0|1} */
  function parkToLocal(s,hh,mm,tz){
    tz=tz||DEFAULT_TZ; var t=instantAt(s,hh,mm,PARK_TZ);
    var tm=new Intl.DateTimeFormat('es-AR',{timeZone:tz,hour:'numeric',minute:'2-digit',hourCycle:'h23'}).format(new Date(t)).replace(/^0(?=\d:)/,'');
    var ld=todayIn(tz,t); return {time:tm,dayShift:diffDays(s,ld),instant:t};
  }
  /* ¿ya abrió la ventana de reservas (6:00 AM de Florida del día `openIso`)? */
  function windowOpened(openIso,now){ return (now==null?Date.now():now)>=instantAt(openIso,6,0,PARK_TZ); }
  return {DEFAULT_TZ:DEFAULT_TZ,PARK_TZ:PARK_TZ,addDays:addDays,diffDays:diffDays,nights:nights,dow:dow,dowMon:dowMon,full:full,dayName:dayName,dayLong:dayLong,short:short,todayIn:todayIn,daysTo:daysTo,ageText:ageText,instantAt:instantAt,parkToLocal:parkToLocal,windowOpened:windowOpened};
});
