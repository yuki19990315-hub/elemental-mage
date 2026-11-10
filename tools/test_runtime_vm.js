'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..');
const fn=()=>{};
const context2d={beginPath:fn,arc:fn,fill:fn,stroke:fn,fillRect:fn,fillText:fn,drawImage:fn,moveTo:fn,lineTo:fn,save:fn,restore:fn};
const canvas={getContext:()=>context2d,addEventListener:fn,getBoundingClientRect:()=>({left:0,top:0,width:360,height:640}),setPointerCapture:fn};
const s={document:{querySelector:()=>canvas},window:{addEventListener:fn},Image:function(){this.complete=false;this.naturalWidth=0;},performance:{now:()=>1000},requestAnimationFrame:fn,fetch:()=>Promise.reject(new Error('network disabled for test')),console:{warn:fn,log:fn},Math,Set,Map};
s.globalThis=s;vm.createContext(s);
for(const file of ['prototype/logic.js','prototype/game.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),s,{filename:file});
function run(code){return vm.runInContext(code,s)}
run('start()');
assert.equal(run('mode'),'altar');
assert.equal(run('player.gear[0]'),'neutral');
assert.equal(run('player.gear[1]'),'neutral');
run('drawScene()');
run('tapOverlay(110,300)');
assert.equal(run('mode'),'battle');
assert.equal(run('enemies.length'),4);
for(const id of ['slime','poison_slime','crystal_golem','abyss_eye','sorcerer_light','phantom_dark']){
 run(`enemies=[createMob(${JSON.stringify(id)},160,160)];`);
 run('enemies[0].cool=-1;updateMob(enemies[0],0.016);drawScene()');
}
// Check obstacle collision stuns the poison charger.
run("walls=[{x:180,y:170,r:14,kind:'crate'}];enemies=[createMob('poison_slime',140,170)];enemies[0].state='dash';enemies[0].lockAngle=0;enemies[0].stateTime=.25;enemies[0].dashSpeed=350;updateMob(enemies[0],.08)");
assert.ok(run('enemies[0].stun')>0);
for(const element of ['neutral','fire','water','ice','lightning','wind','earth','light','dark']){
 run(`player.gear[0]=${JSON.stringify(element)};cooldowns[0]=0;cast(0);`);
}
run("enemies=[];room=3;boss=false;mode='preboss';rewardOptions=['light','dark'];tapOverlay(110,300);");
assert.equal(run('mode'),'swap');
run('tapOverlay(110,300)');
assert.equal(run('mode'),'battle');
assert.equal(run('boss'),true);
run('drawScene()');
console.log('PASS: virtual canvas run, altar, element casts, 5 enemy AI, obstacle stun, pre-boss 2 choice, boss sprite');