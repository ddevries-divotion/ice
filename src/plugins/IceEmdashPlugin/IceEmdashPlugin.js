// IceEmdashPlugin.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * When active, this plugin will convert two successively typed dashes, within
 * the ice block element, into an emdash.
 * @class IceEmdashPlugin
 */
class IceEmdashPlugin {
  /**
   * @param {Object} ice_instance - The ice instance.
   */
  constructor(ice_instance) {
    this._ice = ice_instance;
  }

  /**
   * Handles keydown events to detect dash input and trigger emdash conversion.
   * @param {KeyboardEvent} e - The keyboard event.
   * @returns {boolean} False if emdash conversion occurs, true otherwise.
   */
  keyDown(e) {
    // Catch dashes.
    if (ice.dom.isBrowser("mozilla")) {
      const version = parseInt(ice.dom.browser().version);
      if (
        (version > 14 && e.keyCode === 173) ||
        (version <= 14 && e.keyCode === 109)
      ) {
        return this.convertEmdash(e);
      }
    } else if (e.keyCode === 189) {
      return this.convertEmdash(e);
    }
    return true;
  }

  /**
   * Converts two consecutive dashes into an emdash if conditions are met.
   * @returns {boolean} False if emdash conversion occurs, true otherwise.
   */
  convertEmdash() {
    const range = this._ice.getCurrentRange();
    if (range.collapsed) {
      try {
        // Move the start back one character so we can enclose the range around the previous character to check if it is a dash
        range.moveStart(ice.dom.CHARACTER_UNIT, -1);
        // Get the parent block element for the start and end containers
        const startBlock = ice.dom.getParents(
          range.startContainer,
          this._ice.blockEl,
        )[0];
        const endBlock = ice.dom.getParents(
          range.endContainer,
          this._ice.blockEl,
        )[0];
        // Make sure that the start and end containers aren't in different blocks, or that the start isn't in a delete.
        if (
          startBlock === endBlock &&
          !this._ice.getIceNode(range.startContainer, "deleteType")
        ) {
          // Get the last character and check to see if it is a dash.
          const c = range.toHtml();
          if (c === "-") {
            // Extract the last character/dash and insert an emdash
            range.extractContents();
            range.collapse();
            const mdash = this._ice.env.document.createTextNode("\u2014");
            if (this._ice.isTracking) {
              this._ice._insertNode(mdash, range);
            } else {
              range.insertNode(mdash);
              range.setStart(mdash, 1);
              range.collapse(true);
            }
            this._ice._preventKeyPress = true;
            return false;
          }
        }
      } catch {
        /* empty */
      }
      range.collapse();
    }
    return true;
  }
}

/**
 * Sets up inheritance for IceEmdashPlugin from ice.IcePlugin.
 * @see ice.IcePlugin
 */
ice.dom.noInclusionInherits(IceEmdashPlugin, ice.IcePlugin);

/**
 * Exports the IceEmdashPlugin for CommonJS and attaches it to the global ice object in browsers.
 * @module IceEmdashPlugin
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = IceEmdashPlugin;
}
/**
 * Attaches IceEmdashPlugin to the global ice._plugin object in browsers.
 * @global
 */
if (typeof window !== "undefined") {
  window.ice = window.ice || {};
  window.ice._plugin = window.ice._plugin || {};
  window.ice._plugin.IceEmdashPlugin = IceEmdashPlugin;
}
