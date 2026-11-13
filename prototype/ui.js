'use strict';
/* Interactive mobile app shell; all game progress is per run, not an online account. */
(function(){
 const root=document.getElementById('app');
 const home=document.getElementById('home-screen');
 const battle=document.getElementById('battle-screen');
 const content=document.getElementById('content-screen');
 const dialog=document.getElementById('dialog-host');
 const toast=document.getElementById('toast');
 const E=['neutral','fire','water','ice','lightning','wind','earth','light','dark'];
 const names={neutral:'無',fire:'炎',water:'水',ice:'氷',lightning:'雷',wind:'風',earth:'土',light:'光',dark:'闇'};
 const glyphs={neutral:'✦',fire:'🔥',water:'💧',ice:'❄',lightning:'⚡',wind:'🌪',earth:'◆',light:'☀',dark:'☾'};
 const normal=['slime','eyeball','cultist','crystal','bat','golem','poison_slime','crystal_golem','abyss_eye','sorcerer_light','phantom_dark'];
 const bosses=['lava_titan','frost_queen','abyss_eye_boss'];
 const advanced=new Set(['poison_slime','crystal_golem','abyss_eye','sorcerer_light','phantom_dark']);
 const descriptions={slime:'接近・分裂する粘体',eyeball:'追尾する呪弾',cultist:'扇状の魔弾',crystal:'反射する結晶弾',bat:'飛行・急降下',golem:'重い衝撃波',poison_slime:'赤い予測線を出して突進、障害物で気絶',crystal_golem:'高耐久、跳ね返る氷晶弾と体当たり',abyss_eye:'浮遊・追尾電撃',sorcerer_light:'詠唱後の高速光線',phantom_dark:'螺旋弾幕と加速突進',lava_titan:'溶岩と円形弾幕',frost_queen:'氷の扇状弾幕と凍結',abyss_eye_boss:'広範囲の闇弾とホーミング'};
 const namesMonster={slime:'スライム',eyeball:'魔眼',cultist:'魔導師',crystal:'結晶体',bat:'夜の蝙蝠',golem:'岩石ゴーレム',poison_slime:'ポイズンスライム',crystal_golem:'蒼氷の結晶体',abyss_eye:'深淵の魔眼',sorcerer_light:'光輝の使徒',phantom_dark:'深淵の彷徨者',lava_titan:'灼熱の巨人',frost_queen:'氷晶の女王',abyss_eye_boss:'深淵の魔眼（ボス）'};
 const artEnemies={slime:'slime',eyeball:'evil_eye',cultist:'dark_mage',crystal:'crystal_beast',bat:'night_bat',golem:'stone_golem',poison_slime:'poison_slime',crystal_golem:'crystal_golem',abyss_eye:'abyss_eye',sorcerer_light:'sorcerer_light',phantom_dark:'phantom_dark'};
 const artBosses={lava_titan:'boss_fire_giant',frost_queen:'boss_ice_queen',abyss_eye_boss:'boss_abyss_eye'};
 const sprite=id=> '../assets/gba/v1/'+(bosses.includes(id)?'bosses/'+artBosses[id]:'enemies/'+artEnemies[id])+'/idle_0.png';
 const icon=id=>'../assets/gba/v1/icons/'+id+'.png';
 const M=globalThis.ElementalMechanics;
 const game=()=>globalThis.ElementalGameUI;
 const snap=()=>game()?.snapshot()||{stage:1,room:1,hp:100,maxHp:100,mana:0,mode:'altar',gear:['neutral','neutral'],collection:['neutral'],mutations:[],mastery:{}};
 let page='home',codexTab='all',equipSlot=0,familiarResult=null,nowPaused=true;
 let config={effects:true,bigUI:false};
 try{config={...config,...JSON.parse(localStorage.getItem('elemental_ui_config')||'{}')}}catch(_){}
 function saveConfig(){try{localStorage.setItem('elemental_ui_config',JSON.stringify(config))}catch(_){}}
 function applyConfig(){root.classList.toggle('low-motion',!config.effects);root.classList.toggle('large-ui',config.bigUI)}
 function isPaused(){return nowPaused || page!=='battle'}
 globalThis.ElementalAppShell={isPaused, isLowFx:()=>!config.effects};
 function notice(msg){toast.textContent=msg;toast.hidden=false;clearTimeout(notice.timeout);notice.timeout=setTimeout(()=>toast.hidden=true,2300)}
 function safe(str){return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
 function heading(title,sub){return '<div class="page-top"><div><h2>'+title+'</h2><div class="page-sub">'+sub+'</div></div><span style="color:#e6bd79">✦</span></div>'}
 function labelRow(label,value){return '<div class="statline"><span>'+label+'</span><b>'+value+'</b></div>'}
 function statCard(s){return '<div class="fantasy-card mage-banner"><img src="../assets/gba/v1/characters/mage_down_0.png" alt="魔法使い"><div><b>見習い魔導士</b><p class="small">FLOOR '+s.stage+' / ROOM '+s.room+'</p>'+labelRow('HP',s.hp+'/'+s.maxHp)+labelRow('魔力',s.mana+'/100')+'</div></div>'}
 function cardsElements(list,action,s){return '<div class="element-grid">'+list.map(el=>'<button class="element-card'+(s.gear.includes(el)?' selected':'')+'" data-action="'+action+'" data-element="'+el+'"><img src="'+icon(el)+'" alt=""><span>'+names[el]+'</span><small style="color:#bba9d0;font-size:9px">'+(s.gear.includes(el)?'装備中':'魔導石')+'</small></button>').join('')+'</div>'}
 function homeMarkup(s){return '';}
 function party(){
  const s=snap();
  return heading('パーティ / 装備','2つの属性を装備して合成魔法を使う')+statCard(s)+
    '<div class="page-label">装備枠を選択</div><div class="two-col">'+s.gear.map((el,i)=>'<button class="fantasy-card element-card'+(i===equipSlot?' selected':'')+'" data-action="slot" data-slot="'+i+'"><img src="'+icon(el)+'" alt=""><b>属性枠 '+(i+1)+'</b><span>'+names[el]+'</span></button>').join('')+'</div>'+
    '<div class="page-label">取得した属性石</div>'+cardsElements(s.collection.filter(id=>E.includes(id)),'equip',s)+
    '<div class="info-box">取得済みの属性石だけ装備できます。新しい属性石はバトル中に獲得します。変更は現在のプレイに反映されます。</div>';
 }
 function codex(){
  const items=codexTab==='all'?[...normal,...bosses]:codexTab==='boss'?bosses:codexTab==='elite'?normal.filter(x=>advanced.has(x)):normal.filter(x=>!advanced.has(x));
  return heading('モンスター図鑑','全14体のデザインと攻撃特徴')+
    '<div class="pill-tabs">'+[['all','すべて'],['basic','通常'],['elite','上位'],['boss','ボス']].map(([id,n])=>'<button data-action="codex-tab" data-tab="'+id+'" class="'+(codexTab===id?'active':'')+'">'+n+'</button>').join('')+'</div>'+
    '<div class="three-col">'+items.map(id=>'<button class="creature-card" data-action="monster" data-monster="'+id+'"><div class="sprite-box"><img loading="lazy" src="'+sprite(id)+'" alt=""></div><strong>'+namesMonster[id]+'</strong><span>'+ (bosses.includes(id)?'BOSS':advanced.has(id)?'ELITE':'NORMAL')+'</span></button>').join('')+'</div><div class="info-box">図鑑はデザイン確認用。敵の発見・討伐履歴の永続保存はまだありません。</div>';
 }
 function upgrade(){
  const s=snap(),items=game()?.mutationOptions()||M?.MUTATIONS?.map(m=>({...m,active:s.mutations.includes(m.id)}))||[];
  const ico=['✹','⚡','➤','♡','✦','◈'];
  return heading('強化 / 変異','魔法を成長させる特殊効果')+statCard(s)+
    '<div class="info-box">この画面では<strong>試作デモ用</strong>に強化を直接適用できます。正式版では戦闘報酬として獲得します。</div><div class="mutation-list">'+items.map((m,i)=>
    '<div class="fantasy-card mut-entry"><div class="mut-icon">'+ico[i%ico.length]+'</div><div><b>'+safe(m.name)+'</b><div class="small">'+safe(m.desc)+'</div></div><button class="mini-action" '+(m.active?'disabled':'')+' data-action="upgrade" data-upgrade="'+m.id+'">'+(m.active?'獲得済':'試す')+'</button></div>').join('')+'</div>';
 }
 function inventory(){
  const s=snap();return heading('所持品 / アイテム','現在の探索で入手したもの')+statCard(s)+
   '<div class="page-label">魔導石 / 取得済み '+s.collection.length+'種</div>'+cardsElements(s.collection.filter(id=>E.includes(id)),'inventory-equip',s)+
   '<div class="page-label">現在の効果</div><div class="fantasy-card">'+(s.mutations.length?s.mutations.map(id=>'<span class="rune-chip">'+safe(id)+'</span>').join(''):'<p class="small">強化効果なし</p>')+'</div>'+
   '<div class="info-box">消費アイテムやレアリティの永続管理は未実装です。装備変更は「装備」画面から行えます。</div>';
 }
 function summons(){
  const namesF=['炎の精霊','氷の精霊','雷の精霊','光の精霊','闇の精霊'],em=['🔥','❄️','⚡','✴','🌑'];
  return heading('召喚 / 精霊','魔力精霊の演出を試す')+
   '<div class="fantasy-card" style="text-align:center"><div class="page-label">魔力の祭壇</div><div class="familiar-figure">'+(familiarResult===null?'✧':em[familiarResult])+'</div><h3>'+(familiarResult===null?'精霊召喚':namesF[familiarResult])+'</h3><p class="small">召喚演出デモです。課金・確率提供・キャラ所持の保存は行いません。</p><button class="ornate-btn primary" data-action="summon">✦ 無料デモ召喚</button></div>'+
   '<div class="info-box">戦闘内の精霊契約は「魔法の突然変異」から使用できます。この召喚画面はUI検証専用です。</div>';
 }
 function profile(){
  const s=snap(); const mastery=Object.values(s.mastery).reduce((a,b)=>a+b,0);
  return heading('プロフィール','現在の探索情報')+statCard(s)+
    '<div class="fantasy-card">'+labelRow('挑戦階層',s.stage)+labelRow('使用した魔法',mastery+'回')+labelRow('獲得した属性石',s.collection.length+'種')+labelRow('強化効果',s.mutations.length+'件')+labelRow('精霊契約',s.familiar?'あり':'なし')+'</div>'+
    '<div class="info-box">プロフィールは現在のラン情報です。オンラインアカウント・ランキング・永続実績は未実装です。</div>';
 }
 function settings(){
  return heading('設定','モバイルUIの表示設定')+
   '<div class="fantasy-card"><div class="settings-row"><label for="setting-fx"><b>UIの演出</b><div class="small">光る装飾や動きの軽減</div></label><input id="setting-fx" type="checkbox" data-setting="effects" '+(config.effects?'checked':'')+'></div>'+
   '<div class="settings-row"><label for="setting-big"><b>文字を大きく表示</b><div class="small">メニュー画面の文字を拡大</div></label><input id="setting-big" type="checkbox" data-setting="bigUI" '+(config.bigUI?'checked':'')+'></div>'+
   '<div class="settings-row"><span><b>表示言語</b><div class="small">日本語</div></span><span class="rune-chip">日本語</span></div></div>'+
   '<div class="info-box">設定はこの端末のブラウザに保存されます。BGM・サウンド設定とクラウド同期は未実装のため表示していません。</div>';
 }
 function quests(){
  const s=snap(),total=Object.values(s.mastery).reduce((a,b)=>a+b,0);
  const items=[['魔法の練習','魔法を10回使用する',Math.min(10,total),10],['魔導の探究','異なる2属性を入手する',Math.min(2,s.collection.filter(x=>x!=='neutral').length),2],['深層への一歩','2階層へ到達する',Math.min(1,s.stage-1),1]];
  return heading('ミッション','現在の探索に連動する練習目標')+items.map(([t,d,c,max])=>
   '<div class="fantasy-card"><b>'+t+'</b><p class="small">'+d+'</p><div style="height:7px;border:1px solid #695085;border-radius:8px;overflow:hidden;background:#130f20"><div style="height:100%;background:linear-gradient(90deg,#8558cd,#e5b6ff);width:'+(c/max*100)+'%"></div></div><div class="small" style="text-align:right;margin-top:6px">'+c+' / '+max+(c===max?' · 達成':'')+'</div></div>').join('')+
   '<div class="info-box">報酬配布・毎日のリセット・オンライン実績は未実装です。</div>';
 }
 function menu(){
  return heading('冒険者メニュー','装備・強化・資料・設定')+
   '<div class="menu-grid">'+[['party','✦','装備・編成'],['codex','◈','モンスター図鑑'],['upgrade','✧','魔法の強化'],['summon','✵','精霊召喚'],['inventory','◫','所持品'],['quests','✪','ミッション'],['profile','♙','プロフィール'],['settings','⚙','設定']].map(([id,g,t])=>
   '<button class="menu-tile" data-go="'+id+'"><b>'+g+'</b>'+t+'</button>').join('')+'</div>'+
   '<div class="page-label">ゲームを続ける</div><button class="ornate-btn primary" data-go="battle">▶ バトルへ戻る</button>'+
   '<div class="info-box">UI各画面はスマホ向けブラウザ試作です。会員登録、課金、オンライン同期はありません。</div>';
 }
 const pages={party,codex,upgrade,inventory,summon:summons,profile,settings,quests,menu};
 function show(id){
  if(!['home','battle',...Object.keys(pages)].includes(id))id='home';
  page=id;nowPaused=id!=='battle';home.hidden=id!=='home';battle.hidden=id!=='battle';content.hidden=id==='home'||id==='battle';
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.toggle('active',b.dataset.go===id||id==='menu'&&b.dataset.go==='menu'));
  if(id!=='home'&&id!=='battle')content.innerHTML=pages[id]();
  document.getElementById('viewport').scrollTop=0;
 }
 function modal(title,body,buttons){
  dialog.hidden=false;dialog.innerHTML='<div class="dialog-card"><h3>'+title+'</h3><div class="small">'+body+'</div><div class="dialog-actions">'+buttons.map(b=>
   '<button class="ornate-btn'+(b.primary?' primary':'')+'" data-action="'+b.action+'">'+b.title+'</button>').join('')+'</div></div>';
  nowPaused=true;
 }
 function closeDialog(){dialog.hidden=true;dialog.innerHTML='';nowPaused=page!=='battle';}
 document.addEventListener('click',ev=>{
  const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.go){closeDialog();show(b.dataset.go);return;}
  const action=b.dataset.action; if(!action)return;
  if(action==='new-run'){game()?.startNew();closeDialog();show('battle');return;}
  if(action==='pause'){modal('探索メニュー','探索は一時停止中です。',['resume','backhome'].map((x,i)=>({action:x,title:i?'ホームへ':'バトルを続ける',primary:!i})));return;}
  if(action==='resume'){closeDialog();show('battle');return;}
  if(action==='backhome'){closeDialog();show('home');return;}
  if(action==='slot'){equipSlot=Number(b.dataset.slot);show('party');return;}
  if(action==='equip'){
   const success=game()?.equip(equipSlot,b.dataset.element);
   notice(success?'装備枠'+(equipSlot+1)+'を変更しました':'未入手の属性石です');show('party');return;
  }
  if(action==='inventory-equip'){show('party');notice('装備画面で変更できます');return;}
  if(action==='codex-tab'){codexTab=b.dataset.tab;show('codex');return;}
  if(action==='monster'){
   const id=b.dataset.monster;modal(namesMonster[id],'<img src="'+sprite(id)+'" alt="" style="width:124px;height:124px;image-rendering:pixelated"><p>'+descriptions[id]+'</p>',[{action:'close-dialog',title:'図鑑に戻る',primary:true}]);return;
  }
  if(action==='upgrade'){const ok=game()?.tryMutation(b.dataset.upgrade);notice(ok?'強化を試作データへ適用しました':'すでに取得済みです');show('upgrade');return;}
  if(action==='summon'){familiarResult=Math.floor(Math.random()*5);show('summon');notice('召喚デモを再生しました');return;}
  if(action==='close-dialog'){closeDialog();return;}
 });
 document.addEventListener('change',ev=>{
  const el=ev.target;if(!el.dataset.setting)return;
  config[el.dataset.setting]=!!el.checked;saveConfig();applyConfig();notice('表示設定を保存しました');
 });
 document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!dialog.hidden){closeDialog();return;}
  if(ev.key==='Escape'&&page==='battle'){modal('探索メニュー','探索は一時停止中です。',[{action:'resume',title:'再開',primary:true},{action:'backhome',title:'ホームへ'}]);}
 });
 applyConfig();show('home');
})();
