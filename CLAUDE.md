# portfolio — プロジェクト固有指示

## 概要

中村元揮（札幌・エンジニア）の個人ビジネスポートフォリオサイト。
札幌でWeb制作・Web予約・AI業務改善を提供するサービスのLP。

- 本番URL: https://motoki418.github.io/portfolio/
- 配信: GitHub Pages（`main` ブランチへの push で即本番反映）

## 技術スタック

- 素の HTML / CSS / JavaScript（ビルドツール・パッケージマネージャなし）
- Google Fonts（Noto Sans JP, Sora）を CDN 経由で読込
- Google Analytics (gtag) 導入済み（測定ID `G-KV15FJJDYL`）

## 構成

- `index.html` — メインLP。CSS は `<style>` タグ内、JS は `<script>` タグ内に**インライン**で記述（外部 style.css / script.js は存在しない）
- `privacy.html` — プライバシーポリシー
- `samples/{bonesetter,clinic,restaurant}/` — 営業用サンプルサイト（業種別）
- `favicon.svg`, `sitemap.xml`, `robots.txt`
- `profile.png` — プロフィール画像（`.gitignore` の `!profile.png` で例外許可）
- 他の `*.png` はスクリーンショット等で `.gitignore` により除外される

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
