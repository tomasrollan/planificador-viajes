const assert=require('assert'),D=require('../lib/dates.js');let n=0;const ok=(c,m)=>{assert.ok(c,m);n++};const eq=(a,b,m)=>{assert.deepStrictEqual(a,b,m);n++};
eq(D.addDays('2027-03-14',5),'2027-03-19');eq(D.addDays('2027-03-31',1),'2027-04-01');eq(D.addDays('2027-01-01',-1),'2026-12-31');eq(D.addDays('2028-02-28',1),'2028-02-29');
eq(D.nights('2027-03-14','2027-03-19'),5);eq(D.nights('2027-03-14','2027-03-14'),1);
eq(D.diffDays('2027-03-13','2027-03-14'),1);       // cruce de DST de EE.UU.: igual 1 día
eq(D.dowMon('2027-03-15'),0);eq(D.dow('2027-03-14'),0);   // 14/3/2027 es domingo
// Zona horaria: 6:00 AM Florida -> Argentina. EE.UU. cambia el 14/3/2027 (2.° domingo de marzo); Argentina no tiene horario de verano.
const t=d=>D.parkToLocal(d,6,0,'America/Argentina/Buenos_Aires');
eq(t('2027-03-12').time,'8:00','antes del cambio (EST, UTC-5)');eq(t('2027-03-13').time,'8:00');
eq(t('2027-03-14').time,'7:00','día del cambio (EDT, UTC-4)');eq(t('2027-03-15').time,'7:00');eq(t('2027-03-19').time,'7:00');
eq(t('2027-11-06').time,'7:00');eq(t('2027-11-07').time,'8:00','vuelve EST el 7/11/2027');
eq(t('2027-03-14').dayShift,0);
// otras zonas de agencia configurables
eq(D.parkToLocal('2027-03-15',6,0,'America/New_York').time,'6:00');
eq(D.parkToLocal('2027-03-15',6,0,'Europe/Madrid').time,'11:00');   // Madrid ya en horario de verano? (29/3) no: UTC+1 -> 11:00
eq(D.parkToLocal('2027-07-15',6,0,'Europe/Madrid').time,'12:00');
ok(D.parkToLocal('2027-03-15',6,0,'Australia/Sydney').dayShift===0||D.parkToLocal('2027-03-15',6,0,'Australia/Sydney').dayShift===1,'Sydney cruza de día');
// ventana de reservas: abre a las 6:00 de Florida
const open='2027-01-13', before=D.instantAt(open,5,59,'America/New_York'), after=D.instantAt(open,6,0,'America/New_York');
eq(D.windowOpened(open,before),false);eq(D.windowOpened(open,after),true);
// "hoy" en la zona de la agencia: 23:30 en Buenos Aires ya es el día siguiente en UTC
const ms=Date.UTC(2026,10,11,2,30);   // 10/11 23:30 hora Argentina
eq(D.todayIn('America/Argentina/Buenos_Aires',ms),'2026-11-10');eq(D.todayIn('UTC',ms),'2026-11-11');
eq(D.ageText('2026-11-10','2026-11-11'),'hace 1 día');eq(D.ageText('2026-11-11','2026-11-11'),'hoy');eq(D.daysTo('2027-03-14','2026-11-11'),123);
eq(D.dayName('2027-03-14'),'Domingo');eq(D.full('2027-03-14',true),'domingo, 14 de marzo');
console.log('dates.test: '+n+' verificaciones OK');
