import { test, expect, type Page } from '@playwright/test';

/**
 * ビジュアル回帰（崩れ検出）。フルページ + 重要セクションを撮り、
 * 変更前後でレイアウトが崩れていないかを比較する。
 * ベースライン更新は `npm run update-snapshots`。
 */

// アニメーション・遅延描画を止めて決定論的に撮る
async function freeze(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after { transition: none !important; animation: none !important; }
      .reveal { opacity: 1 !important; transform: none !important; }
    `,
  });
  // Webフォント読み込み完了を待つ（テキスト描画のちらつき防止）
  await page.evaluate(() => document.fonts.ready);
}

test.describe('katachi-ai LP — ビジュアル回帰', () => {
  test('フルページ', async ({ page }) => {
    await page.goto('/');
    await freeze(page);
    await expect(page).toHaveScreenshot('full-page.png', { fullPage: true });
  });

  test('開発セクション（料金カード）', async ({ page }) => {
    await page.goto('/#development');
    await freeze(page);
    await expect(page.locator('#development')).toHaveScreenshot('development.png');
  });

  test('料金プラン（伴走）', async ({ page }) => {
    await page.goto('/#pricing');
    await freeze(page);
    await expect(page.locator('#pricing')).toHaveScreenshot('pricing.png');
  });
});
