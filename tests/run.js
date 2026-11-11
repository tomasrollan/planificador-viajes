// Corre todo: tests unitarios de lib/, build (con validación de datos) y tests de flujos en jsdom.
const {execSync,spawnSync}=require('child_process'),path=require('path'),fs=require('fs');
const R=path.join(__dirname,'..');let fail=0;
const run=(label,cmd,opts)=>{const r=spawnSync('bash',['-c',cmd],Object.assign({cwd:R,encoding:'utf8',env:Object.assign({},process.env,{NODE_PATH:'/home/claude/tools/node_modules'})},opts));
  const ok=r.status===0&&!/ERR\s*\[[^\]]+\]|ERRORES:\s*\[[^\]]+\]|TypeError|AssertionError/.test(r.stdout+r.stderr);if(!ok)fail++;console.log((ok?'✔ ':'✘ ')+label+(ok?'':'\n'+(r.stdout+r.stderr).split('\n').slice(-12).join('\n')));return r.stdout};
['dates','repo','rules','html','translate','features','universal','agencytools','budget','payments'].forEach(n=>run('unit '+n,'node tests/'+n+'.test.js'));
run('build + validación de datos','node build.js');
['test3','test7','test8','test9','test10','test11','test12','test13','test14','test15','test16','test17'].forEach(n=>run('flujos '+n,'node tests/e2e/'+n+'.js'));
console.log(fail?'\n'+fail+' grupo(s) con fallas':'\nTodo en verde');process.exit(fail?1:0);
