const assert=require('assert'),{html,raw,esc}=require('../lib/html.js');let n=0;const eq=(a,b,m)=>{assert.strictEqual(a,b,m);n++};
eq(String(html`<b>${'<img src=x onerror=alert(1)>'}</b>`),'<b>&lt;img src=x onerror=alert(1)&gt;</b>');
eq(String(html`<input value="${'a" onfocus="x'}">`),'<input value="a&quot; onfocus=&quot;x">','atributos');
eq(String(html`<i>${raw('<b>ok</b>')}</i>`),'<i><b>ok</b></i>','raw explícito');
eq(String(html`<ul>${['a','<b>'].map(x=>html`<li>${x}</li>`)}</ul>`),'<ul><li>a</li><li>&lt;b&gt;</li></ul>','html anidado y listas');
eq(String(html`<p>${null}${undefined}${false}${0}</p>`),'<p>0</p>');eq(String(html`<p>${"O'Brien & Co"}</p>`),'<p>O&#39;Brien &amp; Co</p>');
eq(esc('<>&"\''),'&lt;&gt;&amp;&quot;&#39;');
console.log('html.test: '+n+' verificaciones OK');
