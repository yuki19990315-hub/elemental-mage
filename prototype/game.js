'use strict';
/* Elemental Mage: data-driven vertical playable prototype. Not a finished APK. */
const L=globalThis.ElementalLogic;
const M=globalThis.ElementalMechanics;
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d',{alpha:false});
ctx.imageSmoothingEnabled=false;
const W=360,H=640,area={l:39,r:321,t:77,b:515},TWO=Math.PI*2;
const basicColors={neutral:'#dfd7fa',fire:'#ff763c',water:'#51b6f5',ice:'#b9efff',lightning:'#ffda5d',wind:'#72eab1',earth:'#bb8a60',light:'#fff0b0',dark:'#aa64ed'};
const basicNames={neutral:'無',fire:'炎',water:'水',ice:'氷',lightning:'雷',wind:'風',earth:'土',light:'光',dark:'闇'};
const artEnemy={slime:'slime',eyeball:'evil_eye',cultist:'dark_mage',crystal:'crystal_beast',bat:'night_bat',golem:'stone_golem',poison_slime:'poison_slime',crystal_golem:'crystal_golem',abyss_eye:'abyss_eye',sorcerer_light:'sorcerer_light',phantom_dark:'phantom_dark'};
const artBoss={lava_titan:'boss_fire_giant',frost_queen:'boss_ice_queen',abyss_eye_boss:'boss_abyss_eye'};
const legacyEnemy={slime:'slime',eyeball:'eyeball',cultist:'cultist',crystal:'crystal',bat:'bat',golem:'golem'};
const legacyBoss={lava_titan:'lava_titan',frost_queen:'frost_queen',abyss_eye_boss:'abyss_eye'};
const enemyNames={slime:'スライム',eyeball:'魔眼',cultist:'魔導師',crystal:'結晶体',bat:'コウモリ',golem:'岩石ゴーレム',poison_slime:'ポイズンスライム',crystal_golem:'蒼氷の結晶体',abyss_eye:'深淵の魔眼',sorcerer_light:'光輝の使徒',phantom_dark:'深淵の彷徨者'};
const bossNames={lava_titan:'灼熱の巨人',frost_queen:'氷晶の女王',abyss_eye_boss:'深淵の魔眼'};
const eStats={slime:[30,38,11],eyeball:[38,23,11],cultist:[43,21,11],crystal:[54,21,13],bat:[30,52,10],golem:[90,18,18],poison_slime:[56,39,16],crystal_golem:[135,16,21],abyss_eye:[65,24,13],sorcerer_light:[60,20,13],phantom_dark:[70,39,14]};
const bStats={lava_titan:[310,16,32],frost_queen:[270,21,29],abyss_eye_boss:[310,18,31]};
const cache=new Map();
const ENV_THEMES=['cursed_stone','ice_sanctum','lava_temple','abyss_shrine','holy_ruins'];
const ENV_PROPS={
  crate:['cursed_crate','rune_crate'],barrel:['iron_barrel','chained_barrel'],
  pillar:['broken_pillar','rune_pillar'],brazier:['arcane_brazier','violet_brazier'],
  crystal_cluster:['azure_crystal_cluster','amethyst_crystal_cluster'],
  boulder:['rune_boulder','rune_core_boulder']
};
function theme(){return ENV_THEMES[(stage-1)%ENV_THEMES.length]}
function envTile(kind,index,x,y,w=64,h=64){
  const file='../assets/environment/v2/tiles/'+theme()+'/'+kind+'_'+index+'.png';
  if(!sprite(file,x,y,w,h))oldSVG('tiles/'+(theme()==='ice_sanctum'?'ice':theme()==='lava_temple'?'lava':'stone')+'_'+(kind==='floor'?'floor_'+(index%4):'wall'),x,y,w,h);
}
function drawObstacle(o){
  const picture=o.art||ENV_PROPS[o.kind]?.[0];
  if(!picture||!sprite('../assets/environment/v2/props/'+picture+'.png',o.x-26,o.y-27,52,52))
    oldSVG('obstacles/'+o.kind,o.x-17,o.y-17,34,34);
}

const buttons=[{x:201,y:569,r:26},{x:263,y:569,r:26},{x:325,y:569,r:28}];
const kbd={},down=[false,false,false],pointers=[null,null,null],stick={pointer:null,x:0,y:0};
let cfg={elements:null,recipes:new Map(),enemies:null,bosses:null};
let mode='altar',player=null,enemies=[],shots=[],walls=[],pickups=[],fields=[],rewardOptions=[],selected=null;
let stage=1,room=1,boss=false,elapsed=0,frameTick=0,cooldowns=[0,0,0],uid=0,swapFromPreboss=false;
let mutationOptions=[],routeChoice='safe',activeShooter=0;
function clamp(v,a,b){return L.clamp(v,a,b)}
function choice(arr){return arr[Math.floor(Math.random()*arr.length)]}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function rand(a,b){return a+Math.random()*(b-a)}
function img(src){if(!cache.has(src)){const i=new Image();i.src=src;cache.set(src,i)}return cache.get(src)}
function sprite(src,x,y,w,h){const i=img(src);if(i.complete&&i.naturalWidth)ctx.drawImage(i,Math.round(x),Math.round(y),w,h);return !!(i.complete&&i.naturalWidth)}
function oldSVG(path,x,y,w,h){return sprite('../assets/'+path+'.svg',x,y,w,h)}
function color(el){return cfg.elements?.find(x=>x.id===el)?.color||basicColors[el]||'#eee'}
function label(el){return cfg.elements?.find(x=>x.id===el)?.name||basicNames[el]||el}
async function loadData(){
  try{
    const paths=['elements','fusion_recipes','enemies','bosses'];
    const all=await Promise.all(paths.map(async p=>{const r=await fetch('../data/'+p+'.json',{cache:'no-cache'});if(!r.ok)throw Error(p);return r.json()}));
    cfg.elements=all[0];cfg.recipes=new Map(all[1].map(x=>[L.pairKey(...x.elements),x]));cfg.enemies=all[2];cfg.bosses=all[3];
  }catch(err){console.warn('Using offline fallback definitions:',err)}
}
function createMob(kind,x,y,isBoss=false){
  const [base,speed,r]=(isBoss?bStats[kind]:eStats[kind])||[48,25,12];
  const hp=Math.round(base*(1+Math.min(4,stage-1)*.24));
  const mob={id:++uid,kind,x,y,r,hp,maxHp:hp,speed,isBoss,clock:rand(0,5),cool:rand(.75,1.7),state:'approach',stateTime:0,lockAngle:0,dashSpeed:0,stun:0,attackFx:0,hitFx:0,burn:0,slow:0,freeze:0,freezeHits:0,immune:0};
  if(isBoss)mob.parts=[{dx:-20,dy:-7,hp:52},{dx:20,dy:-7,hp:52}];
  return mob;
}
function start(){
  player={x:180,y:425,angle:-Math.PI/2,hp:100,maxHp:100,gear:['neutral','neutral'],inv:0,mana:0,mastery:{},mutations:[],familiar:false,familiarCooldown:1,cursedPower:0};
  stage=1;room=1;cooldowns=[0,0,0];mode='altar';rewardOptions=randomElements(2);selected=null;swapFromPreboss=false;mutationOptions=[];routeChoice='safe';
  enemies=[];shots=[];walls=[];pickups=[];fields=[];
}
function randomElements(num){return [...L.ELEMENTS].sort(()=>Math.random()-.5).slice(0,num)}
function resetRoom(isBoss){
  boss=isBoss;mode='battle';enemies=[];shots=[];walls=[];pickups=[];fields=[];elapsed=0;
  player.x=180;player.y=445;
  const objects=['crate','barrel','boulder','crystal_cluster','pillar','brazier'];
  for(let i=0;i<(boss?2:3+Math.min(2,stage));i++){
    const x=rand(72,287),y=rand(158,399);
    if(Math.hypot(x-player.x,y-player.y)<88)continue;
    const kind=choice(objects),art=choice(ENV_PROPS[kind]);walls.push({x,y,r:14,kind,art,hp:kind==='brazier'?50:38});
  }
  if(boss){
    const names=['lava_titan','frost_queen','abyss_eye_boss'];
    enemies.push(createMob(names[(stage-1)%3],180,171,true));
  }else{
    const base=['slime','eyeball','cultist','crystal','bat','golem'];
    const advanced=['poison_slime','crystal_golem','abyss_eye','sorcerer_light','phantom_dark'];
    const variants=stage===1?[...base,'poison_slime']:stage===2?[...base,...advanced.slice(0,3)]:[...base,...advanced];
    for(let i=0,n=3+Math.min(3,stage)+(routeChoice==='danger'?2:0);i<n;i++){
      const a=(i/n)*TWO,x=clamp(180+118*Math.cos(a),area.l+25,area.r-25),y=clamp(277+125*Math.sin(a),area.t+25,area.b-40);
      enemies.push(createMob(choice(variants),x,y));
    }
  }
}
function advance(){
  if(boss){stage++;room=1;player.hp=Math.min(player.maxHp,player.hp+25);mode='route';}
  else if(room===1){mode='mutation';mutationOptions=M.randomMutations(player.mutations);}
  else if(room===2&&stage>1){mode='curse';}
  else if(room>=3){mode='preboss';rewardOptions=randomElements(2);}
  else{room++;resetRoom(false);}
}
function startSwap(el){selected=el;swapFromPreboss=false;mode='swap';}
function pickupElement(el){if(!el)return;startSwap(el)}
function damagePlayer(dmg,knockAngle=null){if(player.inv>0||mode!=='battle')return;player.hp=Math.max(0,player.hp-dmg);player.inv=.9;
  if(knockAngle!==null){player.x=clamp(player.x+Math.cos(knockAngle)*14,area.l+13,area.r-13);player.y=clamp(player.y+Math.sin(knockAngle)*14,area.t+13,area.b-13)}
  if(player.hp<=0)mode='dead';
}
function spawnShot(x,y,angle,speed,element,damage,friendly,opts={}){
  if(shots.length>=320)return;
  shots.push({x,y,angle,speed,element,damage:friendly?Math.round(damage*M.damageMultiplier(player,element)):damage,sourceId:friendly?0:activeShooter,friendly,spritePath:opts.spritePath||((friendly&&element==='fusion')?'assets/projectiles/fusion_fire_water.svg':(friendly?'assets/projectiles/'+element+'_0.svg':'assets/projectiles/'+(element==='enemy_orb'?'enemy_orb_0':element+'_0')+'.svg')),r:opts.r||5,life:opts.life||3,hitIds:new Set(),homing:opts.homing||0,bounce:opts.bounce||0,pierce:opts.pierce||0,spin:opts.spin||0,destroyBullets:!!opts.destroyBullets});
}
function fusion(){const key=L.pairKey(player.gear[0],player.gear[1]);return key?cfg.recipes.get(key)||{name:'合成魔法',status:'design_only'}:null;}
function cast(slot){
  if(mode!=='battle'||cooldowns[slot]>0)return;
  const p=player,a=p.angle,el=p.gear[slot];
  if(slot===2){
    const fx=fusion();if(!fx)return;
    const power=M.fusionBoost(p);
    const fusionSprite=fx.asset||'assets/projectiles/fusion_fire_water.svg';
    const combo=[p.gear[0],p.gear[1]],boost=combo.includes('light')?4:0;
    if(combo.includes('dark')){
      fields.push({x:p.x+Math.cos(a)*90,y:p.y+Math.sin(a)*90,r:55,life:1.8,type:'void',damage:(12+boost)*power});
    }else if(combo.includes('wind')){
      for(let d=-2;d<=2;d++)spawnShot(p.x,p.y,a+d*.16,250,'fusion',(27+boost)*power,true,{r:10,pierce:1,spritePath:fusionSprite});
    }else if(combo.includes('earth')){
      fields.push({x:p.x+Math.cos(a)*90,y:p.y+Math.sin(a)*90,r:46,life:1.7,type:'shield',damage:(16+boost)*power});
    }else{
      for(let d=-1;d<=1;d++)spawnShot(p.x,p.y,a+d*.19,240,'fusion',(29+boost)*power,true,{r:11,pierce:1,spritePath:fusionSprite});
    }
    if(combo.includes('light'))p.hp=Math.min(p.maxHp,p.hp+5);
    cooldowns[2]=fx.cooldownSeconds||5.5;return;
  }
  const opts={r:6};let damage=14,speed=290,cd=.3;
  if(el==='neutral'){damage=11;cd=.29}
  if(el==='fire'){damage=17;opts.r=8}
  if(el==='water'){damage=12;opts.pierce=2;speed=310}
  if(el==='ice'){damage=12;cd=.24}
  if(el==='lightning'){damage=11;speed=440;cd=.18}
  if(el==='earth'){damage=23;speed=200;cd=.52;opts.r=10;opts.destroyBullets=true}
  if(el==='light'){damage=12;speed=475;opts.pierce=3;cd=.34}
  if(el==='dark'){damage=13;speed=140;opts.r=12;opts.destroyBullets=true;cd=.55}
  if(el==='wind'){
    for(const d of ((p.mastery[el]||0)>=25?[-.36,-.18,0,.18,.36]:[-.27,0,.27]))spawnShot(p.x,p.y,a+d,265,el,9,true,{r:5});
    cd=.39;
  }else spawnShot(p.x,p.y,a,speed,el,damage,true,opts);
  player.mastery[el]=(player.mastery[el]||0)+1;
  if(player.mutations.includes('rapid'))cd*=.77;
  cooldowns[slot]=cd;
}
function beginCharge(m,seconds=.65){m.state='windup';m.stateTime=seconds;m.lockAngle=Math.atan2(player.y-m.y,player.x-m.x);m.attackFx=seconds;}
function circular(m,n,speed=120,kind='enemy_orb',shift=0){for(let i=0;i<n;i++)spawnShot(m.x,m.y,i*TWO/n+shift,speed,kind,9,false)}
function enemyShoot(m){
  activeShooter=m.id;
  const a=Math.atan2(player.y-m.y,player.x-m.x);
  if(m.isBoss){
    if(m.kind==='lava_titan'){circular(m,m.hp<m.maxHp*.5?18:12,115,'fire',elapsed*.12);fields.push({x:rand(area.l+45,area.r-45),y:rand(area.t+75,area.b-75),r:23,life:2.1,type:'lava',damage:9});m.cool=m.hp<m.maxHp*.5?1:1.6;}
    if(m.kind==='frost_queen'){for(const d of [-.45,-.22,0,.22,.45])spawnShot(m.x,m.y,a+d,147,'ice',10,false,{bounce:1});m.cool=1.45;}
    if(m.kind==='abyss_eye_boss'){circular(m,14,124,'dark',elapsed*.8);spawnShot(m.x,m.y,a,135,'lightning',11,false,{homing:2.1});m.cool=1.5;}
    m.attackFx=.28;return;
  }
  if(m.kind==='poison_slime'||m.kind==='phantom_dark'){beginCharge(m,m.kind==='phantom_dark'?.4:.7);m.cool=2.8;return;}
  if(m.kind==='crystal_golem'){for(const d of [-.5,0,.5])spawnShot(m.x,m.y,a+d,138,'ice',11,false,{bounce:2});m.cool=2.1;}
  else if(m.kind==='abyss_eye'){spawnShot(m.x,m.y,a,105,'lightning',10,false,{homing:2.5});m.cool=1.8;}
  else if(m.kind==='sorcerer_light'){m.state='laser_windup';m.stateTime=.85;m.lockAngle=a;m.cool=2.9;}
  else if(m.kind==='cultist'){for(const d of [-.26,0,.26])spawnShot(m.x,m.y,a+d,123,'dark',9,false);m.cool=1.55;}
  else if(m.kind==='eyeball'){spawnShot(m.x,m.y,a,115,'dark',10,false,{homing:1.2});m.cool=1.45;}
  else if(m.kind==='crystal'){circular(m,8,99,'ice');m.cool=1.85;}
  else if(m.kind==='golem'){circular(m,10,91,'earth');m.cool=2.25;}
  else if(m.kind==='bat'){for(const d of [-.16,0,.16])spawnShot(m.x,m.y,a+d,130,'dark',8,false);m.cool=1.4;}
  else{spawnShot(m.x,m.y,a,106,'enemy_orb',8,false);m.cool=1.65;}
  m.attackFx=.26;
}
function updateMob(m,dt){
  m.clock+=dt;m.cool-=dt;m.attackFx=Math.max(0,m.attackFx-dt);m.hitFx=Math.max(0,m.hitFx-dt);
  if(m.burn>0){m.burn-=dt;m.hp-=2.5*dt}
  m.slow=Math.max(0,m.slow-dt);m.freeze=Math.max(0,m.freeze-dt);
  m.stun=Math.max(0,m.stun-dt);
  if(m.stun>0||m.freeze>0)return;
  if(m.state==='windup'||m.state==='laser_windup'){
    m.stateTime-=dt;
    if(m.stateTime<=0){
      if(m.state==='laser_windup'){
        const sx=m.x,sy=m.y,dx=Math.cos(m.lockAngle),dy=Math.sin(m.lockAngle);
        const d=L.pointSegmentDistance(player.x,player.y,sx,sy,sx+dx*430,sy+dy*430);
        if(d<12)damagePlayer(18,m.lockAngle);
        fields.push({x:sx,y:sy,angle:m.lockAngle,type:'laser',life:.18,r:2,damage:0});
        m.state='approach';
      }else{m.state='dash';m.stateTime=.32;m.dashSpeed=m.kind==='poison_slime'?315:375;}
    }
    return;
  }
  if(m.state==='dash'){
    const nx=m.x+Math.cos(m.lockAngle)*m.dashSpeed*dt,ny=m.y+Math.sin(m.lockAngle)*m.dashSpeed*dt;
    const blocked=nx<area.l+m.r||nx>area.r-m.r||ny<area.t+m.r||ny>area.b-m.r||L.dashHitsObstacle(m.x,m.y,nx,ny,walls,m.r*.65);
    if(blocked){m.stun=m.kind==='poison_slime'?1.8:.45;m.state='approach';m.stateTime=0;}
    else{m.x=nx;m.y=ny;if(dist(m,player)<m.r+10)damagePlayer(m.kind==='poison_slime'?24:18,m.lockAngle)}
    m.stateTime-=dt;if(m.stateTime<=0)m.state='approach';return;
  }
  const a=Math.atan2(player.y-m.y,player.x-m.x),range=m.kind==='sorcerer_light'?110:42;
  const pace=m.speed*(m.slow>0?.55:1)*(m.isBoss?.88:1);
  if(dist(m,player)>range+m.r){const nx=clamp(m.x+Math.cos(a)*pace*dt,area.l+m.r,area.r-m.r),ny=clamp(m.y+Math.sin(a)*pace*dt,area.t+m.r,area.b-m.r);if(!L.dashHitsObstacle(m.x,m.y,nx,ny,walls,m.r*.6)){m.x=nx;m.y=ny;}}
  if(dist(m,player)<m.r+10)damagePlayer(m.isBoss?22:12,a);
  if(m.cool<=0)enemyShoot(m);
}
function damageMob(m,dmg,element,shotAngle){
  if(m.immune>0)return;
  m.hp-=dmg;m.hitFx=.15;
  if(['water','lightning','ice','fire'].includes(element)&&(element!=='water'||fields.filter(f=>f.type==='wet').length<8))
    M.terrainReact(fields,element,m.x,m.y);
  if(element==='fire')m.burn=Math.max(m.burn,3);
  if(element==='ice'){m.slow=1.8;m.freezeHits++;if(m.freezeHits>=3){m.freeze=.8;m.freezeHits=0;}}
  if(element==='water'){m.x=clamp(m.x+Math.cos(shotAngle)*15,area.l+m.r,area.r-m.r);m.y=clamp(m.y+Math.sin(shotAngle)*15,area.t+m.r,area.b-m.r)}
  if(element==='lightning')for(const other of enemies){if(other!==m&&dist(other,m)<52)other.hp-=4;}
  if(element==='dark')m.slow=Math.max(m.slow,1.2);
  if(m.hp<=0&&!m.isBoss&&!m.deadDropDone){m.deadDropDone=true;if(Math.random()<.15)pickups.push({x:m.x,y:m.y,element:choice(L.ELEMENTS)});}
}
function updateShots(dt){
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i];s.life-=dt;
    if(s.homing&&player&&mode==='battle')s.angle=L.steerAngle(s.angle,Math.atan2(player.y-s.y,player.x-s.x),s.homing*dt);
    s.angle+=s.spin*dt;s.x+=Math.cos(s.angle)*s.speed*dt;s.y+=Math.sin(s.angle)*s.speed*dt;
    if(s.life<=0){shots.splice(i,1);continue;}
    if(s.x<area.l+s.r||s.x>area.r-s.r||s.y<area.t+s.r||s.y>area.b-s.r){
      if(s.bounce>0){if(s.x<area.l+s.r||s.x>area.r-s.r)s.angle=Math.PI-s.angle;if(s.y<area.t+s.r||s.y>area.b-s.r)s.angle=-s.angle;s.x=clamp(s.x,area.l+s.r,area.r-s.r);s.y=clamp(s.y,area.t+s.r,area.b-s.r);s.bounce--;}
      else{shots.splice(i,1);continue;}
    }
    let obstacle=false;
    for(const o of walls){if(Math.hypot(s.x-o.x,s.y-o.y)<s.r+o.r){obstacle=true;break;}}
    if(obstacle){if(s.bounce>0){s.angle+=Math.PI;s.bounce--;}else{shots.splice(i,1);continue;}}
    if(s.friendly){
      for(const m of enemies){if(dist(s,m)<s.r+m.r&&!s.hitIds.has(m.id)){s.hitIds.add(m.id);damageMob(m,s.damage,s.element,s.angle);if(s.pierce>0)s.pierce--;else{shots.splice(i,1);obstacle=true;}break;}}
      if(obstacle)continue;
      if(s.destroyBullets){for(let j=shots.length-1;j>=0;j--){const e=shots[j];if(e!==s&&!e.friendly&&dist(e,s)<e.r+s.r+5)shots.splice(j,1);}}
    }else if(dist(s,player)<s.r+9){damagePlayer(s.damage,s.angle);shots.splice(i,1)}
  }
}
function updateFields(dt){for(let i=fields.length-1;i>=0;i--){const f=fields[i];f.life-=dt;
  if(f.type==='void'){for(const m of enemies){const d=dist(m,f);if(d<f.r){m.x+=((f.x-m.x)/(d||1))*25*dt;m.y+=((f.y-m.y)/(d||1))*25*dt;m.hp-=f.damage*dt;}}
    for(let j=shots.length-1;j>=0;j--){if(!shots[j].friendly&&dist(shots[j],f)<f.r)shots.splice(j,1);}}
  if(f.type==='shield'){for(const m of enemies)if(dist(m,f)<f.r)m.hp-=f.damage*dt;
    for(let j=shots.length-1;j>=0;j--)if(!shots[j].friendly&&dist(shots[j],f)<f.r)shots.splice(j,1);}
  if(f.type==='lava'&&dist(f,player)<f.r)damagePlayer(f.damage);
  if(f.life<=0)fields.splice(i,1);
}}
function update(dt){
  frameTick+=dt;if(mode!=='battle')return;
  elapsed+=dt;cooldowns=cooldowns.map(c=>Math.max(0,c-dt));player.inv=Math.max(0,player.inv-dt);
  let mx=Number(!!kbd.KeyD||!!kbd.ArrowRight)-Number(!!kbd.KeyA||!!kbd.ArrowLeft)+stick.x;
  let my=Number(!!kbd.KeyS||!!kbd.ArrowDown)-Number(!!kbd.KeyW||!!kbd.ArrowUp)+stick.y;
  const n=Math.hypot(mx,my);if(n>.1){mx/=n;my/=n;player.angle=Math.atan2(my,mx);
    const nx=clamp(player.x+mx*131*dt,area.l+13,area.r-13),ny=clamp(player.y+my*131*dt,area.t+13,area.b-13);
    if(!L.dashHitsObstacle(player.x,player.y,nx,ny,walls,9)){player.x=nx;player.y=ny;}
  }
  for(let i=0;i<3;i++)if(down[i]||kbd[['KeyJ','KeyK','KeyL'][i]])cast(i);
  for(const m of enemies)updateMob(m,dt);
  updateShots(dt);updateFields(dt);
  for(let i=pickups.length-1;i>=0;i--)if(dist(pickups[i],player)<18){const p=pickups.splice(i,1)[0];pickupElement(p.element);break;}
  enemies=enemies.filter(m=>m.hp>0);
  if(enemies.length===0&&mode==='battle')mode='clear';
}
function disk(x,y,r,c,stroke){ctx.beginPath();ctx.arc(x,y,r,0,TWO);ctx.fillStyle=c;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function labelText(v,x,y,size=14,color='#f5edff',align='left'){ctx.font='bold '+size+'px system-ui';ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(v,x,y)}
function drawBeam(x,y,a,len=390,color='#ffe6a2',width=3,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();ctx.restore()}
function drawMob(m){
  const id=m.isBoss?artBoss[m.kind]:artEnemy[m.kind];
  const inAttack=m.attackFx>0||m.state==='windup'||m.state==='laser_windup';
  const state=m.stun>0?'stun':m.hitFx>0?'hit':inAttack?'attack_'+(Math.floor(frameTick*9)%2):dist(m,player)>58?'move_'+(Math.floor(frameTick*6)%2):'idle_'+(Math.floor(frameTick*3)%2);
  const size=m.isBoss?90:(m.kind==='crystal_golem'||m.kind==='golem'?55:43),base=m.isBoss?'bosses':'enemies';
  const file=`../assets/sprites/v2/${base}/${id}/${state}.png`;
  const fallback=m.isBoss?`bosses/${legacyBoss[m.kind]}`:`enemies/${legacyEnemy[m.kind]||'slime'}_0`;
  if(!sprite(file,m.x-size/2,m.y-size*.64,size,size))oldSVG(fallback,m.x-size/2,m.y-size*.64,size,size);
  if(m.hitFx>0){ctx.fillStyle='#fff9';ctx.fillRect(m.x-m.r,m.y-m.r,m.r*2,m.r*2);}
  const w=m.isBoss?72:35;
  ctx.fillStyle='#171025';ctx.fillRect(m.x-w/2,m.y-m.r-15,w,5);
  ctx.fillStyle=m.isBoss?'#ff7a80':'#ffa68a';ctx.fillRect(m.x-w/2,m.y-m.r-15,w*clamp(m.hp/m.maxHp,0,1),5);
  if(m.stun>0)labelText('★',m.x,m.y-m.r-23,14,'#ffec8f','center');
  if(m.state==='windup')drawBeam(m.x,m.y,m.lockAngle,340,'#ff415c',3,.85);
  if(m.state==='laser_windup')drawBeam(m.x,m.y,m.lockAngle,350,'#ffb852',2,.8);
}
function drawWorld(){
  ctx.fillStyle='#242036';ctx.fillRect(0,0,W,H);
  for(let y=0;y<640;y+=64)for(let x=0;x<360;x+=64)envTile('floor',((x/64+2*y/64)%4)|0,x,y);
  for(let y=64;y<520;y+=64){envTile('wall',(Math.floor(y/64)%4),0,y,64,64);envTile('wall',(Math.floor(y/64+1)%4),296,y,64,64)}
  for(const o of walls)drawObstacle(o);
  for(const f of fields){if(f.type==='laser'){drawBeam(f.x,f.y,f.angle,420,'#fff1ac',9,clamp(f.life/.18,0,1));continue;}
    disk(f.x,f.y,f.r,f.type==='lava'?'#f6533d66':f.type==='shield'?'#79dfe857':'#a65eff55');}
  for(const p of pickups){disk(p.x,p.y,13,color(p.element)+'88','#ffffff');drawElementIcon(p.element,p.x-9,p.y-9,18)}
  for(const m of enemies)drawMob(m);
  for(const b of shots){const hue=b.friendly?color(b.element==='fusion'?player.gear[0]:b.element):color(b.element);disk(b.x,b.y,b.r,hue,b.friendly?'#ffffff':'#751d38');
    sprite('../'+b.spritePath,b.x-(b.friendly?12:9),b.y-(b.friendly?12:9),b.friendly?24:18,b.friendly?24:18);}
  const angle=player.angle,dir=Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))?(Math.cos(angle)>0?'right':'left'):(Math.sin(angle)>0?'down':'up');
  if(player.inv===0||Math.floor(frameTick*13)%2===0)oldSVG('characters/mage_'+dir+'_'+(Math.floor(frameTick*7)%2),player.x-17,player.y-17,34,34);
}
function drawElementIcon(el,x,y,s){
 const newIcon=['neutral','light','dark'].includes(el),path=newIcon?'../assets/concepts/icons/'+el+'.svg':'../assets/icons/'+el+'.svg';
 if(!sprite(path,x,y,s,s)){disk(x+s/2,y+s/2,s*.34,color(el));labelText(label(el),x+s/2,y+s*.62,Math.max(10,s*.4),'#1c1630','center')}
}
function drawHud(){
  ctx.fillStyle='#0d1028ea';ctx.fillRect(8,8,344,56);
  ctx.fillStyle='#44354a';ctx.fillRect(43,20,154,14);ctx.fillStyle='#5fe5a0';ctx.fillRect(43,20,154*player.hp/player.maxHp,14);
  labelText('HP '+Math.ceil(player.hp)+'/'+player.maxHp,42,53,12);
  labelText(boss?'BOSS':'FLOOR '+stage+' / '+room+'-3',227,30,13);
  if(boss)labelText(bossNames[enemies[0]?.kind]||'BOSS',227,52,12);
  ctx.fillStyle='#131320c9';ctx.fillRect(0,519,360,121);
  disk(72,570,51,'#12152a9e','#a395bc');disk(72+stick.x*26,570+stick.y*26,24,'#8d8ba5a0');
  const fx=fusion();
  for(let i=0;i<3;i++){
    const b=buttons[i],element=i===0?player.gear[0]:i===1?player.gear[1]:null;
    disk(b.x,b.y,b.r,i===2?'#3b2456dd':'#252039dd','#b29bd5');
    if(element)drawElementIcon(element,b.x-15,b.y-15,30);
    else{labelText(fx?'✦':'×',b.x,b.y+7,23,fx?'#f3c6ff':'#65536e','center');}
    if((i===2&&!fx)||cooldowns[i]>0){disk(b.x,b.y,b.r-3,'#0b0c17b9');if(cooldowns[i]>0)labelText(cooldowns[i].toFixed(1),b.x,b.y+5,12,'#f5eaff','center');}
  }
}
function overlay(){if(mode==='battle')return;
 ctx.fillStyle='#0b091bda';ctx.fillRect(32,96,296,402);
 if(mode==='clear'){labelText(boss?'ボス撃破！':'部屋クリア！',180,249,27,'#f4d17d','center');labelText('タップして次へ',180,304,16,'#f4eaff','center');}
 if(mode==='dead'){labelText('GAME OVER',180,247,27,'#ff8392','center');labelText('タップして再挑戦',180,301,16,'#f4eaff','center');}
 if(mode==='altar'||mode==='preboss'){
  const altar=mode==='altar';labelText(altar?'始祖小祠の祭壇':'ボス直前の報酬',180,153,22,'#f4d17d','center');
  labelText(altar?'最初の属性を1つ選ぶ':'2つのうち1つを選択',180,188,15,'#d5cee8','center');
  for(let i=0;i<2;i++){const x=i?193:47;ctx.fillStyle='#352e54';ctx.fillRect(x,225,120,164);drawElementIcon(rewardOptions[i],x+39,249,42);labelText(label(rewardOptions[i])+'の魔導石',x+60,324,14,'#fff6e9','center');labelText('タップで選択',x+60,356,12,'#d8c9f5','center')}
 }
 if(mode==='swap'){
  labelText('装備を入れ替える',180,159,23,'#f4d17d','center');
  labelText(label(selected)+'の魔導石：交換する枠を選択',180,195,13,'#e5dcf8','center');
  for(let i=0;i<2;i++){const x=i?193:47;ctx.fillStyle='#352e54';ctx.fillRect(x,224,120,163);drawElementIcon(player.gear[i],x+39,246,42);labelText('装備 '+(i+1),x+60,322,15,'#fff4e6','center');labelText(label(player.gear[i]),x+60,354,13,'#d8c9f5','center')}
  if(!swapFromPreboss)labelText('下をタップでキャンセル',180,428,13,'#c4adc9','center');
 }
}
function drawScene(){drawWorld();drawHud();overlay()}
function tapOverlay(x,y){if(mode==='battle')return false;
 if(mode==='dead'){start();return true;}
 if(mode==='clear'){advance();return true;}
 if((mode==='altar'||mode==='preboss')&&y>=225&&y<=397){
   const sourceMode=mode;selected=rewardOptions[x<180?0:1];if(sourceMode==='altar'){player.gear[0]=selected;selected=null;resetRoom(false)}else{swapFromPreboss=true;mode='swap';}return true;
 }
 if(mode==='swap'){
   if(y>=224&&y<=388){player.gear[x<180?0:1]=selected;selected=null;if(swapFromPreboss){swapFromPreboss=false;resetRoom(true)}else mode='battle';return true;}
   if(y>=410&&!swapFromPreboss){selected=null;mode='battle';return true;}
 }
 return true;
}
function pointerCoords(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height}}
function release(id){if(stick.pointer===id){stick.pointer=null;stick.x=stick.y=0}for(let i=0;i<3;i++)if(pointers[i]===id){pointers[i]=null;down[i]=false}}
canvas.addEventListener('pointerdown',e=>{
 e.preventDefault();canvas.setPointerCapture(e.pointerId);const p=pointerCoords(e);
 if(tapOverlay(p.x,p.y))return;
 if(p.x<142&&p.y>519&&stick.pointer===null){stick.pointer=e.pointerId;stick.x=clamp((p.x-72)/48,-1,1);stick.y=clamp((p.y-570)/48,-1,1);return;}
 for(let i=0;i<3;i++)if(dist(p,buttons[i])<buttons[i].r+10){pointers[i]=e.pointerId;down[i]=true;cast(i);return;}
});
canvas.addEventListener('pointermove',e=>{if(stick.pointer===e.pointerId){const p=pointerCoords(e);stick.x=clamp((p.x-72)/48,-1,1);stick.y=clamp((p.y-570)/48,-1,1);}});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>release(e.pointerId));
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();
 if(e.code==='Enter'&&mode!=='battle'){tapOverlay(110,300);}kbd[e.code]=true;});
window.addEventListener('keyup',e=>kbd[e.code]=false);
let last=performance.now();function loop(now){const dt=clamp((now-last)/1000,0,.033);last=now;if(player){update(dt);drawScene();}requestAnimationFrame(loop)}
loadData().finally(()=>start());requestAnimationFrame(loop);