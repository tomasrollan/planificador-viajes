/* ======================= estado de UI ======================= */
var UI={pf:{q:'',f:'all',st:'',o:'fecha'},cf:{q:'',cid:'',prio:'',st:'',type:'',view:'board'},role:'agus',route:'panel',cid:null,tab:'agenda',unlocked:{},filt:{q:'',zone:'',tipo:'',cred:'',tier:'',sort:'rating',onlyRated:false},who:null};
function nights(c){ return Dates.nights(c.start,c.end); }
function fmtDate(iso,long){ return Dates.full(iso,long); }
function dayName(iso){ return Dates.dayName(iso); }
function dayLong(iso){ return Dates.dayLong(iso); }
function fmtShort(iso){ return Dates.short(iso); }
function toast(t,act){ var e=document.createElement('div'); e.className='toast'; e.setAttribute('role','status'); e.innerHTML=I('check')+'<span>'+esc(t)+'</span>'+(act?'<button class="tbtn" data-undo="1">'+esc(act.label)+'</button>':''); if(act) UI.undo=act.fn; document.body.appendChild(e); setTimeout(function(){e.remove()},act?7000:2400); }
function copy(txt,okmsg){ try{ navigator.clipboard.writeText(txt).then(function(){toast(okmsg||'Copiado')},function(){toast('No se pudo copiar: seleccioná el texto')}); }catch(e){ toast('No se pudo copiar: seleccioná el texto'); } }
function genPin(){ return String(Math.floor(100000+Math.random()*900000)); }
function genToken(name){ return (name||'cliente').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,16)+'-'+Math.random().toString(36).slice(2,8); }
function linkFor(c){ return location.href.split('#')[0]+'#portal-'+c.token; }
function canEdit(c,slot){ return Rules.canEdit(UI.role,c,slot); }
function canAdd(c){ return Rules.canAdd(UI.role,c); }
function usedCredits(c){ return Rules.usedCredits(c,RID); }
function estimate(c,dest){ return Rules.estimate(c,RID,dest); }
function resWindow(c){ return Rules.resWindow(c,NOW()); }
var countSlots=Rules.countSlots;
function who(c){ if(!UI.who||!c.travelers.some(function(t){return t.id===UI.who})) UI.who=c.travelers[0]&&c.travelers[0].id; return UI.who; }

