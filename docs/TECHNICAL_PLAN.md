# 技術設計（検討案）

## 機能分割
GameManager（進行/画面遷移）、PlayerController（移動/向き/HP）、InputAdapter（タッチUI）、EquipmentSystem（2枠装備）、SpellSystem（通常/合成とCD）、ProjectilePool（弾の再利用）、EnemyAI、BulletPatternSystem、BossPhaseSystem、RoomGenerator、LootSystem、UI、SaveData。

## データ駆動
data/elements.json、fusion_recipes.json、enemies.json、bosses.json、rooms.json、obstacles.json をコンテンツ定義の一次データとして使用。実行環境のコードからはIDで参照。属性ペアはソートした組で正規化し、2属性の順序を問わず15組を一意に解決する。

## マップ生成
シード乱数 → 部屋グラフの生成 → スタートとボスの経路検証 → ボス手前への2択部屋の挿入 → 各室テンプレート・障害物・敵スポーンの配置 → 出入口と当たり判定を検証。

## モバイル性能
小型テクスチャ・描画アトラス・敵弾プーリング・同時弾数の上限・負荷試験を優先。高密度弾幕時も入力遅延と被弾判定の公平性を維持する。

## 試作の位置づけ
prototype/ はブラウザ向けの操作・戦闘の縦画面試作。完全な製品でもAPKでもない。Android向けの最終実装エンジンは未確定。