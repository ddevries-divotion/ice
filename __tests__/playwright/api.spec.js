import { test, expect } from '@playwright/test';
import { setupIceEditor } from './playwright-setup.js';

test.describe('InlineChangeEditor core API', () => {
  test.beforeEach(async ({ page }) => {
    await setupIceEditor(page);
  });

  test('constructor adds paragraph to empty element', async ({ page }) => {
    await page.setContent('<div id="el"></div>');
    const result = await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      return {
        pCount: el.querySelectorAll('p').length,
        rangeStart: changeEditor.env.selection.getRangeAt(0).startContainer.nodeName
      };
    });
    expect(result.pCount).toBe(1);
    expect(['P', '#text']).toContain(result.rangeStart);
  });

  test('getCleanContent strips inserts and deletes', async ({ page }) => {
    await page.setContent('<div id="el"><p>test <span class="ins cts-1" cid="1">content</span> in paragraph one.</p><p>test <em><span class="del cts-2" cid="2">content <span class="ins" cid="3">in</span></span> paragraph</em> two.</p></div>');
    const result = await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      const clean = changeEditor.getCleanContent();
      const temp = document.createElement('div');
      temp.innerHTML = clean;
      return {
        insDelCount: temp.querySelectorAll('.ins, .del').length,
        textContent: temp.textContent
      };
    });
    expect(result.insDelCount).toBe(0);
    expect(result.textContent).toBe('test content in paragraph one.test  paragraph two.');
  });

  test('acceptAll removes inserts and deletes', async ({ page }) => {
    await page.setContent('<div id="el"><p>test <span class="ins" cid="1">content<span class="ins" cid="4"> in</span></span> paragraph one.</p><p>test <em><span class="del" cid="2">content <span class="ins" cid="3">in</span></span> paragraph</em> two.</p></div>');
    await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      changeEditor.acceptAll();
    });
    const elText = await page.$eval('#el', el => el.textContent);
    const insDelCount = await page.$$eval('#el .ins, #el .del', els => els.length);
    expect(insDelCount).toBe(0);
    expect(elText).toBe('test content in paragraph one.test  paragraph two.');
  });

  test('rejectAll removes inserts and replaces deletes', async ({ page }) => {
    await page.setContent('<div id="el"><p>test <span class="ins" cid="1">content<span class="ins" cid="4"> in</span></span> paragraph one.</p><p>test <em><span class="del" cid="2">content <span class="ins" cid="3">in</span></span> paragraph</em> two.</p></div>');
    await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      changeEditor.rejectAll();
    });
    const elText = await page.$eval('#el', el => el.textContent);
    const insDelCount = await page.$$eval('#el .ins, #el .del', els => els.length);
    expect(insDelCount).toBe(0);
    expect(elText).toBe('test  paragraph one.test content  paragraph two.');
  });

  test('acceptChange accepts specific changes', async ({ page }) => {
    await page.setContent('<div id="el"><p>test <span class="ins" cid="1">content<span class="ins" cid="4"> in</span></span> paragraph one.</p><p>test <em><span class="del" cid="2">content <span class="ins" cid="3">in</span></span><span class="del" cid="2">batch change cid</span> paragraph</em> two.</p></div>');
    await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.querySelector('[cid="4"]'), 1);
      range.collapse(true);
      changeEditor.env.selection.addRange(range);
      changeEditor.acceptChange();
      changeEditor.acceptChange(el.querySelector('[cid="2"]'));
    });
    const elText = await page.$eval('#el', el => el.textContent);
    const cidCount = await page.$$eval('#el [cid="4"], #el [cid="2"]', els => els.length);
    expect(cidCount).toBe(0);
    expect(elText).toBe('test content in paragraph one.test  paragraph two.');
  });

  test('rejectChange rejects specific changes', async ({ page }) => {
    await page.setContent('<div id="el"><p>test <span class="ins" cid="1">content<span class="ins" cid="4"> in</span></span> paragraph one.</p><p>test <em><span class="del" cid="2">content <span class="ins" cid="3">in</span></span> paragraph</em> two.</p></div>');
    await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.querySelector('[cid="4"]'), 1);
      range.collapse(true);
      changeEditor.env.selection.addRange(range);
      changeEditor.rejectChange();
      changeEditor.rejectChange(el.querySelector('[cid="2"]'));
    });
    const elText = await page.$eval('#el', el => el.textContent);
    const cidCount = await page.$$eval('#el [cid="4"], #el [cid="2"]', els => els.length);
    expect(cidCount).toBe(0);
    expect(elText).toBe('test content paragraph one.test content in paragraph two.');
  });

  test('placeholdDeletes adds placeholders for deletes', async ({ page }) => {
    await page.setContent('<div id="el"><p>test <span class="del cts-1" cid="1">content</span> in paragraph one.</p><p>test <em><span class="del cts-2" cid="2">content <span class="ins" cid="3">in</span></span> paragraph</em> two.</p></div>');
    const result = await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      changeEditor.placeholdDeletes();
      return {
        p0: el.querySelectorAll('p')[0].textContent,
        p0alloc: el.querySelectorAll('p')[0].querySelector('tempdel')?.getAttribute('data-allocation'),
        p1: el.querySelectorAll('p')[1].textContent,
        p1alloc: el.querySelectorAll('p')[1].querySelector('tempdel')?.getAttribute('data-allocation')
      };
    });
    expect(result.p0).toBe('test  in paragraph one.');
    expect(result.p0alloc).toBe('0');
    expect(result.p1).toBe('test  paragraph two.');
    expect(result.p1alloc).toBe('1');
  });

  test('revertDeletePlaceholders restores original HTML', async ({ page }) => {
    const html = '<p>test <span class="del cts-1" cid="1">content</span> in paragraph one.</p><p>test <em><span class="del cts-2" cid="2">content <span class="ins" cid="3">in</span></span> paragraph</em> two.</p>';
    await page.setContent(`<div id="el">${html}</div>`);
    const result = await page.evaluate(() => {
      const el = document.querySelector('#el');
      const changeEditor = getIce(el);
      changeEditor.placeholdDeletes();
      changeEditor.revertDeletePlaceholders();
      return el.innerHTML;
    });
    expect(result).toBe(html);
  });
});
