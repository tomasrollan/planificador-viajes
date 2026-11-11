const assert=require('assert'),B=require('../lib/budget.js'),AT=require('../lib/agencytools.js');let n=0;
const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++};
// parseAmount
eq(B.parseAmount('1.234,50'),1234.5);eq(B.parseAmount('1,234.50'),1234.5);eq(B.parseAmount('US$ 1200'),1200);eq(B.parseAmount('$1.200'),1200);eq(B.parseAmount('1200'),1200);
eq(B.parseAmount('12,5'),12.5);eq(B.parseAmount('1,200'),1200);eq(B.parseAmount('abc'),null);eq(B.parseAmount(''),null);eq(B.parseAmount(-5),null);eq(B.parseAmount(99.999),100);
// summary
const rows=[{cat:'hotel',amount:3000,status:'confirmado',paid:true},{cat:'hotel',amount:500,status:'estimado'},{cat:'parques',amount:1200,status:'confirmado',paid:false},{cat:'comida',amount:300,status:'estimado'},{cat:'otros',amount:0,status:'confirmado'}];
let s=B.summary({total:6000,cats:{hotel:3000}},rows);
eq(s.confirmed,4200);eq(s.estimated,800);eq(s.committed,5000);eq(s.available,1000);eq(s.paid,3000);eq(s.toPay,1200);eq(s.level,'ok'.replace('ok','ok'));
eq(s.usedPct,83);eq(s.count,4);eq(s.byCat.hotel.total,3500);eq(s.byCat.hotel.over,500);eq(s.byCat.hotel.pct,100);eq(s.byCat.parques.n,1);eq(Math.round(s.pctConf+s.pctEst),83);
s=B.summary({total:5000},rows);eq(s.level,'warn');eq(s.usedPct,100);s=B.summary({total:4000},rows);eq(s.level,'over');eq(s.over,1000);eq(s.available,-1000);
s=B.summary({},rows);eq(s.level,'none');eq(s.pctConf,0);s=B.summary(null,[]);eq(s.committed,0);
eq(B.hasBudget({budget:{total:100}}),true);eq(B.hasBudget({}),false);eq(B.hasBudget({budget:{total:0}}),false);
// créditos
let cr=B.creditsSummary([{cat:'comida',credits:2},{cat:'comida',credits:1},{cat:'hotel',credits:5},{cat:'comida',credits:0}],14,10);
eq(cr.used,3);eq(cr.left,11);eq(cr.items,2);eq(cr.over,0);eq(cr.planned,10);eq(cr.unbooked,7);
cr=B.creditsSummary([{cat:'comida',credits:20}],14,0);eq(cr.over,6);eq(cr.left,0);eq(cr.pct,100);
// cleanItem
let ci=B.cleanItem({title:' Hotel Poly ',cat:'hotel',amount:'1.500,50',status:'confirmado',paid:true,credits:3,date:'2027-07-12',conf:' ABC123 '},5,'agus');
eq(ci.ok,true);eq(ci.item.title,'Hotel Poly');eq(ci.item.amount,1500.5);eq(ci.item.credits,0,'créditos solo en restaurante');eq(ci.item.paid,true);eq(ci.item.conf,'ABC123');eq(ci.item.at,5);
ci=B.cleanItem({title:'Cena',cat:'comida',amount:'80',credits:2,status:'estimado',paid:true});eq(ci.item.credits,2);eq(ci.item.paid,false,'estimado no puede estar pagado');
ci=B.cleanItem({title:'',amount:'x'});eq(ci.ok,false);eq(ci.errors.length,2);ci=B.cleanItem({title:'a',cat:'zzz',date:'mal'});eq(ci.item.cat,'otros');eq(ci.item.date,'');eq(ci.item.amount,0);
ci=B.cleanItem({title:'a',file:{id:'f1',name:'x.pdf',size:10,type:'application/pdf'}});eq(ci.item.file.id,'f1');
// money
eq(B.money(1234.5),'US$ 1.234,50');eq(B.money(1000000),'US$ 1.000.000');eq(B.money(-50),'-US$ 50');eq(B.money(0),'US$ 0');
// texto y csv
const tx=B.shareText('Familia Pérez',B.summary({total:6000},rows),rows);assert(/Familia Pérez/.test(tx)&&/Disponible: US\$ 1\.000/.test(tx)&&/Por pagar: US\$ 1\.200/.test(tx)&&/Hotel: US\$ 3\.500 \(US\$ 3\.000 confirmado\)/.test(tx));n+=4;
assert(/Nos pasamos por US\$ 1\.000/.test(B.shareText('X',B.summary({total:4000},rows),rows)));n++;
const csv=B.toCsv([{cat:'hotel',title:'Poly; "bonito"',amount:1500.5,status:'confirmado',paid:true,conf:'A1'}]).split('\n');eq(csv.length,2);assert(csv[1].indexOf('"Poly; ""bonito"""')>0&&csv[1].indexOf('1500,5')>0&&/;sí;/.test(csv[1]));n+=2;
// archivos
eq(B.checkFile({name:'a.pdf',type:'application/pdf',size:1000}),'');eq(B.checkFile({name:'a.exe',type:'application/x-msdownload',size:1000})!=='',true);eq(B.checkFile({name:'a.pdf',type:'application/pdf',size:11*1048576}),'El archivo pesa más de 10 MB');eq(B.checkFile({name:'f.JPG',type:'',size:5}),'');
eq(B.sizeLabel(512),'512 B');eq(B.sizeLabel(2048),'2 KB');eq(B.sizeLabel(1572864),'1,5 MB');
// parseBudget (WhatsApp)
eq(AT.parseBudget('Hola, queremos ir con un presupuesto de USD 8.000 en total'),8000);eq(AT.parseBudget('tenemos u$s 6500 para el viaje'),6500);eq(AT.parseBudget('presupuesto 5000 dólares'),5000);
eq(AT.parseBudget('nuestro presupuesto es de $4.500,50'),4501);eq(AT.parseBudget('somos 4 y queremos ir en julio'),0);eq(AT.parseBudget('presupuesto de 50 dólares'),0);
const pi=AT.parseIntake('Hola soy Marcela Gómez, somos 2 adultos, Disney del 12 al 20 de julio de 2027. Presupuesto de USD 7.000',{today:'2026-11-11'});eq(pi.budget,7000);assert(pi.found.indexOf('presupuesto')>=0);n+=1;
console.log('ok budget · '+n+' comprobaciones');
