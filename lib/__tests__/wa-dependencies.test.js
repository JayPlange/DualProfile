/**
 * The WhatsApp dependency registry in content/content.js: ordered strategies per element, with the
 * matching strategy reported. content.js is not a module, so the registry block is cut out of the
 * source and run against a small fake `document`.
 */
const fs = require('fs');
const path = require('path');

function load(fakeDocument) {
  const src = fs.readFileSync(path.join(__dirname, '../../content/content.js'), 'utf8');
  const a = src.indexOf('var WA_DEPENDENCIES = {');
  const b = src.indexOf('// Resolves with the first of the named dependencies');
  if (a < 0 || b < 0) throw new Error('registry block not found in content.js');
  const code = src.slice(a, b) + '; return { WA_DEPENDENCIES, waFind };';
  return new Function('document', code)(fakeDocument);
}

// A fake document that answers querySelector / querySelectorAll from a table of selector -> element.
function fakeDoc(table) {
  const el = (name, extra) => Object.assign({ name, closest() { return this; }, multiple: false }, extra || {});
  const doc = {
    el,
    querySelector: (sel) => (sel in table ? table[sel] : null),
    querySelectorAll: (sel) => (sel in table ? [].concat(table[sel]) : [])
  };
  return doc;
}

describe('waFind', () => {
  test('returns the first strategy when it matches, with index 0', () => {
    const btn = { name: 'business-nav-button' };
    const photo = { closest: () => btn };
    const doc = fakeDoc({ '[data-testid="navbar-item-profile-photo"]': photo });
    const { waFind } = load(doc);
    const hit = waFind('navProfileButton');
    expect(hit.el).toBe(btn);
    expect(hit.index).toBe(0);
    expect(hit.strategy).toMatch(/navbar-item-profile-photo/);
  });

  test('falls back to the last footer button on a personal account, and says so', () => {
    const media = { name: 'media' };
    const you = { name: 'you' };
    const footer = { querySelectorAll: () => [media, you] };
    const doc = fakeDoc({ '[data-testid="navbar-footer-section"]': footer });
    const { waFind } = load(doc);
    const hit = waFind('navProfileButton');
    expect(hit.el).toBe(you);
    expect(hit.index).toBe(1);
  });

  test('uses the English label only as the last resort', () => {
    const labelled = { name: 'labelled-you' };
    const doc = fakeDoc({ '[data-testid="navbar-footer-section"] button[aria-label="You"]': labelled });
    const { waFind } = load(doc);
    const hit = waFind('navProfileButton');
    expect(hit.el).toBe(labelled);
    expect(hit.index).toBe(2);
  });

  test('returns null when no strategy matches', () => {
    const { waFind } = load(fakeDoc({}));
    expect(waFind('navProfileButton')).toBeNull();
    expect(waFind('profileRow')).toBeNull();
    expect(waFind('noSuchDependency')).toBeNull();
  });

  test('a strategy that throws is skipped, not fatal', () => {
    const doc = fakeDoc({});
    doc.querySelector = () => { throw new Error('page changed shape'); };
    const { waFind } = load(doc);
    expect(waFind('profilePicker')).toBeNull();
  });

  test('the photo input falls back to a single-file image input, skipping multi-select ones', () => {
    const multi = { name: 'attachments', multiple: true };
    const single = { name: 'avatar-input', multiple: false };
    const doc = fakeDoc({ 'input[type="file"][accept*="image/jpeg"]': [multi, single] });
    const { waFind } = load(doc);
    const hit = waFind('photoInput');
    expect(hit.el).toBe(single);
    expect(hit.index).toBe(1);
  });

  test('the exact accept list wins over the fallback when both exist', () => {
    const exact = { name: 'exact' };
    const doc = fakeDoc({
      'input[type="file"][accept="image/gif,image/jpeg,image/jpg,image/png"]': exact,
      'input[type="file"][accept*="image/jpeg"]': [{ name: 'other', multiple: false }]
    });
    const { waFind } = load(doc);
    expect(waFind('photoInput').el).toBe(exact);
    expect(waFind('photoInput').index).toBe(0);
  });

  test('every dependency lists at least one strategy and names each one', () => {
    const { WA_DEPENDENCIES } = load(fakeDoc({}));
    for (const key of Object.keys(WA_DEPENDENCIES)) {
      expect(WA_DEPENDENCIES[key].length).toBeGreaterThan(0);
      for (const strategy of WA_DEPENDENCIES[key]) {
        expect(typeof strategy.name).toBe('string');
        expect(typeof strategy.find).toBe('function');
      }
    }
  });
});

describe('runWaHealthCheck', () => {
  // Cut the registry plus the health check out of content.js and run it against a fake page.
  function loadHealth(doc) {
    const src = fs.readFileSync(path.join(__dirname, '../../content/content.js'), 'utf8');
    const a = src.indexOf('var WA_DEPENDENCIES = {');
    const b = src.indexOf('var _waHealthRetries = 0;');
    if (a < 0 || b < 0) throw new Error('health block not found in content.js');
    const code = src.slice(a, src.indexOf('// Resolves with the first of the named dependencies')) +
      src.slice(src.indexOf('// Self-check of what can be tested'), b) + '; return runWaHealthCheck;';
    return new Function('document', code)(doc);
  }
  const row = (hasTitle, hasAvatar) => ({
    querySelector: (sel) => (sel === 'span[title]' ? (hasTitle ? {} : null) : (hasAvatar ? {} : null))
  });
  function page(rows, navButton) {
    const footer = navButton ? { querySelectorAll: () => [{}, navButton] } : null;
    const rowList = rows.slice();
    rowList.forEach = Array.prototype.forEach;
    return {
      querySelector: (sel) => (sel === '[data-testid="navbar-footer-section"]' ? footer : null),
      querySelectorAll: (sel) => (sel === '[role="row"]' ? rowList : [])
    };
  }

  test('a page that has not rendered is "not ready", never a failure', () => {
    const results = loadHealth(page([], null))();
    expect(results).toHaveLength(1);
    expect(results[0].ok).toBeNull();
  });

  test('a rendered page with everything present passes every check', () => {
    const results = loadHealth(page([row(true, true), row(true, true)], {}))();
    expect(results.every((r) => r.ok === true)).toBe(true);
  });

  test('rows present but no profile button is a real failure', () => {
    const results = loadHealth(page([row(true, true)], null))();
    const nav = results.find((r) => /profile button/.test(r.name));
    expect(nav.ok).toBe(false);
  });

  test('rows with no names or avatars are failures', () => {
    const results = loadHealth(page([row(false, false)], {}))();
    expect(results.find((r) => /chat names/.test(r.name)).ok).toBe(false);
    expect(results.find((r) => /avatars/.test(r.name)).ok).toBe(false);
  });
});
