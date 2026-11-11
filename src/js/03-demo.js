/* ======================= datos demo ======================= */
var addDays=Dates.addDays;
function mkDays(start,end){ var out=[],d=start,g=0; while(d<=end&&g<21){ out.push({date:d,park:'',slots:{breakfast:null,lunch:null,dinner:null}}); d=addDays(d,1); g++; } return out; }
function demo(){
  var y=new Date().getFullYear()+1, s=y+'-03-14', now=Date.now(), H=36e5;
  var a={id:'c1',token:'rodriguez-7k2m9',pin:'482915',name:'Familia Rodríguez',destination:'Walt Disney World',hotel:'Disney\'s Riviera Resort',start:s,end:addDays(s,5),plan:'base',mode:'collab',
    travelers:[{id:'t1',name:'Laura',type:'adulto',allergies:'Maní'},{id:'t2',name:'Martín',type:'adulto',allergies:''},{id:'t3',name:'Sofi',type:'niño',allergies:'Lactosa'}],
    days:mkDays(s,addDays(s,5)),requests:[],favs:{},notes:'Primera vez en Disney. Les gusta la pasta y los personajes.'};
  a.days[0].park='Magic Kingdom'; a.days[1].park='EPCOT'; a.days[2].park='Hollywood Studios'; a.days[3].park='Animal Kingdom'; a.days[4].park='Disney Springs';
  a.days[0].slots.dinner={rid:'liberty-tree-tavern',state:'reservada',time:'19:10',conf:'E4F7-2201',by:'agus',locked:true};
  a.days[1].slots.lunch={rid:'via-napoli',state:'por_reservar',time:'13:00',conf:'',by:'cliente'};
  a.days[1].slots.dinner={rid:'teppan-edo',state:'idea',time:'',conf:'',by:'cliente'};
  a.days[3].slots.lunch={rid:'tusker-house-restaurant',state:'por_reservar',time:'12:30',conf:'',by:'agus'};
  a.favs={t1:['teppan-edo','via-napoli','toledo'],t2:['teppan-edo','le-cellier-steakhouse'],t3:['crystal-palace','chef-mickeys']};
  var b={id:'c2',token:'perez-x4q8d',pin:'730164',name:'Pareja Pérez',destination:'Walt Disney World',hotel:'Disney\'s Polynesian Village Resort',start:addDays(s,40),end:addDays(s,45),plan:'none',mode:'view',
    travelers:[{id:'t1',name:'Carla',type:'adulto',allergies:''},{id:'t2',name:'Diego',type:'adulto',allergies:'Frutos secos'}],days:mkDays(addDays(s,40),addDays(s,45)),requests:[],favs:{},notes:'Luna de miel. Sin plan de comidas.'};
  b.days[0].park='Magic Kingdom'; b.days[0].slots.dinner={rid:'california-grill',state:'idea',time:'',conf:'',by:'agus'};
  var g={id:'c3',token:'gomez-m5r2t',pin:'219047',name:'Familia Gómez',destination:'Walt Disney World',hotel:'Disney\'s Contemporary Resort',start:addDays(s,90),end:addDays(s,96),plan:'premium',mode:'auto',
    travelers:[{id:'t1',name:'Julián',type:'adulto',allergies:''},{id:'t2',name:'Ana',type:'adulto',allergies:'Gluten'}],days:mkDays(addDays(s,90),addDays(s,96)),requests:[],favs:{},notes:'Viajan con plan premium.'};
  var u={id:'c4',token:'torres-u8n3w',pin:'604827',name:'Familia Torres',destination:'Universal Orlando Resort',dests:['uor'],hotel:'',hotelU:'Loews Portofino Bay Hotel',cardUSD:0,start:addDays(s,120),end:addDays(s,125),plan:'none',mode:'collab',
    travelers:[{id:'t1',name:'Nicolás',type:'adulto',allergies:''},{id:'t2',name:'Vero',type:'adulto',allergies:'Frutos secos'},{id:'t3',name:'Bauti',type:'niño',allergies:''}],days:mkDays(addDays(s,120),addDays(s,125)),requests:[],favs:{t1:['uor-toothsome-chocolate-emporium'],t2:['uor-vivo-italian-kitchen','uor-mythos-restaurant']},notes:'Primera vez en Universal. Les interesa Harry Potter y Epic Universe.'};
  u.days[0].park='Universal Studios Florida'; u.days[1].park='Islands of Adventure'; u.days[2].park='Epic Universe'; u.days[3].park=Universal.REST_PARK;
  u.days[1].slots.dinner={rid:'uor-mythos-restaurant',state:'por_reservar',time:'18:30',conf:'',by:'agus'};
  u.days[2].slots.dinner={rid:'uor-atlantic',state:'idea',time:'',conf:'',by:'cliente'};
  var m5=addDays(s,150), m={id:'c5',token:'alvarez-b6t1y',pin:'351986',name:'Familia Álvarez',destination:'Walt Disney World + Universal Orlando Resort',dests:['wdw','uor'],hotel:'Disney\'s All-Star Sports Resort',hotelU:'Universal Cabana Bay Beach Resort',cardUSD:0,start:m5,end:addDays(m5,9),segs:{wdw:{start:m5,end:addDays(m5,5)},uor:{start:addDays(m5,5),end:addDays(m5,9)}},plan:'base',mode:'collab',
    travelers:[{id:'t1',name:'Fede',type:'adulto',allergies:''},{id:'t2',name:'Lu',type:'adulto',allergies:''},{id:'t3',name:'Mati',type:'niño',allergies:''},{id:'t4',name:'Cata',type:'niño',allergies:''}],days:mkDays(m5,addDays(m5,9)),requests:[],favs:{},notes:'Viaje combinado: 5 noches en Disney y 4 en Universal. Con chicos de 6 y 9.'};
  m.days[0].park='Magic Kingdom'; m.days[1].park='EPCOT'; m.days[2].park='Animal Kingdom'; m.days[3].park='Hollywood Studios'; m.days[5].park='Universal Studios Florida'; m.days[6].park='Islands of Adventure'; m.days[7].park='Epic Universe';
  m.days[0].slots.dinner={rid:'crystal-palace',state:'idea',time:'',conf:'',by:'agus'};
  m.days[6].slots.dinner={rid:'uor-marvel-character-dinner',state:'por_reservar',time:'19:00',conf:'',by:'agus'};
  function K(n,cid,title,type,prio,st,hAgo,text,ref,extra){ var k={id:uid(),num:n,cid:cid,title:title,type:type,priority:prio,status:st,created:now-hAgo*H,updated:now-hAgo*H,due:now-hAgo*H+PRIO[prio][2]*H,source:'cliente',ref:ref||null,thread:[{id:uid(),by:'cliente',kind:'msg',text:text,at:now-hAgo*H}]};
    (extra||[]).forEach(function(m,i){ m.id=uid(); m.at=now-(hAgo-(i+1)*Math.min(3,hAgo/3))*H; k.thread.push(m); if(m.kind!=='nota') k.updated=m.at; }); return k; }
  function IT(c,cat,title,date,amount,status,o){ o=o||{}; c.items=c.items||[]; c.items.push({id:uid(),cat:cat,title:title,date:date||'',amount:amount,status:status,paid:!!o.paid,conf:o.conf||'',file:null,visible:!!o.visible,credits:o.credits||0,note:o.note||'',at:now,by:'agus'}); }
  a.budget={total:8000,cur:'USD',cats:{hotel:3500},share:false,autoMeals:true};
  IT(a,'hotel','Disney\'s Riviera Resort · 5 noches',s,3150,'confirmado',{paid:true,conf:'WDW-71820',visible:true});
  IT(a,'parques','Entradas Magic Kingdom, EPCOT y Hollywood Studios',addDays(s,0),1280,'confirmado',{conf:'TKT-5532',visible:true});
  IT(a,'comida','Liberty Tree Tavern · cena',addDays(s,0),0,'confirmado',{conf:'E4F7-2201',credits:1,visible:true});
  IT(a,'transporte','Traslado aeropuerto ↔ hotel (Mears)',s,95,'estimado');
  g.budget={total:9500,cur:'USD',cats:{},share:true,autoMeals:true};
  IT(g,'hotel','Disney\'s Contemporary Resort · 6 noches',addDays(s,90),3400,'confirmado',{paid:true,conf:'WDW-90312',visible:true});
  IT(g,'parques','Entradas 5 días con Park Hopper',addDays(s,90),1620,'confirmado',{conf:'TKT-8841',visible:true});
  IT(g,'excursion','Fireworks Dessert Party',addDays(s,92),240,'estimado');
  IT(g,'comida','Be Our Guest · cena',addDays(s,91),0,'confirmado',{conf:'D-55410',credits:2,visible:true});
  u.budget={total:7000,cur:'USD',cats:{},share:false,autoMeals:false};
  IT(u,'hotel','Loews Portofino Bay Hotel · 5 noches',addDays(s,120),3100,'confirmado',{paid:true,conf:'UOR-3321',visible:true});
  IT(u,'parques','Entradas 3 parques con Express',addDays(s,120),1650,'estimado');
  m.budget={total:12000,cur:'USD',cats:{hotel:6000},share:false,autoMeals:false};
  IT(m,'hotel','All-Star Sports · 5 noches',m5,1450,'estimado');
  IT(m,'hotel','Cabana Bay Beach Resort · 4 noches',addDays(m5,5),1300,'estimado');
  var T0=new Date().toISOString().slice(0,10);
  function PQ(c,n,off,amount,paidOff,method){ c.pay.plan.push({id:uid(),n:n,due:addDays(T0,off),amount:amount,paidAt:paidOff==null?'':addDays(T0,paidOff),method:paidOff==null?'':(method||'transferencia'),file:null,note:''}); }
  a.pay={price:7400,share:true,plan:[]}; PQ(a,'Anticipo',-60,1500,-60,'transferencia'); PQ(a,'Cuota 1 de 4',-30,1475,-31,'mercadopago'); PQ(a,'Cuota 2 de 4',-3,1475,null); PQ(a,'Cuota 3 de 4',27,1475,null); PQ(a,'Cuota 4 de 4',57,1475,null);
  g.pay={price:8800,share:true,plan:[]}; PQ(g,'Anticipo',-12,2000,-12,'tarjeta'); PQ(g,'Cuota 1 de 4',3,1700,null); PQ(g,'Cuota 2 de 4',33,1700,null); PQ(g,'Cuota 3 de 4',63,1700,null); PQ(g,'Cuota 4 de 4',93,1700,null);
  var cases=[
    K(1008,'c4','Conseguir mesa en Toothsome','Consulta','normal','nuevo',12,'Vimos que Toothsome es difícil de reservar. ¿Lo pueden intentar para el segundo día?'),
    K(1001,'c1','Pasar la cena de Liberty Tree a las 18:00','Cambio de reserva','alta','nuevo',5,'¿Se puede pasar la cena a las 18:00? Los chicos se duermen temprano.',{date:a.days[0].date,slot:'dinner'}),
    K(1002,'c1','Confirmar alergia a maní de Laura en Tusker House','Alergia / dieta','urgente','en_curso',30,'Laura es alérgica al maní. ¿Pueden avisarlo en la reserva?',{date:a.days[3].date,slot:'lunch'},[{by:'agus',kind:'nota',text:'Cargar la alergia en My Disney Experience al reservar y escribir a Special Diets.'},{by:'agus',kind:'msg',text:'Listo, ya lo anoto en la reserva. Apenas la confirme te aviso.'}]),
    K(1003,'c2','¿Conviene contratar el plan de comidas?','Consulta','normal','esperando',70,'Somos dos y comemos poco. ¿Nos conviene el plan de comidas?',null,[{by:'agus',kind:'msg',text:'Armé un estimado: sin plan, unos US$ 700 en las comidas de mesa. ¿Querés que lo comparemos con el plan base?'}]),
    K(1004,'c2','Enviar comprobante de seña','Pago / documentación','baja','resuelto',200,'Les mando el comprobante de la seña por acá.',null,[{by:'agus',kind:'msg',text:'Recibido, gracias. Queda registrado.'}]),
    K(1005,'c1','Ideas para el cumpleaños de Sofi','Consulta','normal','en_curso',50,'Sofi cumple años en el viaje. ¿Hay algún lugar lindo con personajes?',null,[{by:'agus',kind:'msg',text:'Sí, te propongo Chef Mickey\'s o Crystal Palace. Mirá los dos en Restaurantes.'}]),
    K(1006,'c3','Cambiar las fechas del viaje','Otro','alta','nuevo',20,'Necesitamos mover el viaje una semana. ¿Se puede?'),
    K(1007,'c3','Duda sobre créditos del plan premium','Consulta','normal','en_curso',9,'¿Los shows cuentan como dos créditos?',null,[{by:'agus',kind:'msg',text:'Sí, los shows y algunos de personajes cuestan 2 créditos. Están marcados en cada restaurante.'}])
  ];
  var FM=function(n,name,phone,tags,pers,prefs,notes,past){ return {id:'fam'+n,code:'FAM-'+('000'+n).slice(-4),name:name,phone:phone,email:'',tags:tags,personality:pers,prefs:prefs,notes:notes.map(function(t,i){return {id:'fn'+n+i,t:t,at:Date.now()-(i+2)*864e5*9,by:'agus'}}),past:past.map(function(p,i){return {id:'fp'+n+i,year:p[0],dest:p[1],hotel:p[2],notes:p[3]}}),created:Date.now()-864e5*400}; };
  var fams=[
    FM(1,'Familia Rodríguez','+54 9 11 5555-1001',['viaja con chicos','cumpleaños en viaje','repite'],'Laura decide todo y le gusta tener el plan cerrado con tiempo. Martín solo pregunta por el precio. Prefieren WhatsApp a llamadas.','Hoteles dentro de Disney, desayuno con personajes, no les gustan las filas. Comen temprano por los chicos.',['Prefieren que les mande 2 opciones, no 5.','Sofi cumple años durante el viaje: sorprenderla en la cena.'],[[2024,'Cancún','Hotel con todo incluido','Los chicos amaron el club infantil. Les pareció caro el extra de excursiones.'],[2022,'Walt Disney World','Disney\'s Pop Century','Primera vez. Volvieron encantados, querían más tiempo.']]),
    FM(2,'Familia Gómez','+54 9 11 5555-1002',['plan premium','VIP'],'Julián es detallista y quiere ver todo en números. Ana es la que decide los restaurantes.','Buena comida, mesas con vista, sin apuro. Pagan en cuotas.',['Pidieron factura a nombre de la empresa de Julián.'],[[2023,'Italia','Roma y Florencia','Viaje de aniversario. Querían más tiempo libre y menos traslados.']]),
    FM(3,'Pareja Pérez','+54 9 11 5555-1003',['luna de miel'],'Carla es la que escribe; Diego se suma a la decisión final.','Les interesa lo romántico y tranquilo; comen poco.',[],[])
  ];
  a.famId='fam1'; g.famId='fam2'; b.famId='fam3';
  return {v:3,agency:{name:'Agus Natrone Turismo',tagline:'Planificador de viajes'},seq:1008,families:fams,famSeq:3,clients:[a,b,g,u,m],cases:cases};   // v3 -> Repo.migrate lo lleva a la versión actual (agency_id, zona horaria)
}
var repo=Repo.create({storage:store,key:KEY,demo:demo});
var S=repo.load();
function save(){ repo.set(S); repo.save(); }
repo.save();   // deja guardada la versión migrada del esquema
function client(id){ return repo.client(id); }
var NOW=function(){return Date.now()};
var isOpen=Rules.isOpen;
function kase(id){ return repo.kase(id); }
function casesOf(cid){ return repo.casesOf(cid); }
function ago(ts){ var m=Math.round((NOW()-ts)/6e4); if(m<1) return 'recién'; if(m<60) return 'hace '+m+' min'; var h=Math.round(m/60); if(h<24) return 'hace '+h+' h'; var d=Math.round(h/24); return 'hace '+d+(d===1?' día':' días'); }
function dueInfo(k){ return Rules.dueInfo(k,NOW()); }
function addCase(o){ var k=repo.addCase(o,NOW(),uid,PRIO); try{ var c=repo.client(o.cid); if(c) AgencyTools.logAdd(c,{t:'Caso #'+k.num+': '+k.title,kind:'caso',by:o.source==='agencia'?'agus':'cliente'},NOW()); repo.save(); }catch(e){} return k; }
function addMsg(k,by,kind,text){ repo.addMsg(k,by,kind,text,NOW(),uid); }
function clientByToken(t){ return repo.clientByToken(t); }

