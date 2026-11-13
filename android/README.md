# Elemental Mage — Android APK (オフライン試作)

ブラウザで動いているElemental Mage UI v5と戦闘試作版を、**Android標準WebViewに内包したAPK**にします。

- **オンライン接続は不要:** HTML / JS / CSS / データJSON / GBAドット絵PNGをAPKに含めます。
- 対応: Android 7.0 (API 24)以降、縦画面固定。端末のWebViewコンポーネントが必要です。
- 内容: 現行のゲーム試作機能、ホーム、装備、図鑑、強化デモ、所持品、召喚デモ、設定。
- アプリID: `jp.elementalmage.app`。
- **テスト用debug署名**。Playストア配信や正式リリース用のrelease署名ではありません。
- 通信権限は疑似HTTPSローカルオリジン用です。許可されたローカルURLのリクエストだけがAPK内ファイルにマッピングされ、外部サイトの遷移はブロックします。

## APKをダウンロード

[GitHub Releases](https://github.com/yuki19990315-hub/elemental-mage/releases) の `android-preview-v1` から
`elemental-mage-preview-debug.apk` を取得できます（ビルド・公開が成功した場合）。
[GitHub Actions](https://github.com/yuki19990315-hub/elemental-mage/actions/workflows/android-apk.yml)
の `ElementalMage-Android-Debug-APK` アーティファクトからも取得できます。

## ローカルビルド

JDK 17 / Android SDK platform 35 / Android Gradle Plugin 8.7.3 / Gradle 8.10.2 を準備。

```bash
python tools/stage_android_assets.py --check
python tools/stage_android_assets.py
cd android
gradle --no-daemon assembleDebug
# app/build/outputs/apk/debug/app-debug.apk
```

生成したAPKは `python tools/verify_android_apk.py android/app/build/outputs/apk/debug/app-debug.apk` で構造検査可能。
GitHub Actionsも同様に検査してから、debug APKを成果物とプレリリースに保存します。

## 端末へのインストール

AndroidスマホでAPKをダウンロードして開き、「この提供元のアプリを許可」（機種やOSにより表記が異なります）を有効にしてインストール。確認後は許可を元に戻せます。

## 既知の制限

- **Android実機でのタッチ・音声・FPS・機種ごとの画面表示のテストは未実施。**
- 中身は既存のWebゲーム試作版であり、ネイティブな新エンジンへの移植ではありません。
- セーブ・課金・アカウント同期・Playストア配布は未実装です。アプリを削除するとUI設定も消えます。
- 合成魔法は28組のレシピ管理があるものの、すべて固有演出を実装したわけではありません。
