/**
 * Block boundary merging issue in TinyMCE 6+ and contenteditable
 *
 * Problem:
 * TinyMCE 6+ merges adjacent block elements before ICE block boundary logic executes, breaking legacy change tracking.
 * Contenteditable context also merges blocks, but timing and DOM state differ.
 *
 * Solution:
 * The fix was to introduce an event listener for the `beforeinput` event, allowing ICE to intercept and handle block merges/splits before the DOM changes occur.
 * This ensures correct change tracking and block boundary detection in both TinyMCE 6+ and contenteditable environments.
 *
 * See tests below for expected behavior after Delete/Backspace merges and change tracking.
 * 
 * The tests are currently skipped in Firefox due to inconsistent behavior.
 * They are also skipped in CI environments as it seems to be impossible to use the TinyMCE API key within GitHub Actions.
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173/");
});

test.describe.skip("Context: contenteditable", () => {
  test("should handle block element merging correctly after pressing Delete key", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "firefox") {
      test.skip("Skipped in Firefox");
    }

    const editor = await page.getByTestId("editor");

    await expect(editor).toBeDefined();

    // First paragraph
    const p_1 = await editor.getByText(/Lorem ipsum/);

    await expect(p_1).toBeVisible();

    // Set caret to the end of the first paragraph
    await p_1.click();

    await page.keyboard.press("End");

    await page.keyboard.press("Delete");

    // Check that the two paragraphs are merged into a single element
    const mergedParagraph = await editor.locator("p").filter({
      hasText:
        /Lorem ipsum dolor sit amet, consectetur adipiscing elit\.Praesent facilisis sed nisi nec mattis\./,
    });

    await expect(mergedParagraph).toBeVisible();

    const del = mergedParagraph.locator('delete, .del, [class*="del"]');

    // Ensure the merged paragraph doesn't contain any delete elements
    await expect(del).toHaveCount(0);

    await page.keyboard.press("Delete");

    await expect(del).toHaveCount(1);

    await expect(del).toHaveText("P");
  });

  test("should handle block element merging correctly after pressing Backspace key", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "firefox") {
      test.skip("Skipped in Firefox");
    }

    const editor = await page.getByTestId("editor");

    await expect(editor).toBeDefined();

    // Second paragraph
    const p_2 = await editor.getByText(/Praesent/);

    await expect(p_2).toBeVisible();

    // Set caret to the beginning of the second paragraph
    await p_2.click();

    await page.keyboard.press("Home");

    await page.keyboard.press("Backspace");

    // Check that the two paragraphs are merged into a single element
    const mergedParagraph = await editor.locator("p").filter({
      hasText:
        /Lorem ipsum dolor sit amet, consectetur adipiscing elit\.Praesent facilisis sed nisi nec mattis\./,
    });

    await expect(mergedParagraph).toBeVisible();

    const del = mergedParagraph.locator('delete, .del, [class*="del"]');

    // Ensure the merged paragraph doesn't contain any delete elements
    await expect(del).toHaveCount(0);

    await page.keyboard.press("Backspace");

    await expect(del).toHaveCount(1);

    await expect(del).toHaveText(".");
  });
});

test.describe("Context: TinyMCE", () => {
  test("should handle block element merging correctly after pressing Delete key", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "firefox") {
      test.skip("Skipped in Firefox");
    }

    const editor = await page.frameLocator("iFrame");

    await expect(editor).toBeDefined();

    // First paragraph
    const p_1 = await editor.getByText(/Lorem ipsum/);

    await expect(p_1).toBeVisible();

    // Set caret to the end of the first paragraph
    await p_1.click();

    await page.keyboard.press("End");

    await page.keyboard.press("Delete");

    // Check that the two paragraphs are merged into a single element
    const mergedParagraph = await editor.locator("p").filter({
      hasText:
        /Lorem ipsum dolor sit amet, consectetur adipiscing elit\.Praesent facilisis sed nisi nec mattis\./,
    });

    await expect(mergedParagraph).toBeVisible();

    const del = mergedParagraph.locator('delete, .del, [class*="del"]');

    // Ensure the merged paragraph doesn't contain any delete elements
    await expect(del).toHaveCount(0);

    await page.keyboard.press("Delete");

    await expect(del).toHaveCount(1);

    await expect(del).toHaveText("P");
  });

  test("should handle block element merging correctly after pressing Backspace key", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "firefox") {
      test.skip("Skipped in Firefox");
    }

    const editor = await page.frameLocator("iFrame");

    await expect(editor).toBeDefined();

    // Second paragraph
    const p_2 = await editor.getByText(/Praesent/);

    await expect(p_2).toBeVisible();

    // Set caret to the beginning of the second paragraph
    await p_2.click();

    await page.keyboard.press("Home");

    await page.keyboard.press("Backspace");

    // Check that the two paragraphs are merged into a single element
    const mergedParagraph = await editor.locator("p").filter({
      hasText:
        /Lorem ipsum dolor sit amet, consectetur adipiscing elit\.Praesent facilisis sed nisi nec mattis\./,
    });

    await expect(mergedParagraph).toBeVisible();

    const del = mergedParagraph.locator('delete, .del, [class*="del"]');

    // Ensure the merged paragraph doesn't contain any delete elements
    await expect(del).toHaveCount(0);

    await page.keyboard.press("Backspace");

    await expect(del).toHaveCount(1);

    await expect(del).toHaveText(".");
  });
});
