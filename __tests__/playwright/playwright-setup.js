// playwright-setup.js
// Shared Playwright setup for InlineChangeEditor tests

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupIceEditor(page) {
  await page.addScriptTag({
    url: "https://code.jquery.com/jquery-3.7.1.min.js",
  });
  await page.addScriptTag({
    path: path.resolve(__dirname, "../../dist/ice.min.js"),
  });
  await page.addScriptTag({
    path: path.resolve(__dirname, "./setupPlaywrightGetIce.js"),
  });
}
