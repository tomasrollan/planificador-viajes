/* Motor de sincronización con la nube (puro: la red y el almacenamiento entran por parámetro, así se prueba sin servidor).
   El estado de la app (S) se parte en registros: client / case / family (uno por cada uno) y meta (todo lo demás).
   Cada registro tiene una revisión (rev). Local-first: la app trabaja contra S y este motor reconcilia en segundo plano.
   - Subir: solo lo que cambió desde la última sincronización, con la rev base; si alguien más lo cambió, el servidor avisa y se fusiona.
   - Bajar: solo lo que cambió en el servidor; si lo local no tiene cambios se adopta, si los tiene se fusiona campo por campo. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Cloud=factory(); })(typeof self!=='undefined'?self:this,function(){
  var LISTS={clients:'client',cases:'case',families:'family'}, KINDS=['client','case','family','meta'], META_ID='state';
  var COUNTERS={seq:1,famSeq:1};

  function clone(x){ return x===undefined?undefined:JSON.parse(JSON.stringify(x)); }
  function canon(x){ if(x===undefined) return 'undefined'; if(x===null||typeof x!=='object') return JSON.stringify(x);
    if(Array.isArray(x)) return '['+x.map(canon).join(',')+']';
    return '{'+Object.keys(x).sort().map(function(k){ return JSON.stringify(k)+':'+canon(x[k]); }).join(',')+'}'; }
  function key(kind,id){ return kind+'/'+id; }
  function listOf(kind){ return Object.keys(LISTS).filter(function(l){ return LISTS[l]===kind; })[0]; }

  /* S -> {clave: json canónico} */
  function split(S){
    var out={};
    Object.keys(LISTS).forEach(function(l){ (S[l]||[]).forEach(function(r){ if(r&&r.id!==undefined) out[key(LISTS[l],r.id)]=canon(r); }); });
    var meta={}; Object.keys(S).forEach(function(k){ if(!LISTS[k]) meta[k]=S[k]; });
    out[key('meta',META_ID)]=canon(meta);
    return out;
  }
  function getRec(S,kind,id){
    if(kind==='meta'){ var m={}; Object.keys(S).forEach(function(k){ if(!LISTS[k]) m[k]=S[k]; }); return m; }
    return (S[listOf(kind)]||[]).filter(function(r){ return r.id===id; })[0];
  }
  function putRec(S,kind,id,data){
    if(kind==='meta'){ Object.keys(S).forEach(function(k){ if(!LISTS[k]&&!(k in data)) delete S[k]; }); Object.keys(data).forEach(function(k){ S[k]=clone(data[k]); }); return; }
    var l=listOf(kind); S[l]=S[l]||[]; var i=-1; S[l].forEach(function(r,n){ if(r.id===id) i=n; });
    var d=clone(data); if(i>=0) S[l][i]=d; else if(kind==='case') S[l].unshift(d); else S[l].push(d);
  }
  function delRec(S,kind,id){ var l=listOf(kind); if(!l) return; S[l]=(S[l]||[]).filter(function(r){ return r.id!==id; }); }

  /* fusión campo por campo (3 vías): si solo cambió uno de los lados, gana ese; si cambiaron los dos, gana el local,
     salvo listas (historial, hilos de mensajes, notas): se unen sin perder nada, y los contadores (seq) se quedan con el mayor. */
  function mergeLists(m,t){
    var seen={}, out=[]; function k(x){ return x&&typeof x==='object'&&x.id!==undefined?'id:'+x.id:canon(x); }
    t.concat(m).forEach(function(x){ var kk=k(x); if(!seen[kk]){ seen[kk]=1; out.push(clone(x)); } });
    if(out.every(function(x){ return x&&typeof x.at==='number'; })) out.sort(function(a,b){ return a.at-b.at; });
    return out;
  }
  function merge3(b,m,t,kind){
    b=b||{}; var out={}, keys={}; [b,m,t].forEach(function(o){ Object.keys(o||{}).forEach(function(k){ keys[k]=1; }); });
    Object.keys(keys).forEach(function(k){
      var cb=canon(b[k]), cm=canon(m[k]), ct=canon(t[k]), v;
      if(cm===ct) v=m[k];
      else if(cm===cb) v=t[k];
      else if(ct===cb) v=m[k];
      else if(Array.isArray(m[k])&&Array.isArray(t[k])) v=mergeLists(m[k],t[k]);
      else v=m[k];
      if(kind==='meta'&&COUNTERS[k]) v=Math.max(+m[k]||0,+t[k]||0);
      if(v!==undefined) out[k]=clone(v);
    });
    return out;
  }

  function parseKey(k){ var i=k.indexOf('/'); return [k.slice(0,i),k.slice(i+1)]; }

  /* o: {get():S, transport:{pull(sinceISO)->rows, push(items)->results}, onChange(), base, cursor, log} */
  function createEngine(o){
    var base=o.base||{}, cursor=o.cursor||null, busy=false, lastError=null;
    function S(){ return o.get(); }
    function changed(){ if(o.onChange) o.onChange(); }

    function pending(){
      var cur=split(S()), n=0;
      Object.keys(cur).forEach(function(k){ var b=base[k]; if(!b||b.deleted||b.json!==cur[k]) n++; });
      Object.keys(base).forEach(function(k){ if(!(k in cur)&&!base[k].deleted) n++; });
      return n;
    }

    function applyRows(rows){
      var any=false;
      rows.forEach(function(row){
        var k=key(row.kind,row.id), b=base[k], st=S();
        if(row.updated_at&&(!cursor||row.updated_at>cursor)) cursor=row.updated_at;
        if(b&&row.rev<=b.rev) return;
        var local=getRec(st,row.kind,row.id), lj=local?canon(local):null;
        if(row.deleted){
          if(local&&b&&!b.deleted&&lj!==b.json){ base[k]={rev:row.rev,json:b.json}; return; }       // tengo cambios locales: se "revive" al subir
          if(local){ delRec(st,row.kind,row.id); any=true; }
          base[k]={rev:row.rev,json:null,deleted:true}; return;
        }
        var theirs=row.data||{};
        if(!local||!b||b.deleted){ putRec(st,row.kind,row.id,theirs); base[k]={rev:row.rev,json:canon(theirs)}; any=true; return; }
        if(lj===b.json){ putRec(st,row.kind,row.id,theirs); base[k]={rev:row.rev,json:canon(theirs)}; any=true; return; }
        var merged=merge3(JSON.parse(b.json),local,theirs,row.kind);
        putRec(st,row.kind,row.id,merged); base[k]={rev:row.rev,json:canon(theirs)}; any=true;
      });
      return any;
    }

    function call(fn){ return new Promise(function(res){ res(fn()); }); }
    function since(){ if(!cursor) return null; return new Date(new Date(cursor).getTime()-60000).toISOString(); }

    function pull(){ return call(function(){ return o.transport.pull(since()); }).then(function(rows){ var a=applyRows(rows||[]); if(a) changed(); return rows.length; }); }

    function plan(){
      var cur=split(S()), items=[], map={};
      Object.keys(cur).forEach(function(k){ var b=base[k];
        if(!b||b.deleted||b.json!==cur[k]){ var p=parseKey(k); items.push({kind:p[0],id:p[1],data:JSON.parse(cur[k]),base_rev:b?b.rev:0,deleted:false}); map[k]=cur[k]; } });
      Object.keys(base).forEach(function(k){ if(!(k in cur)&&!base[k].deleted){ var p=parseKey(k); items.push({kind:p[0],id:p[1],base_rev:base[k].rev,deleted:true}); map[k]=null; } });
      return {items:items,sent:map};
    }

    function push(){
      var pl=plan(); if(!pl.items.length) return Promise.resolve({sent:0,conflicts:0});
      var chunks=[]; for(var i=0;i<pl.items.length;i+=150) chunks.push(pl.items.slice(i,i+150));
      var conflicts=0, sent=0;
      return chunks.reduce(function(p,ch){ return p.then(function(){ return call(function(){ return o.transport.push(ch); }).then(function(res){
        (res||[]).forEach(function(r){
          var k=key(r.kind,r.id), st=S();
          if(r.status==='ok'){ sent++; base[k]=pl.sent[k]===null?{rev:r.rev,json:null,deleted:true}:{rev:r.rev,json:pl.sent[k]}; return; }
          conflicts++;
          if(r.gone){ delete base[k]; return; }                                  // el servidor no lo tiene: se vuelve a crear en la próxima vuelta
          var theirs=r.data||{}, local=getRec(st,r.kind,r.id), b=base[k];
          if(r.deleted){ base[k]={rev:r.rev,json:null,deleted:true}; return; }    // lo borraron allá: si sigue acá, se revive en la próxima vuelta
          if(!local||pl.sent[k]===null){ putRec(st,r.kind,r.id,theirs); base[k]={rev:r.rev,json:canon(theirs)}; changed(); return; }   // yo lo borré pero allá lo cambiaron: gana lo cambiado
          var merged=merge3(b&&b.json?JSON.parse(b.json):{},local,theirs,r.kind);
          putRec(st,r.kind,r.id,merged); base[k]={rev:r.rev,json:canon(theirs)}; changed();
        });
      }); }); },Promise.resolve()).then(function(){ return {sent:sent,conflicts:conflicts}; });
    }

    function sync(){
      if(busy) return Promise.resolve({busy:true});
      busy=true; var tries=0, total={sent:0};
      function loop(){
        return pull().then(function(){ return push(); }).then(function(r){ total.sent+=r.sent; if(r.conflicts&&++tries<4) return loop(); });
      }
      return loop().then(function(){ busy=false; lastError=null; return {ok:true,sent:total.sent,pending:pending()}; },function(e){ busy=false; lastError=e; return {ok:false,error:e&&e.message?e.message:String(e),pending:pending()}; });
    }

    return { sync:sync, pull:pull, push:push, pending:pending,
      snapshot:function(){ return {base:base,cursor:cursor}; },
      isBusy:function(){ return busy; }, lastError:function(){ return lastError; },
      /* primera subida: todo lo local pasa a la nube */
      adoptAll:function(){ base={}; cursor=null; } };
  }

  /* estado vacío para una agencia que arranca de cero (mismo formato que el demo, sin datos) */
  function emptyState(name,id){ return {v:3,agency:{id:id||'ag_default',name:name||'Agencia',tagline:'Planificador de viajes'},seq:1000,families:[],famSeq:0,clients:[],cases:[],templates:[]}; }

  /* Casos que llegan del portal con num 0: la agencia les asigna el próximo número */
  function fixCaseNums(S){ var n=0; (S.cases||[]).slice().reverse().forEach(function(k){ if(!k.num){ S.seq=(S.seq||1000)+1; k.num=S.seq; n++; } }); return n; }

  return {split:split,merge3:merge3,canon:canon,getRec:getRec,putRec:putRec,delRec:delRec,createEngine:createEngine,emptyState:emptyState,fixCaseNums:fixCaseNums,KINDS:KINDS};
});
