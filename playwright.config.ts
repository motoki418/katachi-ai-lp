import { defineConfig, devices } from '@playwright/test';

/**
 * katachi-ai-lp の E2E + ビジュアル回帰設定。
 * - サイト本体は素の静的HTMLなので、python3 の簡易サーバで配信して検証する。
 * - desktop(Chromium) と mobile(iPhone 13 = WebKit) の2プロジェクトで、
 *   PC幅・モバイル幅の両方を確認する（WebKit は本物の Safari に近い描画）。
 * - スクリーンショットのベースライン名には OS 接尾辞（-darwin / -linux）が
 *   自動で付くため、ローカル(mac)と CI(Linux)の基準画像は衝突しない。
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  expect: {
    // フォント描画の微差での誤検知を抑える許容値
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30 * 1000,
  },
});
