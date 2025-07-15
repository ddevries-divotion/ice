// icePluginManager.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class IcePluginManager
 * @description Manages ICE plugins: loading, enabling, firing events, and plugin sets.
 */
class IcePluginManager {
  /**
   * @param {Object} ice_instance - The ice instance.
   */
  constructor(ice_instance) {
    this.plugins = {};
    this.pluginConstructors = {};
    this.keyPressListeners = {};
    this.activePlugin = null;
    this.pluginSets = {};
    this.activePluginSet = null;
    this._ice = ice_instance;
  }

  /** Returns all plugin names. */
  getPluginNames() {
    return Object.keys(this.plugins);
  }

  /** Adds a plugin object by name. */
  addPluginObject(pluginName, pluginObj) {
    this.plugins[pluginName] = pluginObj;
  }

  /** Adds a plugin constructor by name. */
  addPlugin(name, pluginConstructor) {
    if (typeof pluginConstructor !== "function") {
      throw Error("IcePluginException: plugin must be a constructor function");
    }
    if (!ice.dom.isset(this.pluginConstructors[name])) {
      this.pluginConstructors[name] = pluginConstructor;
    }
  }

  /** Loads plugins by name or object, then calls callback. */
  loadPlugins(plugins, callback) {
    if (plugins.length === 0) {
      callback.call(this);
    } else {
      let plugin = plugins.shift();
      if (typeof plugin === "object") plugin = plugin.name;
      if (ice.dom.isset(ice._plugin[plugin]) === true) {
        this.addPlugin(plugin, ice._plugin[plugin]);
        this.loadPlugins(plugins, callback);
      } else {
        throw new Error("plugin was not included in the page: " + plugin);
      }
    }
  }

  /** Enables a set of plugins by set name. */
  _enableSet(name) {
    this.activePluginSet = name;
    const pSet = this.pluginSets[name];
    for (let i = 0; i < pSet.length; i++) {
      let plugin = pSet[i];
      let pluginName = typeof plugin === "object" ? plugin.name : plugin;
      const pluginConstructor = this.pluginConstructors[pluginName];
      if (pluginConstructor) {
        const pluginObj = new pluginConstructor(this._ice);
        this.plugins[pluginName] = pluginObj;
        if (ice.dom.isset(plugin.settings) === true) {
          pluginObj.setSettings(plugin.settings);
        }
        pluginObj.start();
      }
    }
  }

  /** Sets the active plugin by name. */
  setActivePlugin(name) {
    this.activePlugin = name;
  }
  /** Gets the active plugin name. */
  getActivePlugin() {
    return this.activePlugin;
  }

  /** Gets the name of a plugin constructor. */
  _getPluginName(pluginConstructor) {
    const fn = pluginConstructor.toString();
    const start = "function ".length;
    return fn.substr(start, fn.indexOf("(") - start);
  }

  /** Removes specified plugin. */
  removePlugin(plugin) {
    if (this.plugins[plugin]) {
      this.plugins[plugin].remove();
    }
  }

  /** Returns the plugin object for specified plugin name. */
  getPlugin(name) {
    return this.plugins[name];
  }

  /** Add a new set of plugins. */
  usePlugins(name, plugins, callback) {
    if (ice.dom.isset(plugins) === true) {
      this.pluginSets[name] = plugins;
    } else {
      this.pluginSets[name] = [];
    }
    const clone = this.pluginSets[name].concat([]);
    this.loadPlugins(clone, () => {
      this._enableSet(name);
      if (callback) callback.call(this);
    });
  }

  /** Disables a plugin by name. */
  disablePlugin(name) {
    this.plugins[name].disable();
  }

  /** Checks if an element is a plugin element. */
  isPluginElement(element) {
    for (const i in this.plugins) {
      if (
        this.plugins[i].isPluginElement &&
        this.plugins[i].isPluginElement(element) === true
      ) {
        return true;
      }
    }
    return false;
  }

  /** Fires key pressed event to all plugins. */
  fireKeyPressed(e) {
    if (this._fireKeyPressFns(e, "all_keys") === false) return false;
    const eKeys = [];
    if (e.ctrlKey === true || e.metaKey === true) eKeys.push("ctrl");
    if (e.shiftKey === true) eKeys.push("shift");
    if (e.altKey === true) eKeys.push("alt");
    switch (e.keyCode) {
      case 13:
        eKeys.push("enter");
        break;
      case ice.dom.DOM_VK_LEFT:
        eKeys.push("left");
        break;
      case ice.dom.DOM_VK_RIGHT:
        eKeys.push("right");
        break;
      case ice.dom.DOM_VK_UP:
        eKeys.push("up");
        break;
      case ice.dom.DOM_VK_DOWN:
        eKeys.push("down");
        break;
      case 9:
        eKeys.push("tab");
        break;
      case ice.dom.DOM_VK_DELETE:
        eKeys.push("delete");
        break;
      default: {
        let code = e.keyCode || e.which;
        if (code) eKeys.push(String.fromCharCode(code).toLowerCase());
        break;
      }
    }
    const eKeysStr = eKeys.sort().join("+");
    return this._fireKeyPressFns(e, eKeysStr);
  }

  /** Internal: fires key press functions for a key string. */
  _fireKeyPressFns(e, eKeysStr) {
    if (this.keyPressListeners[eKeysStr]) {
      for (const listener of this.keyPressListeners[eKeysStr]) {
        const { fn: eventFn, plugin, data } = listener;
        if (eventFn) {
          if (typeof eventFn === "function") {
            if (eventFn.call(plugin, e, data) === true) {
              ice.dom.preventDefault(e);
              return false;
            }
          } else if (
            plugin[eventFn] &&
            plugin[eventFn].call(plugin, e, data) === true
          ) {
            ice.dom.preventDefault(e);
            return false;
          }
        }
      }
    }
    return true;
  }

  /** Fires selection changed event to all plugins. */
  fireSelectionChanged(range) {
    for (const i in this.plugins) {
      this.plugins[i].selectionChanged(range);
    }
  }

  /** Fires node inserted event to all plugins. */
  fireNodeInserted(node, range) {
    for (const i in this.plugins) {
      if (this.plugins[i].nodeInserted(node, range) === false) {
        return false;
      }
    }
  }

  /** Fires node created event to all plugins. */
  fireNodeCreated(node, option) {
    for (const i in this.plugins) {
      if (this.plugins[i].nodeCreated(node, option) === false) {
        return false;
      }
    }
  }

  /** Fires caret positioned event to all plugins. */
  fireCaretPositioned() {
    for (const i in this.plugins) {
      this.plugins[i].caretPositioned();
    }
  }

  /** Fires clicked event to all plugins. */
  fireClicked(e) {
    let val = true;
    for (const i in this.plugins) {
      if (this.plugins[i].clicked(e) === false) val = false;
    }
    return val;
  }

  /** Fires mouse down event to all plugins. */
  fireMouseDown(e) {
    let val = true;
    for (const i in this.plugins) {
      if (this.plugins[i].mouseDown(e) === false) val = false;
    }
    return val;
  }

  /** Fires key down event to all plugins. */
  fireKeyDown(e) {
    let val = true;
    for (const i in this.plugins) {
      if (this.plugins[i].keyDown(e) === false) val = false;
    }
    return val;
  }

  /** Fires key press event to all plugins. */
  fireKeyPress(e) {
    let val = true;
    for (const i in this.plugins) {
      if (this.plugins[i].keyPress(e) === false) val = false;
    }
    return val;
  }

  /** Fires enabled event to all plugins. */
  fireEnabled(enabled) {
    for (const i in this.plugins) {
      this.plugins[i].setEnabled(enabled);
    }
  }

  /** Fires disabled event to all plugins. */
  fireDisabled(disabled) {
    for (const i in this.plugins) {
      this.plugins[i].setEnabled(!disabled);
    }
  }

  /** Fires caret updated event to all plugins. */
  fireCaretUpdated() {
    for (const i in this.plugins) {
      if (this.plugins[i].caretUpdated) {
        this.plugins[i].caretUpdated();
      }
    }
  }
}

// Export for ice namespace
this.ice = this.ice || {};
this.ice._plugin = this.ice._plugin || {};
this.ice.IcePluginManager = IcePluginManager;
