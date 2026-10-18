const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const path = require('node:path');
const root = path.join(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'assets/app.js'), 'utf8');

function start({ country = 'DE', languages = ['en-US'], saved, fail = false, blockedStorage = false, pending } = {}) {
  const storage = new Map(saved ? [['smarsys-language-choice', saved]] : []);
  const session = new Map();
  const elements = [{ dataset: { i18n: 'navContact' }, textContent: '' }];
  const buttons = ['sq', 'en', 'de'].map(lang => ({
    dataset: { lang }, classList: { toggle() {} }, setAttribute() {},
    addEventListener(event, callback) { this.click = callback; }
  }));
  let calls = 0;
  const context = vm.createContext({
    window: {}, navigator: { languages }, AbortController, setTimeout, clearTimeout,
    CustomEvent: class {},
    localStorage: {
      getItem(key) { if (blockedStorage) throw Error(); return storage.get(key); },
      setItem(key, value) { if (blockedStorage) throw Error(); storage.set(key, value); }
    },
    sessionStorage: { getItem: key => session.get(key), setItem: (key, value) => session.set(key, value) },
    document: {
      documentElement: {}, dispatchEvent() {},
      querySelectorAll: selector => selector === '[data-lang]' ? buttons : elements
    },
    fetch: async () => {
      calls++;
      if (pending) return pending;
      if (fail) throw Error('Network failure');
      return { ok: true, json: async () => ({ success: true, country_code: country }) };
    }
  });
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/marketing-content.js'), 'utf8'), context);
  vm.runInContext(app.slice(0, app.indexOf("document.getElementById('year')")), context);
  return { context, buttons, storage, elements, calls: () => calls, lang: () => context.document.documentElement.lang };
}
const settled = () => new Promise(resolve => setImmediate(resolve));

test('country selects supported language, otherwise English', async () => {
  for (const [country, expected] of Object.entries({ XK: 'sq', AL: 'sq', DE: 'de', AT: 'de', LI: 'de', IT: 'en', FR: 'en', TR: 'en', MK: 'en', ME: 'en', RS: 'en', US: 'en' })) {
    const site = start({ country });
    assert.equal(site.lang(), 'en');
    await settled();
    assert.equal(site.lang(), expected, country);
    assert.equal(site.storage.size, 0, 'Automatic selection must not become a manual preference');
  }
});

test('multilingual countries use the first supported browser language', async () => {
  for (const country of ['CH', 'BE', 'LU', 'CA']) {
    const site = start({ country, languages: ['fr-CH', 'de-CH', 'en'] });
    await settled();
    assert.equal(site.lang(), 'de');
  }
  const site = start({ country: 'CH', languages: ['fr-CH', 'it'] });
  await settled();
  assert.equal(site.lang(), 'en');
});

test('saved manual selection wins and skips location lookup', async () => {
  const site = start({ country: 'DE', saved: 'sq' });
  await settled();
  assert.equal(site.lang(), 'sq');
  assert.equal(site.calls(), 0);
});

test('a manual selection during lookup cannot be overwritten', async () => {
  let finish;
  const site = start({ pending: new Promise(resolve => { finish = resolve; }) });
  site.buttons[0].click();
  finish({ ok: true, json: async () => ({ success: true, country_code: 'DE' }) });
  await settled();
  assert.equal(site.lang(), 'sq');
  assert.equal(site.storage.get('smarsys-language-choice'), 'sq');
});

test('lookup failure, invalid responses and blocked storage are handled', async () => {
  for (const options of [{ fail: true }, { country: 'invalid' }, { saved: '__proto__', fail: true }]) {
    const site = start(options);
    await settled();
    assert.equal(site.lang(), 'en');
  }
  const site = start({ blockedStorage: true });
  await settled();
  assert.equal(site.lang(), 'de');
  site.buttons[0].click();
  assert.equal(site.lang(), 'sq');
});

test('missing translation text falls back to English instead of previous language', async () => {
  const site = start({ saved: 'sq' });
  vm.runInContext("delete translations.de.navContact; setLanguage('de');", site.context);
  assert.equal(site.elements[0].textContent, 'Contact');
});

test('all pages start in English and load shared language selection', () => {
  for (const file of ['index.html', 'poligon.html', 'villa.html', 'downloads.html']) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, /<html lang="en">/);
    assert.match(html, /data-lang="en" class="active"/);
    assert.match(html, /src="assets\/app.js"/);
  }
});
