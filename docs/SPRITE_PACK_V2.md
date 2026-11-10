# モンスター・ボス素材パック v2（リデザイン）

## 対象

**14体 / 112フレーム**（通常・上位敵11体、ボス3体）を、4列×4行の元画像7枚から分割する仕様です。

通常・上位敵: 192×192 px RGBA / ボス: 256×256 px RGBA。

敵: `slime`, `poison_slime`, `evil_eye`, `abyss_eye`, `dark_mage`, `sorcerer_light`, `crystal_beast`, `crystal_golem`, `night_bat`, `phantom_dark`, `stone_golem`。

ボス: `boss_fire_giant`, `boss_ice_queen`, `boss_abyss_eye`。

## 保存先

`assets/sprites/v2/enemies/{enemy_id}/` または `assets/sprites/v2/bosses/{boss_id}/`。

各フォルダは次のファイルで構成します:

- `idle_0.png`, `idle_1.png`
- `move_0.png`, `move_1.png`
- `attack_0.png`, `attack_1.png`
- `hit.png`, `stun.png`
- `atlas.png`（4列×2行）
- `meta.json`（フレーム範囲、FPS、アンカー）

共通の `manifest.json` にはモンスターID・相対パス・画像サイズを記載します。既存の `assets/enemies`、`assets/bosses` は互換性のため変更しません。

## 元画像からの再生成

チャットで提供する **elemental-mage-sprite-pack-v2.zip** には分割済みPNG、JSON、元シート7枚が含まれています。

GitHub内の `tools/split_sprite_sheet_v2.py` で再生成する場合:

```bash
pip install pillow
python tools/split_sprite_sheet_v2.py --source-dir path/to/sheets --output-dir assets/sprites/v2
```

入力ファイル名はスクリプト内の `SHEETS` を参照してください。

## 品質・注意事項

- AI生成の**コンセプト画をプログラムで分割した候補素材**です。手描きで整えた完全なスプライトではありません。
- 透過アルファは保持し、微小な透明ノイズは抑制しますが、エフェクトのセル越境やコマ間の姿勢ずれが残る場合があります。
- 8方向用のキャラクター素材ではなく、表情・移動・詠唱等の**イメージ差分**です。
- `hit` / `stun` は暫定ラベルで、ボス差分の一部は怒り・詠唱ポーズである可能性があります。
- 見た目から当たり判定を自動決定しないでください。衝突形状はゲーム側で別に定義してください。

**登録状態について:** この文章と変換スクリプトはGitHub管理対象です。PNG本体はリポジトリに実際に存在することを確認するまで「登録済み」と扱いません。


## GitHubリポジトリ内のPNG復元（追加）

`assets/sprites/v2/packets/*.json` はPNGバイナリのbase64を持つ復元用ソースです。2026-11-10時点で**12体分のパケットのみ**あり、`boss_ice_queen` と `boss_abyss_eye` の2体分は未登録です。完全版14体分の元PNGは会話で配布したZIPにあります。

```bash
python -m pip install Pillow
python tools/materialize_sprite_packets.py
```

12体について8フレームとアトラス、仮のアンカー/タイミング付き `meta.json` を生成します。GitHub Actions `materialize-sprites.yml` でも同じ処理を行い、生成PNGの登録を試みます。必ずGitHubのブランチで画像が存在するか確認してください。

**注意:** 分割画像のフレーム内容、透明ノイズ、当たり判定、FPSは本実装前に目視で確定する必要があります。
