// IceAddTitlePlugin.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class IceAddTitlePlugin
 * @description Adds a title attribute to nodes indicating modification details.
 */
class IceAddTitlePlugin {
  /**
   * @param {Object} ice_instance - The ice instance.
   */
  constructor(ice_instance) {
    this._ice = ice_instance;
  }

  /**
   * Adds a title attribute to the node.
   * @param {Element} node - The DOM node.
   * @param {Object} option - Options containing action.
   */
  nodeCreated(node, option) {
    node.setAttribute(
      "title",
      `${option.action || "Modified"} by ${node.getAttribute(this._ice.userNameAttribute)} - ${ice.dom.date(
        "m/d/Y h:ia",
        parseInt(node.getAttribute(this._ice.timeAttribute)),
      )}`,
    );
  }
}

/**
 * Sets up inheritance for IceAddTitlePlugin from ice.IcePlugin.
 * @see ice.IcePlugin
 */
ice.dom.noInclusionInherits(IceAddTitlePlugin, ice.IcePlugin);

/**
 * Exports the IceAddTitlePlugin for CommonJS and attaches it to the global ice object in browsers.
 * @module IceAddTitlePlugin
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = IceAddTitlePlugin;
}
/**
 * Attaches IceAddTitlePlugin to the global ice._plugin object in browsers.
 * @global
 */
if (typeof window !== "undefined") {
  window.ice = window.ice || {};
  window.ice._plugin = window.ice._plugin || {};
  window.ice._plugin.IceAddTitlePlugin = IceAddTitlePlugin;
}
