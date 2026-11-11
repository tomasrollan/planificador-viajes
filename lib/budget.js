/* Presupuesto del viaje, sin dependencias del navegador (se prueba directo en Node).
   - El cliente tiene un presupuesto total (en dólares) y la agente va cargando ítems: hotel, entradas, restaurantes, etc.
   - Cada ítem es «estimado» (precio de referencia) o «confirmado» (ya hay una reserva o una factura).
   - La barra suma lo comprometido (confirmado + estimado) contra el total y marca lo que falta pagar.
   - Los créditos del plan de comidas de Disney se llevan aparte: solo cuentan en ítems de restaurante. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Budget=factory(); })(typeof self!=='undefined'?self:this,function(){
  var CATS=[
    {k:'hotel',n:'Hotel',ic:'hotel'},
    {k:'parques',n:'Entradas a parques',ic:'ticket'},
    {k:'comida',n:'Restaurantes',ic:'utensils'},
    {k:'excursion',n:'Excursiones y shows',ic:'sparkles'},
    {k:'transporte',n:'Transporte',ic:'bus'},
    {k:'seguro',n:'Seguro de viaje',ic:'shield'},
    {k:'otros',n:'Otros',ic:'pin'}
  ];
  var STATUS={estimado:'Estimado',confirmado:'Confirmado'};
  var MAX_FILE=10*1024*1024;
  function catOf(k){ for(var i=0;i<CATS.length;i++) if(CATS[i].k===k) return CATS[i]; return CATS[CATS.length-1]; }
  function round(x){ return Math.round((+x||0)*100)/100; }

  /* "1.234,50", "1,234.50", "US$ 1200", "$1.200", "1200" -> número (>=0) o null */
  function parseAmount(s){
    if(typeof s==='number') return isFinite(s)&&s>=0?round(s):null;
    var t=String(s==null?'':s).toLowerCase().replace(/us\$|u\$s|usd|dolares|dólares|d[oó]lar(es)?|\$/g,'').replace(/\s+/g,'');
    if(!t||!/^[\d.,]+$/.test(t)) return null;
    var lc=t.lastIndexOf(','), ld=t.lastIndexOf('.');
    if(lc>=0&&ld>=0){ // el último separador es el decimal
      if(lc>ld) t=t.replace(/\./g,'').replace(',','.'); else t=t.replace(/,/g,'');
    } else if(lc>=0){ // solo comas: decimal si hay una sola y ≤2 dígitos después
      var pc=t.split(','); t=(pc.length===2&&pc[1].length<=2)?pc[0]+'.'+pc[1]:t.replace(/,/g,'');
    } else if(ld>=0){ // solo puntos: miles si hay varios o 3 dígitos después
      var pd=t.split('.'); t=(pd.length===2&&pd[1].length<=2)?t:t.replace(/\./g,'');
    }
    var n=parseFloat(t); return isFinite(n)&&n>=0?round(n):null;
  }

  /* ¿Hay presupuesto definido? */
  function hasBudget(c){ return !!(c&&c.budget&&+c.budget.total>0); }
  function itemsOf(c){ return (c&&c.items)||[]; }

  /* rows: ítems cargados + filas automáticas (ya calculadas por quien llama).
     Devuelve totales, por categoría y el nivel de la barra. */
  function summary(budget,rows){
    budget=budget||{}; rows=rows||[];
    var total=round(budget.total), targets=budget.cats||{};
    var byCat={}; CATS.forEach(function(c){ byCat[c.k]={k:c.k,confirmed:0,estimated:0,paid:0,n:0,target:round(targets[c.k])}; });
    var conf=0, est=0, paid=0, toPay=0;
    rows.forEach(function(it){
      var a=round(it.amount); if(!(a>0)) return; var cat=byCat[catOf(it.cat).k]; cat.n++;
      if(it.status==='confirmado'){ conf+=a; cat.confirmed+=a; if(it.paid){ paid+=a; cat.paid+=a; } else toPay+=a; }
      else { est+=a; cat.estimated+=a; }
    });
    conf=round(conf); est=round(est); paid=round(paid); toPay=round(toPay);
    var committed=round(conf+est), avail=round(total-committed), over=avail<0?round(-avail):0;
    var pctConf=total?Math.min(100,conf/total*100):0, pctEst=total?Math.min(100-pctConf,est/total*100):0;
    var usedPct=total?Math.round(committed/total*100):0;
    var level=!total?'none':committed>total?'over':usedPct>=90?'warn':'ok';
    CATS.forEach(function(c){ var x=byCat[c.k]; x.total=round(x.confirmed+x.estimated); x.over=x.target>0&&x.total>x.target?round(x.total-x.target):0; x.pct=x.target?Math.min(100,Math.round(x.total/x.target*100)):0; });
    return {total:total,confirmed:conf,estimated:est,committed:committed,paid:paid,toPay:toPay,available:avail,over:over,
      pctConf:round(pctConf),pctEst:round(pctEst),usedPct:usedPct,level:level,byCat:byCat,count:rows.filter(function(r){return round(r.amount)>0}).length};
  }

  /* Créditos de Disney: se cargan en ítems de restaurante. total = lo que da el plan; planned = lo de la agenda. */
  function creditsSummary(items,total,planned){
    var used=0, n=0; (items||[]).forEach(function(it){ var k=Math.max(0,Math.floor(+it.credits||0)); if(it.cat==='comida'&&k>0){ used+=k; n++; } });
    total=Math.max(0,+total||0); planned=Math.max(0,+planned||0);
    return {total:total,used:used,items:n,left:Math.max(0,total-used),over:Math.max(0,used-total),pct:total?Math.min(100,Math.round(used/total*100)):0,planned:planned,
      unbooked:Math.max(0,Math.min(total,planned)-Math.min(used,planned))};
  }

  /* Valida un ítem; devuelve {ok,errors,item} con el ítem limpio */
  function cleanItem(o,now,by){
    var errs=[], title=String(o.title||'').trim().slice(0,120);
    if(!title) errs.push('Poné un título');
    var amt=o.amount===''||o.amount==null?0:parseAmount(o.amount);
    if(amt===null) errs.push('El monto no es un número válido');
    var cr=Math.max(0,Math.min(99,Math.floor(+o.credits||0)));
    var date=/^\d{4}-\d{2}-\d{2}$/.test(o.date||'')?o.date:'';
    var cat=catOf(o.cat).k;
    var it={id:o.id||('i'+Math.random().toString(36).slice(2,9)),cat:cat,title:title,date:date,amount:amt||0,
      status:o.status==='confirmado'?'confirmado':'estimado',paid:o.status==='confirmado'&&!!o.paid,conf:String(o.conf||'').trim().slice(0,40),
      file:o.file&&o.file.id?{id:o.file.id,name:String(o.file.name||'').slice(0,120),size:+o.file.size||0,type:String(o.file.type||'')}:null,
      visible:!!o.visible,credits:cat==='comida'?cr:0,note:String(o.note||'').trim().slice(0,300),at:o.at||now||0,by:o.by||by||'agus'};
    return {ok:!errs.length,errors:errs,item:it};
  }

  function money(x,cur){ var n=round(x), neg=n<0; n=Math.abs(n); var parts=n.toFixed(2).split('.'), ent=parts[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.'), dec=parts[1]==='00'?'':','+parts[1];
    return (neg?'-':'')+(cur||'US$')+' '+ent+dec; }

  /* Texto para mandar por WhatsApp (sin códigos de confirmación de otros clientes, solo los de este) */
  function shareText(name,s,rows,o){
    o=o||{}; var L=[]; L.push('*Resumen del presupuesto · '+name+'*');
    if(s.total) L.push('Presupuesto: '+money(s.total)+' · Comprometido: '+money(s.committed)+' ('+s.usedPct+'%)');
    L.push((s.available>=0?'Disponible: '+money(s.available):'Nos pasamos por '+money(s.over)));
    L.push('');
    CATS.forEach(function(c){ var x=s.byCat[c.k]; if(!x.total) return; L.push('• '+c.n+': '+money(x.total)+(x.confirmed&&x.estimated?' ('+money(x.confirmed)+' confirmado)':x.estimated?' (estimado)':'')); });
    var pend=rows.filter(function(r){ return r.status==='confirmado'&&!r.paid&&r.amount>0; });
    if(pend.length){ L.push(''); L.push('Por pagar: '+money(s.toPay)); pend.slice(0,8).forEach(function(r){ L.push('  - '+r.title+(r.date?' ('+r.date.slice(8,10)+'/'+r.date.slice(5,7)+')':'')+': '+money(r.amount)); }); }
    if(o.footer) { L.push(''); L.push(o.footer); }
    return L.join('\n');
  }

  function csvCell(v){ v=String(v==null?'':v); return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }
  /* CSV con ; (Excel en español lo abre directo) */
  function toCsv(rows){
    var head=['Categoría','Título','Fecha','Monto (USD)','Estado','Pagado','Confirmación','Créditos','Nota'];
    var out=[head.join(';')];
    rows.forEach(function(r){ out.push([catOf(r.cat).n,r.title,r.date||'',String(round(r.amount)).replace('.',','),STATUS[r.status]||r.status,r.status==='confirmado'?(r.paid?'sí':'no'):'',r.conf||'',r.credits||'',r.note||''].map(csvCell).join(';')); });
    return out.join('\n');
  }

  /* Archivos: tipo y tamaño permitidos */
  function checkFile(f){ if(!f) return 'No hay archivo'; if(f.size>MAX_FILE) return 'El archivo pesa más de 10 MB'; var ok=/^(application\/pdf|image\/(png|jpe?g|webp|heic))$/i.test(f.type||'')||/\.(pdf|png|jpe?g|webp|heic)$/i.test(f.name||''); return ok?'':'Solo PDF o imágenes (PNG, JPG)'; }
  function sizeLabel(b){ b=+b||0; return b<1024?b+' B':b<1048576?Math.round(b/1024)+' KB':(b/1048576).toFixed(1).replace('.',',')+' MB'; }

  return {CATS:CATS,STATUS:STATUS,MAX_FILE:MAX_FILE,catOf:catOf,parseAmount:parseAmount,hasBudget:hasBudget,itemsOf:itemsOf,summary:summary,creditsSummary:creditsSummary,cleanItem:cleanItem,money:money,shareText:shareText,toCsv:toCsv,checkFile:checkFile,sizeLabel:sizeLabel};
});
