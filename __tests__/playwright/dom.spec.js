import { test, expect } from '@playwright/test';
import path from 'path';

test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.min.js' });
    await page.addScriptTag({ path: path.resolve(__dirname, '../../src/dom.js') });
});

test.describe('dom.js utility functions', () => {
    test('dom.extend merges objects', async ({ page }) => {
        const result = await page.evaluate(() => {
            return window.ice.dom.extend({}, { foo: 1 }, { bar: 2 });
        });
        expect(result.foo).toBe(1);
        expect(result.bar).toBe(2);
    });

    test('dom.walk traverses DOM tree', async ({ page }) => {
        const nodes = await page.evaluate(() => {
            const dom = window.ice.dom;
            const div = document.createElement('div');
            div.innerHTML = '<span><b></b></span>';
            const nodes = [];
            dom.walk(div, (el) => { nodes.push(el.nodeName); });
            return nodes;
        });
        expect(nodes).toContain('DIV');
        expect(nodes).toContain('SPAN');
        expect(nodes).toContain('B');
    });

    test('dom.setStyle and dom.getStyle set and get CSS', async ({ page }) => {
        const color = await page.evaluate(() => {
            const dom = window.ice.dom;
            const el = document.createElement('div');
            document.body.appendChild(el);
            dom.setStyle(el, 'color', 'red');
            const color = dom.getStyle(el, 'color');
            document.body.removeChild(el);
            return color;
        });
        expect(color).toMatch("rgb(255, 0, 0)");
    });

    test('dom.preventDefault and dom.stopPropagation', async ({ page }) => {
        const { prevented, stopped } = await page.evaluate(() => {
            const dom = window.ice.dom;
            let prevented = false, stopped = false;
            const e = {
                preventDefault: () => { prevented = true; },
                stopPropagation: () => { stopped = true; }
            };
            dom.preventDefault(e);
            return { prevented, stopped };
        });
        expect(prevented).toBe(true);
        expect(stopped).toBe(true);
    });

    test('dom.noInclusionInherits copies prototype properties', async ({ page }) => {
        const result = await page.evaluate(() => {
            const dom = window.ice.dom;
            function Parent() { }
            Parent.prototype.foo = () => 42;
            function Child() { }
            dom.noInclusionInherits(Child, Parent);
            const c = new Child();
            return { fooType: typeof c.foo, fooResult: c.foo() };
        });
        expect(result.fooType).toBe('function');
        expect(result.fooResult).toBe(42);
    });

    test('dom.each iterates over arrays and objects', async ({ page }) => {
        const { sum, keys } = await page.evaluate(() => {
            const dom = window.ice.dom;
            const arr = [1, 2, 3];
            let sum = 0;
            dom.each(arr, (i, el) => { sum += el; });
            const obj = { a: 1, b: 2 };
            let keys = [];
            dom.each(obj, (i, el) => { keys.push(i); });
            return { sum, keys };
        });
        expect(sum).toBe(6);
        expect(keys).toContain('a');
        expect(keys).toContain('b');
    });

    test('dom.isset returns true for set values', async ({ page }) => {
        const dom = require('../../src/dom.js');
        expect(dom.isset(0)).toBe(true);
        expect(dom.isset(null)).toBe(false);
        expect(dom.isset(undefined)).toBe(false);
    });

    test('dom.arrayDiff returns difference between arrays', async ({ page }) => {
        const dom = require('../../src/dom.js');
        const a = [1, 2, 3];
        const b = [2, 3, 4];
        expect(dom.arrayDiff(a, b, true)).toEqual([1]);
        expect(dom.arrayDiff(a, b, false)).toEqual([1, 4]);
    });

    test('dom.arrayMerge merges arrays', async ({ page }) => {
        const dom = require('../../src/dom.js');
        const a = [1, 2];
        const b = [3, 4];
        expect(dom.arrayMerge(a, b)).toEqual([1, 2, 3, 4]);
    });

    test('dom.stripTags strips tags except allowed', async ({ page }) => {
        const result = await page.evaluate(() => {
            const dom = window.ice.dom;
            const html = '<div><b>bold</b><i>italic</i></div>';
            return dom.stripTags(html, ['b']);
        });
        expect(result).toContain('bold');
        expect(result).not.toContain('<i>');
    });
});

test.describe('dom.js date and timestamp functions', () => {
    test('dom.date formats a timestamp', async ({ page }) => {
        const result = await page.evaluate(() => window.ice.dom.date('Y-m-d', 946684800000)); // 2000-01-01
        expect(result).toBe('2000-01-01');
    });

    test('dom.date formats ISO 8601 string', async ({ page }) => {
        const result = await page.evaluate(() => window.ice.dom.date('Y-m-d', null, '2000-01-01T00:00:00Z'));
        expect(result).toBe('2000-01-01');
    });

    test('dom.tsIso8601ToTimestamp parses ISO 8601', async ({ page }) => {
        const ts = await page.evaluate(() => window.ice.dom.tsIso8601ToTimestamp('2000-01-01T00:00:00Z'));
        // Should be close to 946684800000 (Jan 1, 2000 UTC)
        expect(Math.abs(ts - 946684800000)).toBeLessThan(1000); // allow 1s drift
    });

    test('dom.tsIso8601ToTimestamp returns null for invalid', async ({ page }) => {
        const ts = await page.evaluate(() => window.ice.dom.tsIso8601ToTimestamp('not-a-date'));
        expect(ts).toBeNull();
    });
});

test.describe('jQuery-based dom.js functions', () => {
  test('`getClass` returns elements with the given class', async ({ page }) => {
    await page.setContent('<div class="foo"></div><div class="foo"></div>');
    const result = await page.evaluate(() => window.ice.dom.getClass('foo').length);
    expect(result).toBe(2);
  });

  test('`empty` removes all children', async ({ page }) => {
    await page.setContent('<div id="test"><span></span></div>');
    await page.evaluate(() => window.ice.dom.empty(document.getElementById('test')));
    const children = await page.evaluate(() => document.getElementById('test').children.length);
    expect(children).toBe(0);
  });

  test('`remove` deletes the element', async ({ page }) => {
    await page.setContent('<div id="test"></div>');
    await page.evaluate(() => window.ice.dom.remove(document.getElementById('test')));
    const exists = await page.evaluate(() => document.getElementById('test'));
    expect(exists).toBeNull();
  });

  test('`prepend` adds element as first child', async ({ page }) => {
    await page.setContent('<div id="parent"><span></span></div>');
    await page.evaluate(() => {
      const parent = document.getElementById('parent');
      const newElem = document.createElement('b');
      window.ice.dom.prepend(parent, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('parent').firstChild.tagName);
    expect(tag).toBe('B');
  });

  test('`append` adds element as last child', async ({ page }) => {
    await page.setContent('<div id="parent"><span></span></div>');
    await page.evaluate(() => {
      const parent = document.getElementById('parent');
      const newElem = document.createElement('b');
      window.ice.dom.append(parent, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('parent').lastChild.tagName);
    expect(tag).toBe('B');
  });

  test('`insertBefore` inserts before the reference node', async ({ page }) => {
    await page.setContent('<div id="parent"><span id="ref"></span></div>');
    await page.evaluate(() => {
      const ref = document.getElementById('ref');
      const newElem = document.createElement('b');
      window.ice.dom.insertBefore(ref, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('ref').previousSibling.tagName);
    expect(tag).toBe('B');
  });

  test('`insertAfter` inserts after the reference node', async ({ page }) => {
    await page.setContent('<div id="parent"><span id="ref"></span></div>');
    await page.evaluate(() => {
      const ref = document.getElementById('ref');
      const newElem = document.createElement('b');
      window.ice.dom.insertAfter(ref, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('ref').nextSibling.tagName);
    expect(tag).toBe('B');
  });

  test('`contents` returns child nodes as array', async ({ page }) => {
    await page.setContent('<div id="test"><span></span><b></b></div>');
    const result = await page.evaluate(() => window.ice.dom.contents(document.getElementById('test')).length);
    expect(result).toBe(2);
  });

  test('`getNodeTextContent` returns text content', async ({ page }) => {
    await page.setContent('<div id="test">hello <b>world</b></div>');
    const text = await page.evaluate(() => window.ice.dom.getNodeTextContent(document.getElementById('test')));
    expect(text).toContain('hello');
  });

  // Parallel tests for native browser API equivalents
  test('`getClass` (native) returns elements with the given class', async ({ page }) => {
    await page.setContent('<div class="foo"></div><div class="foo"></div>');
    const result = await page.evaluate(() => Array.from(document.getElementsByClassName('foo')).length);
    expect(result).toBe(2);
  });

  test('`empty` (native) removes all children', async ({ page }) => {
    await page.setContent('<div id="test"><span></span></div>');
    await page.evaluate(() => {
      const el = document.getElementById('test');
      while (el.firstChild) el.removeChild(el.firstChild);
    });
    const children = await page.evaluate(() => document.getElementById('test').children.length);
    expect(children).toBe(0);
  });

  test('`remove` (native) deletes the element', async ({ page }) => {
    await page.setContent('<div id="test"></div>');
    await page.evaluate(() => {
      const el = document.getElementById('test');
      el.parentNode.removeChild(el);
    });
    const exists = await page.evaluate(() => document.getElementById('test'));
    expect(exists).toBeNull();
  });

  test('`prepend` (native) adds element as first child', async ({ page }) => {
    await page.setContent('<div id="parent"><span></span></div>');
    await page.evaluate(() => {
      const parent = document.getElementById('parent');
      const newElem = document.createElement('b');
      parent.insertBefore(newElem, parent.firstChild);
    });
    const tag = await page.evaluate(() => document.getElementById('parent').firstChild.tagName);
    expect(tag).toBe('B');
  });

  test('`append` (native) adds element as last child', async ({ page }) => {
    await page.setContent('<div id="parent"><span></span></div>');
    await page.evaluate(() => {
      const parent = document.getElementById('parent');
      const newElem = document.createElement('b');
      parent.appendChild(newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('parent').lastChild.tagName);
    expect(tag).toBe('B');
  });

  test('`insertBefore` (native) inserts before the reference node', async ({ page }) => {
    await page.setContent('<div id="parent"><span id="ref"></span></div>');
    await page.evaluate(() => {
      const ref = document.getElementById('ref');
      const newElem = document.createElement('b');
      ref.parentNode.insertBefore(newElem, ref);
    });
    const tag = await page.evaluate(() => document.getElementById('ref').previousSibling.tagName);
    expect(tag).toBe('B');
  });

  test('`insertAfter` (native) inserts after the reference node', async ({ page }) => {
    await page.setContent('<div id="parent"><span id="ref"></span></div>');
    await page.evaluate(() => {
      const ref = document.getElementById('ref');
      const newElem = document.createElement('b');
      ref.parentNode.insertBefore(newElem, ref.nextSibling);
    });
    const tag = await page.evaluate(() => document.getElementById('ref').nextSibling.tagName);
    expect(tag).toBe('B');
  });

  test('`contents` (native) returns child nodes as array', async ({ page }) => {
    await page.setContent('<div id="test"><span></span><b></b></div>');
    const result = await page.evaluate(() => Array.from(document.getElementById('test').childNodes).length);
    expect(result).toBe(2);
  });

  test('`getNodeTextContent` (native) returns text content', async ({ page }) => {
    await page.setContent('<div id="test">hello <b>world</b></div>');
    const text = await page.evaluate(() => document.getElementById('test').textContent);
    expect(text).toContain('hello');
  });
});