# GBA風・パーソナライズ適用アート規格

> **現在の最優先規格:** [GBA再構築仕様](GBA_ART_STANDARD.md)。この文書にある旧32px/多色の記述は従来のスターターアートにのみ適用されます。

# アート制作ガイド

## 初期方向性
- 2Dドット絵。暗めの石造ダンジョン、鮮明な属性弾、紫色の帽子・ローブを着た魔法使いをスターター案とする。
- 戦闘中に弾の輪郭が床と重ならない配色とする。
- PNG は RGBA の透過画像。ゲーム内の拡大は nearest neighbor / pixelated。
- 初期基準：通常キャラ 32×32、ボス 64×64、床と壁 32×32、遮蔽物 32×32、属性弾 16〜24px。
- 当たり判定は見た目から独立して設定。足元の基準点を統一する。

## フォルダ
- assets/characters: mage_down/up/left/right の2コマ
- assets/enemies: slime, eyeball, cultist, crystal, bat, golem の2コマ
- assets/bosses: lava_titan, frost_queen, abyss_eye
- assets/tiles: stone/lava/ice/moss の床4種と壁
- assets/obstacles: crate, barrel, boulder, crystal_cluster, pillar, brazier
- assets/projectiles: 属性弾、敵弾、全15組の合成弾
- assets/icons: 6属性
- assets/previews: 全体カタログ、合成魔法一覧、スマホ縦画面の画面イメージ

## 属性カラー（暫定）
炎 #ff763c / 水 #51b6f5 / 氷 #b9efff / 雷 #ffda5d / 風 #72eab1 / 土 #bb8a60。

## 今後のデザイン工程
主人公と6種の敵は攻撃・被弾・消滅モーションを追加。ボスは各フェーズの攻撃予告素材を追加。
アセット名とデータIDを一致させ、素材差し替えだけで挙動を変えない。