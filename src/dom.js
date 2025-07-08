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
dom.CHARACTER_UNIT = 'character';
/** @constant {string} */
dom.WORD_UNIT = 'word';
/** @constant {string} */
dom.BREAK_ELEMENT = 'br';
/** @constant {string[]} */
dom.CONTENT_STUB_ELEMENTS = ['img', 'hr', 'iframe', 'param', 'link', 'meta', 'input', 'frame', 'col', 'base', 'area'];
/** @constant {string[]} */
dom.BLOCK_ELEMENTS = ['p', 'div', 'pre', 'ul', 'ol', 'li', 'table', 'tbody', 'td', 'th', 'fieldset', 'form', 'blockquote', 'dl', 'dt', 'dd', 'dir', 'center', 'address', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
/** @constant {string[]} */
dom.TEXT_CONTAINER_ELEMENTS = ['p', 'div', 'pre', 'li', 'td', 'th', 'blockquote', 'dt', 'dd', 'center', 'address', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/**
 * @constant {string[]}
 * @description All stub elements including break element.
 */
dom.STUB_ELEMENTS = dom.CONTENT_STUB_ELEMENTS.slice();
dom.STUB_ELEMENTS.push(dom.BREAK_ELEMENT);

/**
 * Returns the character for a key event.
 * @param {KeyboardEvent} e
 * @returns {string}
 */
dom.getKeyChar = e => String.fromCharCode(e.which);
/**
 * Returns elements with the given class name.
 * @param {string} className
 * @param {Element} [startElement=document.body]
 * @param {string} [tagName]
 * @returns {Element[]}
 */
dom.getClass = (className, startElement = document.body, tagName) => {
    className = '.' + className.split(' ').join('.');
    if (tagName) {
        className = tagName + className;
    }
    return jQuery.makeArray(jQuery(startElement).find(className));
};
/**
 * Returns the element with the given id.
 * @param {string} id
 * @param {Document|Element} [startElement=document]
 * @returns {Element|null}
 */
dom.getId = (id, startElement = document) => {
    return startElement.getElementById(id);
};
/**
 * Returns elements with the given tag name.
 * @param {string} tagName
 * @param {Element} [startElement=document]
 * @returns {Element[]}
 */
dom.getTag = (tagName, startElement = document) => jQuery.makeArray(jQuery(startElement).find(tagName));
/**
 * Returns the width of an element.
 * @param {Element} element
 * @returns {number}
 */
dom.getElementWidth = element => element.offsetWidth;
/**
 * Returns the height of an element.
 * @param {Element} element
 * @returns {number}
 */
dom.getElementHeight = element => element.offsetHeight;
/**
 * Returns the dimensions of an element.
 * @param {Element} element
 * @returns {{width: number, height: number}}
 */
dom.getElementDimensions = element => ({
    width: dom.getElementWidth(element),
    height: dom.getElementHeight(element)
});
/**
 * Trims whitespace from a string.
 * @param {string} string
 * @returns {string}
 */
dom.trim = string => jQuery.trim(string);
/**
 * Removes all children from an element.
 * @param {Element} element
 * @returns {jQuery|undefined}
 */
dom.empty = element => element ? jQuery(element).empty() : undefined;
/**
 * Removes the element from the DOM.
 * @param {Element} element
 * @returns {jQuery|undefined}
 */
dom.remove = element => element ? jQuery(element).remove() : undefined;
/**
 * Prepends an element as the first child.
 * @param {Element} parent
 * @param {Element} elem
 */
dom.prepend = (parent, elem) => jQuery(parent).prepend(elem);
/**
 * Appends an element as the last child.
 * @param {Element} parent
 * @param {Element} elem
 */
dom.append = (parent, elem) => jQuery(parent).append(elem);
/**
 * Inserts an element before the reference node.
 * @param {Element} before
 * @param {Element} elem
 */
dom.insertBefore = (before, elem) => jQuery(before).before(elem);
/**
 * Inserts an element after the reference node.
 * @param {Element} after
 * @param {Element} elem
 */
dom.insertAfter = (after, elem) => jQuery(after).after(elem);
/**
 * Returns the inner HTML of an element.
 * @param {Element} element
 * @returns {string}
 */
dom.getHtml = element => jQuery(element).html();
/**
 * Sets the inner HTML of an element.
 * @param {Element} element
 * @param {string} content
 */
dom.setHtml = (element, content) => { if (element) jQuery(element).html(content); };
/**
 * Removes whitespace and newlines between nested block elements.
 * @param {Element} element
 */
dom.removeWhitespace = element => {
    jQuery(element).contents().filter(function () {
        if (this.nodeType !== dom.TEXT_NODE && (this.nodeName === 'UL' || this.nodeName === 'OL')) {
            dom.removeWhitespace(this);
            return false;
        } else if (this.nodeType !== dom.TEXT_NODE) {
            return false;
        } else {
            return !/\S/.test(this.nodeValue);
        }
    }).remove();
};
/**
 * Returns the child nodes as an array.
 * @param {Element} el
 * @returns {Node[]}
 */
dom.contents = el => jQuery.makeArray(jQuery(el).contents());
/**
 * Returns the inner contents of el as a DocumentFragment.
 * @param {Element} el
 * @returns {DocumentFragment}
 */
dom.extractContent = el => {
    const frag = document.createDocumentFragment();
    let child;
    while ((child = el.firstChild)) {
        frag.appendChild(child);
    }
    return frag;
};
/**
 * Returns the closest ancestor of the given node that matches the selector.
 * @param {Node} node
 * @param {string} selector
 * @returns {Node|null}
 */
dom.getNode = (node, selector) => dom.is(node, selector) ? node : dom.parents(node, selector)[0] || null;
/**
 * Returns the parents of the given elements up to the stop element, filtered by the given selector.
 * @param {Element|Element[]} elements
 * @param {string} filter
 * @param {Element} stopEl
 * @returns {Element[]}
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
 * @param {Element} parent
 * @returns {boolean}
 */
dom.hasBlockChildren = parent => {
    for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i].nodeType === dom.ELEMENT_NODE && dom.isBlockElement(parent.childNodes[i])) {
            return true;
        }
    }
    return false;
};
/**
 * Removes the specified tag from the element, replacing it with its children.
 * @param {Element} element
 * @param {string} selector
 * @returns {Element}
 */
dom.removeTag = (element, selector) => {
    jQuery(element).find(selector).replaceWith(function () {
        return jQuery(this).contents();
    });
    return element;
};
/**
 * Strips enclosing tags from the content, allowing only the specified tags.
 * @param {Element} content
 * @param {string[]} allowedTags
 * @returns {Element}
 */
dom.stripEnclosingTags = (content, allowedTags) => {
    const c = jQuery(content);
    c.find('*').not(allowedTags).replaceWith(function () {
        let ret = jQuery();
        let $this;
        try {
            $this = jQuery(this);
            ret = $this.contents();
        } catch (e) { }
        if (ret.length === 0) {
            $this.remove();
        }
        return ret;
    });
    return c[0];
};
/**
 * Returns the siblings of an element in the specified direction.
 * @param {Element} element
 * @param {'prev'|'next'} dir
 * @param {boolean} elementNodesOnly
 * @param {Element} stopElem
 * @returns {Element[]}
 */
dom.getSiblings = (element, dir, elementNodesOnly, stopElem) => {
    if (elementNodesOnly === true) {
        return dir === 'prev' ? jQuery(element).prevAll() : jQuery(element).nextAll();
    } else {
        const elems = [];
        if (dir === 'prev') {
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
 * @param {Node} node
 * @returns {string}
 */
dom.getNodeTextContent = node => jQuery(node).text();
/**
 * Returns the stub content of a node.
 * @param {Node} node
 * @returns {jQuery}
 */
dom.getNodeStubContent = node => jQuery(node).find(dom.CONTENT_STUB_ELEMENTS.join(', '));
/**
 * Checks if a node has no text or stub content.
 * @param {Node} node
 * @returns {boolean}
 */
dom.hasNoTextOrStubContent = node => {
    if (dom.getNodeTextContent(node).length > 0) return false;
    if (jQuery(node).find(dom.CONTENT_STUB_ELEMENTS.join(', ')).length > 0) return false;
    return true;
};
/**
 * Returns the character length of a node, including stub elements.
 * @param {Node} node
 * @returns {number}
 */
dom.getNodeCharacterLength = node => dom.getNodeTextContent(node).length + jQuery(node).find(dom.STUB_ELEMENTS.join(', ')).length;
/**
 * Sets the text content of a node.
 * @param {Node} node
 * @param {string} txt
 */
dom.setNodeTextContent = (node, txt) => jQuery(node).text(txt);
/**
 * Returns the tag name of a node.
 * @param {Node} node
 * @returns {string|null}
 */
dom.getTagName = node => node.tagName && node.tagName.toLowerCase() || null;
/**
 * Returns the document of an iframe.
 * @param {HTMLIFrameElement} iframe
 * @returns {Document|null}
 */
dom.getIframeDocument = iframe => {
    if (iframe.contentDocument) return iframe.contentDocument;
    if (iframe.contentWindow) return iframe.contentWindow.document;
    if (iframe.document) return iframe.document;
    return null;
};
/**
 * Checks if an element is a block element.
 * @param {Element} element
 * @returns {boolean}
 */
dom.isBlockElement = element => dom.BLOCK_ELEMENTS.lastIndexOf(element.nodeName.toLowerCase()) !== -1;
/**
 * Checks if an element is a stub element.
 * @param {Element} element
 * @returns {boolean}
 */
dom.isStubElement = element => dom.STUB_ELEMENTS.lastIndexOf(element.nodeName.toLowerCase()) !== -1;
/**
 * Removes <br> elements from the children of a node.
 * @param {Node} node
 */
dom.removeBRFromChild = node => {
    if (node && node.hasChildNodes()) {
        for (let z = 0; z < node.childNodes.length; z++) {
            const child = node.childNodes[z];
            if (child && (dom.BREAK_ELEMENT === dom.getTagName(child))) {
                child.parentNode.removeChild(child);
            }
        }
    }
};
/**
 * Checks if an element is a child of the specified parent.
 * @param {Element} el
 * @param {Element} parent
 * @returns {boolean}
 */
dom.isChildOf = (el, parent) => {
    try {
        while (el && el.parentNode) {
            if (el.parentNode === parent) return true;
            el = el.parentNode;
        }
    } catch (e) { }
    return false;
};
/**
 * Checks if an element is a child of a parent with the specified tag name.
 * @param {Element} el
 * @param {string} name
 * @returns {Element|boolean}
 */
dom.isChildOfTagName = (el, name) => {
    try {
        while (el && el.parentNode) {
            if (el.parentNode && el.parentNode.tagName && el.parentNode.tagName.toLowerCase() === name) {
                return el.parentNode;
            }
            el = el.parentNode;
        }
    } catch (e) { }
    return false;
};
/**
 * Checks if an element is a child of a parent with one of the specified tag names.
 * @param {Element} el
 * @param {string[]} names
 * @returns {Element|null}
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
    } catch (e) { }
    return null;
};
/**
 * Checks if an element is a child of a parent with the specified class name.
 * @param {Element} el
 * @param {string} name
 * @returns {Element|null}
 */
dom.isChildOfClassName = (el, name) => {
    try {
        while (el && el.parentNode) {
            if (jQuery(el.parentNode).hasClass(name)) return el.parentNode;
            el = el.parentNode;
        }
    } catch (e) { }
    return null;
};
/**
 * Clones the given elements.
 * @param {Element|Element[]} elems
 * @param {boolean} [cloneEvents=true]
 * @returns {Element|Element[]}
 */
dom.cloneNode = (elems, cloneEvents = true) => jQuery(elems).clone(cloneEvents);
/**
 * Binds an event handler to an element.
 * @param {Element} element
 * @param {string} event
 * @param {Function} callback
 */
dom.bind = (element, event, callback) => jQuery(element).bind(event, callback);
/**
 * Unbinds an event handler from an element.
 * @param {Element} element
 * @param {string} event
 * @param {Function} callback
 */
dom.unbind = (element, event, callback) => jQuery(element).unbind(event, callback);
/**
 * Gets or sets an attribute value for the given elements.
 * @param {Element|Element[]} elements
 * @param {string} key
 * @param {string} [val]
 * @returns {string|undefined}
 */
dom.attr = (elements, key, val) => val ? jQuery(elements).attr(key, val) : jQuery(elements).attr(key);
/**
 * Replaces a node with the given replacement.
 * @param {Node} node
 * @param {Node|string|Function} replacement
 */
dom.replaceWith = (node, replacement) => jQuery(node).replaceWith(replacement);
/**
 * Removes an attribute from the given elements.
 * @param {Element|Element[]} elements
 * @param {string} name
 */
dom.removeAttr = (elements, name) => jQuery(elements).removeAttr(name);
/**
 * Returns the elements between two elements.
 * @param {Element} fromElem
 * @param {Element} toElem
 * @returns {Element[]}
 */
dom.getElementsBetween = (fromElem, toElem) => {
    let elements = [];
    if (fromElem === toElem) return elements;
    if (dom.isChildOf(toElem, fromElem)) {
        for (let i = 0; i < fromElem.childNodes.length; i++) {
            if (fromElem.childNodes[i] === toElem) break;
            else if (dom.isChildOf(toElem, fromElem.childNodes[i])) {
                return dom.arrayMerge(elements, dom.getElementsBetween(fromElem.childNodes[i], toElem));
            } else {
                elements.push(fromElem.childNodes[i]);
            }
        }
        return elements;
    }
    let startEl = fromElem.nextSibling;
    while (startEl) {
        if (dom.isChildOf(toElem, startEl)) {
            elements = dom.arrayMerge(elements, dom.getElementsBetween(startEl, toElem));
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
    for (let j = 0; j < (parentElems.length - 1); j++) {
        elements = dom.arrayMerge(elements, dom.getSiblings(parentElems[j], 'next'));
    }
    const lastParent = parentElems[parentElems.length - 1];
    elements = dom.arrayMerge(elements, dom.getElementsBetween(lastParent, toElem));
    return elements;
};
/**
 * Returns the closest common ancestor of two nodes.
 * @param {Node} a
 * @param {Node} b
 * @returns {Node|null}
 */
dom.getCommonAncestor = (a, b) => {
    let node = a;
    while (node) {
        if (dom.isChildOf(b, node)) return node;
        node = node.parentNode;
    }
    return null;
};
/**
 * Returns the next node in the container.
 * @param {Node} node
 * @param {Node} container
 * @returns {Node|null}
 */
dom.getNextNode = (node, container) => {
    if (node) {
        while (node.parentNode) {
            if (node === container) return null;
            if (node.nextSibling) {
                if (node.nextSibling.nodeType === dom.TEXT_NODE && node.nextSibling.length === 0) {
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
 * @param {Node} node
 * @param {Node} container
 * @returns {Node|null}
 */
dom.getNextContentNode = (node, container) => {
    if (node) {
        while (node.parentNode) {
            if (node === container) return null;
            if (node.nextSibling && dom.canContainTextElement(dom.getBlockParent(node))) {
                if (node.nextSibling.nodeType === dom.TEXT_NODE && node.nextSibling.length === 0) {
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
 * Returns the previous node in the container.
 * @param {Node} node
 * @param {Node} container
 * @returns {Node|null}
 */
dom.getPrevNode = (node, container) => {
    if (node) {
        while (node.parentNode) {
            if (node === container) return null;
            if (node.previousSibling) {
                if (node.previousSibling.nodeType === dom.TEXT_NODE && node.previousSibling.length === 0) {
                    node = node.previousSibling;
                    continue;
                }
                return dom.getLastChild(node.previousSibling);
            }
            node = node.parentNode;
        }
    }
    return null;
};
/**
 * Returns the previous content node in the container.
 * @param {Node} node
 * @param {Node} container
 * @returns {Node|null}
 */
dom.getPrevContentNode = (node, container) => {
    if (node) {
        while (node.parentNode) {
            if (node === container) return null;
            if (node.previousSibling && dom.canContainTextElement(dom.getBlockParent(node))) {
                if (node.previousSibling.nodeType === dom.TEXT_NODE && node.previousSibling.length === 0) {
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
 * Checks if an element can contain a text element.
 * @param {Element} element
 * @returns {boolean}
 */
dom.canContainTextElement = element => element && element.nodeName ? dom.TEXT_CONTAINER_ELEMENTS.lastIndexOf(element.nodeName.toLowerCase()) !== -1 : false;
/**
 * Returns the first child node that is not an element.
 * @param {Node} node
 * @returns {Node}
 */
dom.getFirstChild = node => {
    if (node.firstChild) {
        if (node.firstChild.nodeType === dom.ELEMENT_NODE) {
            return dom.getFirstChild(node.firstChild);
        } else {
            return node.firstChild;
        }
    }
    return node;
};
/**
 * Returns the last child node that is not an element.
 * @param {Node} node
 * @returns {Node}
 */
dom.getLastChild = node => {
    if (node.lastChild) {
        if (node.lastChild.nodeType === dom.ELEMENT_NODE) {
            return dom.getLastChild(node.lastChild);
        } else {
            return node.lastChild;
        }
    }
    return node;
};
/**
 * Removes empty nodes from the DOM.
 * @param {Element} parent
 * @param {Function} [callback]
 */
dom.removeEmptyNodes = (parent, callback) => {
    let elems = jQuery(parent).find(':empty');
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
 * Creates a DOM element from the given HTML.
 * @param {string} html
 * @returns {Element}
 */
dom.create = html => jQuery(html)[0];
/**
 * Finds elements within the parent element that match the selector.
 * @param {Element} parent
 * @param {string} exp
 * @returns {Element[]}
 */
dom.find = (parent, exp) => jQuery(parent).find(exp);
/**
 * Gets the children of the parent element that match the selector.
 * @param {Element} parent
 * @param {string} exp
 * @returns {Element[]}
 */
dom.children = (parent, exp) => jQuery(parent).children(exp);
/**
 * Returns the parent of the child element that matches the selector.
 * @param {Element} child
 * @param {string} exp
 * @returns {Element}
 */
dom.parent = (child, exp) => jQuery(child).parent(exp)[0];
/**
 * Returns the ancestors of the child element that match the selector.
 * @param {Element} child
 * @param {string} exp
 * @returns {Element[]}
 */
dom.parents = (child, exp) => jQuery(child).parents(exp);
/**
 * Checks if a node matches the selector.
 * @param {Node} node
 * @param {string} exp
 * @returns {boolean}
 */
dom.is = (node, exp) => jQuery(node).is(exp);
/**
 * Extends an object with properties from other objects.
 * @param {...Object} args
 * @returns {Object}
 */
dom.extend = (...args) => jQuery.extend.apply(this, args);
/**
 * Walks the DOM tree and applies the callback function to each element.
 * @param {Node} elem
 * @param {Function} callback
 * @param {number} [lvl=0]
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
 * Walks the DOM tree in reverse order and applies the callback function to each element.
 * @param {Node} elem
 * @param {Function} callback
 */
dom.revWalk = (elem, callback) => {
    if (!elem) return;
    const retVal = callback.call(this, elem);
    if (retVal === false) return;
    if (elem.childNodes && elem.childNodes.length > 0) {
        dom.walk(elem.lastChild, callback);
    } else if (elem.previousSibling) {
        dom.walk(elem.previousSibling, callback);
    } else if (elem.parentNode && elem.parentNode.previousSibling) {
        dom.walk(elem.parentNode.previousSibling, callback);
    }
};
/**
 * Sets a CSS property for an element.
 * @param {Element} element
 * @param {string} property
 * @param {string|number} value
 */
dom.setStyle = (element, property, value) => { if (element) jQuery(element).css(property, value); };
/**
 * Gets the value of a CSS property for an element.
 * @param {Element} element
 * @param {string} property
 * @returns {string}
 */
dom.getStyle = (element, property) => jQuery(element).css(property);
/**
 * Checks if an element has the specified class.
 * @param {Element} element
 * @param {string} className
 * @returns {boolean}
 */
dom.hasClass = (element, className) => jQuery(element).hasClass(className);
/**
 * Adds the specified class to an element.
 * @param {Element} element
 * @param {string} classNames
 */
dom.addClass = (element, classNames) => jQuery(element).addClass(classNames);
/**
 * Removes the specified class from an element.
 * @param {Element} element
 * @param {string} classNames
 */
dom.removeClass = (element, classNames) => jQuery(element).removeClass(classNames);
/**
 * Prevents the default action of an event.
 * @param {Event} e
 */
dom.preventDefault = e => { e.preventDefault(); dom.stopPropagation(e); };
/**
 * Stops the propagation of an event.
 * @param {Event} e
 */
dom.stopPropagation = e => { e.stopPropagation(); };
/**
 * Inherits the properties of the parent object, excluding inclusion in the prototype chain.
 * @param {Function|string} child
 * @param {Function|string} parent
 */
dom.noInclusionInherits = (child, parent) => {
    if (parent instanceof String || typeof parent === 'string') parent = window[parent];
    if (child instanceof String || typeof child === 'string') child = window[child];
    const above = function () { };
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
        child.prototype['super'] = new above();
    }
};
/**
 * Iterates over an array or object and applies the callback function to each item.
 * @param {Array|Object} val
 * @param {Function} callback
 */
dom.each = (val, callback) => {
    jQuery.each(val, function (i, el) {
        callback.call(this, i, el);
    });
};
/**
 * Iterates over an array-like or object-like value and applies the callback function to each item.
 * @param {Array|NodeList|Object} value
 * @param {Function} cb
 */
dom.foreach = (value, cb) => {
    if (Array.isArray(value) || value instanceof NodeList || (typeof value.length !== 'undefined' && typeof value.item !== 'undefined')) {
        for (let i = 0; i < value.length; i++) {
            const res = cb.call(this, i, value[i]);
            if (res === false) break;
        }
    } else {
        for (const id in value) {
            if (Object.prototype.hasOwnProperty.call(value, id)) {
                const res = cb.call(this, id);
                if (res === false) break;
            }
        }
    }
};
/**
 * Checks if a value is blank (null, undefined, or empty string).
 * @param {*} value
 * @returns {boolean}
 */
dom.isBlank = value => !value || /^\s*$/.test(value);
/**
 * Checks if a value is a function.
 * @param {*} f
 * @returns {boolean}
 */
dom.isFn = f => typeof f === 'function';
/**
 * Checks if a value is an object.
 * @param {*} v
 * @returns {boolean}
 */
dom.isObj = v => v !== null && typeof v === 'object';
/**
 * Checks if a value is set (not undefined or null).
 * @param {*} v
 * @returns {boolean}
 */
dom.isset = v => typeof v !== 'undefined' && v !== null;
/**
 * Checks if a value is an array.
 * @param {*} v
 * @returns {boolean}
 */
dom.isArray = v => jQuery.isArray(v);
/**
 * Checks if a string is numeric.
 * @param {string} str
 * @returns {boolean}
 */
dom.isNumeric = str => /^\d+$/.test(str);
/**
 * Generates a unique ID.
 * @returns {string}
 */
dom.getUniqueId = () => {
    const timestamp = (new Date()).getTime();
    const random = Math.ceil(Math.random() * 1000000);
    const id = timestamp + '' + random;
    return id.substr(5, 18).replace(/,/, '');
};
/**
 * Checks if a value is in an array.
 * @param {*} needle
 * @param {Array} haystack
 * @returns {boolean}
 */
dom.inArray = (needle, haystack) => {
    for (let i = 0; i < haystack.length; i++) {
        if (needle === haystack[i]) return true;
    }
    return false;
};
/**
 * Returns the difference between two arrays.
 * @param {Array} array1
 * @param {Array} array2
 * @param {boolean} firstOnly
 * @returns {Array}
 */
dom.arrayDiff = (array1, array2, firstOnly) => {
    let res = [];
    for (let i = 0; i < array1.length; i++) {
        if (!dom.inArray(array1[i], array2)) res.push(array1[i]);
    }
    if (!firstOnly) {
        for (let i = 0; i < array2.length; i++) {
            if (!dom.inArray(array2[i], array1)) res.push(array2[i]);
        }
    }
    return res;
};
/**
 * Merges two arrays into the first array.
 * @param {Array} array1
 * @param {Array} array2
 * @returns {Array}
 */
dom.arrayMerge = (array1, array2) => {
    for (let i = 0; i < array2.length; i++) {
        array1.push(array2[i]);
    }
    return array1;
};
/**
 * Strips tags from content, allowing only the specified tags.
 * @param {string} content
 * @param {string[]} allowedTags
 * @returns {string}
 */
dom.stripTags = (content, allowedTags) => {
    if (typeof allowedTags === 'string') {
        const c = jQuery('<div>' + content + '</div>');
        c.find('*').not(allowedTags).remove();
        return c.html();
    } else {
        let match;
        const re = /<\/?(\w+)((\s+\w+(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?/gim;
        let resCont = content;
        while ((match = re.exec(content)) != null) {
            if (!dom.isset(allowedTags) || !dom.inArray(match[1], allowedTags)) {
                resCont = resCont.replace(match[0], '');
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
        result.type = 'mozilla';
        result.version = match[2];
    } else if ((match = userAgent.match(/(msie) ([\d.]+)/i)) || (match = userAgent.match(/trident.*rv:([\d.]+)/i))) {
        result.type = 'msie';
        result.version = match[2] || match[1];
    } else if ((match = userAgent.match(/(opera|opr)\/([\d.]+)/i))) {
        result.type = 'opera';
        result.version = match[2];
    } else if ((match = userAgent.match(/(chrome)\/([\d.]+)/i))) {
        result.type = 'webkit';
        result.version = match[2];
    } else if ((match = userAgent.match(/(safari)\/([\d.]+)/i))) {
        result.type = 'webkit';
        result.version = match[2];
    } else {
        result.type = 'other';
        result.version = '0';
    }
    return result;
};
/**
 * Returns the browser type.
 * @returns {string}
 */
dom.getBrowserType = function () {
    if (this._browserType === null) {
        const tests = ['msie', 'firefox', 'chrome', 'safari'];
        for (let i = 0; i < tests.length; i++) {
            const r = new RegExp(tests[i], 'i');
            if (r.test(navigator.userAgent)) {
                this._browserType = tests[i];
                return this._browserType;
            }
        }
        this._browserType = 'other';
    }
    return this._browserType;
};
/**
 * Returns the webkit type ('safari' or 'chrome').
 * @returns {string|boolean}
 */
dom.getWebkitType = () => {
    if (dom.browser().type !== 'webkit') {
        console.log('Not a webkit!');
        return false;
    }
    const isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    if (isSafari) return 'safari';
    return 'chrome';
};
/**
 * Checks if the browser is of the specified type.
 * @param {string} browser
 * @returns {boolean}
 */
dom.isBrowser = browser => dom.browser().type === browser;
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
 * Finds a node parent that matches the selector.
 * @param {Node} node
 * @param {string} selector
 * @param {Node} container
 * @returns {Node|null}
 */
dom.findNodeParent = (node, selector, container) => {
    if (node) {
        while (node.parentNode) {
            if (node === container) return null;
            if (dom.is(node, selector)) return node;
            node = node.parentNode;
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
    const bleft = dom.isChildOfTagNames(leftContainer, blockEls) || (dom.is(leftContainer, blockEls.join(', ')) && leftContainer) || null;
    const bright = dom.isChildOfTagNames(rightContainer, blockEls) || (dom.is(rightContainer, blockEls.join(', ')) && rightContainer) || null;
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
    const bleft = dom.getBlockParent(leftContainer, container) || (dom.isBlockElement(leftContainer, container) && leftContainer) || null;
    const bright = dom.getBlockParent(rightContainer, container) || (dom.isBlockElement(rightContainer, container) && rightContainer) || null;
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
    const siblingBlock = next ? jQuery(block).next().get(0) : jQuery(block).prev().get(0);
    if (next) dom.mergeContainers(siblingBlock, block);
    else dom.mergeContainers(block, siblingBlock);
    range.collapse(true);
    return true;
};
/**
 * Formats a timestamp or ISO 8601 string into a human-readable date string.
 * @param {string} format
 * @param {number} timestamp
 * @param {string} tsIso8601
 * @returns {string|undefined}
 */
dom.date = (format, timestamp, tsIso8601) => {
    if (timestamp === null && tsIso8601) {
        timestamp = dom.tsIso8601ToTimestamp(tsIso8601);
        if (!timestamp) return;
    }
    const date = new Date(timestamp);
    const formats = format.split('');
    let dateStr = '';
    for (let i = 0; i < formats.length; i++) {
        let r = '';
        const f = formats[i];
        switch (f) {
            case 'D':
            case 'l': {
                const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                r = names[date.getDay()];
                if (f === 'D') r = r.substring(0, 3);
                break;
            }
            case 'F':
            case 'm': {
                r = date.getMonth() + 1;
                if (r < 10) r = '0' + r;
                break;
            }
            case 'M': {
                const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                r = months[date.getMonth()];
                if (f === 'M') r = r.substring(0, 3);
                break;
            }
            case 'd':
                r = date.getDate();
                break;
            case 'S':
                r = dom.getOrdinalSuffix(date.getDate());
                break;
            case 'Y':
                r = date.getFullYear();
                break;
            case 'y':
                r = date.getFullYear().toString().substring(2);
                break;
            case 'H':
                r = date.getHours();
                break;
            case 'h':
                r = date.getHours();
                if (r === 0) r = 12;
                else if (r > 12) r -= 12;
                break;
            case 'i':
                r = dom.addNumberPadding(date.getMinutes());
                break;
            case 'a':
                r = 'am';
                if (date.getHours() >= 12) r = 'pm';
                break;
            default:
                r = f;
                break;
        }
        dateStr += r;
    }
    return dateStr;
};
/**
 * Returns the ordinal suffix for a number (e.g., 'st', 'nd', 'rd', 'th').
 * @param {number} number
 * @returns {string}
 */
dom.getOrdinalSuffix = number => {
    const tmp = number % 100;
    if (tmp >= 4 && tmp <= 20) return 'th';
    switch (number % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
};
/**
 * Adds a leading zero to numbers less than 10.
 * @param {number} number
 * @returns {string|number}
 */
dom.addNumberPadding = number => number < 10 ? '0' + number : number;
/**
 * Converts an ISO 8601 timestamp string to a Unix timestamp (ms since epoch).
 * @param {string} tsIso8601
 * @returns {number|null}
 */
dom.tsIso8601ToTimestamp = tsIso8601 => {
    const regexp = /(\d\d\d\d)(?:-?(\d\d)(?:-?(\d\d)(?:[T ](\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(?:Z|(?:([-+])(\d\d)(?::?(\d\d))?)?)?)?)?)?/;
    const d = tsIso8601.match(new RegExp(regexp));
    if (d) {
        const date = new Date();
        date.setDate(d[3]);
        date.setFullYear(d[1]);
        date.setMonth(d[2] - 1);
        date.setHours(d[4]);
        date.setMinutes(d[5]);
        date.setSeconds(d[6]);
        let offset = (d[9] * 60);
        if (d[8] === '+') offset *= -1;
        offset -= date.getTimezoneOffset();
        const timestamp = (date.getTime() + (offset * 60 * 1000));
        return timestamp;
    }
    return null;
};

/**
 * Exports the dom object for CommonJS and attaches it to the global ice object in browsers.
 * @module dom
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dom;
}
/**
 * Attaches dom utilities to the global ice object in browsers.
 * @global
 */
if (typeof window !== 'undefined') {
    window.ice = window.ice || {};
    window.ice.dom = dom;
}
