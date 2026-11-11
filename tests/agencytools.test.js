// Tests de las herramientas de la agencia: lectura de mensajes, respuestas rápidas, buscador, antigüedad de datos, historial.
const assert=require('assert');const T=require('../lib/agencytools.js');
let n=0;const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++},ok=(c,m)=>{assert.ok(c,m);n++};
const TODAY='2026-11-11';
// ---- fechas
eq(T.parseDates('vamos del 12 al 20 de julio de 2027',TODAY),{start:'2027-07-12',end:'2027-07-20'},'del 12 al 20 de julio de 2027');
eq(T.parseDates('viajamos del 12 al 20 de julio',TODAY),{start:'2027-07-12',end:'2027-07-20'},'sin año: próxima ocurrencia');
eq(T.parseDates('del 28 de diciembre al 4 de enero',TODAY),{start:'2026-12-28',end:'2027-01-04'},'cruza de año');
eq(T.parseDates('12/7/2027 al 20/7/2027',TODAY),{start:'2027-07-12',end:'2027-07-20'},'numérico con año');
eq(T.parseDates('del 12/07 al 20/07',TODAY),{start:'2027-07-12',end:'2027-07-20'},'numérico sin año');
eq(T.parseDates('2027-07-12 al 2027-07-20',TODAY),{start:'2027-07-12',end:'2027-07-20'},'ISO');
eq(T.parseDates('del 12 de julio al 20 de agosto de 2027',TODAY),{start:'2027-07-12',end:'2027-08-20'},'dos meses');
eq(T.parseDates('nos vamos en julio',TODAY),null,'sin días no inventa');
eq(T.parseDates('del 31 al 40 de julio',TODAY),null,'fecha inválida');
// ---- teléfono
eq(T.parsePhone('mi cel es 11 5555-1234 gracias'),'11 5555-1234','teléfono');
eq(T.parsePhone('viajamos 12/07/2027 al 20/07/2027'),'','las fechas no son teléfonos');
eq(T.parsePhone('+54 9 11 5555 1234'),'+54 9 11 5555 1234','con código de país');
// ---- viajeros
eq(T.parseTravelers('somos 2 adultos y 2 chicos de 8 y 5'),{adults:2,kids:2},'adultos y chicos');
eq(T.parseTravelers('dos adultos y un nene'),{adults:2,kids:1},'en letras');
eq(T.parseTravelers('somos 4'),{adults:4,kids:0},'somos N');
eq(T.parseTravelers('somos una pareja'),{adults:2,kids:0},'pareja');
eq(T.parseTravelers('hola'),{adults:0,kids:0},'nada');
// ---- nombre y destino
eq(T.parseName('Hola! Somos la familia Pérez y queremos ir'),'Familia Pérez','nombre de familia');
eq(T.parseName('Soy Marcela Gómez'),'Marcela Gómez','soy…');
eq(T.parseDests('Disney y Universal'),['wdw','uor'],'ambos');
eq(T.parseDests('Vamos a Magic Kingdom'),['wdw'],'solo Disney');
eq(T.parseDests('Islands of Adventure'),['uor'],'solo Universal');
eq(T.parseDests('Vamos a Miami'),[],'ninguno');
// ---- hotel y plan
const H=[{n:"Disney's Contemporary Resort",k:['contemporary'],dest:'wdw'},{n:'Universal Cabana Bay Beach Resort',k:['cabana bay'],dest:'uor'}];
eq(T.parseHotel('nos alojamos en el Contemporary',H),{name:"Disney's Contemporary Resort",dest:'wdw'},'hotel Disney');
eq(T.parseHotel('Cabana Bay',H).dest,'uor','hotel Universal');
eq(T.parseHotel('un hotel afuera',H),null,'sin hotel');
eq(T.parsePlan('queremos el plan de comidas premium'),'premium','plan premium');
eq(T.parsePlan('con plan de comidas'),'base','plan base');
eq(T.parsePlan('sin nada'),'','sin plan');
// ---- mensaje completo
const msg='Hola Agus! Somos la familia Pérez, vamos a Disney y Universal del 12 al 20 de julio de 2027. Somos 2 adultos y 2 chicos. Mi cel es 11 5555-1234. Mi hija es alérgica al maní. Nos alojamos en el Contemporary.';
const r=T.parseIntake(msg,{today:TODAY,hotels:H});
eq([r.name,r.dests,r.start,r.end,r.phone,r.adults,r.kids],['Familia Pérez',['wdw','uor'],'2027-07-12','2027-07-20','11 5555-1234',2,2],'mensaje completo');
eq(r.hotel.dest,'wdw','hotel del mensaje');
ok(r.allergyLines.length===1&&/maní/.test(r.allergyLines[0]),'detecta la alergia pero no se la asigna a nadie');
eq(r.missing,[],'no falta nada');
const r2=T.parseIntake('hola, quiero info',{today:TODAY});
eq(r2.hasAny,false,'mensaje sin datos'); ok(r2.missing.indexOf('fechas')>=0,'avisa lo que falta');
// ---- respuestas rápidas
eq(T.macros().length,9,'9 respuestas');
ok(T.macros().every(m=>m.id&&m.label&&m.text),'campos completos');
eq(T.fill('Hola {nombre}! Ya reservé {restaurante}{cuando}{hora}.{conf}',{nombre:'Familia Pérez',restaurante:'Mythos',fecha:'lun, 12 jul',hora:'19:30',conf:'AB123'}),'Hola Familia Pérez! Ya reservé Mythos del lun, 12 jul a las 19:30 hs. Número de confirmación: AB123.','completa los datos');
eq(T.fill('Hola {nombre}! Ya reservé {restaurante}{cuando}{hora}.{conf}',{nombre:'Ana'}),'Hola Ana! Ya reservé el restaurante.','sin datos usa un texto neutro');
ok(!/\{/.test(T.fill('{nombre} {xyz}',{nombre:'A'})),'no deja llaves sueltas');
// ---- buscador
const items=[{label:'Familia Torres',text:'Familia Torres Loews Portofino Bay',boost:5},{label:'Mythos Restaurant',text:'Mythos Restaurant Islands of Adventure'},{label:'Teppan Edo',text:'Teppan Edo Japonesa EPCOT'}];
eq(T.rank(items,'mytos').length,0,'no hace coincidencias aproximadas');
eq(T.rank(items,'MYTHOS')[0].label,'Mythos Restaurant','sin mayúsculas');
eq(T.rank(items,'epcot teppan')[0].label,'Teppan Edo','todas las palabras, en cualquier orden');
eq(T.rank(items,'portofino')[0].label,'Familia Torres','busca en el texto completo');
eq(T.rank(items,'',2).length,2,'sin búsqueda muestra los primeros');
eq(T.rank([{label:'Pérez',text:'Pérez'}],'perez').length,1,'sin tildes');
// ---- antigüedad
const F=T.freshness([{k:'a',label:'A',at:'2026-11-10'},{k:'b',label:'B',at:'2026-10-01'},{k:'c',label:'C',at:'2026-08-01'},{k:'d',label:'D'}],TODAY);
eq(F.map(x=>x.level),['ok','warn','bad','unknown'],'niveles');
eq(F[0].days,1,'días');
eq(T.daysBetween('2026-11-11','2026-11-11'),0,'mismo día');
// ---- historial
const c={};T.logAdd(c,{t:'uno'},1);T.logAdd(c,{t:'dos',by:'cliente'},2);
eq(c.log.map(x=>x.t),['dos','uno'],'la más nueva primero');
for(let i=0;i<300;i++)T.logAdd(c,{t:'x'+i},i);
eq(c.log.length,200,'máximo 200');
console.log('agencytools OK ('+n+' verificaciones)');
