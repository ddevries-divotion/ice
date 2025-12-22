// selection.js - Selection helper
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class Selection
 * @description Selection utility for ice.js built on native Selection/Range APIs with ICE-specific helpers.
 */
class Selection {
  /**
   * @param {Object} env - The environment object (contains document, frame, etc).
   */
  constructor(env) {
    this.env = env;
    this._selection = null;
    this._rangeCtor =
      (env &&
        env.document &&
        env.document.defaultView &&
        env.document.defaultView.Range) ||
      (typeof Range !== "undefined" ? Range : null);
    this._patchRangePrototype();
    this._getSelection();
  }

  /**
   * Returns the selection object for the current browser.
   * @returns {Selection|null} The native selection object.
   */
  _getSelection() {
    const win =
      (this.env && this.env.window) ||
      (this.env && this.env.document && this.env.document.defaultView) ||
      (typeof window !== "undefined" ? window : null);

    if (!win || typeof win.getSelection !== "function") {
      console.warn("ICE: Selection API unavailable");
      return null;
    }

    this._selection = win.getSelection();
    return this._selection;
  }

  /**
   * Creates a range object.
   * @returns {Range} The native range object.
   */
  createRange() {
    const doc =
      (this.env && this.env.document) ||
      (typeof document !== "undefined" ? document : null);

    if (!doc || typeof doc.createRange !== "function") {
      throw new Error("ICE: Range API unavailable");
    }

    return doc.createRange();
  }

  /**
   * Returns the range object at the specified position. The current range object
   * is at position 0. Note - currently only setting single range in `addRange` so
   * position 0 will be the only allocation filled.
   * @param {number} pos - The range position (usually 0).
   * @returns {Range} The native range object at the given position.
   */
  getRangeAt(pos = 0) {
    const selection = this._selection || this._getSelection();

    if (!selection) {
      return this.createRange();
    }

    if (selection.rangeCount === 0) {
      return this.createRange();
    }

    const index = Math.min(pos, selection.rangeCount - 1);

    try {
      return selection.getRangeAt(index);
    } catch (error) {
      console.warn("ICE: Failed to read selection range, recreating", error);
      selection.removeAllRanges();
      return this.createRange();
    }
  }

  /**
   * Adds the specified range to the current selection. Note - only supporting setting
   * a single range, so the previous range gets evicted.
   * @param {Range} range - The range object to add.
   */
  addRange(range) {
    this._selection || this._getSelection();

    if (!this._selection || !range) return;

    if (
      range.startContainer &&
      range.startContainer.ownerDocument !== this.env.document
    ) {
      console.warn(
        "ICE: Range not in correct document context, skipping addRange",
        range,
      );
      return;
    }

    try {
      this._selection.removeAllRanges();
      this._selection.addRange(range);
    } catch (error) {
      console.error("ICE: Failed to add range to selection", error);
    }
  }

  /**
   * Initialize range helpers on the native Range prototype.
   * @private
   */
  _patchRangePrototype() {
    const RangeCtor = this._rangeCtor;
    if (!RangeCtor || RangeCtor.__iceRangePatched) return;

    const proto = RangeCtor.prototype;

    const isSelectable = (node) =>
      !!(
        node &&
        node.nodeType === ice.dom.TEXT_NODE &&
        node.data &&
        node.data.length !== 0
      );

    const setBoundary = (range, isStart, container, offset) => {
      if (isStart) {
        range.setStart(container, offset);
      } else {
        range.setEnd(container, offset);
      }
    };

    /**
     * Returns the first selectable child for a given element, descending as needed
     * to locate the deepest selectable text node.
     */
    const getFirstSelectableChild = (element) => {
      if (!element) return null;
      if (element.nodeType === ice.dom.TEXT_NODE) return element;
      let child = element.firstChild;
      while (child) {
        if (isSelectable(child)) {
          return child;
        } else if (child.firstChild) {
          const res = getFirstSelectableChild(child);
          if (res !== null) {
            return res;
          }
        }
        child = child.nextSibling;
      }
      return null;
    };

    /**
     * Returns the last selectable child for a given element, descending as needed
     * to locate the deepest selectable text node.
     */
    const getLastSelectableChild = (element) => {
      if (!element) return null;
      if (element.nodeType === ice.dom.TEXT_NODE) return element;
      let child = element.lastChild;
      while (child) {
        if (isSelectable(child)) {
          return child;
        } else if (child.lastChild) {
          const res = getLastSelectableChild(child);
          if (res !== null) {
            return res;
          }
        }
        child = child.previousSibling;
      }
      return null;
    };

    /**
     * Returns the deepest next container that the range can be extended to.
     * For example, if the next container is an element that contains text nodes,
     * the container's firstChild is returned.
     */
    const getNextContainer = (container, skippedBlockElem) => {
      if (!container) return null;
      let cursor = container;
      while (cursor.nextSibling) {
        cursor = cursor.nextSibling;
        if (cursor.nodeType !== ice.dom.TEXT_NODE) {
          const child = getFirstSelectableChild(cursor);
          if (child !== null) return child;
        } else if (isSelectable(cursor) === true) {
          return cursor;
        }
      }
      while (cursor && !cursor.nextSibling) {
        cursor = cursor.parentNode;
      }
      if (!cursor) return null;
      cursor = cursor.nextSibling;
      if (isSelectable(cursor) === true) {
        return cursor;
      } else if (skippedBlockElem && ice.dom.isBlockElement(cursor) === true) {
        skippedBlockElem.push(cursor);
      }
      const selChild = getFirstSelectableChild(cursor);
      if (selChild !== null) return selChild;
      return getNextContainer(cursor, skippedBlockElem);
    };

    /**
     * Returns the deepest previous container that the range can be extended to.
     * For example, if the previous container is an element that contains text nodes,
     * then the container's lastChild is returned.
     */
    const getPreviousContainer = (container, skippedBlockElem) => {
      if (!container) return null;
      let cursor = container;
      while (cursor.previousSibling) {
        cursor = cursor.previousSibling;
        if (cursor.nodeType !== ice.dom.TEXT_NODE) {
          if (ice.dom.isStubElement(cursor) === true) {
            return cursor;
          } else {
            const child = getLastSelectableChild(cursor);
            if (child !== null) return child;
          }
        } else if (isSelectable(cursor) === true) {
          return cursor;
        }
      }
      while (cursor && !cursor.previousSibling) {
        cursor = cursor.parentNode;
      }
      if (!cursor) return null;
      cursor = cursor.previousSibling;
      if (isSelectable(cursor) === true) {
        return cursor;
      } else if (skippedBlockElem && ice.dom.isBlockElement(cursor) === true) {
        skippedBlockElem.push(cursor);
      }
      const selChild = getLastSelectableChild(cursor);
      if (selChild !== null) return selChild;
      return getPreviousContainer(cursor, skippedBlockElem);
    };

    /**
     * Finds the next selectable text node from the given container.
     */
    const getNextTextNode = (container) => {
      if (!container) return null;
      if (container.nodeType === ice.dom.ELEMENT_NODE) {
        if (container.childNodes.length !== 0) {
          return getFirstSelectableChild(container);
        }
      }
      const next = getNextContainer(container);
      if (!next) return null;
      if (next.nodeType === ice.dom.TEXT_NODE) {
        return next;
      }
      return getNextTextNode(next);
    };

    /**
     * Finds the previous selectable text node from the given container.
     */
    const getPreviousTextNode = (container, skippedBlockEl) => {
      const prev = getPreviousContainer(container, skippedBlockEl);
      if (!prev) return null;
      if (prev.nodeType === ice.dom.TEXT_NODE) {
        return prev;
      }
      return getPreviousTextNode(prev, skippedBlockEl);
    };

    /**
     * Depending on the given `moveStart` boolean, moves the start or end containers
     * to the left by the given number of character `units`. Use the following
     * example as a demonstration for where the range will fall as it moves in and
     * out of tag boundaries (where "|" is the marked range):
     *
     * test <em>it</em> o|ut
     * test <em>it</em> |out
     * test <em>it</em>| out
     * test <em>i|t</em> out
     * test <em>|it</em> out
     * test| <em>it</em> out
     * tes|t <em>it</em> out
     *
     * A range could be mapped in one of two ways:
     *
     * (1) If a startContainer is a Node of type Text, Comment, or CDATASection, then startOffset
     * is the number of characters from the start of startNode. For example, the following
     * are the range properties for `<p>te|st</p>` (where "|" is the collapsed range):
     *
     * startContainer: <TEXT>test<TEXT>
     * startOffset: 2
     * endContainer: <TEXT>test<TEXT>
     * endOffset: 2
     *
     * (2) For other Node types, startOffset is the number of child nodes between the start of
     * the startNode. Take the following html fragment:
     *
     * `<p>some <span>test</span> text</p>`
     *
     * If we were working with the following range properties:
     *
     * startContainer: <p>
     * startOffset: 2
     * endContainer: <p>
     * endOffset: 2
     *
     * Since <p> is an Element node, the offsets are based on the offset in child nodes of <p> and
     * the range is selecting the second child - the <span> tag.
     *
     * <p><TEXT>some </TEXT><SPAN>test</SPAN><TEXT> text</TEXT></p>
     */
    const moveCharLeft = (range, moveStart, units) => {
      let container;
      let offset;
      if (moveStart) {
        container = range.startContainer;
        offset = range.startOffset;
      } else {
        container = range.endContainer;
        offset = range.endOffset;
      }
      if (!container) return;

      if (container.nodeType === ice.dom.ELEMENT_NODE) {
        if (container.hasChildNodes()) {
          container = container.childNodes[offset] || container.lastChild;
          container = getPreviousTextNode(container);
          while (
            container &&
            container.nodeType === ice.dom.TEXT_NODE &&
            container.nodeValue === ""
          ) {
            container = getPreviousTextNode(container);
          }
          offset = container ? container.data.length - units : units * -1;
        } else {
          offset = units * -1;
        }
      } else {
        offset -= units;
      }
      if (offset < 0) {
        while (offset < 0) {
          const skippedBlockElem = [];
          container = getPreviousTextNode(container, skippedBlockElem);
          if (!container) return;
          if (container.nodeType === ice.dom.ELEMENT_NODE) {
            // Land the caret just before the stub/element to avoid infinite looping
            const parent = container.parentNode;
            if (parent) {
              const idx = Array.prototype.indexOf.call(
                parent.childNodes,
                container,
              );
              setBoundary(range, moveStart, parent, Math.max(idx, 0));
            }
            return;
          }
          offset += container.data.length;
        }
      }
      setBoundary(range, moveStart, container, offset);
    };

    /**
     * Moves the start or end containers to the right by the given number of character `units`.
     * Use the following
     * example as a demonstration for where the range will fall as it moves in and
     * out of tag boundaries (where "|" is the marked range):
     *
     * tes|t <em>it</em> out
     * test| <em>it</em> out
     * test |<em>it</em> out
     * test <em>i|t</em> out
     * test <em>it|</em> out
     * test <em>it</em> |out
     *
     * A range could be mapped in one of two ways:
     *
     * (1) If a startContainer is a Node of type Text, Comment, or CDATASection, then startOffset
     * is the number of characters from the start of startNode. For example, the following
     * are the range properties for `<p>te|st</p>` (where "|" is the collapsed range):
     *
     * startContainer: <TEXT>test<TEXT>
     * startOffset: 2
     * endContainer: <TEXT>test<TEXT>
     * endOffset: 2
     *
     * (2) For other Node types, startOffset is the number of child nodes between the start of
     * the startNode. Take the following html fragment:
     *
     * `<p>some <span>test</span> text</p>`
     *
     * If we were working with the following range properties:
     *
     * startContainer: <p>
     * startOffset: 2
     * endContainer: <p>
     * endOffset: 2
     *
     * Since <p> is an Element node, the offsets are based on the offset in child nodes of <p> and
     * the range is selecting the second child - the <span> tag.
     *
     * <p><TEXT>some </TEXT><SPAN>test</SPAN><TEXT> text</TEXT></p>
     */
    const moveCharRight = (range, moveStart, units) => {
      let container;
      let offset;
      if (moveStart) {
        container = range.startContainer;
        offset = range.startOffset;
      } else {
        container = range.endContainer;
        offset = range.endOffset;
      }
      if (!container) return;
      if (container.nodeType === ice.dom.ELEMENT_NODE) {
        container = container.childNodes[offset] || container.lastChild;
        if (container && container.nodeType !== ice.dom.TEXT_NODE) {
          container = getNextTextNode(container);
        }
        offset = units;
      } else {
        offset += units;
      }
      if (!container) return;
      let diff = offset - (container.data ? container.data.length : 0);
      if (diff > 0) {
        const skippedBlockElem = [];
        while (diff > 0) {
          container = getNextContainer(container, skippedBlockElem);
          if (!container) return;
          if (container.nodeType === ice.dom.ELEMENT_NODE) continue;
          if (container.data.length >= diff) {
            break;
          } else if (container.data.length > 0) {
            diff -= container.data.length;
          }
        }
        offset = diff;
      }
      setBoundary(range, moveStart, container, offset);
    };

    /**
     * Moves the start or end of the range using the specified `unitType`, by the specified
     * number of `units`. Defaults to `CHARACTER_UNIT` and units of 1.
     */
    const move = (range, unitType, units, isStart) => {
      if (units === 0) return;
      switch (unitType) {
        case ice.dom.CHARACTER_UNIT:
          if (units > 0) {
            moveCharRight(range, isStart, units);
          } else {
            moveCharLeft(range, isStart, units * -1);
          }
          break;
        case ice.dom.WORD_UNIT:
        default:
          break;
      }
    };

    /**
     * Moves the range to the next selectable element or places it after the given element
     * when no further selectable content is found.
     */
    const moveToNextEl = (range, element) => {
      if (!element) return;
      const anchor =
        element.nodeType === ice.dom.TEXT_NODE ? element : element.parentNode;
      let next = getNextContainer(anchor);
      if (!next && anchor && anchor.parentNode) {
        next = getNextContainer(anchor.parentNode);
      }
      if (!next) {
        range.setStartAfter(element);
        range.collapse(true);
        return;
      }
      if (next.nodeType === ice.dom.TEXT_NODE) {
        range.setStart(next, 0);
      } else {
        const child = getFirstSelectableChild(next);
        if (child) {
          range.setStart(child, 0);
        } else {
          range.setStartAfter(element);
        }
      }
      range.collapse(true);
    };

    /**
     * Returns the HTML contents of the range, optionally using a cloned selection fragment.
     */
    const getHTMLContents = (range, clonedSelection) => {
      const doc =
        (range.startContainer && range.startContainer.ownerDocument) ||
        (range.endContainer && range.endContainer.ownerDocument) ||
        (typeof document !== "undefined" ? document : null);
      if (!doc) return "";
      const fragment = clonedSelection || range.cloneContents();
      const div = doc.createElement("div");
      div.appendChild(fragment.cloneNode(true));
      return div.innerHTML;
    };

    proto.moveStart = function (unitType, units) {
      move(this, unitType, units, true);
    };

    proto.moveEnd = function (unitType, units) {
      move(this, unitType, units, false);
    };

    proto.setRange = function (start, container, offset) {
      setBoundary(this, start, container, offset);
    };

    proto.moveCharLeft = function (moveStart, units) {
      moveCharLeft(this, moveStart, units);
    };

    proto.moveCharRight = function (moveStart, units) {
      moveCharRight(this, moveStart, units);
    };

    proto.getNextContainer = function (container, skippedBlockElem) {
      return getNextContainer(container, skippedBlockElem);
    };

    proto.getPreviousContainer = function (container, skippedBlockElem) {
      return getPreviousContainer(container, skippedBlockElem);
    };

    proto.getNextTextNode = function (container) {
      return getNextTextNode(container);
    };

    proto.getPreviousTextNode = function (container, skippedBlockEl) {
      return getPreviousTextNode(container, skippedBlockEl);
    };

    proto.getFirstSelectableChild = function (element) {
      return getFirstSelectableChild(element);
    };

    proto.getLastSelectableChild = function (element) {
      return getLastSelectableChild(element);
    };

    proto.isSelectable = function (container) {
      return isSelectable(container);
    };

    proto.getHTMLContents = function (clonedSelection) {
      return getHTMLContents(this, clonedSelection);
    };

    proto.getHTMLContentsObj = function () {
      return this.cloneContents();
    };

    proto.moveToNextEl = function (element) {
      moveToNextEl(this, element);
    };

    RangeCtor.__iceRangePatched = true;
  }
}

// Export for ice namespace
this.ice = this.ice || {};
this.ice.Selection = Selection;
