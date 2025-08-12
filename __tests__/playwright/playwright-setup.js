// playwright-setup.js
// Shared Playwright setup for InlineChangeEditor tests

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupIceEditor(page) {
  await page.addScriptTag({ url: 'https://code.jquery.com/jquery-3.7.1.min.js' });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../node_modules/rangy/lib/rangy-core.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/ice.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/dom.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/icePlugin.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/icePluginManager.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/selection.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/bookmark.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/plugins/IceAddTitlePlugin/IceAddTitlePlugin.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/plugins/IceCopyPastePlugin/IceCopyPastePlugin.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/plugins/IceEmdashPlugin/IceEmdashPlugin.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, '../../src/plugins/IceSmartQuotesPlugin/IceSmartQuotesPlugin.js') });
  await page.addScriptTag({ path: path.resolve(__dirname, './setupPlaywrightGetIce.js') });
}
