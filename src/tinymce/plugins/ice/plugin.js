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
      preventScrollOnFocus: false,
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

    function setupButtons() {
      const buttons = [
        {
          name: "iceaccept", // Legacy command name for backward compatibility
          tooltip: "Accept Change",
          icon: "checkmark",
          command: "iceaccept",
          isToggle: true,
          setup: "acceptButton",
        },
        {
          name: "ice_accept",
          tooltip: "Accept Change",
          icon: "checkmark",
          command: "ice_accept",
          isToggle: true,
          setup: "acceptButton",
        },
        {
          name: "icereject", // Legacy command name for backward compatibility
          tooltip: "Reject Change",
          icon: "close",
          command: "icereject",
          isToggle: true,
          setup: "rejectButton",
        },
        {
          name: "ice_reject",
          tooltip: "Reject Change",
          icon: "close",
          command: "ice_reject",
          isToggle: true,
          setup: "rejectButton",
        },
        {
          name: "iceacceptall", // Legacy command name for backward compatibility
          tooltip: "Accept All Changes",
          icon: "checklist-rtl",
          command: "iceacceptall",
          isToggle: false,
          setup: "acceptAllButton",
        },
        {
          name: "ice_acceptall",
          tooltip: "Accept All Changes",
          icon: "checklist-rtl",
          command: "ice_acceptall",
          isToggle: false,
          setup: "acceptAllButton",
        },
        {
          name: "icerejectall", // Legacy command name for backward compatibility
          tooltip: "Reject All Changes",
          icon: "close",
          command: "icerejectall",
          isToggle: false,
          setup: "rejectAllButton",
        },
        {
          name: "ice_rejectall",
          tooltip: "Reject All Changes",
          icon: "close",
          command: "ice_rejectall",
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
            onAction: () => editor.execCommand("ice_accept"),
          },
          {
            type: "menuitem",
            icon: "close",
            text: "Reject Change",
            onAction: () => editor.execCommand("ice_reject"),
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

            // Ensure the node is an insert or delete tag
            if (
              ![config.insertTag, config.deleteTag].includes(
                node.tagName.toLowerCase(),
              )
            ) {
              return false;
            }

            // Ensure the editor body is available
            const body = editor.getBody();
            if (!body) {
              return false;
            }

            // Check if tracking is enabled and changes are visible
            const isTrackingEnabled =
              changeEditor?.isTracking ?? config.isTracking;
            const changesVisible = !body.classList.contains("CT-hide");

            if (!isTrackingEnabled || !changesVisible) {
              return false;
            }

            // Check if node or any parent has change tracking classes
            const hasChangeClass =
              node.classList.contains(config.deleteClass) ||
              node.classList.contains(config.insertClass) ||
              !!isInsideChangeTag(node);

            return hasChangeClass;
          } catch (error) {
            console.error("Error in context toolbar predicate:", error);
            return false;
          }
        },
        items: "ice_accept ice_reject",
        position: "selection",
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
            editor.execCommand("initialize_ice");
          }
        },
      );

      setupButtons();
    });

    const initializeIce = () => {
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
              preventScrollOnFocus: config.preventScrollOnFocus,
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

      ["mousedown", "keyup", "keydown", "keypress", "beforeinput"].forEach(
        (eventType) => {
          editor.on(eventType, (e) => changeEditor.handleEvent(e));
        },
      );

      setTimeout(() => config.afterInit.call(config), 10);
    };

    editor.addCommand("initialize_ice", initializeIce);
    editor.addCommand("initializeice", initializeIce); // Legacy command name for backward compatibility

    const iceCleanBody = (el) => {
      const body = changeEditor.getCleanContent(
        el || editor.getContent(),
        config.afterClean,
        config.beforeClean,
      );
      return body;
    };

    editor.addCommand("ice_cleanbody", iceCleanBody);
    editor.addCommand("icecleanbody", iceCleanBody); // Legacy command name for backward compatibility

    editor.addCommand("ice_changeuser", (user) => {
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
    const iceInsert = (insert = {}) => {
      changeEditor.insert(insert.item, insert.range);
    };

    editor.addCommand("ice_insert", iceInsert);
    editor.addCommand("iceinsert", iceInsert); // Legacy command name for backward compatibility

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
    const iceDelete = (del = {}) => {
      changeEditor.deleteContents(del.right, del.range);
    };

    editor.addCommand("ice_delete", iceDelete);
    editor.addCommand("icedelete", iceDelete); // Legacy command name for backward compatibility

    const iceAccept = () => {
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
    };

    editor.addCommand("ice_accept", iceAccept);
    editor.addCommand("iceaccept", iceAccept); // Legacy command name for backward compatibility

    const iceReject = () => {
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
    };

    editor.addCommand("ice_reject", iceReject);
    editor.addCommand("icereject", iceReject); // Legacy command name for backward compatibility

    const iceAcceptAll = () => {
      editor.undoManager.add();
      changeEditor.acceptAll();
      cleanup();
    };

    editor.addCommand("ice_acceptall", iceAcceptAll);
    editor.addCommand("iceacceptall", iceAcceptAll); // Legacy command name for backward compatibility

    const iceRejectAll = () => {
      editor.undoManager.add();
      changeEditor.rejectAll();
      cleanup();
    };

    editor.addCommand("ice_rejectall", iceRejectAll);
    editor.addCommand("icerejectall", iceRejectAll); // Legacy command name for backward compatibility

    editor.addCommand("ice_enable", () => {
      changeEditor.enableChangeTracking();
      editor.plugins.ice.trackChangesButton.setActive(true);
      safeSetDisabled(editor.plugins.ice.showChangesButton, false);
      editor.execCommand("ice_toggleshowchanges");
      config.isTracking = true;
    });

    editor.addCommand("ice_disable", () => {
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

    editor.addCommand("ice_togglechanges", () => {
      editor.execCommand(
        changeEditor.isTracking ? "ice_disable" : "ice_enable",
      );
    });

    editor.addCommand("ice_toggleshowchanges", () => {
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

    editor.addCommand("ice_smartquotes", () => {
      changeEditor.pluginsManager.plugins.IceSmartQuotesPlugin.convert(
        editor.getBody(),
      );
      editor.windowManager.alert(
        "Regular quotes have been converted into smart quotes.",
      );
    });

    editor.addCommand("ice_strippaste", (html) => {
      return changeEditor.pluginsManager.plugins.IceCopyPastePlugin.stripPaste(
        html,
      );
    });

    editor.addCommand("ice_handlepaste", () => {
      return changeEditor.pluginsManager.plugins.IceCopyPastePlugin.handlePaste();
    });

    editor.addCommand("ice_handleemdash", () => {
      return changeEditor.pluginsManager.plugins.IceEmdashPlugin.convertEmdash()
        ? 1
        : 0;
    });

    editor.addCommand("ice_isTracking", () =>
      changeEditor.isTracking ? 1 : 0,
    );

    editor.addCommand("ice_hasDeletePlaceholders", () => {
      return changeEditor.isPlaceholdingDeletes;
    });

    editor.addCommand("ice_addDeletePlaceholders", () => {
      return changeEditor.placeholdDeletes();
    });

    editor.addCommand("ice_removeDeletePlaceholders", () => {
      return changeEditor.revertDeletePlaceholders();
    });

    editor.addCommand("ice_initenv", () => {
      changeEditor.initializeEnvironment();
      changeEditor.initializeRange();
    });
  });
})();
