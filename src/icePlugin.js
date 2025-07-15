// icePlugin.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class IcePlugin
 * @description Base class for ICE plugins. Provides empty hooks for plugin events.
 */
class IcePlugin {
  /**
   * @param {Object} ice_instance - The ice instance.
   */
  constructor(ice_instance) {
    this._ice = ice_instance;
  }

  /** Called when the plugin is started. */
  start() {}
  /** Called when the plugin is clicked. */
  clicked() {
    return true;
  }
  /** Called on mouse down. */
  mouseDown() {
    return true;
  }
  /** Called on key down. */
  keyDown() {
    return true;
  }
  /** Called on key press. */
  keyPress() {
    return true;
  }
  /** Called when the selection changes. */
  selectionChanged(_range) {}
  /** Called to enable the plugin. */
  setEnabled(_enabled) {}
  /** Called to disable the plugin. */
  setDisabled(_enabled) {}
  /** Called when the caret is updated. */
  caretUpdated() {}
  /** Called when a node is inserted. */
  nodeInserted(_node, _range) {}
  /** Called when a node is created. */
  nodeCreated(_node, _options) {}
  /** Called when the caret is positioned. */
  caretPositioned() {}
  /** Called to remove the plugin and its listeners. */
  remove() {
    this._ice.removeKeyPressListener(this);
  }
  /** Called to set plugin settings. */
  setSettings(_settings) {}
}

// Export for ice namespace
this.ice = this.ice || {};
this.ice.IcePlugin = IcePlugin;
