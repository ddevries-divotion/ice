// IceCopyPastePlugin.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class IceCopyPastePlugin
 * @description Handles copy, cut, and paste operations with cleaning and preservation logic.
 */
class IceCopyPastePlugin extends ice.IcePlugin {
  /**
   * @param {Object} ice_instance - The ice instance.
   */
  constructor(ice_instance) {
    super(ice_instance);
    this._ice = ice_instance;
    this._tmpNode = null;
    this._tmpNodeTagName = "icepaste";
    this._pasteId = "icepastediv";
    // API
    // 'formatted' - paste will be MS Word cleaned.
    // 'formattedClean' - paste will be MS Word cleaned, insert and
    //    delete tags will be removed keeping insert content in place,
    //    and tags not found in `preserve` will be stripped.
    this.pasteType = "formattedClean";

    // Subset of tags that will not be stripped when pasteType
    // is set to 'formattedClean'. Parameter is of type string with
    // comma delimited tag and attribute definitions. For example:
    //   'p,a[href],i[style|title],span[*]'
    // Would allow `p`, `a`, `i` and `span` tags. The attributes for
    // each one of these tags would be cleaned as follows: `p` tags
    // would have all attributes removed, `a` tags will have all but
    // `href` attributes removed, `i` tags will have all but `style`
    // and `title` attributes removed, and `span` tags will keep all attributes.
    this.preserve = "p";
    // Callback triggered before any paste cleaning happens
    this.beforePasteClean = (body) => body;
    // Callback triggered at the end of the paste cleaning
    this.afterPasteClean = (body) => body;
    // Event Listener for copying
    ice_instance.element.oncopy = () => this.handleCopy();
  }

  /**
   * Sets plugin settings and preserved tags.
   * @param {Object} settings - Settings to apply.
   */
  setSettings(settings = {}) {
    ice.dom.extend(this, settings);
    this.preserve += "," + this._tmpNodeTagName;
    this.setupPreserved();
  }

  /**
   * Handles keydown events for paste/cut.
   * @param {KeyboardEvent} e
   * @returns {boolean}
   */
  keyDown(e) {
    if (e.metaKey !== true && e.ctrlKey !== true) return;
    if (e.keyCode === 86) this.handlePaste();
    else if (e.keyCode === 88) this.handleCut();
    return true;
  }

  /**
   * Handles copy event.
   */
  handleCopy() {}

  /**
   * Inserts a temporary placeholder for the current range and removes
   * the contents of the ice element body and calls a paste handler.
   * @returns {boolean}
   */
  handlePaste() {
    let range = this._ice.getCurrentRange();
    if (!range.collapsed) {
      if (this._ice.isTracking) {
        this._ice.deleteContents();
        range = range.cloneRange();
      } else {
        range.deleteContents();
        range.collapse(true);
      }
    }
    if (this._ice.isTracking) this._ice._moveRangeToValidTrackingPos(range);
    if (range.startContainer === this._ice.element) {
      // Fix a potentially empty body with a bad selection
      let firstBlock = ice.dom.find(this._ice.element, this._ice.blockEl)[0];
      if (!firstBlock) {
        firstBlock = ice.dom.create(
          `<${this._ice.blockEl}><br/></${this._ice.blockEl}>`,
        );
        this._ice.element.appendChild(firstBlock);
      }
      range.setStart(firstBlock, 0);
      range.collapse(true);
      this._ice.env.selection.addRange(range);
    }
    this._tmpNode = this._ice.env.document.createElement(this._tmpNodeTagName);
    range.insertNode(this._tmpNode);
    switch (this.pasteType) {
      case "formatted":
        this.setupPaste();
        break;
      case "formattedClean":
        this.setupPaste(true);
        break;
    }
    return true;
  }

  /**
   * Create a temporary div and set focus to it so that the browser can paste into it.
   * Set a timeout to push a paste handler on to the end of the execution stack.
   * @param {boolean} stripTags - Whether to strip tags during paste.
   * @returns {boolean}
   */
  setupPaste(stripTags) {
    const div = this.createDiv(this._pasteId);
    const range = this._ice.getCurrentRange();
    range.selectNodeContents(div);
    this._ice.selection.addRange(range);
    div.onpaste = (event) => {
      setTimeout(() => {
        this.handlePasteValue(stripTags);
      }, 0);
      event.stopPropagation();
    };
    div.focus();
    return true;
  }

  /**
   * Handles the pasted value, cleans and inserts it.
   * @param {boolean} stripTags - Whether to strip tags during paste.
   */
  handlePasteValue(stripTags) {
    // Get the pasted content.
    let doc = this._ice.env.document,
      pasteDiv = doc.getElementById(this._pasteId),
      html = pasteDiv.innerHTML,
      childBlocks = ice.dom.children(
        "<div>" + html + "</div>",
        this._ice.blockEl,
      );
    if (
      childBlocks.length === 1 &&
      ice.dom.getNodeTextContent("<div>" + html + "</div>") ===
        ice.dom.getNodeTextContent(childBlocks)
    ) {
      html = html.innerHTML;
    }

    html = this.beforePasteClean.call(this, html);

    if (stripTags) {
      // Strip out change tracking tags.
      html = this._ice.getCleanContent(html);
      html = this.stripPaste(html);
    }

    html = this.afterPasteClean.call(this, html);
    html = html.trim();
    let range = this._ice.getCurrentRange();
    range.setStartAfter(this._tmpNode);
    range.collapse(true);

    let innerBlock = null,
      lastEl = null,
      newEl = null;
    let fragment = range.createContextualFragment(html);
    let changeid = this._ice.startBatchChange();

    // If fragment contains block level elements, most likely we will need to
    // do some splitting so we do not have P tags in P tags, etc. Split the
    // container from current selection and then insert paste contents after it.
    if (ice.dom.hasBlockChildren(fragment)) {
      // Split from current selection.
      let block = ice.dom.isChildOfTagName(this._tmpNode, this._ice.blockEl);
      range.setEndAfter(block.lastChild);
      this._ice.selection.addRange(range);
      let contents = range.extractContents();
      let newblock = doc.createElement(this._ice.blockEl);
      newblock.appendChild(contents);
      ice.dom.insertAfter(block, newblock);

      range.setStart(newblock, 0);
      range.collapse(true);
      this._ice.selection.addRange(range);
      let prevBlock = range.startContainer;

      // Paste all of the children in the fragment.
      while (fragment.firstChild) {
        if (
          fragment.firstChild.nodeType === 3 &&
          !fragment.firstChild.nodeValue.trim()
        ) {
          fragment.removeChild(fragment.firstChild);
          continue;
        }
        // We may have blocks with text nodes at the beginning or end. For example, this paste:
        //  textnode <p>blocktext</p> <p>blocktext</p> moretext
        // In which case we wrap the leading or trailing text nodes in blocks.
        if (ice.dom.isBlockElement(fragment.firstChild)) {
          if (fragment.firstChild.textContent !== "") {
            innerBlock = null;
            let insert = null;
            if (this._ice.isTracking) {
              insert = this._ice.createIceNode("insertType");
              this._ice.addChange("insertType", [insert]);
              newEl = doc.createElement(fragment.firstChild.tagName);
              insert.innerHTML = fragment.firstChild.innerHTML;
              newEl.appendChild(insert);
            } else {
              insert = newEl = doc.createElement(fragment.firstChild.tagName);
              newEl.innerHTML = fragment.firstChild.innerHTML;
            }
            lastEl = insert;
            ice.dom.insertBefore(prevBlock, newEl);
          }
          fragment.removeChild(fragment.firstChild);
        } else {
          if (!innerBlock) {
            // Create a new block and append an insert
            newEl = doc.createElement(this._ice.blockEl);
            ice.dom.insertBefore(prevBlock, newEl);
            if (this._ice.isTracking) {
              innerBlock = this._ice.createIceNode("insertType");
              this._ice.addChange("insertType", [innerBlock]);
              newEl.appendChild(innerBlock);
            } else {
              innerBlock = newEl;
            }
          }
          lastEl = innerBlock;
          innerBlock.appendChild(fragment.removeChild(fragment.firstChild));
        }
      }
      if (!newblock.textContent) {
        newblock.parentNode.removeChild(newblock);
      }
    } else {
      if (this._ice.isTracking) {
        newEl = this._ice.createIceNode("insertType", fragment);
        this._ice.addChange("insertType", [newEl]);
        range.insertNode(newEl);
        lastEl = newEl;
      } else {
        let child;
        while ((child = fragment.firstChild)) {
          range.insertNode(child);
          range.setStartAfter(child);
          range.collapse(true);
          lastEl = child;
        }
      }
    }
    this._ice.endBatchChange(changeid);
    pasteDiv.parentNode.removeChild(pasteDiv);
    this._cleanup(lastEl);
  }

  /**
   * Creates a div for paste operations.
   * @param {string} id - The id for the div.
   * @returns {HTMLDivElement}
   */
  createDiv(id) {
    const doc = this._ice.env.document; // Document object of window or tinyMCE iframe
    const oldEl = doc.getElementById(id);
    if (oldEl) oldEl.parentNode.removeChild(oldEl);
    const div = doc.createElement("div");
    div.id = id;
    div.setAttribute("contentEditable", true);
    ice.dom.setStyle(div, "width", "1px");
    ice.dom.setStyle(div, "height", "1px");
    ice.dom.setStyle(div, "overflow", "hidden");
    ice.dom.setStyle(div, "position", "fixed");
    ice.dom.setStyle(div, "top", "10px");
    ice.dom.setStyle(div, "left", "10px");
    div.appendChild(doc.createElement("br"));
    doc.body.appendChild(div);
    return div;
  }

  /**
   * Handles cut event.
   */
  handleCut() {
    let range = this._ice.getCurrentRange();
    if (range.collapsed) return; // If nothing is selected, there's nothing to mark deleted
    this.cutElement = this.createDiv("icecut");
    // Chrome strips out spaces between text nodes and elements node during cut
    this.cutElement.innerHTML = range
      .getHTMLContents()
      .replace(/ </g, "&nbsp;<")
      .replace(/> /g, ">&nbsp;");
    if (this._ice.isTracking) this._ice.deleteContents();
    else range.deleteContents();
    let crange = this._ice.env.document.createRange();
    crange.setStart(this.cutElement.firstChild, 0);
    crange.setEndAfter(this.cutElement.lastChild);
    setTimeout(() => {
      this.cutElement.focus();
      // After the browser cuts out of the `cutElement`, reset the range and remove the cut element.
      setTimeout(() => {
        ice.dom.remove(this.cutElement);
        range.setStart(range.startContainer, range.startOffset);
        range.collapse(false);
        this._ice.env.selection.addRange(range);
      }, 100);
    }, 0);
    this._ice.env.selection.addRange(crange);
  }

  /**
   * Strips tags from pasted content.
   * @param {string} content
   * @returns {string}
   */
  stripPaste(content) {
    // Clean word stuff out and strip tags that are not in `this.preserve`.
    content = this._cleanWordPaste(content);
    content = this.cleanPreserved(content);
    return content;
  }

  /**
   * Sets up preserved tags for cleaning.
   * Parses `preserve` to setup `_tags` with a comma delimited list of all of the
   * defined tags, and the `_attributesMap` with a mapping between the allowed tags and
   * an array of their allowed attributes. For example, given this value:
   *   `preserve` = 'p,a[href|class],span[*]'
   * The following will result:
   *   `_tags` = 'p,a,span'
   *   `_attributesMap` = ['p' => [], 'a' => ['href', 'class'], 'span' => ['*']]
   */
  setupPreserved() {
    let self = this;
    this._tags = "";
    this._attributesMap = [];
    ice.dom.each(this.preserve.split(","), function (i, tagAttr) {
      // Extract the tag and attributes list
      tagAttr.match(/(\w+)(\[(.+)\])?/);
      let tag = RegExp.$1;
      let attr = RegExp.$3;
      if (self._tags) self._tags += ",";
      self._tags += tag.toLowerCase();
      self._attributesMap[tag] = attr.split("|");
    });
  }

  /**
   * Cleans preserved tags in the body.
   * @param {string} body
   * @returns {string}
   */
  cleanPreserved(body) {
    let self = this;
    let bodyel = this._ice.env.document.createElement("div");
    bodyel.innerHTML = body;
    // Strip out any tags not found in `this._tags`, replacing the tags with their inner contents.
    bodyel = ice.dom.stripEnclosingTags(bodyel, this._tags);
    // Strip out any attributes from the allowed set of tags that don't match what is in the `_attributesMap`
    ice.dom.each(ice.dom.find(bodyel, this._tags), function (i, el) {
      if (ice.dom.hasClass(el, "skip-clean")) {
        return true;
      }
      let tag = el.tagName.toLowerCase();
      let attrMatches = self._attributesMap[tag];
      // Kleene star - keep all of the attributes for this tag.
      if (attrMatches[0] && attrMatches[0] === "*") return true;
      // Remove any foreign attributes that do not match the map.
      if (el.hasAttributes()) {
        let attributes = el.attributes;
        for (let x = attributes.length - 1; x >= 0; x--) {
          if (!attrMatches.includes(attributes[x].name)) {
            el.removeAttribute(attributes[x].name);
          }
        }
      }
    });
    return bodyel.innerHTML;
  }

  /**
   * Cleans MS Word paste content.
   * @param {string} content
   * @returns {string}
   */
  _cleanWordPaste(content) {
    // Meta and link tags.
    content = content.replace(/<(meta|link)[^>]+>/g, "");
    // Comments.
    content = content.replace(/<!--(.|\s)*?-->/g, "");
    // Remove style tags.
    content = content.replace(/<style>[\s\S]*?<\/style>/g, "");
    // Remove span and o:p etc. tags.
    //content = content.replace(/<\/?span[^>]*>/gi, "");
    content = content.replace(/<\/?\w+:[^>]*>/gi, "");
    // Remove XML tags.
    content = content.replace(/<\\?\?xml[^>]*>/gi, "");
    // Generic cleanup.
    content = this._cleanPaste(content);
    // Remove class, lang and style attributes.
    content = content.replace(/<(\w[^>]*) (lang)=([^ |>]*)([^>]*)/gi, "<$1$4");
    return content;
  }

  /**
   * Cleans generic paste content.
   * @param {string} content
   * @returns {string}
   */
  _cleanPaste(content) {
    // Some generic content cleanup. Change all b/i tags to strong/em.
    content = content.replace(/<b(\s+|>)/g, "<strong$1");
    content = content.replace(/<\/b(\s+|>)/g, "</strong$1");
    content = content.replace(/<i(\s+|>)/g, "<em$1");
    content = content.replace(/<\/i(\s+|>)/g, "</em$1");
    return content;
  }

  /**
   * Cleans up after paste.
   * @param {Element} moveTo
   */
  _cleanup(moveTo) {
    try {
      // Set focus back to ice element.
      if (this._ice.env.frame) this._ice.env.frame.contentWindow.focus();
      else this._ice.element.focus();
      moveTo = (moveTo && moveTo.lastChild) || moveTo || this._tmpNode;
      // Move the range to the end of moveTo so that the cursor will be at the end of the paste.
      let range = this._ice.getCurrentRange();
      range.setStartAfter(moveTo);
      range.collapse(true);
      this._ice.selection.addRange(range);
      // Kill the tmp node.
      this._tmpNode.parentNode.removeChild(this._tmpNode);
      this._tmpNode = null;
      // Kill any empty change nodes.
      let ins = this._ice.env.document.getElementsByClassName(
        this._ice.changeTypes["insertType"].alias,
      );
      for (let i = 0; i < ins.length; i++) {
        if (!ins[i].textContent) {
          if (ins[i].parentNode) {
            ins[i].parentNode.removeChild(ins[i]);
          }
        }
      }
    } catch (e) {
      window.console && console.error(e);
    }
  }
}

/**
 * Sets up inheritance for IceCopyPastePlugin from ice.IcePlugin.
 * @see ice.IcePlugin
 */
ice.dom.noInclusionInherits(IceCopyPastePlugin, ice.IcePlugin);

/**
 * Exports the IceCopyPastePlugin for CommonJS and attaches it to the global ice object in browsers.
 * @module IceCopyPastePlugin
 */
if (
  typeof window === "undefined" &&
  typeof module !== "undefined" &&
  module.exports
) {
  module.exports = IceCopyPastePlugin;
}
/**
 * Attaches IceCopyPastePlugin to the global ice._plugin object in browsers.
 * @global
 */
if (typeof window !== "undefined") {
  window.ice = window.ice || {};
  window.ice._plugin = window.ice._plugin || {};
  window.ice._plugin.IceCopyPastePlugin = IceCopyPastePlugin;
}
