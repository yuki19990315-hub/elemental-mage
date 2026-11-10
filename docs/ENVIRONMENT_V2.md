# Elemental Mage: 高精細背景・障害物アート v2

## 収録内容

元のコンセプト画像を**加工せず** `assets/concepts/boards/` に保存しています。

- [背景・ダンジョンタイルセット原寸](../assets/concepts/boards/dungeon_tileset_hd.png)
- [障害物・環境オブジェクト原寸](../assets/concepts/boards/obstacles_environment_assets_hd.png)

ゲーム素材は `assets/environment/v2/` に分離してあり、`manifest.json` に相対パス、サイズ、テーマ、アンカー、通行判定、飛び道具判定、画像チェックサムを記録しています。

| 種類 | 数量 | 出力 | 用途 |
|---|---:|---|---|
| 床タイル | 20 | 64×64 RGBA PNG（不透明） | 5テーマ×4バリエーション |
| 壁モジュール | 20 | 64×64 RGBA PNG（不透明） | 5テーマ×4装飾タイプ |
| 障害物 | 12 | 128×128 RGBA PNG（透過） | 木箱、樽、柱、火鉢、結晶、岩の2バリエーション |
| アトラス | 11 | PNG | 各テーマの床・壁、障害物の参照用 |

環境テーマ：`cursed_stone`、`ice_sanctum`、`lava_temple`、`abyss_shrine`、`holy_ruins`。

## 素材の利用と再生成

```bash
python tools/unpack_environment_art.py
python -m pip install Pillow
python tools/validate_environment.py
```

ZIP `assets/environment/source/environment_art_pack_v2.zip` は、画像63枚（タイル40枚、障害物12枚、アトラス11枚）と `manifest.json` の**正規アーカイブ**です。ワークフロー `environment-art.yml` が展開・検証して GitHubへ個別PNGを追加します。

試作版ではタイル `assets/environment/v2/tiles/{theme}/floor_{0..3}.png` と `wall_{0..3}.png`、障害物 `assets/environment/v2/props/*.png` を使えます。相対座標や当たり判定は `manifest.json` を参照してください。

## 既知の制約

- これらは設定画ボードから**トリミングした候補素材**で、床の継ぎ目が完全にシームレスとは限りません。
- 壁は装飾用モジュールで、自動タイル変形の全パターンを提供するものではありません。
- 障害物の透過マスクは GrabCut による推定です。エフェクト端の切り抜きとアンカー位置には目視調整が必要です。
- 描画上の見た目と当たり判定は分けて調整してください。敵弾が障害物を通過するかは `blocks_projectiles` で指定します。
- 制作後の実機確認が必要で、正式版の完成を示すものではありません。
