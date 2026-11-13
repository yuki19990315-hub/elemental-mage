# GBAピクセルアート再構築・デザイン規格

## 最優先条件

- **画風:** ゲームボーイアドバンス時代のオリジナル・ファンタジーモンスターゲームを参考にしたドット絵。既存作品のデザイン自体を複製しない。
- **主人公・すべての通常敵・ボス:** 64×64 px固定。全身、角、翼、尻尾、杖を画面から見切れさせない。
- **色数:** 各PNGにつき最大16種類のRGBA値。透明（0 alpha）は1色に数える。アルファは0/255のみ。
- **描画:** ぼかし、補間、アンチエイリアス、半透明ピクセル、ディザリングは不使用。拡大は必ずnearest-neighbor。
- **環境:** 床・壁タイルは32×32 px、オブジェクトは64×64 px、弾16×16 px、アイコン24×24 px。いずれも最大16色。
- **見た目:** シルエットの判読性、種族ごとの独自形状、色・陰影・装飾、モンスターの進化系統を意識する。単純な円や一般的な図形だけを完成扱いしない。

## 新しい配置

- `assets/gba/v1/characters/mage_{down,up,left,right}_{0,1}.png`
- `assets/gba/v1/enemies/{entity}/idle_0.png ... stun.png` （通常敵11種類）
- `assets/gba/v1/bosses/{boss_id}/idle_0.png ... stun.png` （ボス3種類）
- `assets/gba/v1/tiles/{theme}/{floor,wall}_{0..3}.png`（5テーマ）
- `assets/gba/v1/props/{name}.png`、`icons/{element}.png`、`projectiles/{name}.png`
- `assets/gba/v1/manifest.json` にパス、サイズ、色数、SHA-256、当たり判定メモとアニメーション情報を格納。

## 生成と検証

```bash
python -m pip install Pillow
python tools/rebuild_gba_art.py --root .
```

GitHub Actionsの `gba-pixel-art.yml` が実行すると素材を生成し、検証後にリポジトリへコミットします。

**検証対象:** 全フレーム64×64、色数上限、二値アルファ、全身がキャンバス内、全11敵と3ボス、参照先、ファイルハッシュ。

**注意:** 変換で規格を満たすことと、最高品質の新規原画であることは異なります。v2の高精細AI原画を64px/15色へ変換した候補であり、滑らかなモーション、余白、構図、ボスの個性を実機で目視修正する余地があります。背景タイルの継ぎ目は今回の色数検証とは別に確認する必要があります。試作版はデフォルトでGBA版を描画し、ロード失敗時のみv2にフォールバックします。

## プレビュー

- [キャラクター・敵・ボス一覧](../assets/gba/v1/previews/creature_catalog.png)
- [背景・オブジェクト・弾・属性アイコン一覧](../assets/gba/v1/previews/environment_catalog.png)

**プレビュー用画像は複数のキャラクターを合成した資料画像であり、ゲーム内の最大16色ルールは適用しません。** ルールが適用されるのは manifest.json に記録された個別のゲーム用素材です。
