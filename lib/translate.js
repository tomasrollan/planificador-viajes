/* Traducción de menús EN -> ES a partir del diccionario data/es.json ({names, terms, alg}). Sin IA en el navegador: todo es lookup.
   Los nombres propios, marcas y platos sin entrada quedan como están. */
(function(root,factory){ if(typeof module==='object'&&module.exports) module.exports=factory(); else root.Translate=factory(); })(typeof self!=='undefined'?self:this,function(){
  var ALG=/\s*\((?:for |contains )?[^()]*allerg[^()]*\)/ig;
  function split(s){ var out=[],d=0,cur=''; for(var i=0;i<s.length;i++){ var ch=s[i]; if(ch==='(')d++; if(ch===')')d--; if(ch===','&&d===0){ out.push(cur); cur=''; } else cur+=ch; } out.push(cur); return out.map(function(x){return x.trim();}).filter(Boolean); }
  function cap(t){ return t.charAt(0).toUpperCase()+t.slice(1); }
  function create(ES){
    ES=ES||{names:{},terms:{},alg:{}};
    function name(en){ return ES.names[en]||en; }
    /* descripción: términos traducidos unidos por ", " + frases de alergia al final (traducidas literalmente) */
    function desc(d){
      if(!d) return '';
      var phr=(d.match(ALG)||[]).map(function(x){return x.trim();});
      var base=d.replace(ALG,'');
      var parts=split(base).map(function(t){ var k=t.toLowerCase(); return ES.terms[k]!==undefined?ES.terms[k]:t; });
      var out=parts.join(', ');
      if(out) out=cap(out);
      if(phr.length) out+=(out?' ':'')+phr.map(function(p){ return ES.alg[p]||p; }).join(' ');
      return out;
    }
    return {name:name,desc:desc,split:split};
  }
  return {create:create,split:split,ALG:ALG};
});
