# スマホで遊べるWeb版・素材ギャラリー

## 公開URL
- [ホーム](https://yuki19990315-hub.github.io/elemental-mage/)
- [ブラウザ版ゲーム](https://yuki19990315-hub.github.io/elemental-mage/prototype/)
- [GBAドット絵素材ギャラリー](https://yuki19990315-hub.github.io/elemental-mage/gallery/)

これらのURLは、GitHub Pagesが正しく有効化・デプロイされた場合に公開されます。GitHub Pages未設定時は **Settings → Pages → Build and deployment → Source: GitHub Actions** を1回選択してください。Settingsの管理は利用者が行います。

## デプロイ内容

`.github/workflows/pages.yml` は `main` の更新後、既存の画像生成スクリプトを実行し、GBA規格の素材を生成・検証してから、ゲーム、アセット、ギャラリーをPagesへデプロイします。

公開対象は `web/` のホームとギャラリー、`prototype/` のゲームコード、`assets/` の画像・SVGです。変換素材の規格検査は `assets/gba/v1/manifest.json` に基づきます。

もし自動公開が失敗した場合は [Actions](https://github.com/yuki19990315-hub/elemental-mage/actions) の "Publish playable Elemental Mage web preview" を参照してください。

## 画風に関する注意
主人公・全敵・ボス64×64／最大16色、床壁32×32、オブジェクト64×64、弾16×16、属性アイコン24×24。元の高精細素材からの自動減色候補であり、オリジナル原画としての最終品質保証ではありません。ボスの表情や輪郭、背景の継ぎ目はゲーム画面で目視確認してください。
