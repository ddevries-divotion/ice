// dom.js - DOM utilities for ice.js
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @namespace dom
 * @description DOM utilities for ice.js, jQuery-based.
 */
const dom = {};

/** @constant {number} */
dom.DOM_VK_DELETE = 8;
/** @constant {number} */
dom.DOM_VK_LEFT = 37;
/** @constant {number} */
dom.DOM_VK_UP = 38;
/** @constant {number} */
dom.DOM_VK_RIGHT = 39;
/** @constant {number} */
dom.DOM_VK_DOWN = 40;
/** @constant {number} */
dom.DOM_VK_ENTER = 13;
/** @constant {number} */
dom.ELEMENT_NODE = 1;
/** @constant {number} */
dom.ATTRIBUTE_NODE = 2;
/** @constant {number} */
dom.TEXT_NODE = 3;
/** @constant {number} */
dom.CDATA_SECTION_NODE = 4;
/** @constant {number} */
dom.ENTITY_REFERENCE_NODE = 5;
/** @constant {number} */
dom.ENTITY_NODE = 6;
/** @constant {number} */
dom.PROCESSING_INSTRUCTION_NODE = 7;
/** @constant {number} */
dom.COMMENT_NODE = 8;
/** @constant {number} */
dom.DOCUMENT_NODE = 9;
/** @constant {number} */
dom.DOCUMENT_TYPE_NODE = 10;
/** @constant {number} */
dom.DOCUMENT_FRAGMENT_NODE = 11;
/** @constant {number} */
dom.NOTATION_NODE = 12;
/** @constant {string} */
dom.CHARACTER_UNIT = "character";
/** @constant {string} */
dom.WORD_UNIT = "word";
/** @constant {string} */
dom.BREAK_ELEMENT = "br";
/** @constant {string[]} */
dom.CONTENT_STUB_ELEMENTS = [
  "img",
  "hr",
  "iframe",
  "param",
  "link",
  "meta",
  "input",
  "frame",
  "col",
  "base",
  "area",
];
/** @constant {string[]} */
dom.BLOCK_ELEMENTS = [
  "p",
  "div",
  "pre",
  "ul",
  "ol",
  "li",
  "table",
  "tbody",
  "td",
  "th",
  "fieldset",
  "form",
  "blockquote",
  "dl",
  "dt",
  "dd",
  "dir",
  "center",
  "address",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];
/** @constant {string[]} */
dom.TEXT_CONTAINER_ELEMENTS = [
  "p",
  "div",
  "pre",
  "li",
  "td",
  "th",
  "blockquote",
  "dt",
  "dd",
  "center",
  "address",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

/**
 * @constant {string[]}
 * @description All stub elements including break element.
 */
dom.STUB_ELEMENTS = [...dom.CONTENT_STUB_ELEMENTS, dom.BREAK_ELEMENT];

/**
 * Returns elements with the given class name.
 * @param {string} className - The class name to search for.
 * @param {Element} [startElement=document.body] - The element to start the search from.
 * @returns {Element[]} Array of elements with the given class name.
 * @see __tests__/playwright/dom.spec.js
 */
dom.getClass = (className, element = document.body) => {
  // For backwards compatibility, add a dot prefix if the className does not start with one.
  const prefix = className.startsWith(".") ? "" : ".";
  return element.querySelectorAll(`${prefix}${className}`);
};
/**
 * Removes all children from an element.
 * @param {Element} element - The element to empty.
 * @returns {undefined}
 * @see __tests__/playwright/dom.spec.js
 */
dom.empty = (element) => (element ? (element.innerHTML = "") : undefined);
/**
 * Removes the element from the DOM.
 * @param {Element} element - The element to remove.
 * @returns {undefined}
 * @see __tests__/playwright/dom.spec.js
 */
dom.remove = (element) => (element ? jQuery(element).remove() : undefined);
/**
 * Prepends an element as the first child.
 * @param {Element} parent - The parent element.
 * @param {Element} elem - The element to prepend.
 * @see __tests__/playwright/dom.spec.js
 */
dom.prepend = (parent, elem) => parent.prepend(elem);
/**
 * Appends an element as the last child.
 * @param {Element} parent - The parent element.
 * @param {Element} elem - The element to append.
 * @see __tests__/playwright/dom.spec.js
 */
dom.append = (parent, elem) => parent.append(elem);
/**
 * Inserts an element before the reference node.
 * @param {Element} before - The reference node.
 * @param {Element} elem - The element to insert.
 * @see __tests__/playwright/dom.spec.js
 */
dom.insertBefore = (before, elem) => jQuery(before).before(elem);
/**
 * Inserts an element after the reference node.
 * @param {Element} after - The reference node.
 * @param {Element} elem - The element to insert.
 * @see __tests__/playwright/dom.spec.js
 */
dom.insertAfter = (after, elem) => jQuery(after).after(elem);
/**
 * Removes whitespace and newlines between nested block elements using jQuery.
 * @param {Element} element - The element to clean.
 */
dom.removeWhitespace = (element) => {
  jQuery(element)
    .contents()
    .filter(function () {
      if (
        this.nodeType !== dom.TEXT_NODE &&
        (this.nodeName === "UL" || this.nodeName === "OL")
      ) {
        dom.removeWhitespace(this);
        return false;
      } else if (this.nodeType !== dom.TEXT_NODE) {
        return false;
      } else {
        return !/\S/.test(this.nodeValue);
      }
    })
    .remove();
};
/**
 * Returns the child nodes as an array.
 * @param {Element} el - The element whose child nodes to return.
 * @returns {Node[]} Array of child nodes.
 * @see __tests__/playwright/dom.spec.js
 */
dom.contents = (el) => (el ? Array.from(el.childNodes) : []);
/**
 * Returns the inner contents of el as a DocumentFragment.
 * @param {Element} el - The element to extract content from.
 * @returns {DocumentFragment}
 */
dom.extractContent = (el) => {
  const frag = document.createDocumentFragment();
  let child;
  while ((child = el.firstChild)) {
    frag.appendChild(child);
  }
  return frag;
};
/**
 * Returns the closest ancestor of the given node that matches the selector.
 * @param {Node} node - The node to start from.
 * @param {string} selector - The selector to match.
 * @returns {Node|null} The matching ancestor or null.
 */
dom.getNode = (node, selector) =>
  dom.is(node, selector) ? node : dom.parents(node, selector)[0] || null;
/**
 * Returns the parents of the given elements up to the stop element, filtered by the given selector using jQuery.parents().
 * @param {Element|Element[]} elements - The elements to start from.
 * @param {string} filter - The selector to filter parents.
 * @param {Element} stopEl - The element to stop at.
 * @returns {Element[]} Array of parent elements.
 */
dom.getParents = (elements, filter, stopEl) => {
  const res = jQuery(elements).parents(filter);
  const ar = [];
  for (let i = 0; i < res.length; i++) {
    if (res[i] === stopEl) break;
    ar.push(res[i]);
  }
  return ar;
};
/**
 * Checks if the parent element has block-level children.
 * @param {Element} parent - The parent element.
 * @returns {boolean} True if block-level children exist.
 */
dom.hasBlockChildren = (parent) => {
  for (let i = 0; i < parent.childNodes.length; i++) {
    if (
      parent.childNodes[i].nodeType === dom.ELEMENT_NODE &&
      dom.isBlockElement(parent.childNodes[i])
    ) {
      return true;
    }
  }
  return false;
};
/**
 * Removes the specified tag from the element, replacing it with its children using jQuery.
 * @param {Element} element - The element to modify.
 * @param {string} selector - The tag selector to remove.
 * @returns {Element} The modified element.
 */
dom.removeTag = (element, selector) => {
  jQuery(element)
    .find(selector)
    .replaceWith(function () {
      return jQuery(this).contents();
    });
  return element;
};
/**
 * Strips enclosing tags from the content, allowing only the specified tags using jQuery.
 * @param {Element} content - The content element.
 * @param {string[]} allowedTags - Array of allowed tag names.
 * @returns {Element} The cleaned element.
 */
dom.stripEnclosingTags = (content, allowedTags) => {
  const c = jQuery(content);
  c.find("*")
    .not(allowedTags)
    .replaceWith(function () {
      let ret = jQuery();
      let $this;
      try {
        $this = jQuery(this);
        ret = $this.contents();
      } catch {
        /* empty */
      }
      if (ret.length === 0) {
        $this.remove();
      }
      return ret;
    });
  return c[0];
};
/**
 * Returns the siblings of an element in the specified direction.
 * @param {Element} element - The reference element.
 * @param {'prev'|'next'} dir - The direction to search.
 * @param {boolean} elementNodesOnly - Whether to include only element nodes.
 * @param {Element} stopElem - The element to stop at.
 * @returns {Element[]} Array of sibling elements.
 */
dom.getSiblings = (element, dir, elementNodesOnly, stopElem) => {
  if (elementNodesOnly === true) {
    return dir === "prev"
      ? jQuery(element).prevAll()
      : jQuery(element).nextAll();
  } else {
    const elems = [];
    if (dir === "prev") {
      while (element.previousSibling) {
        element = element.previousSibling;
        if (element === stopElem) break;
        elems.push(element);
      }
    } else {
      while (element.nextSibling) {
        element = element.nextSibling;
        if (element === stopElem) break;
        elems.push(element);
      }
    }
    return elems;
  }
};
/**
 * Returns the text content of a node.
 * @param {Node} node - The node to get text from.
 * @returns {string} The text content.
 * @see __tests__/playwright/dom.spec.js
 */
dom.getNodeTextContent = (node) => (node ? node.textContent || "" : "");
/**
 * Checks if a node has no text or stub content.
 * @param {Node} node - The node to check.
 * @returns {boolean} True if no text or stub content.
 */
dom.hasNoTextOrStubContent = (node) => {
  if (dom.getNodeTextContent(node).length > 0) return false;
  if (jQuery(node).find(dom.CONTENT_STUB_ELEMENTS.join(", ")).length > 0)
    return false;
  return true;
};
/**
 * Returns the character length of a node, including stub elements using jQuery.
 * @param {Node} node - The node to measure.
 * @returns {number} The character length.
 */
dom.getNodeCharacterLength = (node) =>
  dom.getNodeTextContent(node).length +
  jQuery(node).find(dom.STUB_ELEMENTS.join(", ")).length;
/**
 * Returns the tag name of a node in lowercase.
 * @param {Node} node - The node to get the tag name from.
 * @returns {string|null} The tag name or null.
 */
dom.getTagName = (node) =>
  node && node.tagName ? node.tagName.toLowerCase() : null;
/**
 * Checks if an element is a block element by tag name.
 * @param {Element} element - The element to check.
 * @returns {boolean} True if block element.
 */
dom.isBlockElement = (element) =>
  !!(
    element &&
    element.nodeName &&
    dom.BLOCK_ELEMENTS.includes(element.nodeName.toLowerCase())
  );
/**
 * Checks if an element is a stub element by tag name.
 * @param {Element} element - The element to check.
 * @returns {boolean} True if stub element.
 */
dom.isStubElement = (element) =>
  !!(
    element &&
    element.nodeName &&
    dom.STUB_ELEMENTS.includes(element.nodeName.toLowerCase())
  );
/**
 * Removes `<br>` elements from the children of a node.
 * @param {Node} node - The node to clean.
 */
dom.removeBRFromChild = (node) => {
  if (node && node.hasChildNodes()) {
    for (let z = 0; z < node.childNodes.length; z++) {
      const child = node.childNodes[z];
      if (child && dom.BREAK_ELEMENT === dom.getTagName(child)) {
        child.parentNode.removeChild(child);
      }
    }
  }
};
/**
 * Checks if an element is a child of the specified parent.
 * @param {Element} el - The element to check.
 * @param {Element} parent - The parent element.
 * @returns {boolean} True if el is a child of parent.
 */
dom.isChildOf = (el, parent) => {
  try {
    while (el && el.parentNode) {
      if (el.parentNode === parent) return true;
      el = el.parentNode;
    }
  } catch {
    /* empty */
  }
  return false;
};
/**
 * Checks if an element is a child of a parent with the specified tag name.
 * @param {Element} el - The element to check.
 * @param {string} name - The tag name.
 * @returns {Element|boolean} The parent element or false.
 */
dom.isChildOfTagName = (el, name) => {
  try {
    while (el && el.parentNode) {
      if (
        el.parentNode &&
        el.parentNode.tagName &&
        el.parentNode.tagName.toLowerCase() === name
      ) {
        return el.parentNode;
      }
      el = el.parentNode;
    }
  } catch {
    /* empty */
  }
  return false;
};
/**
 * Checks if an element is a child of a parent with one of the specified tag names.
 * @param {Element} el - The element to check.
 * @param {string[]} names - Array of tag names.
 * @returns {Element|null} The parent element or null.
 */
dom.isChildOfTagNames = (el, names) => {
  try {
    while (el && el.parentNode) {
      if (el.parentNode && el.parentNode.tagName) {
        const tagName = el.parentNode.tagName.toLowerCase();
        for (let i = 0; i < names.length; i++) {
          if (tagName === names[i]) return el.parentNode;
        }
      }
      el = el.parentNode;
    }
  } catch {
    /* empty */
  }
  return null;
};
/**
 * Clones the given elements using jQuery.clone().
 * @param {Element|Element[]} elems - The elements to clone.
 * @param {boolean} [cloneEvents=true] - Whether to clone events.
 * @returns {Element|Element[]} The cloned elements.
 */
dom.cloneNode = (elems, cloneEvents = true) => jQuery(elems).clone(cloneEvents);
/**
 * Binds an event handler to an element using jQuery.bind().
 * @param {Element} element - The element to bind to.
 * @param {string} event - The event name.
 * @param {Function} callback - The event handler.
 */
dom.bind = (element, event, callback) => jQuery(element).bind(event, callback);
/**
 * Unbinds an event handler from an element using jQuery.unbind().
 * @param {Element} element - The element to unbind from.
 * @param {string} event - The event name.
 * @param {Function} callback - The event handler.
 */
dom.unbind = (element, event, callback) =>
  jQuery(element).unbind(event, callback);
/**
 * Gets or sets an attribute value for the given elements.
 * @param {Element|Element[]} element - The element(s) to operate on.
 * @param {string} key - The attribute name.
 * @param {string} [val] - The value to set (if provided).
 * @returns {string|undefined} The attribute value or undefined.
 */
dom.attr = (element, key, val) =>
  val ? element?.setAttribute(key, val) : element?.getAttribute(key);
/**
 * Replaces a node with the given replacement using jQuery.replaceWith().
 * @param {Node} node - The node to replace.
 * @param {Node|string|Function} replacement - The replacement.
 */
dom.replaceWith = (node, replacement) => jQuery(node).replaceWith(replacement);
/**
 * Returns the elements between two elements in the DOM tree.
 * @param {Element} fromElem - The starting element.
 * @param {Element} toElem - The ending element.
 * @returns {Element[]} Array of elements between fromElem and toElem.
 */
dom.getElementsBetween = (fromElem, toElem) => {
  let elements = [];
  if (fromElem === toElem) return elements;
  if (dom.isChildOf(toElem, fromElem)) {
    for (let i = 0; i < fromElem.childNodes.length; i++) {
      if (fromElem.childNodes[i] === toElem) break;
      else if (dom.isChildOf(toElem, fromElem.childNodes[i])) {
        return dom.arrayMerge(
          elements,
          dom.getElementsBetween(fromElem.childNodes[i], toElem),
        );
      } else {
        elements.push(fromElem.childNodes[i]);
      }
    }
    return elements;
  }
  let startEl = fromElem.nextSibling;
  while (startEl) {
    if (dom.isChildOf(toElem, startEl)) {
      elements = dom.arrayMerge(
        elements,
        dom.getElementsBetween(startEl, toElem),
      );
      return elements;
    } else if (startEl === toElem) {
      return elements;
    } else {
      elements.push(startEl);
      startEl = startEl.nextSibling;
    }
  }
  const fromParents = dom.getParents(fromElem);
  const toParents = dom.getParents(toElem);
  const parentElems = dom.arrayDiff(fromParents, toParents, true);
  for (let j = 0; j < parentElems.length - 1; j++) {
    elements = dom.arrayMerge(
      elements,
      dom.getSiblings(parentElems[j], "next"),
    );
  }
  const lastParent = parentElems[parentElems.length - 1];
  elements = dom.arrayMerge(
    elements,
    dom.getElementsBetween(lastParent, toElem),
  );
  return elements;
};
/**
 * Returns the next node in the container.
 * @param {Node} node - The node to start from.
 * @param {Node} container - The container node.
 * @returns {Node|null} The next node or null.
 */
dom.getNextNode = (node, container) => {
  if (node) {
    while (node.parentNode) {
      if (node === container) return null;
      if (node.nextSibling) {
        if (
          node.nextSibling.nodeType === dom.TEXT_NODE &&
          node.nextSibling.length === 0
        ) {
          node = node.nextSibling;
          continue;
        }
        return dom.getFirstChild(node.nextSibling);
      }
      node = node.parentNode;
    }
  }
  return null;
};
/**
 * Returns the next content node in the container.
 * @param {Node} node - The node to start from.
 * @param {Node} container - The container node.
 * @returns {Node|null} The next content node or null.
 */
dom.getNextContentNode = (node, container) => {
  if (node) {
    while (node.parentNode) {
      if (node === container) return null;
      if (
        node.nextSibling &&
        dom.canContainTextElement(dom.getBlockParent(node))
      ) {
        if (
          node.nextSibling.nodeType === dom.TEXT_NODE &&
          node.nextSibling.length === 0
        ) {
          node = node.nextSibling;
          continue;
        }
        return node.nextSibling;
      } else if (node.nextElementSibling) {
        return node.nextElementSibling;
      }
      node = node.parentNode;
    }
  }
  return null;
};
/**
 * Returns the previous content node in the container.
 * @param {Node} node - The node to start from.
 * @param {Node} container - The container node.
 * @returns {Node|null} The previous content node or null.
 */
dom.getPrevContentNode = (node, container) => {
  if (node) {
    while (node.parentNode) {
      if (node === container) return null;
      if (
        node.previousSibling &&
        dom.canContainTextElement(dom.getBlockParent(node))
      ) {
        if (
          node.previousSibling.nodeType === dom.TEXT_NODE &&
          node.previousSibling.length === 0
        ) {
          node = node.previousSibling;
          continue;
        }
        return node.previousSibling;
      } else if (node.previousElementSibling) {
        return node.previousElementSibling;
      }
      node = node.parentNode;
    }
  }
  return null;
};
/**
 * Checks if an element can contain a text element by tag name.
 * @param {Element} element - The element to check.
 * @returns {boolean} True if the element can contain text.
 */
dom.canContainTextElement = (element) =>
  !!(
    element &&
    element.nodeName &&
    dom.TEXT_CONTAINER_ELEMENTS.includes(element.nodeName.toLowerCase())
  );
/**
 * Returns the first child node that is not an element.
 * @param {Node} node - The node to start from.
 * @returns {Node} The first non-element child node or the node itself.
 */
dom.getFirstChild = (node) => {
  if (!node) return null;
  let child = node.firstChild;
  while (child && child.nodeType === dom.ELEMENT_NODE && child.firstChild) {
    child = child.firstChild;
  }
  return child || node;
};
/**
 * Returns the last child node that is not an element.
 * @param {Node} node - The node to start from.
 * @returns {Node} The last non-element child node or the node itself.
 */
dom.getLastChild = (node) => {
  if (!node) return null;
  let child = node.lastChild;
  while (child && child.nodeType === dom.ELEMENT_NODE && child.lastChild) {
    child = child.lastChild;
  }
  return child || node;
};
/**
 * Removes empty nodes from the DOM using jQuery.
 * @param {Element} parent - The parent element.
 * @param {Function} [callback] - Optional callback for each node.
 */
dom.removeEmptyNodes = (parent, callback) => {
  let elems = jQuery(parent).find(":empty");
  let i = elems.length;
  while (i > 0) {
    i--;
    if (!dom.isStubElement(elems[i])) {
      if (!callback || callback.call(this, elems[i]) !== false) {
        dom.remove(elems[i]);
      }
    }
  }
};
/**
 * Creates a DOM element from the given HTML using jQuery.
 * @param {string} html - The HTML string.
 * @returns {Element} The created element.
 */
dom.create = (html) => jQuery(html)[0];
/**
 * Finds elements within the parent element that match the selector using jQuery.find().
 * @param {Element} parent - The parent element.
 * @param {string} exp - The selector expression.
 * @returns {Element[]} Array of found elements.
 */
dom.find = (parent, exp) => jQuery(parent).find(exp);
/**
 * Gets the children of the parent element that match the selector using jQuery.children().
 * @param {Element} parent - The parent element.
 * @param {string} exp - The selector expression.
 * @returns {Element[]} Array of child elements.
 */
dom.children = (parent, exp) => jQuery(parent).children(exp);
/**
 * Returns the ancestors of the child element that match the selector using jQuery.parents().
 * @param {Element} child - The child element.
 * @param {string} exp - The selector expression.
 * @returns {Element[]} Array of ancestor elements.
 */
dom.parents = (child, exp) => jQuery(child).parents(exp);
/**
 * Checks if a node matches the selector using jQuery.is().
 * @param {Node} node - The node to check.
 * @param {string} exp - The selector expression.
 * @returns {boolean} True if the node matches.
 */
dom.is = (node, exp) => jQuery(node).is(exp);
/**
 * Extends an object with properties from other objects using Object.assign.
 * @param {...Object} args - Objects to merge.
 * @returns {Object} The extended object.
 * @see __tests__/playwright/dom.spec.js
 */
dom.extend = (...args) => jQuery.extend.apply(this, args);
/**
 * Walks the DOM tree and applies the callback function to each element recursively.
 * @param {Node} elem - The node to start from.
 * @param {Function} callback - The function to call for each node.
 * @param {number} [lvl=0] - The current depth level.
 * @see __tests__/playwright/dom.spec.js
 */
dom.walk = (elem, callback, lvl = 0) => {
  if (!elem) return;
  const retVal = callback.call(this, elem, lvl);
  if (retVal === false) return;
  if (elem.childNodes && elem.childNodes.length > 0) {
    dom.walk(elem.firstChild, callback, lvl + 1);
  } else if (elem.nextSibling) {
    dom.walk(elem.nextSibling, callback, lvl);
  } else if (elem.parentNode && elem.parentNode.nextSibling) {
    dom.walk(elem.parentNode.nextSibling, callback, lvl - 1);
  }
};
/**
 * Sets a CSS property for an element.
 * @param {Element} element - The element to style.
 * @param {string} property - The CSS property.
 * @param {string|number} value - The value to set.
 * @see __tests__/playwright/dom.spec.js
 */
dom.setStyle = (element, property, value) => {
  if (element) {
    element.style[property] = value;
  }
};
/**
 * Gets the value of a CSS property for an element.
 * @param {Element} element - The element to read from.
 * @param {string} property - The CSS property.
 * @returns {string} The property value.
 * @see __tests__/playwright/dom.spec.js
 */
dom.getStyle = (element, property) => getComputedStyle(element)[property];
/**
 * Checks if an element has the specified class.
 * @param {Element} element - The element to check.
 * @param {string} className - The class name.
 * @returns {boolean} True if the element has the class.
 */
dom.hasClass = (element, className) => element.classList.contains(className);
/**
 * Adds the specified class to an element.
 * @param {Element} element - The element to modify.
 * @param {string} classNames - Space-separated class names.
 */
dom.addClass = (element, classNames) =>
  element.classList.add(...classNames.split(" "));
/**
 * Prevents the default action of an event and stops propagation.
 * @param {Event} e - The event to handle.
 * @see __tests__/playwright/dom.spec.js
 */
dom.preventDefault = (e) => {
  e.preventDefault();
  dom.stopPropagation(e);
};
/**
 * Stops the propagation of an event.
 * @param {Event} e - The event to handle.
 * @see __tests__/playwright/dom.spec.js
 */
dom.stopPropagation = (e) => {
  e.stopPropagation();
};
/**
 * Inherits the properties of the parent object, excluding inclusion in the prototype chain.
 * @param {Function|string} child - The child constructor or name.
 * @param {Function|string} parent - The parent constructor or name.
 * @see __tests__/playwright/dom.spec.js
 */
dom.noInclusionInherits = (child, parent) => {
  if (parent instanceof String || typeof parent === "string")
    parent = window[parent];
  if (child instanceof String || typeof child === "string")
    child = window[child];
  const above = function () {};
  if (dom.isset(parent)) {
    for (const value in parent.prototype) {
      if (child.prototype[value]) {
        above.prototype[value] = parent.prototype[value];
        continue;
      }
      child.prototype[value] = parent.prototype[value];
    }
  }
  if (child.prototype) {
    above.prototype.constructor = parent;
    child.prototype["super"] = new above();
  }
};
/**
 * Iterates over an array or object and applies the callback function to each item.
 * @param {Array|Object} val - The array or object to iterate.
 * @param {Function} callback - The function to call for each item.
 * @see __tests__/playwright/dom.spec.js
 */
dom.each = (val, callback) => {
  jQuery.each(val, function (i, el) {
    callback.call(this, i, el);
  });
};
/**
 * Checks if a value is set (not undefined or null).
 * @param {*} v - The value to check.
 * @returns {boolean} True if set.
 * @see __tests__/playwright/dom.spec.js
 */
dom.isset = (v) => typeof v !== "undefined" && v !== null;
/**
 * Returns the difference between two arrays.
 * @param {Array} array1 - The first array.
 * @param {Array} array2 - The second array.
 * @param {boolean} firstOnly - If true, only return items in array1 not in array2.
 * @returns {Array} The difference array.
 * @see __tests__/playwright/dom.spec.js
 */
dom.arrayDiff = (array1, array2, firstOnly) => {
  let res = array1.filter((x) => !array2.includes(x));
  if (!firstOnly) {
    res = res.concat(array2.filter((x) => !array1.includes(x)));
  }
  return res;
};
/**
 * Merges two arrays into the first array.
 * @param {Array} array1 - The first array.
 * @param {Array} array2 - The second array.
 * @returns {Array} The merged array.
 * @see __tests__/playwright/dom.spec.js
 */
dom.arrayMerge = (array1, array2) => {
  array1.push(...array2);
  return array1;
};
/**
 * Strips tags from content, allowing only the specified tags (array overload).
 * @param {string} content - The HTML content.
 * @param {string[]} allowedTags - Array of allowed tag names.
 * @returns {string} The cleaned HTML string.
 * @see __tests__/playwright/dom.spec.js
 */
dom.stripTags = (content, allowedTags) => {
  if (typeof allowedTags === "string") {
    const c = jQuery("<div>" + content + "</div>");
    c.find("*").not(allowedTags).remove();
    return c.html();
  } else {
    let match;
    const re =
      /<\/?(\w+)((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?/gim;
    let resCont = content;
    while ((match = re.exec(content)) != null) {
      if (!dom.isset(allowedTags) || !allowedTags.includes(match[1])) {
        resCont = resCont.replace(match[0], "");
      }
    }
    return resCont;
  }
};
/**
 * Detects the browser type and version.
 * @returns {{type: string, version: string}}
 */
dom.browser = () => {
  const userAgent = navigator.userAgent;
  const result = {};
  let match;
  if ((match = userAgent.match(/(firefox)\/([\d.]+)/i))) {
    result.type = "mozilla";
    result.version = match[2];
  } else if (
    (match = userAgent.match(/(msie) ([\d.]+)/i)) ||
    (match = userAgent.match(/trident.*rv:([\d.]+)/i))
  ) {
    result.type = "msie";
    result.version = match[2] || match[1];
  } else if ((match = userAgent.match(/(opera|opr)\/([\d.]+)/i))) {
    result.type = "opera";
    result.version = match[2];
  } else if ((match = userAgent.match(/(chrome)\/([\d.]+)/i))) {
    result.type = "webkit";
    result.version = match[2];
  } else if ((match = userAgent.match(/(safari)\/([\d.]+)/i))) {
    result.type = "webkit";
    result.version = match[2];
  } else {
    result.type = "other";
    result.version = "0";
  }
  return result;
};
/**
 * Checks if the browser is of the specified type.
 * @param {string} browser
 * @returns {boolean}
 */
dom.isBrowser = (browser) => dom.browser().type === browser;
/**
 * Returns the block parent of a node.
 * @param {Node} node
 * @param {Node} container
 * @returns {Node|null}
 */
dom.getBlockParent = (node, container) => {
  if (dom.isBlockElement(node)) return node;
  if (node) {
    while (node.parentNode) {
      node = node.parentNode;
      if (node === container) return null;
      if (dom.isBlockElement(node)) return node;
    }
  }
  return null;
};
/**
 * Checks if the left and right containers are on the same block boundary.
 * @param {Element} leftContainer
 * @param {Element} rightContainer
 * @param {string[]} blockEls
 * @returns {boolean}
 */
dom.onBlockBoundary = (leftContainer, rightContainer, blockEls) => {
  if (!leftContainer || !rightContainer) return false;
  const bleft =
    dom.isChildOfTagNames(leftContainer, blockEls) ||
    (dom.is(leftContainer, blockEls.join(", ")) && leftContainer) ||
    null;
  const bright =
    dom.isChildOfTagNames(rightContainer, blockEls) ||
    (dom.is(rightContainer, blockEls.join(", ")) && rightContainer) ||
    null;
  return bleft !== bright;
};
/**
 * Checks if the left and right containers are on the same block boundary within the specified container.
 * @param {Element} leftContainer
 * @param {Element} rightContainer
 * @param {Element} container
 * @returns {boolean}
 */
dom.isOnBlockBoundary = (leftContainer, rightContainer, container) => {
  if (!leftContainer || !rightContainer) return false;
  const bleft =
    dom.getBlockParent(leftContainer, container) ||
    (dom.isBlockElement(leftContainer, container) && leftContainer) ||
    null;
  const bright =
    dom.getBlockParent(rightContainer, container) ||
    (dom.isBlockElement(rightContainer, container) && rightContainer) ||
    null;
  return bleft !== bright;
};
/**
 * Merges the node into the mergeToNode.
 * @param {Node} node
 * @param {Node} mergeToNode
 * @returns {boolean}
 */
dom.mergeContainers = (node, mergeToNode) => {
  if (!node || !mergeToNode) return false;
  if (node.nodeType === dom.TEXT_NODE || dom.isStubElement(node)) {
    mergeToNode.appendChild(node);
  } else if (node.nodeType === dom.ELEMENT_NODE) {
    while (node.firstChild) {
      mergeToNode.appendChild(node.firstChild);
    }
    dom.remove(node);
  }
  return true;
};
/**
 * Merges a block element with its sibling.
 * @param {Range} range
 * @param {Element} block
 * @param {boolean} next
 * @returns {boolean}
 */
dom.mergeBlockWithSibling = (range, block, next) => {
  const siblingBlock = next
    ? jQuery(block).next().get(0)
    : jQuery(block).prev().get(0);
  if (next) dom.mergeContainers(siblingBlock, block);
  else dom.mergeContainers(block, siblingBlock);
  range.collapse(true);
  return true;
};
/**
 * Formats a timestamp or ISO 8601 string into a human-readable date string.
 * @param {string} format - The date format string.
 * @param {number} timestamp - The timestamp in ms.
 * @param {string} tsIso8601 - ISO 8601 string (optional).
 * @returns {string|undefined} The formatted date string.
 * @see __tests__/playwright/dom.spec.js
 */
dom.date = (format, timestamp, tsIso8601) => {
  if (timestamp === null && tsIso8601) {
    timestamp = dom.tsIso8601ToTimestamp(tsIso8601);
    if (!timestamp) return;
  }
  if (typeof timestamp !== "number") return;
  const date = new Date(timestamp);
  return format
    .replace(/Y/g, date.getFullYear())
    .replace(/m/g, String(date.getMonth() + 1).padStart(2, "0"))
    .replace(/d/g, String(date.getDate()).padStart(2, "0"))
    .replace(/H/g, String(date.getHours()).padStart(2, "0"))
    .replace(/i/g, String(date.getMinutes()).padStart(2, "0"))
    .replace(/s/g, String(date.getSeconds()).padStart(2, "0"));
};
/**
 * Converts an ISO 8601 timestamp string to a Unix timestamp (ms since epoch).
 * @param {string} tsIso8601 - The ISO 8601 string.
 * @returns {number|null} The timestamp or null if invalid.
 * @see __tests__/playwright/dom.spec.js
 */
dom.tsIso8601ToTimestamp = (tsIso8601) => {
  const d = Date.parse(tsIso8601);
  return isNaN(d) ? null : d;
};

/**
 * Exports the dom object for CommonJS and attaches it to the global ice object in browsers.
 * @module dom
 */
if (typeof module !== "undefined" && module.exports) {
  module.exports = dom;
}
/**
 * Attaches dom utilities to the global ice object in browsers.
 * @global
 */
if (typeof window !== "undefined") {
  window.ice = window.ice || {};
  window.ice.dom = dom;
}
