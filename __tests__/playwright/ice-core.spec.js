import { test, expect } from "@playwright/test";
import { setupIceEditor } from "./playwright-setup.js";

test.describe("ICE Core Functionality (Native DOM)", () => {
  test.beforeEach(async ({ page }) => {
    await setupIceEditor(page);
  });

  test("inserts at block boundaries (start/end)", async ({ page }) => {
    await page.setContent('<div id="el"><p>middle</p></div>');
    await page.evaluate(() => {
      const el = document.getElementById("el");
      const changeEditor = getIce(el);
      const p = el.querySelector("p");
      // Insert at start
      let range = changeEditor.env.selection.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      changeEditor.insert("start-", range);
      // Insert at end
      range = changeEditor.env.selection.createRange();
      range.setStart(p, p.childNodes.length);
      range.collapse(true);
      changeEditor.insert("-end", range);
    });
    const text = await page.$eval("#el", (el) => el.textContent);
    expect(text).toBe("start-middle-end");
  });

  test("nested and overlapping changes", async ({ page }) => {
    await page.setContent('<div id="el"><p>foo</p></div>');
    await page.evaluate(() => {
      const el = document.getElementById("el");
      const changeEditor = getIce(el);
      const p = el.querySelector("p");
      // Insert "bar" after "f"
      let range = changeEditor.env.selection.createRange();
      range.setStart(p.firstChild, 1);
      range.collapse(true);
      changeEditor.insert("bar", range);
      // After insertion, find the text node containing "o"
      const nodes = Array.from(p.childNodes);
      let oNode = null,
        oOffset = 0;
      for (const node of nodes) {
        if (
          node.nodeType === Node.TEXT_NODE &&
          node.textContent.includes("o")
        ) {
          oNode = node;
          oOffset = node.textContent.indexOf("o");
          break;
        }
      }
      if (oNode) {
        range = changeEditor.env.selection.createRange();
        range.setStart(oNode, oOffset);
        range.setEnd(oNode, oOffset + 1);
        changeEditor.deleteContents(false, range);
      }
    });
    const html = await page.$eval("#el", (el) => el.innerHTML);
    expect(html).toMatch(/ins/); // Inserted node
    expect(html).toMatch(/del/); // Deleted node
  });

  test("changing user attributes new changes", async ({ page }) => {
    await page.setContent('<div id="el"><p>user test</p></div>');
    const result = await page.evaluate(() => {
      const el = document.getElementById("el");
      const changeEditor = getIce(el);
      changeEditor.setCurrentUser({ id: "99", name: "Alice" });
      const p = el.querySelector("p");
      let range = changeEditor.env.selection.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      changeEditor.insert("A", range);
      // Find the inserted node and get userid
      const ins = el.querySelector(".ins");
      return ins ? ins.getAttribute("userid") : null;
    });
    expect(result).toBe("99");
  });

  test("plugin hooks are called (nodeInserted)", async ({ page }) => {
    await page.setContent('<div id="el"><p>plugin</p></div>');
    const result = await page.evaluate(() => {
      let called = false;
      // Add a dummy plugin with setEnabled
      window.ice._plugin.TestPlugin = function (_ice) {
        this.nodeInserted = function (_node) {
          called = true;
        };
        this.start = function () {};
        this.setEnabled = function () {};
      };
      const el = document.getElementById("el");
      const changeEditor = new ice.InlineChangeEditor({
        element: el,
        isTracking: true,
        plugins: ["TestPlugin"],
      }).startTracking();
      const p = el.querySelector("p");
      let range = changeEditor.env.selection.createRange();
      range.setStart(p, 0);
      range.collapse(true);
      changeEditor.insert("Z", range);
      return called;
    });
    expect(result).toBe(true);
  });

  test("allows composing space and adds composed punctuation", async ({
    page,
  }) => {
    await page.setContent('<div id="el"><p>abc</p></div>');

    const result = await page.evaluate(() => {
      const el = document.querySelector("#el");
      const changeEditor = getIce(el);
      const p = el.querySelector("p");
      const preventedSpaces = [];

      for (let i = 0; i < 3; i++) {
        const evt = new KeyboardEvent("keydown", {
          key: " ",
          code: "Space",
          keyCode: 32,
          which: 32,
          bubbles: true,
        });
        Object.defineProperty(evt, "isComposing", { value: true });
        changeEditor.handleEvent(evt);
        preventedSpaces.push(evt.defaultPrevented);
      }

      const textAfterSpaces = el.textContent;

      const chars = ["'", '"', "`"]; // single, double, backtick
      const preventedChars = [];

      for (const ch of chars) {
        const evt = new KeyboardEvent("keydown", {
          key: " ",
          code: "Space",
          keyCode: 32,
          which: 32,
          bubbles: true,
        });
        Object.defineProperty(evt, "isComposing", { value: true });
        changeEditor.handleEvent(evt);
        preventedChars.push(evt.defaultPrevented);

        const range = changeEditor.env.selection.createRange();
        range.setStart(p, p.childNodes.length);
        range.collapse(true);
        changeEditor.insert(ch, range);
      }

      return {
        textAfterSpaces,
        finalText: el.textContent,
        preventedSpaces,
        preventedChars,
      };
    });

    expect(result.preventedSpaces.every((v) => v === false)).toBe(true);
    expect(result.textAfterSpaces).toBe("abc");
    expect(result.preventedChars.every((v) => v === false)).toBe(true);
    expect(result.finalText).toBe("abc'\"`");
  });
});
