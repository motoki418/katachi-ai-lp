const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(require('node:path').join(__dirname, '../assets/lead-attribution.js'), 'utf8');
const key = 'katachi.public-page-attribution.v1';
function context(pathname, storage = new Map(), blocked = false) {
  const window = { location: { pathname, search: '?private=secret', hash: '#secret' },
    sessionStorage: { getItem: k => { if (blocked) throw Error(); return storage.get(k); },
                      setItem: (k,v) => storage.set(k,v) } };
  vm.runInNewContext(source, { window });
  return window;
}
function visit(pathname, storage, blocked) {
  const window = context(pathname, storage, blocked);
  return window.katachiLeadAttribution && JSON.parse(JSON.stringify(window.katachiLeadAttribution()));
}
test('BFCache restored contact page uses latest same-tab navigation', () => {
  const storage = new Map(); const restored = context('/', storage);
  visit('/training/', storage);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.katachiLeadAttribution())), { landing_page: '/', lead_source_page: '/training/' });
});
test('training -> contact retains first entry and source', () => {
  const storage = new Map(); visit('/training/', storage);
  assert.deepEqual(visit('/', storage), { landing_page: '/training/', lead_source_page: '/training/' });
  assert.equal([...storage.values()].join('').includes('secret'), false);
});
test('last content page and first entry are distinct', () => {
  const storage = new Map(); visit('/', storage); visit('/about/index.html', storage); visit('/training', storage);
  assert.deepEqual(visit('/', storage), { landing_page: '/', lead_source_page: '/training/' });
});
test('download canonical path', () => {
  assert.deepEqual(visit('/downloads/ai-readiness-checklist.html'), { landing_page: '/downloads/ai-readiness-checklist', lead_source_page: '/downloads/ai-readiness-checklist' });
});
test('denied storage uses current public path', () => {
  assert.deepEqual(visit('/', new Map(), true), { landing_page: '/', lead_source_page: '/' });
});
test('invalid or malicious stored data never propagates', () => {
  for (const saved of ['not json', JSON.stringify({ landing_page: '/private/person', lead_source_page: '/' }), JSON.stringify({ landing_page: '/', lead_source_page: '/?secret' })]) {
    assert.deepEqual(visit('/', new Map([[key, saved]])), { landing_page: '/', lead_source_page: '/' });
  }
});
test('unknown paths are not tracked', () => assert.equal(visit('/private/person'), undefined));
