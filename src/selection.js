// selection.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class Selection
 * @description Selection utility for ice.js, wraps rangy selection/range with custom logic.
 */
class Selection {
  /**
   * @param {Object} env - The environment object (contains document, frame, etc).
   */
  constructor(env) {
    this._selection = null;
    this.env = env;
    this._initializeRangeLibrary();
    this._getSelection();
  }

  /**
   * Returns the selection object for the current browser.
   * @returns {Object} The rangy selection object.
   */
  _getSelection() {
    if (this._selection) {
      this._selection.refresh();
    } else if (this.env.frame) {
      this._selection = rangy.getSelection(this.env.frame);
    } else {
      this._selection = rangy.getSelection();
    }
    return this._selection;
  }

  /**
   * Creates a range object.
   * @returns {Object} The rangy range object.
   */
  createRange() {
    return rangy.createRange(this.env.document);
  }

  /**
   * Returns the range object at the specified position. The current range object
   * is at position 0. Note - currently only setting single range in `addRange` so
   * position 0 will be the only allocation filled.
   * @param {number} pos - The range position (usually 0).
   * @returns {Object} The rangy range object at the given position.
   */
  getRangeAt(pos) {
    this._selection.refresh();
    try {
      return this._selection.getRangeAt(pos);
    } catch {
      this._selection = null;
      return this._getSelection().getRangeAt(0);
    }
  }

  /**
   * Adds the specified range to the current selection. Note - only supporting setting
   * a single range, so the previous range gets evicted.
   * @param {Object} range - The rangy range object to add.
   */
  addRange(range) {
    this._selection || (this._selection = this._getSelection());

    try {
      // Validate that the range is in the correct document
      if (
        range &&
        range.startContainer &&
        range.startContainer.ownerDocument === this.env.document
      ) {
        this._selection.setSingleRange(range);
        this._selection.ranges = [range];
      } else {
        console.warn(
          "ICE: Range not in correct document context, skipping addRange",
          range,
        );
      }
    } catch (error) {
      console.error("ICE: Failed to add range to selection", error);
    }
    return;
  }

  /**
   * Initialize and extend the `rangy` library with some custom functionality.
   * Adds movement and selection helpers to rangy.rangePrototype.
   * @private
   */
  _initializeRangeLibrary() {
    const self = this;
    rangy.init();
    rangy.config.checkSelectionRanges = false;

    /**
     * Moves the start or end of the range using the specified `unitType`, by the specified
     * number of `units`. Defaults to `CHARACTER_UNIT` and units of 1.
     * @param {Object} range - The rangy range object.
     * @param {string} unitType - The unit type (CHARACTER_UNIT, WORD_UNIT).
     * @param {number} units - Number of units to move.
     * @param {boolean} isStart - Whether to move the start (true) or end (false).
     */
    const move = (range, unitType, units, isStart) => {
      if (units === 0) return;
      switch (unitType) {
        case ice.dom.CHARACTER_UNIT:
          if (units > 0) {
            range.moveCharRight(isStart, units);
          } else {
            range.moveCharLeft(isStart, units * -1);
          }
          break;
        case ice.dom.WORD_UNIT:
        default:
          // Removed. TODO: possibly refactor or re-implement.
          break;
      }
    };

    /**
     * Moves the start of the range using the specified `unitType`, by the specified
     * number of `units`.
     */
    rangy.rangePrototype.moveStart = function (unitType, units) {
      move(this, unitType, units, true);
    };
    /**
     * Moves the end of the range using the specified `unitType`, by the specified
     * number of `units`.
     */
    rangy.rangePrototype.moveEnd = function (unitType, units) {
      move(this, unitType, units, false);
    };
    /**
     * Sets the start or end containers to the given `container` with `offset` units.
     * @param {boolean} start - If true, set start; else set end.
     * @param {Node} container - The container node.
     * @param {number} offset - The offset.
     */
    rangy.rangePrototype.setRange = function (start, container, offset) {
      if (start) {
        this.setStart(container, offset);
      } else {
        this.setEnd(container, offset);
      }
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
    rangy.rangePrototype.moveCharLeft = function (moveStart, units) {
      let container, offset;
      if (moveStart) {
        container = this.startContainer;
        offset = this.startOffset;
      } else {
        container = this.endContainer;
        offset = this.endOffset;
      }
      // Handle the case where the range conforms to (2) (noted in the comment above).
      if (container.nodeType === ice.dom.ELEMENT_NODE) {
        if (container.hasChildNodes()) {
          container = container.childNodes[offset];
          container = this.getPreviousTextNode(container);
          // Get the previous text container that is not an empty text node.
          while (
            container &&
            container.nodeType === ice.dom.TEXT_NODE &&
            container.nodeValue === ""
          ) {
            container = this.getPreviousTextNode(container);
          }
          offset = container.data.length - units;
        } else {
          offset = units * -1;
        }
      } else {
        offset -= units;
      }
      if (offset < 0) {
        // We need to move to a previous selectable container.
        while (offset < 0) {
          const skippedBlockElem = [];
          container = this.getPreviousTextNode(container, skippedBlockElem);
          // We are at the beginning/out of the editable - break.
          if (!container) return;
          if (container.nodeType === ice.dom.ELEMENT_NODE) continue;
          offset += container.data.length;
        }
      }
      this.setRange(moveStart, container, offset);
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
    rangy.rangePrototype.moveCharRight = function (moveStart, units) {
      let container, offset;
      if (moveStart) {
        container = this.startContainer;
        offset = this.startOffset;
      } else {
        container = this.endContainer;
        offset = this.endOffset;
      }
      if (container.nodeType === ice.dom.ELEMENT_NODE) {
        container = container.childNodes[offset];
        if (!container) {
          // No child node at the specified offset, we're at the end
          return;
        }
        if (container.nodeType !== ice.dom.TEXT_NODE) {
          container = this.getNextTextNode(container);
          if (!container) {
            // No next text node found
            return;
          }
        }
        offset = units;
      } else {
        offset += units;
      }
      let diff = offset - container.data.length;
      if (diff > 0) {
        const skippedBlockElem = [];
        // We need to move to the next selectable container.
        while (diff > 0) {
          container = this.getNextContainer(container, skippedBlockElem);
          if (!container) {
            // No next container found, we're at the end of content
            return;
          }
          if (container.nodeType === ice.dom.ELEMENT_NODE) continue;
          if (container.data.length >= diff) {
            // We found a container with enough content to select.
            break;
          } else if (container.data.length > 0) {
            // Container does not have enough content, find the next one.
            diff -= container.data.length;
          }
        }
        offset = diff;
      }
      this.setRange(moveStart, container, offset);
    };

    /**
     * Returns the deepest next container that the range can be extended to.
     * For example, if the next container is an element that contains text nodes,
     * the container's firstChild is returned.
     */
    rangy.rangePrototype.getNextContainer = function (
      container,
      skippedBlockElem,
    ) {
      if (!container) return null;
      while (container.nextSibling) {
        container = container.nextSibling;
        if (container.nodeType !== ice.dom.TEXT_NODE) {
          const child = this.getFirstSelectableChild(container);
          if (child !== null) return child;
        } else if (this.isSelectable(container) === true) {
          return container;
        }
      }
      // Look at parents next sibling.
      while (container && !container.nextSibling) {
        container = container.parentNode;
      }
      if (!container) return null;
      container = container.nextSibling;
      if (this.isSelectable(container) === true) {
        return container;
      } else if (
        skippedBlockElem &&
        ice.dom.isBlockElement(container) === true
      ) {
        skippedBlockElem.push(container);
      }
      const selChild = this.getFirstSelectableChild(container);
      if (selChild !== null) return selChild;
      return this.getNextContainer(container, skippedBlockElem);
    };

    /**
     * Returns the deepest previous container that the range can be extended to.
     * For example, if the previous container is an element that contains text nodes,
     * then the container's lastChild is returned.
     */
    rangy.rangePrototype.getPreviousContainer = (
      container,
      skippedBlockElem,
    ) => {
      if (!container) return null;
      while (container.previousSibling) {
        container = container.previousSibling;
        if (container.nodeType !== ice.dom.TEXT_NODE) {
          if (ice.dom.isStubElement(container) === true) {
            return container;
          } else {
            const child =
              rangy.rangePrototype.getLastSelectableChild(container);
            if (child !== null) return child;
          }
        } else if (rangy.rangePrototype.isSelectable(container) === true) {
          return container;
        }
      }
      while (container && !container.previousSibling) {
        container = container.parentNode;
      }
      if (!container) return null;
      container = container.previousSibling;
      if (rangy.rangePrototype.isSelectable(container) === true) {
        return container;
      } else if (
        skippedBlockElem &&
        ice.dom.isBlockElement(container) === true
      ) {
        skippedBlockElem.push(container);
      }
      const selChild = rangy.rangePrototype.getLastSelectableChild(container);
      if (selChild !== null) return selChild;
      return rangy.rangePrototype.getPreviousContainer(
        container,
        skippedBlockElem,
      );
    };

    rangy.rangePrototype.getNextTextNode = (container) => {
      if (!container) return null;
      if (container.nodeType === ice.dom.ELEMENT_NODE) {
        if (container.childNodes.length !== 0) {
          return rangy.rangePrototype.getFirstSelectableChild(container);
        }
      }
      container = rangy.rangePrototype.getNextContainer(container);
      if (!container) return null;
      if (container.nodeType === ice.dom.TEXT_NODE) {
        return container;
      }
      return rangy.rangePrototype.getNextTextNode(container);
    };

    rangy.rangePrototype.getPreviousTextNode = (container, skippedBlockEl) => {
      container = rangy.rangePrototype.getPreviousContainer(
        container,
        skippedBlockEl,
      );
      if (!container) return null;
      if (container.nodeType === ice.dom.TEXT_NODE) {
        return container;
      }
      return rangy.rangePrototype.getPreviousTextNode(
        container,
        skippedBlockEl,
      );
    };

    rangy.rangePrototype.getFirstSelectableChild = (element) => {
      if (element) {
        if (element.nodeType !== ice.dom.TEXT_NODE) {
          let child = element.firstChild;
          while (child) {
            if (rangy.rangePrototype.isSelectable(child) === true) {
              return child;
            } else if (child.firstChild) {
              // This node does have child nodes.
              const res = rangy.rangePrototype.getFirstSelectableChild(child);
              if (res !== null) {
                return res;
              } else {
                child = child.nextSibling;
              }
            } else {
              child = child.nextSibling;
            }
          }
        } else {
          // Given element is a text node so return it.
          return element;
        }
      }
      return null;
    };

    rangy.rangePrototype.getLastSelectableChild = (element) => {
      if (element) {
        if (element.nodeType !== ice.dom.TEXT_NODE) {
          let child = element.lastChild;
          while (child) {
            if (rangy.rangePrototype.isSelectable(child) === true) {
              return child;
            } else if (child.lastChild) {
              // This node does have child nodes.
              const res = rangy.rangePrototype.getLastSelectableChild(child);
              if (res !== null) {
                return res;
              } else {
                child = child.previousSibling;
              }
            } else {
              child = child.previousSibling;
            }
          }
        } else {
          // Given element is a text node so return it.
          return element;
        }
      }
      return null;
    };

    rangy.rangePrototype.isSelectable = (container) =>
      !!(
        container &&
        container.nodeType === ice.dom.TEXT_NODE &&
        container.data.length !== 0
      );

    rangy.rangePrototype.getHTMLContents = function (clonedSelection) {
      if (!clonedSelection) {
        clonedSelection = this.cloneContents();
      }
      const div = self.env.document.createElement("div");
      div.appendChild(clonedSelection.cloneNode(true));
      return div.innerHTML;
    };

    rangy.rangePrototype.getHTMLContentsObj = function () {
      return this.cloneContents();
    };
  }
}

// Export for ice namespace
this.ice = this.ice || {};
this.ice.Selection = Selection;
