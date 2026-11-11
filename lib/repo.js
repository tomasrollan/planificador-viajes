/* Capa de datos. Hoy persiste en localStorage; mañana se cambia el "storage" por Supabase sin tocar la UI.
   Todo registro lleva agency_id (multi-agencia desde el modelo). El estado tiene schema versionado y migraciones. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Repo=factory(); })(typeof self!=='undefined'?self:this,function(){
  var SCHEMA=7, DEFAULT_AGENCY='ag_default';
  /* migraciones: MIGRATIONS[n] lleva el estado de la versión n a la n+1. Nunca se edita una vieja: se agrega una nueva. */
  var MIGRATIONS={
    3:function(s){
      s.agency=s.agency||{name:'Agencia',tagline:''};
      s.agency.id=s.agency.id||DEFAULT_AGENCY; s.agency.tz=s.agency.tz||'America/Argentina/Buenos_Aires'; s.agency.tzName=s.agency.tzName||'Argentina';
      (s.clients||[]).forEach(function(c){ c.agency_id=c.agency_id||s.agency.id; });
      (s.cases||[]).forEach(function(k){ k.agency_id=k.agency_id||s.agency.id; });
      s.v=4; return s;
    },
    4:function(s){                                         // v5: plantillas de agenda por agencia + formulario de ingreso y teléfono por cliente
      s.templates=s.templates||[];
      (s.clients||[]).forEach(function(c){ if(c.intake===undefined) c.intake=null; if(c.phone===undefined) c.phone=''; });
      s.v=5; return s;
    },
    5:function(s){                                         // v6: destinos por viaje (Disney / Universal), estadías por destino, hotel y tarjeta de comidas de Universal
      (s.clients||[]).forEach(function(c){ if(!c.dests||!c.dests.length) c.dests=['wdw']; if(c.hotelU===undefined) c.hotelU=''; if(c.cardUSD===undefined) c.cardUSD=0; if(c.segs===undefined) c.segs=null; });
      s.v=6; return s;
    },
    6:function(s){                                         // v7: ficha por cliente/familia (código, gustos, notas, viajes anteriores); cada viaje apunta a su familia (famId)
      s.families=s.families||[]; s.famSeq=s.famSeq||0; var byPhone={};
       s.families.forEach(function(f){ f.agency_id=f.agency_id||(s.agency&&s.agency.id)||DEFAULT_AGENCY; });
      function pk(p){ var d=String(p||'').replace(/\D/g,''); return d.length>=10?d.slice(-10):(d.length>=8?d:''); }   // mismo teléfono = misma familia
      s.families.forEach(function(f){ var k=pk(f.phone); if(k) byPhone[k]=f; });
      (s.clients||[]).forEach(function(c){ if(c.famId) return; var k=pk(c.phone), f=k?byPhone[k]:null;
        if(!f){ s.famSeq++; f={id:'fam'+s.famSeq,agency_id:c.agency_id||(s.agency&&s.agency.id)||DEFAULT_AGENCY,code:'FAM-'+('000'+s.famSeq).slice(-4),name:String(c.name||'').replace(/\s*\(copia\)$/i,''),phone:c.phone||'',email:'',tags:[],personality:'',prefs:'',notes:[],past:[],created:Date.now()}; s.families.push(f); if(k) byPhone[k]=f; }
        c.famId=f.id; });
      s.v=7; return s;
    }
  };
  function migrate(s){
    if(!s||typeof s!=='object') return null;
    if(!s.v) s.v=3;                                       // estados anteriores a la versión explícita
    if(s.v>SCHEMA) return null;                           // guardado por una versión más nueva: no lo pisamos
    var g=0; while(s.v<SCHEMA&&g++<20){ var f=MIGRATIONS[s.v]; if(!f) return null; s=f(s); }
    return s;
  }
  /* copia de respaldo: se exporta con marca de app y versión; al importar se valida y migra (nunca se acepta una versión más nueva) */
  var APP='agus-planner';
  function exportJSON(s,now){ return JSON.stringify({app:APP,schema:SCHEMA,exported:new Date(now||Date.now()).toISOString(),state:s},null,1); }
  function parseBackup(text){
    var o; try{ o=JSON.parse(text); }catch(e){ return {error:'El archivo no es un JSON válido.'}; }
    if(!o||o.app!==APP||!o.state) return {error:'Este archivo no es una copia de este planificador.'};
    var st=o.state; if(st&&st.v>SCHEMA) return {error:'La copia es de una versión más nueva del planificador.'};
    var m=migrate(JSON.parse(JSON.stringify(st)));
    if(!valid(m)) return {error:'La copia está incompleta o dañada.'};
    return {state:m,exported:o.exported||null,clients:m.clients.length,cases:m.cases.length};
  }
  function valid(s){ return !!(s&&Array.isArray(s.clients)&&Array.isArray(s.cases)&&s.agency); }
  /* storage: {get(key),set(key,value)}; demo(): estado inicial */
  function create(o){
    var state=null;
    return {
      SCHEMA:SCHEMA,
      load:function(){ var raw=null; try{ raw=o.storage.get(o.key); }catch(e){ raw=null; }
        var s=raw?migrate(JSON.parse(JSON.stringify(raw))):null;
        if(!valid(s)) s=migrate(o.demo()); state=s; return state; },
      get:function(){ return state; },
      set:function(s){ state=s; },
      save:function(){ try{ o.storage.set(o.key,state); }catch(e){} },
      reset:function(){ state=migrate(o.demo()); this.save(); return state; },
      client:function(id){ return state.clients.filter(function(c){return c.id===id})[0]; },
      clientByToken:function(t){ return state.clients.filter(function(c){return c.token===t})[0]; },
      kase:function(id){ return state.cases.filter(function(k){return k.id===id})[0]; },
      casesOf:function(cid){ return state.cases.filter(function(k){return k.cid===cid}); },
      /* alta de caso: prio = [rótulo, clase, horas de SLA] */
      addCase:function(x,now,uid,prio){ state.seq=(state.seq||1000)+1; var t=now, p=prio[x.priority||'normal'];
        var k={id:uid(),agency_id:state.agency.id,num:state.seq,cid:x.cid,title:x.title,type:x.type||'Consulta',priority:x.priority||'normal',status:'nuevo',created:t,updated:t,due:t+p[2]*36e5,source:x.source||'cliente',ref:x.ref||null,thread:[]};
        if(x.text) k.thread.push({id:uid(),by:x.source==='agencia'?'agus':'cliente',kind:'msg',text:x.text,at:t});
        state.cases.unshift(k); this.save(); return k; },
      addMsg:function(k,by,kind,text,now,uid){ k.thread.push({id:uid(),by:by,kind:kind,text:text,at:now}); if(kind!=='nota') k.updated=now; },
      addClient:function(c){ c.agency_id=state.agency.id; state.clients.push(c); this.save(); return c; }
    };
  }
  return {SCHEMA:SCHEMA,migrate:migrate,valid:valid,create:create,exportJSON:exportJSON,parseBackup:parseBackup,DEFAULT_AGENCY:DEFAULT_AGENCY};
});
