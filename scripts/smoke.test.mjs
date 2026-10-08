import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const exec = promisify(execFile);

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'katachi-smoke-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const responses = new Map();
  const server = createServer((req, res) => {
    const [status, body] = responses.get(req.url) || [404, 'Not found'];
    res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const html = `<title>AI導入・AI活用支援</title><link rel="canonical" href="${base}/"><p>お問い合わせ</p>`;
  const sitemap = `<urlset><url><loc>${base}/</loc></url><url><loc>${base}/privacy.html</loc></url></urlset>`;
  for (const [path, name, body] of [
    ['/', 'index.html', html],
    ['/privacy.html', 'privacy.html', '<title>Privacy</title>'],
    ['/sitemap.xml', 'sitemap.xml', sitemap],
    ['/robots.txt', 'robots.txt', `Sitemap: ${base}/sitemap.xml`],
  ]) {
    responses.set(path, [200, body]);
    await writeFile(join(dir, name), body);
  }
  const run = (verify = true) => exec(process.execPath, ['scripts/smoke.mjs', base, ...(verify ? [dir] : [])]);
  return { responses, dir, run };
}

test('matching published content passes with artifact verification', async (t) => {
  const { run } = await fixture(t);
  assert.match((await run()).stdout, /smoke: ALL PASS/);
});

test('existing uptime usage passes without a local artifact', async (t) => {
  const { run } = await fixture(t);
  assert.match((await run(false)).stdout, /smoke: ALL PASS/);
});

test('HTTP 200 with stale content on a sitemap page fails', async (t) => {
  const { run, responses } = await fixture(t);
  responses.set('/privacy.html', [200, '<title>Old revision</title>']);
  await assert.rejects(run(), (error) => error.code === 1 && /SHA-256不一致/.test(error.stderr));
});

test('HTTP failure is detected without artifact verification', async (t) => {
  const { run, responses } = await fixture(t);
  responses.set('/', [503, 'Unavailable']);
  await assert.rejects(run(false), (error) => error.code === 1 && /status=503/.test(error.stderr));
});

test('a missing expected artifact fails instead of skipping verification', async (t) => {
  const { run, dir } = await fixture(t);
  await rm(join(dir, 'privacy.html'));
  await assert.rejects(run(), (error) => error.code === 1 && /artifactが存在する/.test(error.stderr));
});
