import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('jQuery-based dom.js functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.min.js' });
    await page.addScriptTag({ path: path.resolve(__dirname, '../../src/dom.js') });
  });

  test('`getClass` returns elements with the given class', async ({ page }) => {
    await page.setContent('<div class="foo"></div><div class="foo"></div>');
    const result = await page.evaluate(() => window.ice.dom.getClass('foo').length);
    expect(result).toBe(2);
  });

  test('`getTag` returns elements with the given tag', async ({ page }) => {
    await page.setContent('<span></span><span></span>');
    const result = await page.evaluate(() => window.ice.dom.getTag('span').length);
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

  test('`getHtml` returns innerHTML', async ({ page }) => {
    await page.setContent('<div id="test">foo</div>');
    const html = await page.evaluate(() => window.ice.dom.getHtml(document.getElementById('test')));
    expect(html).toBe('foo');
  });

  test('`setHtml` sets innerHTML', async ({ page }) => {
    await page.setContent('<div id="test"></div>');
    await page.evaluate(() => window.ice.dom.setHtml(document.getElementById('test'), 'bar'));
    const html = await page.evaluate(() => document.getElementById('test').innerHTML);
    expect(html).toBe('bar');
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

  test('`getTag` (native) returns elements with the given tag', async ({ page }) => {
    await page.setContent('<span></span><span></span>');
    const result = await page.evaluate(() => document.getElementsByTagName('span').length);
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

  test('`getHtml` (native) returns innerHTML', async ({ page }) => {
    await page.setContent('<div id="test">foo</div>');
    const html = await page.evaluate(() => document.getElementById('test').innerHTML);
    expect(html).toBe('foo');
  });

  test('`setHtml` (native) sets innerHTML', async ({ page }) => {
    await page.setContent('<div id="test"></div>');
    await page.evaluate(() => { document.getElementById('test').innerHTML = 'bar'; });
    const html = await page.evaluate(() => document.getElementById('test').innerHTML);
    expect(html).toBe('bar');
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
