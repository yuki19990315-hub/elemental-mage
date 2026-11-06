"use strict";
/* Elemental Mage: mobile portrait playable concept, not a finished APK. */
const cv=document.querySelector("#game"),ctx=cv.getContext("2d",{alpha:false});
ctx.imageSmoothingEnabled=false;
const W=360,H=640,field={l:39,t:77,r:321,b:515};
const palette={fire:"#ff793f",water:"#4bb6f0",ice:"#b6efff",lightning:"#ffdf64",wind:"#73dfb1",earth:"#bb8a5c"};
const jp={fire:"炎",water:"水",ice:"氷",lightning:"雷",wind:"風",earth:"土"};
const types=Object.keys(palette),imageCache=new Map();
function img(name){if(!imageCache.has(name)){const i=new Image();i.src="../assets/"+name+".svg";imageCache.set(name,i)}return imageCache.get(name)}
function draw(name,x,y,w,h){const i=img(name);if(i.complete&&i.naturalWidth)ctx.drawImage(i,Math.round(x),Math.round(y),w||i.naturalWidth,h||i.naturalHeight)}
function between(x,a,b){return Math.max(a,Math.min(b,x))}
function rnd(a,b){return a+Math.random()*(b-a)}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
let mode="battle",floor=1,room=1,boss=false,tick=0,mouseKeys=new Set();
const buttons=[{x:202,y:568,r:26},{x:263,y:568,r:26},{x:325,y:568,r:28}];
let player,enemy=[],bullets=[],objects=[],rewards=[],selected=null,pressed=[false,false,false],pointerButtons=[null,null,null],stick={pointer:null,x:0,y:0},cooldown=[0,0,0];
const keyboard={};
function mob(kind,x,y,large=false){const health=large?210+floor*38:kind==="golem"?70:kind==="slime"?29:42;return{kind,x,y,r:large?24:12,hp:health,maxHp:health,large,t:rnd(0,10),cd:rnd(.5,1.6),speed:large?24:rnd(20,38)}}
function start(){player={x:180,y:430,hp:100,max:100,angle:-Math.PI/2,gear:["fire","ice"],inv:0};floor=1;room=1;cooldown=[0,0,0];openRoom(false)}
function openRoom(isBoss){
 boss=isBoss;mode="battle";enemy=[];bullets=[];objects=[];tick=0;player.x=180;player.y=443;
 const kinds=["crate","barrel","boulder","crystal_cluster","pillar","brazier"];
 for(let i=0;i<(isBoss?2:4);i++){let x=rnd(69,284),y=rnd(135,412);if(Math.hypot(x-player.x,y-player.y)<76)continue;objects.push({x,y,kind:kinds[Math.floor(rnd(0,kinds.length))],r:14})}
 if(isBoss){const bosses=["lava_titan","frost_queen","abyss_eye"];enemy.push(mob(bosses[(floor-1)%3],180,171,true))}
 else{const kinds=["slime","eyeball","cultist","crystal","bat","golem"];for(let i=0,n=3+Math.min(floor,3);i<n;i++){const a=i*Math.PI*2/n;enemy.push(mob(kinds[Math.floor(rnd(0,kinds.length))],180+115*Math.cos(a),280+120*Math.sin(a)))}}
}
function advance(){if(boss){floor++;room=1;player.hp=Math.min(player.max,player.hp+25);openRoom(false)}else if(room===3){mode="reward";rewards=[...types].sort(()=>Math.random()-.5).slice(0,2)}else{room++;openRoom(false)}}
function attack(x,y,angle,speed,kind,dmg,friendly,rad=5){if(bullets.length>=260)return;bullets.push({x,y,angle,v:speed,kind,dmg,friendly,r:rad,life:3})}
function cast(which){
 if(mode!=="battle"||cooldown[which]>0)return;
 const a=player.angle,p=player,el=which===2?player.gear[0]:player.gear[which];
 if(which===2){const pair=[...p.gear].sort().join("_");const spread=[-0.18,0,0.18];for(const k of spread)attack(p.x,p.y,a+k,245,"fusion_"+pair,23,true,11);cooldown[2]=5.2}
 else{attack(p.x,p.y,a,295,el,el==="fire"?17:14,true,6);cooldown[which]=el==="lightning"?.17:.27}
}
function enemyFire(m){
 const a=Math.atan2(player.y-m.y,player.x-m.x),phase=m.large&&m.hp<m.max*.5?1:0;
 if(m.large){const n=phase?16:10;for(let i=0;i<n;i++)attack(m.x,m.y,i*2*Math.PI/n+tick*.5,phase?144:112,"enemy_orb",12,false,5);for(const off of [-.22,0,.22])attack(m.x,m.y,a+off,157,"enemy_ring",9,false,5);m.cd=phase?.95:1.45}
 else if(m.kind==="cultist"||m.kind==="eyeball"){for(const off of [-.24,0,.24])attack(m.x,m.y,a+off,116,"enemy_orb",9,false,4);m.cd=1.4}
 else if(m.kind==="crystal"){for(let i=0;i<8;i++)attack(m.x,m.y,i*Math.PI/4,92,"enemy_ring",9,false,4);m.cd=2}
 else{attack(m.x,m.y,a,115,"enemy_orb",9,false,4);m.cd=1.5}
}
function update(dt){
 tick+=dt;if(mode!=="battle")return;
 for(let i=0;i<3;i++)cooldown[i]=Math.max(0,cooldown[i]-dt);
 player.inv=Math.max(0,player.inv-dt);
 let mx=Number(!!keyboard.KeyD||!!keyboard.ArrowRight)-Number(!!keyboard.KeyA||!!keyboard.ArrowLeft);
 let my=Number(!!keyboard.KeyS||!!keyboard.ArrowDown)-Number(!!keyboard.KeyW||!!keyboard.ArrowUp);
 mx+=stick.x;my+=stick.y;
 const len=Math.hypot(mx,my);if(len>.08){mx/=len;my/=len;player.angle=Math.atan2(my,mx);const nx=between(player.x+mx*128*dt,field.l+12,field.r-12),ny=between(player.y+my*128*dt,field.t+14,field.b-10);if(!objects.some(o=>Math.hypot(nx-o.x,ny-o.y)<o.r+9)){player.x=nx;player.y=ny}}
 for(let i=0;i<3;i++)if(pressed[i]||keyboard[["KeyJ","KeyK","KeyL"][i]])cast(i);
 for(const m of enemy){const angle=Math.atan2(player.y-m.y,player.x-m.x);if(distance(m,player)>m.r+45){m.x+=Math.cos(angle)*m.speed*dt;m.y+=Math.sin(angle)*m.speed*dt}m.t+=dt;m.cd-=dt;if(m.cd<=0)enemyFire(m)}
 for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=Math.cos(b.angle)*b.v*dt;b.y+=Math.sin(b.angle)*b.v*dt;b.life-=dt;
  if(b.life<=0||b.x<field.l||b.x>field.r||b.y<field.t||b.y>field.b){bullets.splice(i,1);continue}
  if(b.friendly){let hit=false;for(const m of enemy){if(Math.hypot(b.x-m.x,b.y-m.y)<b.r+m.r){m.hp-=b.dmg;hit=true;break}}if(hit){bullets.splice(i,1);continue}}
  else if(player.inv<=0&&Math.hypot(b.x-player.x,b.y-player.y)<b.r+7){player.hp=Math.max(0,player.hp-b.dmg);player.inv=.9;bullets.splice(i,1);if(player.hp<=0){mode="dead"}continue}
 }
 enemy=enemy.filter(e=>e.hp>0);if(!enemy.length&&mode==="battle"){mode="clear"}
}
function circle(x,y,r,color,outline){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();if(outline){ctx.strokeStyle=outline;ctx.lineWidth=2;ctx.stroke()}}
function text(s,x,y,size=15,color="#f5edff",align="left"){ctx.font="bold "+size+"px system-ui";ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(s,x,y)}
function drawScene(){
 ctx.fillStyle="#29233a";ctx.fillRect(0,0,W,H);
 for(let y=0;y<640;y+=32)for(let x=0;x<360;x+=32)draw("tiles/stone_floor_"+((x+y)/32%4|0),x,y,32,32);
 ctx.fillStyle="#100f1a78";ctx.fillRect(0,517,360,123);
 for(let y=65;y<=518;y+=32){draw("tiles/stone_wall",0,y);draw("tiles/stone_wall",328,y)}
 for(const o of objects)draw("obstacles/"+o.kind,o.x-16,o.y-16);
 for(const m of enemy){draw(m.large?"bosses/"+m.kind:"enemies/"+m.kind+"_"+(Math.floor(m.t*4)%2),m.x-(m.large?32:16),m.y-(m.large?32:16),m.large?64:32,m.large?64:32);ctx.fillStyle="#160e24";ctx.fillRect(m.x-(m.large?30:14),m.y-m.r-12,m.large?60:28,4);ctx.fillStyle=m.large?"#ff7b6d":"#ffad7a";ctx.fillRect(m.x-(m.large?30:14),m.y-m.r-12,(m.large?60:28)*(m.hp/m.max),4)}
 for(const b of bullets){const color=b.friendly?palette[b.kind.replace("fusion_","").split("_")[0]]:"#ff5475";circle(b.x,b.y,b.r,color,"#2c1b3c");if(b.friendly){const name=b.kind.startsWith("fusion_")?"projectiles/"+b.kind:"projectiles/"+b.kind+"_0";draw(name,b.x-11,b.y-11,22,22)}else draw("projectiles/enemy_orb_0",b.x-8,b.y-8,16,16)}
 const direction=Math.abs(Math.cos(player.angle))>Math.abs(Math.sin(player.angle))?(Math.cos(player.angle)>0?"right":"left"):(Math.sin(player.angle)>0?"down":"up");
 if(player.inv===0||Math.floor(tick*12)%2===0)draw("characters/mage_"+direction+"_"+(Math.floor(tick*7)%2),player.x-16,player.y-16);
 ctx.fillStyle="#161525ee";ctx.fillRect(8,8,344,56);circle(27,31,8,"#ff5d78");ctx.fillStyle="#3c304e";ctx.fillRect(43,20,158,15);ctx.fillStyle="#63df9b";ctx.fillRect(45,22,154*player.hp/player.max,11);text("HP "+player.hp+"/"+player.max,43,53,12);text(boss?"BOSS":("FLOOR "+floor+" - "+room+"/3"),234,31,14);if(boss)text(["灼熱の巨人","氷晶の女王","深淵の魔眼"][(floor-1)%3],229,53,12);
 circle(72,570,51,"#16182799","#9389aa");circle(72+stick.x*26,570+stick.y*26,25,"#9790bc8f");
 for(let i=0;i<3;i++){const b=buttons[i],e=i<2?player.gear[i]:player.gear[0],name=i===2?"projectiles/fusion_"+[...player.gear].sort().join("_"):"icons/"+e;circle(b.x,b.y,b.r,"#211e38dc","#ab96ce");circle(b.x,b.y,b.r-5,"#343051");draw(name,b.x-14,b.y-14,28,28);if(cooldown[i]>0){circle(b.x,b.y,b.r-3,"#181726a9");text(cooldown[i].toFixed(1),b.x,b.y+6,13,"#f4efff","center")}}
 if(mode!=="battle"){ctx.fillStyle="#0b091bdc";ctx.fillRect(35,103,290,390);if(mode==="clear"){text(boss?"ボス撃破！":"部屋クリア！",180,255,28,"#f6d180","center");text("タップして次へ",180,310,17,"#eee7ff","center")}
 if(mode==="reward"){text("ボス直前の報酬",180,168,23,"#f4ce83","center");text("2つのうち1つを選択",180,196,15,"#d3c5e4","center");for(let i=0;i<2;i++){const x=i?193:48;ctx.fillStyle="#3c3356";ctx.fillRect(x,230,119,150);draw("icons/"+rewards[i],x+39,247,40,40);text(jp[rewards[i]]+"の魔導石",x+60,320,14,"#fff5e8","center");text("タップで選択",x+60,353,12,"#e3d2ff","center")}}
 if(mode==="swap"){text("装備枠を選択",180,180,24,"#f4ce83","center");text(jp[selected]+"をどちらと交換する？",180,218,15,"#e4d9fc","center");for(let i=0;i<2;i++){const x=i?193:48;ctx.fillStyle="#3c3356";ctx.fillRect(x,250,119,136);draw("icons/"+player.gear[i],x+39,261,40,40);text("装備 "+(i+1),x+60,330,14,"#fff5e8","center");text(jp[player.gear[i]],x+60,358,14,"#ddd0f5","center")}}
 if(mode==="dead"){text("GAME OVER",180,250,27,"#ff8795","center");text("タップして再挑戦",180,307,16,"#eee7ff","center")}}}
function tapOverlay(x,y){if(mode==="dead"){start();return true}if(mode==="clear"){advance();return true}
 if(mode==="reward"&&y>230&&y<390){const idx=x<180?0:1;selected=rewards[idx];mode="swap";return true}
 if(mode==="swap"&&y>250&&y<400){player.gear[x<180?0:1]=selected;selected=null;openRoom(true);return true}
 return mode!=="battle"}
function coord(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
function endPointer(id){if(stick.pointer===id){stick.pointer=null;stick.x=stick.y=0}for(let i=0;i<3;i++)if(pointerButtons[i]===id){pointerButtons[i]=null;pressed[i]=false}}
cv.addEventListener("pointerdown",e=>{e.preventDefault();cv.setPointerCapture(e.pointerId);const p=coord(e);if(tapOverlay(p.x,p.y))return;if(p.x<140&&p.y>515&&stick.pointer===null){stick.pointer=e.pointerId;stick.x=between((p.x-72)/48,-1,1);stick.y=between((p.y-570)/48,-1,1);return}for(let i=0;i<3;i++)if(distance(p,buttons[i])<buttons[i].r+10){pressed[i]=true;pointerButtons[i]=e.pointerId;cast(i);return}});
cv.addEventListener("pointermove",e=>{if(stick.pointer===e.pointerId){const p=coord(e);stick.x=between((p.x-72)/48,-1,1);stick.y=between((p.y-570)/48,-1,1)}});
for(const n of ["pointerup","pointercancel","lostpointercapture"])cv.addEventListener(n,e=>endPointer(e.pointerId));
window.addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="Enter"&&mode!=="battle"){tapOverlay(170,295)}keyboard[e.code]=true});
window.addEventListener("keyup",e=>keyboard[e.code]=false);
let last=performance.now();function loop(now){const dt=between((now-last)/1000,0,.033);last=now;update(dt);drawScene();requestAnimationFrame(loop)}start();requestAnimationFrame(loop);
