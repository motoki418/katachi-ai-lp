# テスト（Playwright）

このディレクトリは LP の **E2E + ビジュアル回帰テスト**。サイト本体（`index.html` ほか）は
素のHTML/CSS/JSのまま。テスト基盤だけを `tests/` と `package.json` に隔離している。

## セットアップ（初回のみ）

```bash
npm ci                              # 依存（@playwright/test）を入れる
npx playwright install chromium webkit   # ブラウザ本体を入れる
```

Node はリポジトリ直下の `.node-version` に揃える。

## 実行

```bash
npm run test:e2e        # 機能E2E（導線・価格ガード・FAQ・フォーム）。OS非依存
npm run test:visual     # ビジュアル回帰（崩れ検出）。ローカルmacの基準と比較
npm test                # 両方
npm run report          # 直近の結果をHTMLレポートで開く
```

## 構成

- `e2e.spec.ts` — 主要導線の機能テスト。**開発価格(40/120/150/150万円〜)の恒久ガード**を含む。
  問い合わせフォームは実送信しない（web3formsに本物の問い合わせが飛ぶため、存在・必須属性のみ確認）。
- `visual.spec.ts` — フルページ + 開発/料金セクションのスクショ差分。
- プロジェクトは `desktop-chromium`(1280幅) と `mobile-safari`(iPhone 13 = WebKit) の2つ。

## ビジュアル基準画像（baseline）の運用

- スクショ基準は **OS接尾辞付き**（`*-darwin.png` = mac、`*-linux.png` = CI）で別管理される。
- 表示を意図的に変えたら `npm run update-snapshots` で mac 基準を撮り直してコミットする。
- **CIでビジュアル比較も回したい場合**: GitHub Actions の「Update visual baselines (Linux)」を
  1回手動実行すると Linux 基準が生成・コミットされる。以後 CI でも比較可能。
- PR では `ci.yml` と `e2e.yml` が静的検証・機能E2E・Visualを実行する。
- main の push / Deploy 手動実行では `deploy.yml` が両workflowを呼び出す。
  静的検証が生成した同一run/SHAのartifactを E2E・Visual が配信して確認し、
  両方の成功後だけ Deploy が同じartifactを再ビルドせず配信する。
  手動実行もこの検証を通り、main以外のブランチでは配信しない。
- 配信後は `scripts/smoke.mjs` がHTTP・canonical・sitemap・404と、
  公開トップ/sitemap掲載HTML/robotsのSHA-256をartifactと比較する。
  失敗時は最大3回（待機10秒）で検査し、Deployを失敗にする。自動ロールバックは行わない。

ローカルで配信成果物を検証する場合:

```bash
sh scripts/build-cloudflare-pages.sh
PLAYWRIGHT_WEB_ROOT=dist npm test
python3 -m unittest discover -s scripts -p 'test_*.py'
node --test scripts/smoke.test.mjs
```

## 注意（既知の癖）

- `--window-size` 等の素のヘッドレス撮影と違い、Playwright は本物の WebKit でモバイルを描画する。
  ただし実機 iPhone Safari と完全一致ではない（flex-wrap/gap で稀に差）。重要セクションは
  ときどき実機でも目視する。
