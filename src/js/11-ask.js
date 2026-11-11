/* ======================= Preguntar a la agencia ======================= */
var ASKREG=[];
function askQ(rid,dish){ ASKREG.push({rid:rid,dish:dish}); return '<button class="qbtn" data-ask="'+(ASKREG.length-1)+'" title="Preguntar a la agencia sobre este plato" aria-label="Preguntar a la agencia sobre '+esc(dish)+'">?</button>'; }
function openAsk(o){
  UI.ask=o; var r=o.rid&&RID[o.rid], tr=o.topic==='transporte';
  var ctx=tr?'Transporte desde tu hotel':(r?r.name+(o.dish?' · '+o.dish:''):'');
  var types=tr?['Consulta','Otro']:['Consulta','Alergia / dieta','Cambio de reserva'];
  var ph=tr?'Ej: llegamos a las 22 hs al aeropuerto, ¿qué nos conviene?':(o.dish?'Ej: ¿este plato se puede pedir sin gluten? ¿es picante?':'Ej: ¿hace falta reservar? ¿tienen opción vegetariana?');
  showModal('<div class="mask" data-close="1"><div class="modal"><button class="x" data-close="1">'+I('x')+'</button><div class="pad"><span class="eyebrow">Preguntar a '+esc(S.agency.name)+'</span><h3 style="padding-right:40px;font-size:19px;font-weight:900;margin:4px 0 6px">'+esc(ctx)+'</h3>'+
   '<div class="tiny muted" style="margin-bottom:12px">Tu consulta se guarda como un caso con este contexto y tu agente te responde en la pestaña Pedidos.</div>'+
   '<label class="f">¿Qué tipo de consulta es?</label><select id="ask-type">'+types.map(function(x){return '<option>'+x+'</option>'}).join('')+'</select>'+
   '<label class="f" style="margin-top:12px">Tu pregunta</label><textarea id="ask-text" placeholder="'+esc(ph)+'"></textarea>'+
   '<label class="small" style="display:flex;gap:8px;align-items:center;margin-top:10px;font-weight:600"><input type="checkbox" id="ask-urg"> Es urgente (viajo pronto)</label>'+
   '<div class="notice" style="margin-top:12px">'+I('shield')+'<div>Si es una alergia grave, avisala igual al reservar y al mozo: la información de los menús no reemplaza ese aviso.</div></div>'+
   '<div class="row" style="margin-top:14px"><button class="btn" data-sendask="1">'+I('check')+' Enviar a la agencia</button></div></div></div></div>');
}
function sendAsk(){
  var o=UI.ask||{}, c=client(UI.cid); if(!c) return;
  var tx=($('#ask-text').value||'').trim(); if(!tx){ toast('Escribí tu consulta'); return; }
  var ty=$('#ask-type').value, r=o.rid&&RID[o.rid], tr=o.topic==='transporte';
  var pr=ty==='Alergia / dieta'?'alta':'normal'; if($('#ask-urg').checked) pr=(pr==='alta')?'urgente':'alta';
  var what=tr?'transporte desde el hotel':(o.dish?o.dish+' ('+(r?r.name:'')+')':(r?r.name:'restaurante'));
  addCase({cid:c.id,title:(ty==='Alergia / dieta'?'Alergia / dieta: ':'Consulta: ')+what,type:ty,priority:pr,text:tx,ref:{rid:o.rid||null,dish:o.dish||null,topic:o.topic||null}});
  closeModal(); toast('Consulta enviada a '+S.agency.name); render();
}

