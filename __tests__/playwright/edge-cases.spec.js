// @ts-check

/**
 * These tests are skipped in CI environments as it seems to be impossible to use the TinyMCE API key within GitHub Actions.
 */

import { test, expect } from "@playwright/test";

const TEXT_CONTENT = "dynamic text content";
const TABLE_CAPTION = "Table 1";

test.beforeEach("open start URL", async ({ page }) => {
  await page.goto("/");
});

test.describe("Edge-cases", () => {
  test.skip("replacing text in table cell does not place caret in next cell", async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === "webkit", "Skipped for Webkit");

    const editor = await page.frameLocator("iFrame");

    await expect(editor).toBeDefined();

    const table = await editor.getByRole("table", { name: TABLE_CAPTION });

    const firstCell = await table.getByRole("cell").first();

    await firstCell.scrollIntoViewIfNeeded();

    const currentText = await firstCell.textContent();

    await expect(currentText).toBeDefined();

    await firstCell.selectText();

    await firstCell.pressSequentially(TEXT_CONTENT);

    const deletion = await firstCell.getByRole("deletion");

    await expect(deletion).toBeVisible();

    // @ts-ignore null assertion tested above
    await expect(deletion).toHaveText(currentText);

    const insertion = await firstCell.getByRole("insertion");

    await expect(insertion).toBeVisible();

    await expect(insertion).toHaveText(TEXT_CONTENT);
  });
});
