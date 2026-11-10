/* Elemental Mage v4: data-light experimental roguelite mechanics. */
(function(root){
 'use strict';
 const MUTATIONS=Object.freeze([
  {id:'arcane_power',name:'魔力増幅',desc:'魔法ダメージが20％上昇'},
  {id:'rapid',name:'高速詠唱',desc:'通常魔法の連射速度が上昇'},
  {id:'piercing',name:'貫通術式',desc:'通常魔法が敵を貫通'},
  {id:'recovery',name:'生命の祝福',desc:'最大HPと現在HPが増加'},
  {id:'familiar_orb',name:'精霊契約',desc:'精霊が自動で魔法を撃つ'},
  {id:'magnetic_soul',name:'吸魔の魂',desc:'敵弾吸収の魔力回収量が増加'}
 ]);
 function randomMutations(existing=[],random=Math.random){
  const list=MUTATIONS.filter(m=>!existing.includes(m.id));
  for(let i=list.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[list[i],list[j]]=[list[j],list[i]];}
  return list.slice(0,3);
 }
 function applyMutation(player,id){
  if(!MUTATIONS.some(x=>x.id===id)||player.mutations.includes(id))return false;
  player.mutations.push(id);
  if(id==='recovery'){player.maxHp+=25;player.hp=Math.min(player.maxHp,player.hp+40);}
  if(id==='familiar_orb'){player.familiar=true;player.familiarCooldown=.4;}
  return true;
 }
 function absorb(player,num=1){
  const multiplier=player.mutations.includes('magnetic_soul')?1.8:1;
  player.mana=Math.min(100,player.mana+num*5*multiplier);
 }
 function fusionBoost(player){
  if(player.mana>=40){player.mana-=40;return 1.65;}
  return 1;
 }
 function damageMultiplier(player,element){
  return 1 + (player.mutations.includes('arcane_power')?.2:0)
   + (player.cursedPower||0) + ((player.mastery?.[element]||0)>=25?.2:0);
 }
 function terrainReact(fields,element,x,y){
  if(element==='water'){fields.push({x,y,type:'wet',life:5,r:24,damage:0});return 'wet';}
  const near=fields.find(f=>f.type==='wet'&&Math.hypot(f.x-x,f.y-y)<(f.r+20));
  if(near&&element==='lightning'){near.type='electrified';near.life=2.4;near.damage=11;return 'electrified';}
  if(near&&element==='ice'){near.type='frozen';near.life=3.2;near.damage=0;return 'frozen';}
  if(near&&element==='fire'){near.type='steam';near.life=2.3;near.damage=0;return 'steam';}
  return null;
 }
 function breakPart(m,part,damage){
  if(!part||part.hp<=0)return false;
  part.hp-=damage;if(part.hp>0)return false;
  part.hp=0;m.hp-=25;m.cool+=.7;return true;
 }
 function friendlyFireDamage(damage){return Math.round(damage*.55);}
 function curse(player,accept){
  if(!accept)return false;
  player.maxHp=Math.max(30,player.maxHp-20);
  player.hp=Math.min(player.maxHp,Math.max(1,player.hp-20));
  player.cursedPower=(player.cursedPower||0)+.3;return true;
 }
 const api=Object.freeze({MUTATIONS,randomMutations,applyMutation,absorb,fusionBoost,damageMultiplier,terrainReact,breakPart,friendlyFireDamage,curse});
 root.ElementalMechanics=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
