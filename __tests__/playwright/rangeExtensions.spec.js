import { test, expect } from '@playwright/test';
import { setupIceEditor } from './playwright-setup.js';

test.describe('range/rangy extensions', () => {
  test.beforeEach(async ({ page }) => {
    await setupIceEditor(page);
  });

  test('range.moveStart - move 1 character to the left', async ({ page }) => {
    await page.setContent('<div id="el"><p>a paragraph</p><ol><li><span><img></span></li></ol></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('li')[0], 0);
      range.moveStart('character', -1);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        pText: el.find('p')[0].childNodes[0].textContent
      };
    });
    expect(result.startOffset).toBe(10);
  });

  test('range.moveStart - move 15 characters to the left', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span>a paragraph</span>test</p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0].childNodes[2], 2);
      range.moveStart('character', -15);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset
      };
    });
    expect(result.startOffset).toBe(2);
  });

  test('range.moveStart - move 15 characters to the right', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span>a paragraph</span>test</p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0].childNodes[0], 2);
      range.moveStart('character', 15);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset
      };
    });
    expect(result.startOffset).toBe(2);
  });

  test('range.moveStart - move 6 characters to the left', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span>a paragraph</span>test</p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0].childNodes[2], 2);
      range.moveStart('character', -6);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset
      };
    });
    expect(result.startOffset).toBe(7);
  });

  test('range.moveStart - move 6 characters to the right', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span>a paragraph</span>test</p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0].childNodes[1].childNodes[0], 7);
      range.moveStart('character', 6);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset
      };
    });
    expect(result.startOffset).toBe(2);
  });

  test('range.moveStart - move 6 characters to the left (with em)', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span><em>a paragraph</em></span>test</p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0].childNodes[2], 2);
      range.moveStart('character', -6);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset
      };
    });
    expect(result.startOffset).toBe(7);
  });

  test('range.moveStart - move 19 characters to the right (with em)', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span><em>a paragraph</em></span>test</p><p></p><p>test<span><em>a paragraph</em></span>test</p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p:eq(0) em')[0].childNodes[0], 7);
      range.moveStart('character', 19);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset
      };
    });
    expect(result.startOffset).toBe(7);
  });

  test('range.moveStart - move 19 characters to the left (with em)', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span><em>a paragraph</em></span>test</p><p></p><p>test<span><em>a paragraph</em></span>test</p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p:eq(2) em')[0].childNodes[0], 7);
      range.moveStart('character', -19);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset
      };
    });
    expect(result.startOffset).toBe(7);
  });

  test('range.moveStart - move 1 character to the right', async ({ page }) => {
    await page.setContent('<div id="el"><p><span>a paragraph</span></p></div>');
    const result = await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0], 0);
      range.moveStart('character', 1);
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        spanText: el.find('span')[0].childNodes[0].textContent
      };
    });
    expect(result.startOffset).toBe(1);
  });
});
