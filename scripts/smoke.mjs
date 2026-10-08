#!/usr/bin/env node
/* global console, process, fetch */
// 本番（または任意 URL）への読み取り専用スモーク。
// 「対象が壊れたら必ず落ちる観測量」を assert する（200 の数だけ数えない）。
// 使い方: node scripts/smoke.mjs [BASE_URL] [VERIFIED_DIST]（省略時 SMOKE_BASE_URL）
// VERIFIED_DIST 指定時は、公開トップ・sitemap掲載HTML・robotsとartifactのSHA-256も比較する。

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const BASE = process.argv[2] || process.env.SMOKE_BASE_URL;
if (!BASE) {
  console.error("BASE_URL または SMOKE_BASE_URL を指定してください。");
  process.exit(1);
}
const base = BASE.replace(/\/$/, "");
const expectedDist = process.argv[3];
const failures = [];

function get(url) {
  return fetch(url, {
    headers: { "user-agent": "katachi-smoke" },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
}

function verifyContent(url, bytes) {
  if (!expectedDist) return;
  const pathname = decodeURIComponent(new URL(url).pathname);
  const candidates = pathname.endsWith('/')
    ? [`${pathname}index.html`]
    : [pathname, `${pathname}.html`];
  const root = resolve(expectedDist);
  const files = candidates.map((path) => resolve(root, `.${path}`))
    .filter((path) => path.startsWith(root + sep));
  const file = files.find((path) => existsSync(path));
  check(`${pathname} のartifactが存在する`, !!file);
  if (!file) return;
  const hash = (data) => createHash('sha256').update(data).digest('hex');
  check(
    `${pathname} の公開内容が検証済みartifactと一致`,
    hash(bytes) === hash(readFileSync(file)),
    'SHA-256不一致（別リビジョン/古い配信の疑い）',
  );
}

function check(name, cond, detail) {
  if (cond) console.log(`  ✓ ${name}`);
  else failures.push(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

const res = await get(`${base}/`);
const bytes = Buffer.from(await res.arrayBuffer());
const body = bytes.toString('utf8');
verifyContent(`${base}/`, bytes);

check("/ が 200", res.status === 200, `status=${res.status}`);
check(
  "/ に LP のタイトル（AI導入・AI活用支援）がある",
  /AI導入・AI活用支援/.test(body),
  "タイトル欠落（別ページ/壊れた配信の疑い）",
);
check(
  "/ に CTA 導線（お問い合わせ/相談）がある",
  /(お問い合わせ|相談)/.test(body),
  "CTA が見つからない（コンバージョン導線の欠落）",
);

check(
  "/ の最終URLが正規トップ(<base>/)と一致",
  res.url === `${base}/`,
  `res.url=${res.url}`,
);

const canonicalMatch = body.match(
  /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i,
);
check(
  "/ の canonical が最終URLと一致",
  !!canonicalMatch && canonicalMatch[1] === res.url,
  canonicalMatch
    ? `canonical=${canonicalMatch[1]} res.url=${res.url}`
    : "canonical タグが見つからない",
);

// sitemap.xml: 全 <loc> が redirect を挟まず 200 を返すことを確認する。
const sitemapRes = await get(`${base}/sitemap.xml`);
const sitemapBytes = Buffer.from(await sitemapRes.arrayBuffer());
const sitemapBody = sitemapBytes.toString('utf8');
verifyContent(`${base}/sitemap.xml`, sitemapBytes);
check("sitemap.xml が 200", sitemapRes.status === 200, `status=${sitemapRes.status}`);
const locs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check("sitemap.xml に <loc> が1件以上ある", locs.length > 0, `body=${sitemapBody.slice(0, 200)}`);
for (const loc of locs) {
  const locRes = await get(loc);
  verifyContent(loc, Buffer.from(await locRes.arrayBuffer()));
  check(
    `sitemap: ${loc} が200かつ無リダイレクト`,
    locRes.status === 200 && locRes.url === loc,
    `status=${locRes.status} res.url=${locRes.url}`,
  );
}

// robots.txt が Sitemap 行を含むこと。
const robotsRes = await get(`${base}/robots.txt`);
const robotsBytes = Buffer.from(await robotsRes.arrayBuffer());
const robotsBody = robotsBytes.toString('utf8');
verifyContent(`${base}/robots.txt`, robotsBytes);
check("robots.txt が 200", robotsRes.status === 200, `status=${robotsRes.status}`);
check(
  "robots.txt に Sitemap: 行がある",
  /^Sitemap:/m.test(robotsBody),
  "Sitemap: 行が見つからない",
);

// 存在しないパスが 404 を返し、soft-redirect（200でトップと同一内容を返す誤設定）でないこと。
const notFoundRes = await get(`${base}/__not-exist-smoke__`);
const notFoundBody = await notFoundRes.text();
check(
  "存在しないパスが404を返す",
  notFoundRes.status === 404,
  `status=${notFoundRes.status}`,
);
check(
  "404ページがトップと同一内容でない（soft redirect検出）",
  notFoundBody !== body,
  "404の本文がトップページと同一（soft 404/soft redirectの疑い）",
);

console.log(`smoke: ${base}`);
if (failures.length) {
  console.error("FAILURES:");
  for (const f of failures) console.error(f);
  process.exit(1);
}
console.log("smoke: ALL PASS");
