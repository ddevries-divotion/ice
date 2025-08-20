/**
 * Refactored IcePlugin for TinyMCE 8 with modern JavaScript and native DOM APIs.
 */

(() => {
  tinymce.PluginManager.add("ice", (editor, pluginUrl) => {
    const config = {
      /**
       * Tinymce initializtion API for ice. An `ice` object is expected
       * with any of the following params.
       */
      deleteTag: "span",
      insertTag: "span",
      deleteClass: "del",
      insertClass: "ins",
      changeIdAttribute: "data-cid",
      userIdAttribute: "data-userid",
      userNameAttribute: "data-username",
      timeAttribute: "data-time",
      preserveOnPaste: "p",
      user: { name: "Unknown User", id: Math.random() },
      isTracking: true,
      contentEditable: true,
      css: "css/ice.css",
      manualInit: false,
      scriptVersion: Date.now(),
      afterInit: () => {},
      afterClean: (body) => body,
      beforePasteClean: (body) => body,
      afterPasteClean: (body) => body,
    };

    let changeEditor = null;

    function loadScript(url, callback) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.onload = callback;
      script.src = url;
      document.head.appendChild(script);
    }

    function isInsideChangeTag(node) {
      return editor.dom.getParent(
        node,
        `.${config.insertClass},.${config.deleteClass}`,
      );
    }

    function cleanup() {
      const emptyNodes = editor.dom.select(
        `.${config.insertClass}:empty, .${config.deleteClass}:empty`,
      );
      emptyNodes.forEach((node) => editor.dom.remove(node));
    }

    function registerCommand(name, fn) {
      editor.addCommand(name, fn);
    }

    function setupButtons() {
      const buttons = [
        {
          name: "iceaccept",
          tooltip: "Accept Change",
          icon: "checkmark",
          command: "iceaccept",
          isToggle: true,
          setup: "acceptButton",
        },
        {
          name: "icereject",
          tooltip: "Reject Change",
          icon: "close",
          command: "icereject",
          isToggle: true,
          setup: "rejectButton",
        },
        {
          name: "iceacceptall",
          tooltip: "Accept All Changes",
          icon: "checklist-rtl",
          command: "iceacceptall",
          isToggle: false,
          setup: "acceptAllButton",
        },
        {
          name: "icerejectall",
          tooltip: "Reject All Changes",
          icon: "close",
          command: "icerejectall",
          isToggle: false,
          setup: "rejectAllButton",
        },
        {
          name: "ice_toggleshowchanges",
          tooltip: "Show/Hide Track Changes",
          icon: "preview",
          command: "ice_toggleshowchanges",
          isToggle: true,
          setup: "showChangesButton",
        },
        {
          name: "ice_togglechanges",
          tooltip: "Toggle Track Changes",
          icon: "brightness",
          command: "ice_togglechanges",
          isToggle: true,
          setup: "trackChangesButton",
        },
        {
          name: "ice_smartquotes",
          tooltip: "Convert quotes to smart quotes",
          icon: "quote",
          command: "ice_smartquotes",
          isToggle: false,
        },
      ];

      buttons.forEach(({ name, tooltip, icon, command, isToggle, setup }) => {
        const commonProps = {
          tooltip,
          icon,
          onAction: () => editor.execCommand(command),
        };

        if (isToggle) {
          editor.ui.registry.addToggleButton(name, {
            ...commonProps,
            onSetup: (api) => {
              if (setup) editor.plugins.ice[setup] = api;
              const nodeChangeHandler = () => {
                if (["acceptButton", "rejectButton"].includes(setup)) {
                  const selectedNode = editor.selection.getNode();
                  api.setEnabled(!!isInsideChangeTag(selectedNode));
                }
              };
              editor.on("NodeChange", nodeChangeHandler);
              return () => editor.off("NodeChange", nodeChangeHandler);
            },
          });
        } else {
          editor.ui.registry.addButton(name, {
            ...commonProps,
            onSetup: (api) => {
              if (setup) editor.plugins.ice[setup] = api;
              return () => {};
            },
          });
        }
      });

      editor.ui.registry.addNestedMenuItem("nesteditem", {
        text: "ICE action",
        getSubmenuItems: () => [
          {
            type: "menuitem",
            icon: "checkmark",
            text: "Accept Change",
            onAction: () => editor.execCommand("iceaccept"),
          },
          {
            type: "menuitem",
            icon: "close",
            text: "Reject Change",
            onAction: () => editor.execCommand("icereject"),
          },
        ],
      });

      // Context toolbar to accept/reject a single change
      editor.ui.registry.addContextToolbar("acceptreject", {
        predicate: (node) => {
          try {
            // Ensure we have a valid node and body
            if (!node || !node.classList) {
              return false;
            }

            const body = editor.getBody();
            if (!body) {
              return false;
            }

            // Check if tracking is enabled and changes are visible
            const isTrackingEnabled =
              changeEditor?.isTracking ?? config.isTracking;
            const changesVisible = !editor.dom.hasClass(body, "CT-hide");

            // Check if node or any parent has change tracking classes
            const hasChangeClass =
              node.classList.contains(config.deleteClass) ||
              node.classList.contains(config.insertClass) ||
              !!isInsideChangeTag(node);

            return isTrackingEnabled && changesVisible && hasChangeClass;
          } catch (error) {
            console.error("Error in context toolbar predicate:", error);
            return false;
          }
        },
        items: "iceaccept icereject",
        position: "node",
        scope: "node",
      });
    }

    // Patch to ensure `setDisabled` is always available on toggle buttons
    function safeSetDisabled(api, value) {
      if (typeof api.setDisabled === "function") {
        api.setDisabled(value);
      } else if (typeof api.setEnabled === "function") {
        api.setEnabled(!value);
      } else {
        console.warn("Button API does not support disabling:", api);
      }
    }

    editor.on("init", () => {
      Object.assign(config, editor.getParam("ice", {}));
      const cssPath = config.css.includes("://")
        ? config.css
        : `${pluginUrl}/${config.css}`;
      editor.dom.loadCSS(cssPath);

      loadScript(
        `${pluginUrl}/js/ice.min.js?version=${config.scriptVersion}`,
        () => {
          if (!config.manualInit) {
            editor.execCommand("initializeice");
          }
        },
      );

      setupButtons();
    });

    // Remaining commands now added
    registerCommand("initializeice", () => {
      changeEditor = new ice.InlineChangeEditor({
        element: editor.getBody(),
        isTracking: config.isTracking,
        contentEditable: config.contentEditable,
        changeIdAttribute: config.changeIdAttribute,
        userIdAttribute: config.userIdAttribute,
        userNameAttribute: config.userNameAttribute,
        timeAttribute: config.timeAttribute,
        currentUser: config.user,
        plugins: [
          "IceEmdashPlugin",
          "IceAddTitlePlugin",
          "IceSmartQuotesPlugin",
          {
            name: "IceCopyPastePlugin",
            settings: {
              pasteType: "formattedClean",
              preserve: config.preserveOnPaste,
              beforePasteClean: config.beforePasteClean,
              afterPasteClean: config.afterPasteClean,
            },
          },
        ],
        changeTypes: {
          insertType: { tag: config.insertTag, alias: config.insertClass },
          deleteType: { tag: config.deleteTag, alias: config.deleteClass },
        },
      }).startTracking();

      // Make the changeEditor available for other plugins
      editor.iceChangeEditor = changeEditor;

      ["mousedown", "keyup", "keydown", "keypress"].forEach((eventType) => {
        editor.on(eventType, (e) => changeEditor.handleEvent(e));
      });

      setTimeout(() => config.afterInit.call(config), 10);
    });

    registerCommand("icecleanbody", (el) => {
      const body = changeEditor.getCleanContent(
        el || editor.getContent(),
        config.afterClean,
        config.beforeClean,
      );
      return body;
    });

    registerCommand("ice_changeuser", (user) => {
      changeEditor.setCurrentUser(user);
    });

    /**
     * Insert content with change tracking tags.
     *
     * The `insert` object parameter can contain the following properties:
     *   { `item`, `range` }
     * Where `item` is the item to insert (string, or textnode)
     * and `range` is an optional range to insert into.
     */
    registerCommand("iceinsert", (insert = {}) => {
      changeEditor.insert(insert.item, insert.range);
    });

    /**
     * Deletes content with change tracking tags.
     *
     * The `del` object parameter can contain the following properties:
     *   { `right`, `range` }
     * Where `right` is an optional boolean parameter, where true deletes to the right, false to the left
     * and `range` is an optional range to delete in.
     *
     * If the current Selection isn't collapsed then the `right` param is ignored
     * and a selection delete is performed.
     */
    registerCommand("icedelete", (del = {}) => {
      changeEditor.deleteContents(del.right, del.range);
    });

    registerCommand("iceaccept", () => {
      try {
        if (!changeEditor) {
          console.warn("Change editor not initialized");
          return;
        }

        const selectedNode = editor.selection.getNode();
        const changeNode = isInsideChangeTag(selectedNode) || selectedNode;

        if (
          !changeNode ||
          (!changeNode.classList.contains(config.deleteClass) &&
            !changeNode.classList.contains(config.insertClass))
        ) {
          editor.windowManager.alert("Please select a change to accept.");
          return;
        }

        editor.undoManager.add();
        changeEditor.acceptChange(changeNode);
        cleanup();
      } catch (error) {
        console.error("Error accepting change:", error);
        editor.windowManager.alert(
          "Failed to accept change. Please try again.",
        );
      }
    });

    registerCommand("icereject", () => {
      try {
        if (!changeEditor) {
          console.warn("Change editor not initialized");
          return;
        }

        const selectedNode = editor.selection.getNode();
        const changeNode = isInsideChangeTag(selectedNode) || selectedNode;

        if (
          !changeNode ||
          (!changeNode.classList.contains(config.deleteClass) &&
            !changeNode.classList.contains(config.insertClass))
        ) {
          editor.windowManager.alert("Please select a change to reject.");
          return;
        }

        editor.undoManager.add();
        changeEditor.rejectChange(changeNode);
        cleanup();
      } catch (error) {
        console.error("Error rejecting change:", error);
        editor.windowManager.alert(
          "Failed to reject change. Please try again.",
        );
      }
    });

    registerCommand("iceacceptall", () => {
      editor.undoManager.add();
      changeEditor.acceptAll();
      cleanup();
    });

    registerCommand("icerejectall", () => {
      editor.undoManager.add();
      changeEditor.rejectAll();
      cleanup();
    });

    registerCommand("ice_enable", () => {
      changeEditor.enableChangeTracking();
      editor.plugins.ice.trackChangesButton.setActive(true);
      safeSetDisabled(editor.plugins.ice.showChangesButton, false);
      editor.execCommand("ice_toggleshowchanges");
      config.isTracking = true;
    });

    registerCommand("ice_disable", () => {
      editor.dom.addClass(editor.getBody(), "CT-hide");
      editor.plugins.ice.trackChangesButton.setActive(false);
      editor.plugins.ice.showChangesButton.setActive(false);
      safeSetDisabled(editor.plugins.ice.showChangesButton, true);
      [
        "acceptAllButton",
        "rejectAllButton",
        "acceptButton",
        "rejectButton",
      ].forEach((btn) => {
        const api = editor.plugins.ice[btn];
        if (api) safeSetDisabled(api, true);
      });
      changeEditor.disableChangeTracking();
      config.isTracking = false;
    });

    registerCommand("ice_togglechanges", () => {
      editor.execCommand(
        changeEditor.isTracking ? "ice_disable" : "ice_enable",
      );
    });

    registerCommand("ice_toggleshowchanges", () => {
      const body = editor.getBody();
      const isHidden = editor.dom.hasClass(body, "CT-hide");
      editor.dom.toggleClass(body, "CT-hide");
      editor.plugins.ice.showChangesButton.setActive(isHidden);
      [
        "acceptAllButton",
        "rejectAllButton",
        "acceptButton",
        "rejectButton",
      ].forEach((btn) => {
        editor.plugins.ice[btn]?.setEnabled(isHidden);
      });
      editor.execCommand("mceRepaint");
    });

    registerCommand("ice_smartquotes", () => {
      changeEditor.pluginsManager.plugins.IceSmartQuotesPlugin.convert(
        editor.getBody(),
      );
      editor.windowManager.alert(
        "Regular quotes have been converted into smart quotes.",
      );
    });

    registerCommand("ice_strippaste", (html) => {
      return changeEditor.pluginsManager.plugins.IceCopyPastePlugin.stripPaste(
        html,
      );
    });

    registerCommand("ice_handlepaste", () => {
      return changeEditor.pluginsManager.plugins.IceCopyPastePlugin.handlePaste();
    });

    registerCommand("ice_handleemdash", () => {
      return changeEditor.pluginsManager.plugins.IceEmdashPlugin.convertEmdash()
        ? 1
        : 0;
    });

    registerCommand("ice_isTracking", () => (changeEditor.isTracking ? 1 : 0));

    registerCommand("ice_hasDeletePlaceholders", () => {
      return changeEditor.isPlaceholdingDeletes;
    });

    registerCommand("ice_addDeletePlaceholders", () => {
      return changeEditor.placeholdDeletes();
    });

    registerCommand("ice_removeDeletePlaceholders", () => {
      return changeEditor.revertDeletePlaceholders();
    });

    registerCommand("ice_initenv", () => {
      changeEditor.initializeEnvironment();
      changeEditor.initializeRange();
    });
  });
})();
