'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const actions={};
function node(id){
  return {id,hidden:id==='dialog-host'||id==='toast',innerHTML:'',textContent:'',scrollTop:0,
    classList:{values:new Set(),toggle(n,on){if(on)this.values.add(n);else this.values.delete(n);},contains(n){return this.values.has(n);}}};
}
const ids=['app','home-screen','battle-screen','content-screen','dialog-host','toast','viewport'];
const nodes=Object.fromEntries(ids.map(x=>[x,node(x)]));
const nav=['home','battle','party','codex','menu'].map(id=>({dataset:{go:id},classList:node('t').classList}));
const doc={getElementById:id=>nodes[id],querySelectorAll:()=>nav,addEventListener:(key,callback)=>{actions[key]=callback;}};
const mutations=[{id:'rapid',name:'高速詠唱',desc:'連射速度上昇'},{id:'recovery',name:'生命の祝福',desc:'HP上昇'}];
let snap={mode:'battle',stage:2,room:1,hp:72,maxHp:100,mana:40,gear:['fire','ice'],collection:['neutral','fire','ice','water'],mutations:[],mastery:{fire:5,ice:6},familiar:false};
let newRuns=0, equips=[];
const bridge={snapshot:()=>JSON.parse(JSON.stringify(snap)),startNew:()=>{newRuns++;snap.mode='altar';},equip:(slot,el)=>{equips.push([slot,el]);snap.gear[slot]=el;return true;},mutationOptions:()=>mutations.map(m=>({...m,active:snap.mutations.includes(m.id)})),tryMutation:(id)=>{if(snap.mutations.includes(id))return false;snap.mutations.push(id);return true;}};
const context={document:doc,localStorage:{getItem:()=>null,setItem:()=>{}},ElementalGameUI:bridge,ElementalMechanics:{MUTATIONS:mutations},setTimeout:()=>1,clearTimeout:()=>{},console,Math,Set,Array,JSON};
context.globalThis=context;vm.createContext(context);
const source=fs.readFileSync(path.join(root,'prototype/ui.js'),'utf8');
vm.runInContext(source,context);
function click(dataset){
 const b={dataset,closest:()=>b};
 actions.click({target:b});
}
assert.ok(!nodes['home-screen'].hidden,'home visible');
assert.equal(context.ElementalAppShell.isPaused(),true);
click({go:'battle'});assert.ok(!nodes['battle-screen'].hidden);assert.equal(context.ElementalAppShell.isPaused(),false);
click({action:'pause'});assert.equal(nodes['dialog-host'].hidden,false);assert.equal(context.ElementalAppShell.isPaused(),true);
click({action:'resume'});assert.equal(nodes['dialog-host'].hidden,true);assert.equal(context.ElementalAppShell.isPaused(),false);
click({go:'party'});assert.ok(nodes['content-screen'].innerHTML.includes('装備枠'));
click({action:'slot',slot:'1'});
click({action:'equip',element:'water'});assert.equal(snap.gear[1],'water');assert.equal(equips.length,1);
click({go:'codex'});assert.ok(nodes['content-screen'].innerHTML.includes('モンスター図鑑'));
click({action:'monster',monster:'poison_slime'});assert.ok(nodes['dialog-host'].innerHTML.includes('突進'));click({action:'close-dialog'});
click({go:'upgrade'});click({action:'upgrade',upgrade:'rapid'});assert.ok(snap.mutations.includes('rapid'));
click({go:'summon'});click({action:'summon'});assert.ok(nodes['content-screen'].innerHTML.includes('召喚演出デモ'));
click({go:'inventory'});assert.ok(nodes['content-screen'].innerHTML.includes('所持品'));
click({go:'profile'});assert.ok(nodes['content-screen'].innerHTML.includes('プロフィール'));
click({go:'quests'});assert.ok(nodes['content-screen'].innerHTML.includes('ミッション'));
click({go:'settings'});assert.ok(nodes['content-screen'].innerHTML.includes('表示設定'));
click({go:'menu'});assert.ok(nodes['content-screen'].innerHTML.includes('冒険者メニュー'));
click({action:'new-run'});assert.equal(newRuns,1);assert.equal(context.ElementalAppShell.isPaused(),false);
console.log('PASS: Mobile UI screens, equip, codex, upgrade, summon demo, pause/resume, new run');
