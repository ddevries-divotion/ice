// dom.js - DOM utilities for ice.js
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

const dom = {};

dom.DOM_VK_DELETE = 8;
dom.DOM_VK_LEFT = 37;
dom.DOM_VK_UP = 38;
dom.DOM_VK_RIGHT = 39;
dom.DOM_VK_DOWN = 40;
dom.DOM_VK_ENTER = 13;
dom.ELEMENT_NODE = 1;
dom.ATTRIBUTE_NODE = 2;
dom.TEXT_NODE = 3;
dom.CDATA_SECTION_NODE = 4;
dom.ENTITY_REFERENCE_NODE = 5;
dom.ENTITY_NODE = 6;
dom.PROCESSING_INSTRUCTION_NODE = 7;
dom.COMMENT_NODE = 8;
dom.DOCUMENT_NODE = 9;
dom.DOCUMENT_TYPE_NODE = 10;
dom.DOCUMENT_FRAGMENT_NODE = 11;
dom.NOTATION_NODE = 12;
dom.CHARACTER_UNIT = 'character';
dom.WORD_UNIT = 'word';
dom.BREAK_ELEMENT = 'br';
dom.CONTENT_STUB_ELEMENTS = ['img', 'hr', 'iframe', 'param', 'link', 'meta', 'input', 'frame', 'col', 'base', 'area'];
dom.BLOCK_ELEMENTS = ['p', 'div', 'pre', 'ul', 'ol', 'li', 'table', 'tbody', 'td', 'th', 'fieldset', 'form', 'blockquote', 'dl', 'dt', 'dd', 'dir', 'center', 'address', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
dom.TEXT_CONTAINER_ELEMENTS = ['p', 'div', 'pre', 'li', 'td', 'th', 'blockquote', 'dt', 'dd', 'center', 'address', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

dom.STUB_ELEMENTS = dom.CONTENT_STUB_ELEMENTS.slice();
dom.STUB_ELEMENTS.push(dom.BREAK_ELEMENT);

dom.getKeyChar = e => String.fromCharCode(e.which);
dom.getClass = (className, startElement = document.body, tagName) => {
    className = '.' + className.split(' ').join('.');
    if (tagName) {
        className = tagName + className;
    }
    return jQuery.makeArray(jQuery(startElement).find(className));
};
dom.getId = (id, startElement = document) => {
    return startElement.getElementById(id);
};
dom.getTag = (tagName, startElement = document) => jQuery.makeArray(jQuery(startElement).find(tagName));
dom.getElementWidth = element => element.offsetWidth;
dom.getElementHeight = element => element.offsetHeight;
dom.getElementDimensions = element => ({
    width: dom.getElementWidth(element),
    height: dom.getElementHeight(element)
});
dom.trim = string => jQuery.trim(string);
dom.empty = element => element ? jQuery(element).empty() : undefined;
dom.remove = element => element ? jQuery(element).remove() : undefined;
dom.prepend = (parent, elem) => jQuery(parent).prepend(elem);
dom.append = (parent, elem) => jQuery(parent).append(elem);
dom.insertBefore = (before, elem) => jQuery(before).before(elem);
dom.insertAfter = (after, elem) => jQuery(after).after(elem);
dom.getHtml = element => jQuery(element).html();
dom.setHtml = (element, content) => { if (element) jQuery(element).html(content); };
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
dom.contents = el => jQuery.makeArray(jQuery(el).contents());
dom.extractContent = el => {
    const frag = document.createDocumentFragment();
    let child;
    while ((child = el.firstChild)) {
        frag.appendChild(child);
    }
    return frag;
};
dom.getNode = (node, selector) => dom.is(node, selector) ? node : dom.parents(node, selector)[0] || null;
dom.getParents = (elements, filter, stopEl) => {
    const res = jQuery(elements).parents(filter);
    const ar = [];
    for (let i = 0; i < res.length; i++) {
        if (res[i] === stopEl) break;
        ar.push(res[i]);
    }
    return ar;
};
dom.hasBlockChildren = parent => {
    for (let i = 0; i < parent.childNodes.length; i++) {
        if (parent.childNodes[i].nodeType === dom.ELEMENT_NODE && dom.isBlockElement(parent.childNodes[i])) {
            return true;
        }
    }
    return false;
};
dom.removeTag = (element, selector) => {
    jQuery(element).find(selector).replaceWith(function () {
        return jQuery(this).contents();
    });
    return element;
};
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
dom.getNodeTextContent = node => jQuery(node).text();
dom.getNodeStubContent = node => jQuery(node).find(dom.CONTENT_STUB_ELEMENTS.join(', '));
dom.hasNoTextOrStubContent = node => {
    if (dom.getNodeTextContent(node).length > 0) return false;
    if (jQuery(node).find(dom.CONTENT_STUB_ELEMENTS.join(', ')).length > 0) return false;
    return true;
};
dom.getNodeCharacterLength = node => dom.getNodeTextContent(node).length + jQuery(node).find(dom.STUB_ELEMENTS.join(', ')).length;
dom.setNodeTextContent = (node, txt) => jQuery(node).text(txt);
dom.getTagName = node => node.tagName && node.tagName.toLowerCase() || null;
dom.getIframeDocument = iframe => {
    if (iframe.contentDocument) return iframe.contentDocument;
    if (iframe.contentWindow) return iframe.contentWindow.document;
    if (iframe.document) return iframe.document;
    return null;
};
dom.isBlockElement = element => dom.BLOCK_ELEMENTS.lastIndexOf(element.nodeName.toLowerCase()) !== -1;
dom.isStubElement = element => dom.STUB_ELEMENTS.lastIndexOf(element.nodeName.toLowerCase()) !== -1;
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
dom.isChildOf = (el, parent) => {
    try {
        while (el && el.parentNode) {
            if (el.parentNode === parent) return true;
            el = el.parentNode;
        }
    } catch (e) { }
    return false;
};
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
dom.isChildOfClassName = (el, name) => {
    try {
        while (el && el.parentNode) {
            if (jQuery(el.parentNode).hasClass(name)) return el.parentNode;
            el = el.parentNode;
        }
    } catch (e) { }
    return null;
};
dom.cloneNode = (elems, cloneEvents = true) => jQuery(elems).clone(cloneEvents);
dom.bind = (element, event, callback) => jQuery(element).bind(event, callback);
dom.unbind = (element, event, callback) => jQuery(element).unbind(event, callback);
dom.attr = (elements, key, val) => val ? jQuery(elements).attr(key, val) : jQuery(elements).attr(key);
dom.replaceWith = (node, replacement) => jQuery(node).replaceWith(replacement);
dom.removeAttr = (elements, name) => jQuery(elements).removeAttr(name);
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
dom.getCommonAncestor = (a, b) => {
    let node = a;
    while (node) {
        if (dom.isChildOf(b, node)) return node;
        node = node.parentNode;
    }
    return null;
};
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
dom.canContainTextElement = element => element && element.nodeName ? dom.TEXT_CONTAINER_ELEMENTS.lastIndexOf(element.nodeName.toLowerCase()) !== -1 : false;
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
dom.create = html => jQuery(html)[0];
dom.find = (parent, exp) => jQuery(parent).find(exp);
dom.children = (parent, exp) => jQuery(parent).children(exp);
dom.parent = (child, exp) => jQuery(child).parent(exp)[0];
dom.parents = (child, exp) => jQuery(child).parents(exp);
dom.is = (node, exp) => jQuery(node).is(exp);
dom.extend = (...args) => jQuery.extend.apply(this, args);
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
dom.setStyle = (element, property, value) => { if (element) jQuery(element).css(property, value); };
dom.getStyle = (element, property) => jQuery(element).css(property);
dom.hasClass = (element, className) => jQuery(element).hasClass(className);
dom.addClass = (element, classNames) => jQuery(element).addClass(classNames);
dom.removeClass = (element, classNames) => jQuery(element).removeClass(classNames);
dom.preventDefault = e => { e.preventDefault(); dom.stopPropagation(e); };
dom.stopPropagation = e => { e.stopPropagation(); };
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
dom.each = (val, callback) => {
    jQuery.each(val, function (i, el) {
        callback.call(this, i, el);
    });
};
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
dom.isBlank = value => !value || /^\s*$/.test(value);
dom.isFn = f => typeof f === 'function';
dom.isObj = v => v !== null && typeof v === 'object';
dom.isset = v => typeof v !== 'undefined' && v !== null;
dom.isArray = v => jQuery.isArray(v);
dom.isNumeric = str => /^\d+$/.test(str);
dom.getUniqueId = () => {
    const timestamp = (new Date()).getTime();
    const random = Math.ceil(Math.random() * 1000000);
    const id = timestamp + '' + random;
    return id.substr(5, 18).replace(/,/, '');
};
dom.inArray = (needle, haystack) => {
    for (let i = 0; i < haystack.length; i++) {
        if (needle === haystack[i]) return true;
    }
    return false;
};
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
dom.arrayMerge = (array1, array2) => {
    for (let i = 0; i < array2.length; i++) {
        array1.push(array2[i]);
    }
    return array1;
};
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
dom.getWebkitType = () => {
    if (dom.browser().type !== 'webkit') {
        console.log('Not a webkit!');
        return false;
    }
    const isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    if (isSafari) return 'safari';
    return 'chrome';
};
dom.isBrowser = browser => dom.browser().type === browser;
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
dom.onBlockBoundary = (leftContainer, rightContainer, blockEls) => {
    if (!leftContainer || !rightContainer) return false;
    const bleft = dom.isChildOfTagNames(leftContainer, blockEls) || (dom.is(leftContainer, blockEls.join(', ')) && leftContainer) || null;
    const bright = dom.isChildOfTagNames(rightContainer, blockEls) || (dom.is(rightContainer, blockEls.join(', ')) && rightContainer) || null;
    return bleft !== bright;
};
dom.isOnBlockBoundary = (leftContainer, rightContainer, container) => {
    if (!leftContainer || !rightContainer) return false;
    const bleft = dom.getBlockParent(leftContainer, container) || (dom.isBlockElement(leftContainer, container) && leftContainer) || null;
    const bright = dom.getBlockParent(rightContainer, container) || (dom.isBlockElement(rightContainer, container) && rightContainer) || null;
    return bleft !== bright;
};
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
dom.mergeBlockWithSibling = (range, block, next) => {
    const siblingBlock = next ? jQuery(block).next().get(0) : jQuery(block).prev().get(0);
    if (next) dom.mergeContainers(siblingBlock, block);
    else dom.mergeContainers(block, siblingBlock);
    range.collapse(true);
    return true;
};
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
dom.addNumberPadding = number => number < 10 ? '0' + number : number;
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

// Export for CommonJS and global ice object
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dom;
}
if (typeof window !== 'undefined') {
    window.ice = window.ice || {};
    window.ice.dom = dom;
}
