/* ======================= render raíz ======================= */
function render(){
  if(CL.gate){ $('#app').innerHTML=CL.gate; document.title=(CL.mode==='portal'?'Tu viaje':'Planificador de viajes'); return; }
  var h=location.hash.replace('#','');
  if(CL.mode==='portal'){ UI.role='cliente'; UI.route='portal'; UI.cid=(S.clients[0]||{}).id||null; }
  else if(h.indexOf('portal-')===0){ UI.role='cliente'; UI.route='portal'; UI.cid=(clientByToken(h.slice(7))||{}).id||null; }
  else if(h==='catalogo'){ UI.route='catalogo'; }
  else if(h==='casos'){ UI.role='agus'; UI.route='casos'; }
  else if(h==='reservas'){ UI.role='agus'; UI.route='reservas'; }
  else if(h==='sesion'){ UI.role='agus'; UI.route='sesion'; }
  else if(h==='clientes'){ UI.role='agus'; UI.route='clientes'; }
  else if(h.indexOf('familia-')===0){ UI.role='agus'; UI.route='familia'; UI.famId=h.slice(8); }
  else if(h.indexOf('cliente-')===0){ UI.role='agus'; UI.route='cliente'; UI.cid=h.slice(8); }
  else { UI.route=UI.role==='agus'?'panel':'portal'; }
  var main='';
  if(UI.route==='panel') main=vPanel(); else if(UI.route==='casos') main=vCasos(); else if(UI.route==='reservas') main=vReservas(); else if(UI.route==='sesion') main=vSesion(); else if(UI.route==='clientes') main=vClientes(); else if(UI.route==='familia') main=vFamilia(); else if(UI.route==='cliente') main=vClienteEdit(); else if(UI.route==='catalogo') main=vCatalogoPage(); else main=vPortal();
  $('#app').innerHTML=topbar()+(CL.demo?'<div class="demobar" role="status"><span>'+I('sparkles')+' <b>Versión demo</b> · datos de ejemplo: no se guardan ni afectan a tu agencia.</span><span class="row" style="gap:8px"><button class="btn sm" data-cl-demoreset="1">Restablecer demo</button><button class="btn sm" data-cl-demoexit="1">'+(CL.sess||clSession()?'Volver a mi agencia':'Salir de la demo')+'</button></span></div>':'')+'<div class="demo-note"'+((UI.route==='portal'&&!UI.preview)||CL.mode!=='local'?' hidden':'')+'>Demo interna · los datos se guardan solo en este navegador · fotos de restaurantes solo para uso interno</div>'+main;
  var tc=UI.route==='portal'?client(UI.cid):null; document.documentElement.setAttribute('data-theme',(tc&&tripDests(tc).length===1&&hasDest(tc,'uor'))?'uor':'');
  document.title=S.agency.name+' · Planificador de viajes';
  maybeTour();
  var hd=document.querySelector('.hdr'); if(hd) document.documentElement.style.setProperty('--hdr-h',hd.offsetHeight+'px');
}
function topbar(){
  var openN=S.cases.filter(isOpen).length, cl=(UI.role==='cliente'&&UI.route==='portal')?client(UI.cid):null;
  var eyebrow=esc(cl?(cl.destination||'Tu viaje'):(S.agency.tagline||'Planificador de viajes'));
  var nav='';
  if(UI.role==='agus'){ var act=(UI.route==='clientes'||UI.route==='familia')?'clientes':UI.route==='catalogo'?'catalogo':UI.route==='casos'?'casos':(UI.route==='reservas'||UI.route==='sesion')?'reservas':'panel'; var nq=getQueue().length;
    nav='<nav class="tabs navtabs">'+[['panel','grid','Panel'],['clientes','users','Clientes'],['reservas','list','Reservas'+(nq?' ('+nq+')':'')],['casos','chat','Casos'+(openN?' ('+openN+')':'')],['catalogo','utensils','Restaurantes']].map(function(t){return '<button data-go="'+t[0]+'" class="'+(act===t[0]?'on':'')+'">'+I(t[1])+' '+t[2]+'</button>'}).join('')+'<button data-cp-open="1" class="cpbtn" title="Buscar clientes, casos y restaurantes">'+I('search')+' Buscar <kbd>'+(isMac()?'⌘K':'Ctrl K')+'</kbd></button><button data-settings="1">'+I('key')+' Ajustes</button></nav>'; }
  return '<header class="hdr"><div class="in"><a class="brand" data-go="'+(UI.role==='agus'?'panel':'portal')+'"><div class="logo">'+I('utensils')+'</div><div><div class="eyebrow">'+eyebrow+'</div><h1>'+esc(S.agency.name)+'</h1></div></a>'+
   '<div class="row" style="gap:10px">'+(CL.mode==='agency'&&!CL.demo?cloudChip()+'<button class="cloudchip out" data-cl-demo="1" title="Probar con datos de ejemplo, sin tocar tu agencia">'+I('sparkles')+'<span>Versión demo</span></button><button class="cloudchip out" id="cloudout" data-cl-logout="1" title="Cerrar sesión" aria-label="Cerrar sesión">'+I('user')+'<span>Cerrar sesión</span></button>':'')+((UI.role==='agus'||UI.preview)?'<div class="seg" title="Para la demo: alterná entre lo que ve la agencia y lo que ve el cliente"><button data-role="agus" class="'+(UI.role==='agus'?'on':'')+'">Vista agencia</button><button data-role="cliente" class="'+(UI.role==='cliente'?'on':'')+'">Vista cliente</button></div>':'')+((UI.role==='agus'||(UI.route==='portal'&&UI.cid&&UI.unlocked[UI.cid]))?'<button class="helpbtn" data-tour="1" aria-label="Cómo funciona" title="Cómo funciona esta pantalla">?</button>':'')+'</div>'+nav+'</div></header>';
}

