// bookmark.js - Bookmark utility for ice.js
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class Bookmark
 * @description Bookmark utility for ice.js. Handles creation, selection, and removal of bookmarks in the editor.
 */
class Bookmark {
  /**
   * @param {Object} env - The environment object (contains document, element, selection, etc).
   * @param {Object} [range] - The range to bookmark. If not provided, uses the current selection range.
   * @param {boolean} [keepOldBookmarks] - If false, removes all existing bookmarks in the element.
   */
  constructor(env, range, keepOldBookmarks) {
    this.env = env;
    this.element = env.element;
    this.selection = this.env.selection;

    /**
     * Remove all bookmarks if not keeping old ones.
     */
    if (!keepOldBookmarks) {
      this.removeBookmarks(this.element);
    }

    let currRange = range || this.selection.getRangeAt(0);
    range = currRange.cloneRange();
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    let tmp;

    /**
     * Collapse to the end of range and insert the end bookmark.
     */
    range.collapse(false);

    let endBookmark = this.env.document.createElement("span");
    endBookmark.style.display = "none";
    endBookmark.innerHTML = "&nbsp;";
    ice.dom.addClass(endBookmark, "iceBookmark iceBookmark_end");
    endBookmark.setAttribute("iceBookmark", "end");
    range.insertNode(endBookmark);
    if (!ice.dom.isChildOf(endBookmark, this.element)) {
      this.element.appendChild(endBookmark);
    }

    /**
     * Move the range back to its original position and insert the start bookmark.
     */
    range.setStart(startContainer, startOffset);
    range.collapse(true);

    let startBookmark = this.env.document.createElement("span");
    startBookmark.style.display = "none";
    ice.dom.addClass(startBookmark, "iceBookmark iceBookmark_start");
    startBookmark.innerHTML = "&nbsp;";
    startBookmark.setAttribute("iceBookmark", "start");
    try {
      range.insertNode(startBookmark);

      /**
       * Make sure start and end are in correct position.
       * If startBookmark is before endBookmark, swap them.
       */
      if (startBookmark.previousSibling === endBookmark) {
        tmp = startBookmark;
        startBookmark = endBookmark;
        endBookmark = tmp;
      }
    } catch {
      /**
       * NS_ERROR_UNEXPECTED: I believe this is a Firefox bug.
       * It seems like if the range is collapsed and the text node is empty
       * (i.e. length = 0) then Firefox tries to split the node for no reason and fails...
       */
      ice.dom.insertBefore(endBookmark, startBookmark);
    }

    if (ice.dom.isChildOf(startBookmark, this.element) === false) {
      if (this.element.firstChild) {
        ice.dom.insertBefore(this.element.firstChild, startBookmark);
      } else {
        // Should not happen...
        this.element.appendChild(startBookmark);
      }
    }

    if (!endBookmark.previousSibling) {
      tmp = this.env.document.createTextNode("");
      ice.dom.insertBefore(endBookmark, tmp);
    }

    /**
     * The original range object must be changed.
     */
    if (!startBookmark.nextSibling) {
      tmp = this.env.document.createTextNode("");
      ice.dom.insertAfter(startBookmark, tmp);
    }

    currRange.setStart(startBookmark.nextSibling, 0);
    currRange.setEnd(
      endBookmark.previousSibling,
      endBookmark.previousSibling.length || 0,
    );

    this.start = startBookmark;
    this.end = endBookmark;
  }

  /**
   * Restores the selection to the position of the bookmark.
   */
  selectBookmark() {
    const range = this.selection.getRangeAt(0);
    let startPos = null;
    let endPos = null;
    let startOffset = 0;
    let endOffset = null;
    if (
      this.start.nextSibling === this.end ||
      ice.dom.getElementsBetween(this.start, this.end).length === 0
    ) {
      // Bookmark is collapsed.
      if (this.end.nextSibling) {
        startPos = ice.dom.getFirstChild(this.end.nextSibling);
      } else if (this.start.previousSibling) {
        startPos = ice.dom.getFirstChild(this.start.previousSibling);
        if (startPos.nodeType === ice.dom.TEXT_NODE) {
          startOffset = startPos.length;
        }
      } else {
        // Create a text node in parent.
        this.end.parentNode.appendChild(this.env.document.createTextNode(""));
        startPos = ice.dom.getFirstChild(this.end.nextSibling);
      }
    } else {
      if (this.start.nextSibling) {
        startPos = ice.dom.getFirstChild(this.start.nextSibling);
      } else {
        if (!this.start.previousSibling) {
          const tmp = this.env.document.createTextNode("");
          ice.dom.insertBefore(this.start, tmp);
        }
        startPos = ice.dom.getLastChild(this.start.previousSibling);
        startOffset = startPos.length;
      }

      if (this.end.previousSibling) {
        endPos = ice.dom.getLastChild(this.end.previousSibling);
      } else {
        endPos = ice.dom.getFirstChild(this.end.nextSibling || this.end);
        endOffset = 0;
      }
    }

    ice.dom.remove([this.start, this.end]);

    if (endPos === null) {
      range.setEnd(startPos, startOffset);
      range.collapse(false);
    } else {
      range.setStart(startPos, startOffset);
      if (endOffset === null) {
        endOffset = endPos.length || 0;
      }
      range.setEnd(endPos, endOffset);
    }

    try {
      this.selection.addRange(range);
    } catch {
      // IE may throw exception for hidden elements..
    }
  }

  /**
   * Returns the bookmark element of the given type ("start" or "end") within the parent.
   * @param {Node} parent - The parent node to search in.
   * @param {string} type - The type of bookmark ("start" or "end").
   * @returns {Element} The bookmark element.
   */
  getBookmark(parent, type) {
    return ice.dom.getClass("iceBookmark_" + type, parent)[0];
  }

  /**
   * Removes all bookmark elements from the given element.
   * @param {Node} elem - The element to remove bookmarks from.
   */
  removeBookmarks(elem) {
    ice.dom.remove(ice.dom.getClass("iceBookmark", elem, "span"));
  }
}

// Export for ice namespace
this.ice = this.ice || {};
this.ice.Bookmark = Bookmark;
