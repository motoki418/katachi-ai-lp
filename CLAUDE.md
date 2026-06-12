# portfolio — プロジェクト固有指示

## このディレクトリの境界

**役割: 対外公開の営業LP とサンプルサイト**。Cloudflare Pages で公開する本番資材のみ置く。

> 判定基準: 見込み顧客が直接見る公開物か？
>
> - ビジネスロジック・エージェント → `~/work/ai-biz`
> - 個人ライフログ → `~/life`
> - 学習・プロトタイプ → `~/dev`

## 概要

中村元揮（札幌・エンジニア）の個人ビジネスポートフォリオサイト。
札幌でWeb制作・Web予約・AI業務改善を提供するサービスのLP。

- 本番URL: https://katachi-ai.com/ （正規URL。SNS・名刺・QR・メール署名など外部掲載はすべてこれに統一）
- katachi-ai.jp / www.katachi-ai.jp はブランド保護用。Cloudflare の Redirect Rule で https://katachi-ai.com へ 301 リダイレクト（パス・クエリ保持）。.jp 側にコンテンツは置かない
- 旧URL https://ai-advisory-hokkaido.pages.dev/ は Cloudflare Pages のデフォルトドメイン（残存。新規掲載には使わない）
- 配信: Cloudflare Pages（GitHub 連携時は `main` ブランチへの push が本番反映トリガー）
- 推奨設定: Framework preset は `None`、Production branch は `main`、Build command は `sh scripts/build-cloudflare-pages.sh`、Build output directory は `dist`

## 技術スタック

- 素の HTML / CSS / JavaScript（ビルドツール・パッケージマネージャなし）
- Google Fonts（Noto Sans JP, Sora）を CDN 経由で読込
- Google Analytics (gtag) 導入済み（測定ID `G-KV15FJJDYL`）

## 構成

- `index.html` — メインLP。CSS は `<style>` タグ内、JS は `<script>` タグ内に**インライン**で記述（外部 style.css / script.js は存在しない）
- `privacy.html` — プライバシーポリシー
- `samples/{bonesetter,clinic,restaurant}/` — 営業用サンプルサイト（業種別）。完成サイトの設計見本。AI機能デモは別物（`~/work/ai-biz/demos/`）
- `favicon.svg`, `sitemap.xml`, `robots.txt`
- `profile.png` — プロフィール画像（`.gitignore` の `!profile.png` で例外許可）
- 他の `*.png` はスクリーンショット等で `.gitignore` により除外される

## デザイン規約

デザインの正本はこのリポジトリ直下の `DESIGN.md`。
カラートークン・タイポグラフィ・コンポーネントパターン・DO/DON'T はそちらを参照すること。
なお `~/apps/DESIGN.md` は apps 配下の業務ツール向け共通基準であり、本LPには適用しない。

## 開発規約

- **CSS/JS はインライン方針を維持**：外部ファイル化しない（現状単一ページのため）。変更は `<style>` / `<script>` 内の既存セクションに追記・編集する
- **CSSカスタムプロパティ**：カラー・スペーシングは `:root` の `--ink`, `--accent` 等を必ず使う（ハードコードした色値の新規追加禁止）
- **レスポンシブ**：モバイル優先。画面幅変更で崩れやすい領域は profile section / hero / pricing — HTML変更時は必ず確認する
- **日本語LP**：文言変更時は敬語レベルと語尾の統一感を崩さない
- **画像追加**：`.gitignore` が `*.png` を除外しているので、本番で使う画像は `!filename.png` を追加する必要あり

## Claude への指示

- 変更前に `git diff` で意図しない差分がないか確認する
- コミット前に index.html をブラウザで開いて実機確認する（プレビューツールがあれば活用）
- `git push --force` および画像ファイル削除は明示承認なしで実行しない
- CSSの既存デザイントークン（`--ink`, `--accent`, `--surface` 系）を優先して使う
- 過度な構造変更（外部CSS化、フレームワーク導入、ビルドツール追加）は提案ベースで、実装前に必ず相談する
