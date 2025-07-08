import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('dom.js utility functions', () => {
    test.beforeEach(async ({ page }) => {
        await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.min.js' });
        await page.addScriptTag({ path: path.resolve(__dirname, '../../src/dom.js') });
    });

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

    test('dom.revWalk traverses DOM tree in reverse', async ({ page }) => {
        const nodes = await page.evaluate(() => {
            const dom = window.ice.dom;
            const div = document.createElement('div');
            div.innerHTML = '<span><b></b></span>';
            const nodes = [];
            dom.revWalk(div, (el) => { nodes.push(el.nodeName); });
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

    test('dom.foreach iterates over arrays, NodeLists, and objects', async ({ page }) => {
        const { sum, keys } = await page.evaluate(() => {
            const dom = window.ice.dom;
            const arr = [1, 2, 3];
            let sum = 0;
            dom.foreach(arr, (i, el) => { sum += el; });
            const obj = { a: 1, b: 2 };
            let keys = [];
            dom.foreach(obj, (i) => { keys.push(i); });
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
