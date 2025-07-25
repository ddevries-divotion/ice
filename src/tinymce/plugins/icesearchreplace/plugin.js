/**
 * ICE SearchReplace Plugin for TinyMCE 7
 * Hooks into the opensource searchreplace plugin to wrap replaced content in ICE del/ins tags.
 * Compatible with TinyMCE 7 plugin API. No custom dialog logic is required; hooks into the replace command or event.
 */

(() => {
  tinymce.PluginManager.add("icesearchreplace", (editor) => {
    // Ensure the searchreplace plugin is loaded
    if (!editor.plugins.searchreplace) {
      console.error("ICE SearchReplace: searchreplace plugin is required.");
      return;
    }

    // Helper: perform ICE-aware replacement
    function iceReplace(replaceText) {
      const ice = editor.iceChangeEditor;
      if (ice && ice.isTracking) {
        const rng = editor.selection.getRng();
        editor.execCommand("icedelete", { right: null, range: rng });
        editor.execCommand("iceinsert", { item: replaceText, range: rng });
        return true;
      }
      return false;
    }

    // Patch the searchreplace plugin's replace method if it exists
    setTimeout(() => {
      const sr = editor.plugins.searchreplace;
      if (sr && typeof sr.replace === "function") {
        const origReplace = sr.replace;
        sr.replace = function (replaceText, matchCase, wholeWord) {
          if (iceReplace(replaceText)) return;
          return origReplace.call(this, replaceText, matchCase, wholeWord);
        };
      } else {
        // If TinyMCE 7 exposes a command, override it
        const origCmd = editor.execCommand;
        editor.execCommand = function (cmd, ui, value) {
          if (cmd === "mceSearchReplace" && iceReplace(value)) return;
          return origCmd.apply(this, arguments);
        };
        // Optionally, log a warning for maintainers
        console.warn(
          "ICE SearchReplace: Could not patch searchreplace.replace; using execCommand fallback.",
        );
      }
    }, 100);

    // Add ICE-specific buttons or menu items
    editor.ui.registry.addButton("icesearch", {
      tooltip: "ICE Search",
      icon: "search",
      onAction: () => editor.execCommand("SearchReplace"),
    });
    editor.ui.registry.addMenuItem("icesearch", {
      text: "ICE Search",
      icon: "search",
      onAction: () => editor.execCommand("SearchReplace"),
    });
    editor.ui.registry.addMenuItem("icereplace", {
      text: "ICE Replace",
      icon: "replace",
      onAction: () => editor.execCommand("SearchReplace"),
    });
  });
})();
