/* html`...${valor}...`: escapa automáticamente cada valor interpolado (salvo los marcados con raw() o que ya vengan de otro html``).
   Reemplaza al armado por concatenación ('<b>'+esc(x)+'</b>') donde es fácil olvidarse del esc(). */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Html=factory(); })(typeof self!=='undefined'?self:this,function(){
  function Raw(s){ this.s=s; } Raw.prototype.toString=function(){ return this.s; };
  var MAP={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){ return MAP[c]; }); }
  function raw(s){ return new Raw(s==null?'':String(s)); }
  function part(v){ if(v instanceof Raw) return v.s; if(Array.isArray(v)) return v.map(part).join(''); if(v===false||v==null) return ''; return esc(v); }
  function html(strings){ var out=strings[0]; for(var i=1;i<strings.length;i++) out+=part(arguments[i])+strings[i]; return new Raw(out); }
  return {html:html,raw:raw,esc:esc,Raw:Raw};
});
