import { test, expect } from '@playwright/test';
import { setupIceEditor } from './playwright-setup.js';

test.describe('InlineChangeEditor.insert', () => {
  test.beforeEach(async ({ page }) => {
    await setupIceEditor(page);
  });

  test('inserts at the end, middle, and beginning of a block', async ({ page }) => {
    await page.setContent('<div id="el"><p>a paragraph</p></div>');
    await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      // End
      range.setStart(el.find('p')[0], 0);
      range.moveStart('character', 11);
      range.collapse(true);
      changeEditor.insert('. The end.', range);
      // Middle
      range.setStart(el.find('p')[0], 0);
      range.moveStart('character', 2);
      range.collapse(true);
      changeEditor.insert('new ', range);
      // Beginning
      range.setStart(el.find('p')[0], 0);
      range.collapse(true);
      changeEditor.insert('At the beginning of ', range);
    });
    const text = await page.$eval('#el', el => el.textContent);
    expect(text).toBe('At the beginning of a new paragraph. The end.');
  });

  test('inserts into another user insert', async ({ page }) => {
    await page.setContent('<div id="el"><p>test<span class="ins cts-1" userid="2" cid="1"> in 1 <span class="ins cts-2" userid="3" cid="2">in 2 </span></span><span class="ins cts-3" userid="4" cid="3">in 3</span> done.</p></div>');
    await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('span[cid=3]')[0], 0);
      range.moveStart('character', 2);
      range.collapse(true);
      changeEditor.insert('sert', range);
      range.setStart(el.find('span[cid=1]')[0], 0);
      range.moveStart('character', 3);
      range.collapse(true);
      changeEditor.insert('sert', range);
      range.setStart(el.find('span[cid=2]')[0], 0);
      range.moveStart('character', 2);
      range.collapse(true);
      changeEditor.insert('sert', range);
    });
    const text = await page.$eval('#el', el => el.textContent);
    expect(text).toBe('test insert 1 insert 2 insert 3 done.');
  });

  test('inserts in and around deletes', async ({ page }) => {
    await page.setContent('<div id="el"><p>test <span class="del cts-1" userid="1" cid="1">delete 1</span><span class="del cts-2" userid="2" cid="2"> delete 2<span class="del cts-3" userid="3" cid="3"> delete 3</span> delete 2.</span> The end.</p></div>');
    await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStartAfter(el.find('span[cid=3]')[0], 0);
      range.collapse(true);
      changeEditor.insert(' new insert.', range);
      el.find('.ins').remove();
      range.setStart(el.find('span[cid=3]')[0], 0);
      range.collapse(true);
      changeEditor.insert(' new insert.', range);
      el.find('.ins').remove();
      range.setStart(el.find('span[cid=1]')[0], 0);
      range.moveStart('character', 1);
      range.collapse(true);
      changeEditor.insert(' new insert.', range);
    });
    const text = await page.$eval('#el', el => el.textContent);
    expect(text).toBe('test delete 1 delete 2 delete 3 delete 2. new insert. The end.');
  });

  test('inserts in deletes consuming block', async ({ page }) => {
    await page.setContent('<div id="el"><p><span class="del cts-1" userid="1" cid="1">delete</span></p><p> text</p></div>');
    await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0], 0);
      range.moveStart('character', 1);
      range.collapse(true);
      changeEditor.insert(' test', range);
    });
    const text = await page.$eval('#el', el => el.textContent);
    expect(text).toBe('delete test text');
  });

  test('inserts in deletes consuming block with no following blocks', async ({ page }) => {
    await page.setContent('<div id="el"><p><span class="del cts-1" userid="1" cid="1">del</span><span class="del cts-2" userid="1" cid="2">ete</span></p></div>');
    await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('p')[0], 0);
      range.moveStart('character', 1);
      range.collapse(true);
      changeEditor.insert(' test', range);
    });
    const text = await page.$eval('#el', el => el.textContent);
    expect(text).toBe('delete test');
  });

  test('inserts space into .del region', async ({ page }) => {
    await page.setContent('<div id="el"><p>The placid sliver of <span class="del cts-3" data-cid="4" data-userid="11">Long</span> Island that F. Scott Fitzgerald immortalized in "The Great Gatsby" as West Egg and East Egg seems almost to have shrugged off the recession.</p></div>');
    await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('span.del')[0], 1);
      range.collapse(true);
      changeEditor.insert(' ', range);
    });
    const insText = await page.$eval('#el .ins', el => el.textContent);
    expect(insText).toBe(' ');
  });

  test('inserts space into .del region with track changes hidden', async ({ page }) => {
    await page.setContent('<div id="el"><p>The placid sliver of <span class="del cts-3" data-cid="4" data-userid="11">Long</span> Island that F. Scott Fitzgerald immortalized in "The Great Gatsby" as West Egg and East Egg seems almost to have shrugged off the recession.</p></div>');
    await page.evaluate(() => {
      const el = jQuery('#el');
      const changeEditor = getIce(el);
      el.find('.del').css({display:'none'});
      const range = changeEditor.env.selection.createRange();
      range.setStart(el.find('span.del')[0], 1);
      range.collapse(true);
      changeEditor.insert(' ', range);
    });
    const insText = await page.$eval('#el .ins', el => el.textContent);
    expect(insText).toBe(' ');
  });
});
