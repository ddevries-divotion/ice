# @divotion/ice

A modern fork of [NYTimes/ice](https://github.com/nytimes/ice): Track changes for contenteditable elements and TinyMCE 7+ plugins in JavaScript.

---

**Copyright (c) The New York Times, CMS Group, Matthew DeLambo**  
**Copyright (c) Divotion B.V., Conflux, Dennis de Vries**

---

## About

This project is a maintained and modernized fork of the original NYTimes/ice, updated for compatibility with TinyMCE 7.x and modern JavaScript workflows. It provides robust track changes functionality for any `contenteditable` element and integrates as a TinyMCE plugin.

## Features

- Track multi-user inserts and deletes, with toggles for tracking and highlighting
- Accept/reject changes individually or in bulk
- Clean API for extracting untracked content
- TinyMCE 7+ plugin support
- Optional plugins: copy-paste tracking, smart quotes, em-dash conversion, add title to changes

---

## Installation

```sh
npm install @divotion/ice
```

---

## Usage

### Contenteditable Initialization

```javascript
import { InlineChangeEditor } from '@divotion/ice';

const tracker = new InlineChangeEditor({
  element: document.getElementById('mytextelement'),
  handleEvents: true,
  currentUser: { id: 1, name: 'Miss T' }
});
tracker.startTracking();
```

#### With Plugins

```javascript
const tracker = new InlineChangeEditor({
  element: document.getElementById('mytextelement'),
  handleEvents: true,
  currentUser: { id: 1, name: 'Miss T' },
  plugins: [
    'IceAddTitlePlugin',
    'IceEmdashPlugin',
    {
      name: 'IceCopyPastePlugin',
      settings: {
        preserve: 'p,a[href],span[id,class]em,strong'
      }
    }
  ]
});
tracker.startTracking();
```

### TinyMCE Integration

Copy the plugin files from `dist/tinymce/plugins/ice/` to your TinyMCE plugins directory. Then initialize TinyMCE as follows:

```javascript
tinymce.init({
  plugins: 'ice',
  toolbar: 'ice_togglechanges ice_toggleshowchanges iceacceptall icerejectall iceaccept icereject',
  ice: {
    user: { name: 'Miss T', id: 1 },
    preserveOnPaste: 'p,a[href],i,em,strong',
    css: '/path/to/ice.css'
  }
});
```

---

## API Highlights

- `acceptChange(node)` / `rejectChange(node)` – Accept or reject a specific change
- `acceptAll()` / `rejectAll()` – Accept or reject all changes
- `getCleanContent([body], [callback])` – Get content without tracking tags
- `setCurrentUser(user)` – Set the current user for tracking
- `getChanges()` – Get all tracked changes as objects

---

## Demo

A live demo is included in the `demo/` directory. To try it locally, run:

```sh
npm run build
npm run prepare:demo
npx serve demo
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in your terminal) to interact with the demo editor and see track changes in action.

### TinyMCE API Key for Demo

The demo uses the TinyMCE Cloud CDN, which requires an API key for production use. For local testing, the demo works with the default `no-api-key`, but you may see a warning or have limited features. To use all features and remove warnings, obtain a free API key:

1. **Register for a TinyMCE API Key:**
   - Go to [https://www.tiny.cloud/docs/tinymce/7/cloud-quick-start/#add-your-api-key](https://www.tiny.cloud/docs/tinymce/7/cloud-quick-start/#add-your-api-key)
   - Sign up for a free account and copy your API key.

2. **Update the Demo HTML:**
   - Open `demo/index.html`.
   - Find the following line near the top:
     ```html
     <script src="https://cdn.tiny.cloud/1/no-api-key/tinymce/7/tinymce.min.js" referrerpolicy="origin"></script>
     ```
   - Replace `no-api-key` with your actual API key. For example:
     ```html
     <script src="https://cdn.tiny.cloud/1/YOUR_API_KEY/tinymce/7/tinymce.min.js" referrerpolicy="origin"></script>
     ```

3. **Save and reload the demo** in your browser. The warning should disappear, and all TinyMCE features will be enabled.

> **Note:** The demo will still function for local development with `no-api-key`, but an API key is required for production or public deployments.

---

## Build & Development

- Build: `npm run build` (runs Grunt, outputs to `dist/`)
- Source: See `src/` for core and plugin code
- Distribution: Only `dist/`, `LICENSE`, and `README.md` are published to npm

---

## Automated Testing

This project uses [Playwright](https://playwright.dev/) for automated end-to-end and integration testing.

### Running Tests

To run the test suite:

```sh
npm install  # if you haven't already
npx playwright install  # install browser dependencies
npm test     # or: npx playwright test
```

Test files are located in the `__tests__/playwright/` directory. Playwright will generate a detailed HTML report in the `playwright-report/` directory after each run. To view the report:

```sh
npx playwright show-report
```

### Notes
- The test suite is being actively updated to reflect recent code changes.
- Some tests may be skipped or marked as outdated; see test source for details.
- Contributions to improve test coverage and reliability are welcome.

---

## Limitations / Notes

- Requires DOM ready before initialization
- WordPress support is limited
- Browser support: Firefox (5+), WebKit browsers, minimal IE8+
- GPL-2.0-or-later license (see LICENSE)

---

## Known Issues

- **`icesearchreplace` plugin does not work:** The current implementation of the `icesearchreplace` plugin is non-functional, as it does not correctly hook into the [TinyMCE `searchreplace` plugin](https://github.com/tinymce/tinymce/tree/release/6.7/modules/tinymce/src/plugins/searchreplace). It has only been updated for compatibility with TinyMCE version 7, and redundant logic has been removed. This is a known issue, and contributions to fix or modernize this plugin are welcome.
- **Outdated tests:** The tests in this project have not been updated to reflect all recent changes. Test coverage and reliability are currently limited.

---

## Further Improvements

The following improvements are planned or recommended for future releases.

- **Remove jQuery dependency:** Refactor all code to use modern DOM APIs instead of jQuery (see `src/dom.js` for examples).
- **Update to ES6+ syntax:** Modernize the codebase to use ES6+ features (e.g., `let`/`const`, arrow functions, classes, modules).
- **Modularize TinyMCE plugin:** Refactor `src/tinymce/plugins/ice/plugin.js` for better maintainability and modularity.
- **TypeScript implementation:** Add TypeScript typings and migrate the codebase for improved type safety and developer experience.
- **Update and expand tests:** Update the test suite to reflect all recent changes and ensure robust coverage. A solid testing strategy will be defined at a later stage.
- **General code cleanup and modernization.**

---

## License

GPL-2.0-or-later. See [LICENSE](./LICENSE).
