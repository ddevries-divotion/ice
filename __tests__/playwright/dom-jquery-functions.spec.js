// playwright test for jQuery-based dom.js functions
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('jQuery-based dom.js functions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.min.js' });
    await page.addScriptTag({ path: path.resolve(__dirname, '../../src/dom.js') });
  });

  test('`getClass` returns elements with the given class', async ({ page }) => {
    await page.setContent('<div class="foo"></div><div class="foo"></div>');
    const result = await page.evaluate(() => window.dom.getClass('foo').length);
    expect(result).toBe(2);
  });

  test('`getTag` returns elements with the given tag', async ({ page }) => {
    await page.setContent('<span></span><span></span>');
    const result = await page.evaluate(() => window.dom.getTag('span').length);
    expect(result).toBe(2);
  });

  test('`empty` removes all children', async ({ page }) => {
    await page.setContent('<div id="test"><span></span></div>');
    await page.evaluate(() => window.dom.empty(document.getElementById('test')));
    const children = await page.evaluate(() => document.getElementById('test').children.length);
    expect(children).toBe(0);
  });

  test('`remove` deletes the element', async ({ page }) => {
    await page.setContent('<div id="test"></div>');
    await page.evaluate(() => window.dom.remove(document.getElementById('test')));
    const exists = await page.evaluate(() => document.getElementById('test'));
    expect(exists).toBeNull();
  });

  test('`prepend` adds element as first child', async ({ page }) => {
    await page.setContent('<div id="parent"><span></span></div>');
    await page.evaluate(() => {
      const parent = document.getElementById('parent');
      const newElem = document.createElement('b');
      window.dom.prepend(parent, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('parent').firstChild.tagName);
    expect(tag).toBe('B');
  });

  test('`append` adds element as last child', async ({ page }) => {
    await page.setContent('<div id="parent"><span></span></div>');
    await page.evaluate(() => {
      const parent = document.getElementById('parent');
      const newElem = document.createElement('b');
      window.dom.append(parent, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('parent').lastChild.tagName);
    expect(tag).toBe('B');
  });

  test('`insertBefore` inserts before the reference node', async ({ page }) => {
    await page.setContent('<div id="parent"><span id="ref"></span></div>');
    await page.evaluate(() => {
      const ref = document.getElementById('ref');
      const newElem = document.createElement('b');
      window.dom.insertBefore(ref, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('ref').previousSibling.tagName);
    expect(tag).toBe('B');
  });

  test('`insertAfter` inserts after the reference node', async ({ page }) => {
    await page.setContent('<div id="parent"><span id="ref"></span></div>');
    await page.evaluate(() => {
      const ref = document.getElementById('ref');
      const newElem = document.createElement('b');
      window.dom.insertAfter(ref, newElem);
    });
    const tag = await page.evaluate(() => document.getElementById('ref').nextSibling.tagName);
    expect(tag).toBe('B');
  });

  test('`getHtml` returns innerHTML', async ({ page }) => {
    await page.setContent('<div id="test">foo</div>');
    const html = await page.evaluate(() => window.dom.getHtml(document.getElementById('test')));
    expect(html).toBe('foo');
  });

  test('`setHtml` sets innerHTML', async ({ page }) => {
    await page.setContent('<div id="test"></div>');
    await page.evaluate(() => window.dom.setHtml(document.getElementById('test'), 'bar'));
    const html = await page.evaluate(() => document.getElementById('test').innerHTML);
    expect(html).toBe('bar');
  });

  test('`contents` returns child nodes as array', async ({ page }) => {
    await page.setContent('<div id="test"><span></span><b></b></div>');
    const result = await page.evaluate(() => window.dom.contents(document.getElementById('test')).length);
    expect(result).toBe(2);
  });

  test('`getNodeTextContent` returns text content', async ({ page }) => {
    await page.setContent('<div id="test">hello <b>world</b></div>');
    const text = await page.evaluate(() => window.dom.getNodeTextContent(document.getElementById('test')));
    expect(text).toContain('hello');
  });
});
