/* Seguimiento del cliente: etapa comercial, próximo contacto, recontacto, checklist de documentación y postviaje.
   Sin dependencias del navegador (se prueba directo en Node).
   Familia: f.next={date,note}. Viaje: c.stage, c.docs=[{id,label,done,note,custom}], c.post={rating,liked,improve,referral,at}.
   El checklist NO guarda números de documentos: solo si cada cosa está lista. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Followup=factory(); })(typeof self!=='undefined'?self:this,function(){
  var STAGES=[['consulta','Consulta'],['cotizado','Cotizado'],['sena','Seña pagada'],['confirmado','Confirmado'],['viajando','En viaje'],['postviaje','Postviaje']];
  var REFERRAL=[['pendiente','Todavía no le pedí'],['pedido','Ya le pedí referidos'],['no','No corresponde']];
  var RECONTACT_DAYS=300;   // ~10 meses desde que volvieron
  var DOCS_DAYS=45;         // avisar con 45 días de anticipación si falta documentación
  function isIso(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s||''); }
  function days(a,b){ return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/864e5); }
  function stageLabel(k){ var s=STAGES.filter(function(x){return x[0]===k})[0]; return s?s[1]:''; }
  /* etapa efectiva: manda el calendario cuando ya viajó o está viajando; antes de eso, la que eligió la agencia o una sugerida */
  function stage(c,today,paidSomething){
    if(c.end&&c.end<today) return 'postviaje';
    if(c.start&&c.start<=today) return 'viajando';
    var k=c.stage; if(k&&STAGES.some(function(x){return x[0]===k})&&k!=='viajando'&&k!=='postviaje') return k;
    return paidSomething?'sena':'consulta';
  }
  /* ---- próximo contacto ---- */
  function cleanNext(n){ if(!n||!isIso(n.date)) return null; return {date:n.date,note:String(n.note||'').trim().slice(0,200)}; }
  function nextState(f,today){ var n=cleanNext(f&&f.next); if(!n) return null; var d=days(today,n.date); return {date:n.date,note:n.note,days:d,late:d<0,today:d===0,soon:d>0&&d<=7}; }
  /* ---- recontacto: no tienen viaje próximo y el último terminó hace tiempo ---- */
  function recontact(trips,today,hasNext){
    if(hasNext||!trips||!trips.length) return null;
    if(trips.some(function(c){ return c.end>=today; })) return null;
    var last=trips.reduce(function(m,c){ return c.end>m?c.end:m; },'0000-00-00'); var d=days(last,today);
    return d>=RECONTACT_DAYS?{since:last,days:d,months:Math.round(d/30.4)}:null;
  }
  /* ---- checklist de documentación ---- */
  function defaultDocs(c){
    var kids=(c.travelers||[]).some(function(t){return t.type==='niño'||t.type==='bebé'||t.type==='menor'});
    var L=[['pasaportes','Pasaportes vigentes de todos los viajeros (con vigencia suficiente para la fecha de regreso)'],['ingreso','Autorización o visa de ingreso al país, según nacionalidad (confirmar requisitos actuales)'],['seguro','Seguro de viaje contratado']];
    if(kids) L.push(['menores','Autorización de viaje de menores, si corresponde']);
    L.push(['pasajes','Pasajes aéreos emitidos'],['hotel','Hotel confirmado'],['traslados','Traslados o auto de alquiler'],['entradas','Entradas a parques'],['alergias','Alergias y dietas reconfirmadas con el cliente']);
    return L.map(function(x){ return {id:x[0],label:x[1],done:false,note:''}; });
  }
  /* agrega los que falten sin pisar lo que ya marcó la agencia (y respeta los que borró: no vuelven) */
  function docs(c){ var cur=c.docs; if(!cur) return defaultDocs(c); return cur; }
  function docsSummary(c){ var L=docs(c), done=L.filter(function(x){return x.done}).length; return {total:L.length,done:done,pending:L.length-done,pct:L.length?Math.round(done*100/L.length):0}; }
  function docsAlert(c,today){
    if(!c.start||c.start<today) return null; var d=days(today,c.start); if(d>DOCS_DAYS) return null;
    var s=docsSummary(c); if(!s.pending) return null; return {days:d,pending:s.pending,total:s.total};
  }
  /* ---- postviaje ---- */
  function cleanPost(p){ if(!p) return null; var r=Math.round(+p.rating); if(!(r>=1&&r<=5)) r=0;
    var ref=REFERRAL.some(function(x){return x[0]===p.referral})?p.referral:'pendiente';
    return {rating:r,liked:String(p.liked||'').trim().slice(0,400),improve:String(p.improve||'').trim().slice(0,400),referral:ref,at:p.at||0}; }
  function postAlert(c,today){ if(!c.end||c.end>=today||c.post) return null; var d=days(c.end,today); return d>=2&&d<=60?{days:d}:null; }
  /* ---- búsqueda por nombre, código (FAM-0001, fam 1, 1) y otros datos ---- */
  function norm(s){ return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
  function codeNum(q){ var m=/^\s*(?:fam)?[\s\-_#]*0*(\d{1,6})\s*$/i.exec(String(q||'')); return m?+m[1]:null; }
  function match(q,fields,code){
    var t=norm(q).trim(); if(!t) return true;
    var n=codeNum(q); if(n!==null&&code){ var cn=+String(code).replace(/\D/g,''); if(cn===n) return true; }
    var hay=norm(fields.join(' ')); return t.split(/\s+/).every(function(w){ return hay.indexOf(w)>=0; });
  }
  return {STAGES:STAGES,REFERRAL:REFERRAL,RECONTACT_DAYS:RECONTACT_DAYS,DOCS_DAYS:DOCS_DAYS,stageLabel:stageLabel,stage:stage,cleanNext:cleanNext,nextState:nextState,recontact:recontact,defaultDocs:defaultDocs,docs:docs,docsSummary:docsSummary,docsAlert:docsAlert,cleanPost:cleanPost,postAlert:postAlert,codeNum:codeNum,match:match,days:days};
});
