// IceCopyPastePlugin.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class IceCopyPastePlugin
 * @description Handles copy, cut, and paste operations with ICE change tracking.
 * Uses native browser APIs and modern JavaScript patterns for improved performance and reliability.
 * @extends ice.IcePlugin
 */
class IceCopyPastePlugin extends ice.IcePlugin {
  /**
   * Initialize the copy/paste plugin
   * @param {Object} ice_instance - The ice instance providing change tracking functionality
   * @description Sets up the plugin with feature detection, configuration, and initializes
   * event listeners and tag preservation settings.
   */
  constructor(ice_instance) {
    super(ice_instance);

    /** @private {Object} The ICE instance for change tracking */
    this._ice = ice_instance;

    /** @private {Map<string, Function>} Event handlers for cleanup tracking */
    this._boundHandlers = new Map();

    /** @private {HTMLElement|null} Temporary marker for paste positioning */
    this._tempMarker = null;

    /** @private {boolean} Prevents concurrent paste operations */
    this._isProcessing = false;

    // Configuration
    /**
     * @type {string} Paste processing mode:
     * - 'formatted': MS Word cleaning only
     * - 'formattedClean': Full cleaning with tag preservation based on `preserve` setting
     */
    this.pasteType = "formattedClean";
    this.preventScrollOnFocus = false;
    /**
     * @type {boolean} Whether to prevent scroll when focusing elements during operations
     * @description Used for better UX during clipboard operations
     */
    this.preventScrollOnFocus = false;

    /**
     * @type {string} HTML tags and attributes to preserve during cleaning
     * @description Comma-separated list with attribute specifications:
     * - 'p,a[href],i[style|title],span[*]' preserves:
     *   - p: all attributes removed
     *   - a: only href attribute kept
     *   - i: style and title attributes kept
     *   - span: all attributes kept (*)
     * @default 'p'
     * @example 'p,strong,em,a[href],img[src|alt]'
     */
    this.preserve = "p";

    /**
     * @type {Function} Callback executed before paste content cleaning
     * @description Allows custom preprocessing of pasted HTML content
     * @param {string} html - Raw HTML content from clipboard
     * @returns {string} Preprocessed HTML content
     */
    this.beforePasteClean = (html) => html;

    /**
     * @type {Function} Callback executed after all paste cleaning is complete
     * @description Allows custom postprocessing of cleaned HTML content
     * @param {string} html - Cleaned HTML content
     * @returns {string} Final HTML content for insertion
     */
    this.afterPasteClean = (html) => html;

    // Feature detection for modern browser APIs
    /** @private {boolean} Whether modern Clipboard API is supported */
    this._supportsClipboardAPI = this._checkClipboardAPISupport();

    /** @private {boolean} Whether DOMParser is available for HTML processing */
    this._supportsDOMParser = typeof DOMParser !== "undefined";

    // Initialize plugin state
    /** @private {Set<string>} Cached set of preserved tag names (lowercase) */
    this._preservedTags = new Set();

    /** @private {Map<string, string[]|string>} Map of tag names to allowed attributes */
    this._attributeMap = new Map();

    // Initialize plugin state after ICE instance is fully ready
    this._setupEventListeners();
    this._setupPreservedTags();
  }

  /**
   * Plugin lifecycle method called when plugin is activated
   * @description Empty implementation as initialization is handled in constructor.
   * Required by ICE plugin interface for compatibility.
   */
  start() {
    // Initialization handled in constructor
  }

  /**
   * Detect support for modern Clipboard API with comprehensive feature checking
   * @returns {boolean} True if modern clipboard operations are supported
   * @private
   * @description Checks for navigator.clipboard availability and required methods.
   * Modern clipboard API provides better security and user experience compared to legacy methods.
   */
  _checkClipboardAPISupport() {
    return (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      typeof navigator.clipboard.read === "function" &&
      typeof navigator.clipboard.writeText === "function"
    );
  }

  /**
   * Set up event listeners with proper cleanup tracking for memory management
   * @private
   * @description Attaches copy, cut, and paste event listeners to the ICE element.
   * Uses Map to track handlers for proper cleanup in remove() method.
   */
  _setupEventListeners() {
    const element = this._ice.element;
    const handlers = [
      ["copy", (e) => this._handleCopy(e)],
      ["cut", (e) => this._handleCut(e)],
      ["paste", (e) => this._handlePaste(e)],
    ];

    handlers.forEach(([event, handler]) => {
      element.addEventListener(event, handler);
      this._boundHandlers.set(event, handler);
    });
  }

  /**
   * Parse and configure preserved tags from the preserve setting
   * @private
   * @description Parses the comma-separated preserve string into efficient Set and Map
   * data structures for fast lookup during HTML cleaning. Handles attribute specifications
   * like 'tag[attr1|attr2]' and wildcard '*' for keeping all attributes.
   *
   * @example
   * Input: 'p,a[href|title],span[*]'
   * Creates:
   * - _preservedTags: Set{'p', 'a', 'span'}
   * - _attributeMap: Map{'p' => [], 'a' => ['href', 'title'], 'span' => '*'}
   */
  _setupPreservedTags() {
    this._preservedTags = new Set();
    this._attributeMap = new Map();

    if (this.preserve) {
      this.preserve.split(",").forEach((tagSpec) => {
        const match = tagSpec.trim().match(/^(\w+)(?:\[([^\]]+)\])?$/);
        if (match) {
          const [, tag, attrs] = match;
          this._preservedTags.add(tag.toLowerCase());

          if (attrs) {
            const allowedAttrs = attrs === "*" ? "*" : attrs.split("|");
            this._attributeMap.set(tag.toLowerCase(), allowedAttrs);
          } else {
            this._attributeMap.set(tag.toLowerCase(), []);
          }
        }
      });
    }
  }

  /**
   * Apply plugin configuration settings and update internal state
   * @param {Object} [settings={}] - Configuration object with plugin settings
   * @param {string} [settings.pasteType] - Paste processing mode ('formatted'|'formattedClean')
   * @param {string} [settings.preserve] - Tags and attributes to preserve during cleaning
   * @param {Function} [settings.beforePasteClean] - Preprocessing callback
   * @param {Function} [settings.afterPasteClean] - Postprocessing callback
   * @param {boolean} [settings.preventScrollOnFocus] - Prevent scroll during operations
   * @description Uses Object.assign for efficient property copying, then rebuilds
   * preserved tags configuration to reflect any changes to the preserve setting.
   */
  setSettings(settings = {}) {
    // Apply settings using object assignment
    Object.assign(this, settings);
    this._setupPreservedTags();
  }

  /**
   * Handle keyboard shortcuts for copy, cut, and paste operations
   * @param {KeyboardEvent} e - The keyboard event object
   * @returns {boolean} False if event should be prevented, true to continue propagation
   * @description Intercepts Ctrl/Cmd+C/X/V shortcuts and delegates to appropriate handlers.
   * Returns false to prevent default browser behavior when handling paste operations.
   */
  keyDown(e) {
    if (!e.ctrlKey && !e.metaKey) return true;

    switch (e.key.toLowerCase()) {
      case "v":
        e.preventDefault();
        this._handlePaste(e);
        return false;
      case "c":
        this._handleCopy(e);
        return true;
      case "x":
        e.preventDefault();
        this._handleCut(e);
        return false;
      default:
        return true;
    }
  }

  /**
   * Copy event handler
   * @param {ClipboardEvent} e - The clipboard event object
   * @private
   * @description Handles copy operations by extracting content from current selection
   * and setting both HTML and plain text data in clipboard. Prefers clipboardData
   * API for immediate synchronous operation, falls back to Clipboard API.
   * Uses fire-and-forget approach for Clipboard API to avoid blocking UI.
   */
  _handleCopy(e) {
    try {
      const range = this._ice.getCurrentRange();
      if (range.collapsed) return;

      const content = this._extractRangeContent(range);

      if (e && e.clipboardData) {
        e.clipboardData.setData("text/html", content.html);
        e.clipboardData.setData("text/plain", content.text);
        e.preventDefault();
      } else if (this._supportsClipboardAPI) {
        navigator.clipboard.writeText(content.text).catch(() => {});
      }
    } catch (error) {
      console.warn("Copy operation failed:", error);
    }
  }

  /**
   * Cut event handler with ICE change tracking integration
   * @param {ClipboardEvent} e - The clipboard event object
   * @private
   * @description Combines copy functionality with deletion. Extracts content to clipboard,
   * then removes selected content using ICE tracking (if enabled) or standard deletion.
   * Maintains selection state and integrates with ICE's change tracking system.
   */
  _handleCut(e) {
    try {
      const range = this._ice.getCurrentRange();
      if (range.collapsed) return;

      const content = this._extractRangeContent(range);

      // Set clipboard data
      if (e && e.clipboardData) {
        e.clipboardData.setData("text/html", content.html);
        e.clipboardData.setData("text/plain", content.text);
        e.preventDefault();
      } else if (this._supportsClipboardAPI) {
        navigator.clipboard.writeText(content.text).catch(() => {});
      }

      // Delete the selected content with tracking
      if (this._ice.isTracking) {
        this._ice.deleteContents();
      } else {
        range.deleteContents();
        this._ice.env.selection.addRange(range);
      }
    } catch (error) {
      console.warn("Cut operation failed:", error);
    }
  }

  /**
   * Async paste event handler with multiple clipboard data sources
   * @param {ClipboardEvent} e - The clipboard event object
   * @private
   * @async
   * @description Comprehensive paste handler that:
   * 1. Prevents concurrent operations with _isProcessing flag
   * 2. Extracts data from clipboardData or modern Clipboard API
   * 3. Handles both HTML and plain text content
   * 4. Gracefully degrades when permissions are denied
   * 5. Processes content through cleaning pipeline
   * 6. Integrates with ICE change tracking
   */
  async _handlePaste(e) {
    if (this._isProcessing) return;
    this._isProcessing = true;

    try {
      let html = "";
      let text = "";

      // Get paste content from various sources
      if (e && e.clipboardData) {
        html = e.clipboardData.getData("text/html");
        text = e.clipboardData.getData("text/plain");
        e.preventDefault();
      } else if (this._supportsClipboardAPI) {
        try {
          const clipboardItems = await navigator.clipboard.read();
          for (const item of clipboardItems) {
            if (item.types.includes("text/html")) {
              const blob = await item.getType("text/html");
              html = await blob.text();
            }
            if (item.types.includes("text/plain")) {
              const blob = await item.getType("text/plain");
              text = await blob.text();
            }
          }
        } catch {
          // Fallback to text-only
          text = await navigator.clipboard.readText();
        }
      }

      if (!html && !text) return;

      await this._processPasteContent(html || text, !!html);
    } catch (error) {
      console.warn("Paste operation failed:", error);
    } finally {
      this._isProcessing = false;
    }
  }

  /**
   * Process and insert pasted content with ICE change tracking
   * @param {string} content - Raw content from clipboard (HTML or plain text)
   * @param {boolean} [isHtml=false] - Whether the content is HTML format
   * @private
   * @async
   * @description Main paste processing pipeline that:
   * 1. Handles selection deletion with proper range management
   * 2. Ensures valid ICE tracking position
   * 3. Creates temporary marker for insertion point
   * 4. Applies content cleaning based on pasteType setting
   * 5. Delegates to appropriate insertion method
   * 6. Cleans up temporary elements
   */
  async _processPasteContent(content, isHtml = false) {
    let range = this._ice.getCurrentRange();

    // Handle existing selection
    if (!range.collapsed) {
      if (this._ice.isTracking) {
        this._ice.deleteContents();
        // Get updated range after deletion
        range = this._ice.getCurrentRange();
      } else {
        range.deleteContents();
      }
    }

    // Ensure valid tracking position and create marker
    this._ice._moveRangeToValidTrackingPos(range);
    this._tempMarker = document.createElement("span");
    this._tempMarker.style.display = "none";
    range.insertNode(this._tempMarker);

    try {
      // Clean content based on paste type
      let processedContent = isHtml ? this._cleanContent(content) : content;
      this._insertProcessedContent(processedContent, isHtml);
    } finally {
      this._cleanupTempMarker();
    }
  }

  /**
   * Apply content cleaning pipeline based on paste type configuration
   * @param {string} content - Raw HTML content from clipboard
   * @returns {string} Cleaned and processed HTML content ready for insertion
   * @private
   * @description Orchestrates the content cleaning process:
   * 1. Applies beforePasteClean callback for custom preprocessing
   * 2. Applies appropriate cleaning based on pasteType:
   *    - 'formattedClean': Full ICE cleaning + tag preservation
   *    - 'formatted': MS Word cleaning only
   * 3. Applies afterPasteClean callback for custom postprocessing
   */
  _cleanContent(content) {
    let processedContent = this.beforePasteClean(content);

    if (this.pasteType === "formattedClean") {
      processedContent = this._ice.getCleanContent(processedContent);
      processedContent = this._cleanHtmlContent(processedContent);
    } else if (this.pasteType === "formatted") {
      processedContent = this._cleanWordContent(processedContent);
    }

    return this.afterPasteClean(processedContent);
  }

  /**
   * Extract HTML and plain text content from a DOM Range for clipboard operations
   * @param {Range} range - The DOM range containing selected content
   * @returns {Object} Content object with html and text properties
   * @returns {string} returns.html - HTML representation of range contents
   * @returns {string} returns.text - Plain text representation of range contents
   * @private
   * @description Creates a document fragment clone of the range contents,
   * then extracts both HTML markup and plain text. Handles text extraction
   * efficiently using textContent property.
   */
  _extractRangeContent(range) {
    const fragment = range.cloneContents();
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(fragment);

    return {
      html: tempDiv.innerHTML,
      text: tempDiv.textContent || "",
    };
  }

  /**
   * Insert processed content into the document with ICE change tracking
   * @param {string} content - Cleaned content ready for insertion
   * @param {boolean} isHtml - Whether content should be parsed as HTML
   * @private
   * @description Coordinates the content insertion process:
   * 1. Validates content is not empty after trimming
   * 2. Positions range after temporary marker
   * 3. Wraps insertion in ICE batch change for proper tracking
   * 4. Delegates to HTML or text insertion methods
   * 5. Ensures batch change is properly closed even if errors occur
   */
  _insertProcessedContent(content, isHtml) {
    if (!content.trim()) return;

    const range = this._ice.getCurrentRange();
    range.setStartAfter(this._tempMarker);
    range.collapse(true);

    const changeid = this._ice.startBatchChange();
    try {
      if (isHtml) {
        this._insertHtmlContent(content, range);
      } else {
        this._insertTextContent(content, range);
      }
    } finally {
      this._ice.endBatchChange(changeid);
    }
  }

  /**
   * Insert HTML content with intelligent block vs inline handling
   * @param {string} html - HTML string to insert
   * @param {Range} range - Target range for insertion
   * @private
   * @description Analyzes HTML content structure and chooses appropriate insertion method:
   * 1. Creates DocumentFragment for efficient DOM manipulation
   * 2. Detects presence of block-level elements using TreeWalker
   * 3. Routes to block content handler for complex structures
   * 4. Routes to inline content handler for simple content
   */
  _insertHtmlContent(html, range) {
    const fragment = this._createDocumentFragment(html);
    const hasBlockChildren = this._fragmentHasBlockElements(fragment);

    if (hasBlockChildren) {
      this._insertBlockContent(fragment, range);
    } else {
      this._insertInlineContent(fragment, range);
    }
  }

  /**
   * Insert plain text content with ICE change tracking
   * @param {string} text - Plain text string to insert
   * @param {Range} range - Target range for insertion
   * @private
   * @description Handles plain text insertion with proper ICE tracking:
   * 1. Creates text node from string content
   * 2. Wraps in ICE insert node if tracking is enabled
   * 3. Inserts into DOM at range position
   * 4. Updates range to position cursor after inserted content
   * 5. Updates browser selection to reflect new cursor position
   */
  _insertTextContent(text, range) {
    const textNode = document.createTextNode(text);

    if (this._ice.isTracking) {
      const insertNode = this._ice.createIceNode("insertType", textNode);
      range.insertNode(insertNode);
      range.setEndAfter(insertNode);
    } else {
      range.insertNode(textNode);
      range.setEndAfter(textNode);
    }

    range.collapse(false);
    this._ice.env.selection.addRange(range);
  }

  /**
   * Insert block-level content with proper paragraph splitting and ICE tracking
   * @param {DocumentFragment} fragment - Document fragment containing block elements
   * @param {Range} range - Target range for insertion
   * @private
   * @description Complex block insertion algorithm that:
   * 1. Finds containing block element using ICE utilities
   * 2. Splits current block at insertion point to avoid nested blocks
   * 3. Processes each child in fragment sequentially
   * 4. Wraps non-block content in appropriate block elements
   * 5. Applies ICE tracking to all inserted content
   * 6. Positions cursor after inserted content
   * 7. Cleans up empty blocks created during splitting
   */
  _insertBlockContent(fragment, range) {
    const block = ice.dom.isChildOfTagName(this._tempMarker, this._ice.blockEl);
    if (!block) return;

    // Split current block after marker
    range.setEndAfter(block.lastChild);
    this._ice.env.selection.addRange(range);
    const contents = range.extractContents();
    const newBlock = document.createElement(this._ice.blockEl);
    newBlock.appendChild(contents);
    block.parentNode.insertBefore(newBlock, block.nextSibling);

    // Insert fragment children as separate blocks
    while (fragment.firstChild) {
      const child = fragment.removeChild(fragment.firstChild);

      if (child.nodeType === Node.TEXT_NODE && !child.textContent.trim()) {
        continue;
      }

      if (ice.dom.isBlockElement(child)) {
        const blockEl = document.createElement(child.tagName);
        if (this._ice.isTracking) {
          const insertNode = this._ice.createIceNode("insertType");
          insertNode.innerHTML = child.innerHTML;
          blockEl.appendChild(insertNode);
        } else {
          blockEl.innerHTML = child.innerHTML;
        }
        block.parentNode.insertBefore(blockEl, newBlock);
      } else {
        // Wrap non-block content
        const wrapperBlock = document.createElement(this._ice.blockEl);
        if (this._ice.isTracking) {
          const insertNode = this._ice.createIceNode("insertType");
          insertNode.appendChild(child);
          wrapperBlock.appendChild(insertNode);
        } else {
          wrapperBlock.appendChild(child);
        }
        block.parentNode.insertBefore(wrapperBlock, newBlock);
      }
    }

    // Remove empty newBlock if needed
    if (!newBlock.textContent.trim()) {
      newBlock.parentNode.removeChild(newBlock);
    }

    // Set final cursor position
    const lastInserted = newBlock.previousSibling;
    if (lastInserted) {
      range.setEndAfter(lastInserted.lastChild || lastInserted);
      range.collapse(false);
      this._ice.env.selection.addRange(range);
    }
  }

  /**
   * Insert inline content without block-level restructuring
   * @param {DocumentFragment} fragment - Document fragment containing inline elements
   * @param {Range} range - Target range for insertion
   * @private
   * @description Streamlined inline insertion for simple content:
   * 1. When ICE tracking enabled: wraps entire fragment in single insert node
   * 2. When tracking disabled: inserts each child sequentially
   * 3. Maintains proper cursor positioning throughout process
   * 4. Updates browser selection to reflect final cursor position
   * 5. More efficient than block insertion for simple content
   */
  _insertInlineContent(fragment, range) {
    if (this._ice.isTracking) {
      const insertNode = this._ice.createIceNode("insertType", fragment);
      range.insertNode(insertNode);
      range.setEndAfter(insertNode);
      range.collapse(false);
    } else {
      let lastChild;
      while (fragment.firstChild) {
        lastChild = fragment.removeChild(fragment.firstChild);
        range.insertNode(lastChild);
        range.setStartAfter(lastChild);
        range.collapse(true);
      }
      if (lastChild) {
        range.setEndAfter(lastChild);
        range.collapse(false);
      }
    }
    this._ice.env.selection.addRange(range);
  }

  /**
   * Create DocumentFragment from HTML string with cross-browser compatibility
   * @param {string} html - HTML string to parse into DOM fragment
   * @returns {DocumentFragment} Document fragment containing parsed HTML
   * @private
   * @description Uses modern DOMParser when available for better security and parsing,
   * falls back to Range.createContextualFragment for older browsers.
   * DOMParser approach prevents execution of scripts and provides more control.
   */
  _createDocumentFragment(html) {
    if (this._supportsDOMParser) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
      const fragment = document.createDocumentFragment();
      const container = doc.querySelector("div");

      while (container.firstChild) {
        fragment.appendChild(container.removeChild(container.firstChild));
      }
      return fragment;
    } else {
      // Fallback for older browsers
      const range = document.createRange();
      return range.createContextualFragment(html);
    }
  }

  /**
   * Detect if document fragment contains block-level elements
   * @param {DocumentFragment} fragment - Fragment to analyze
   * @returns {boolean} True if fragment contains any block-level elements
   * @private
   * @description Uses TreeWalker with custom filter for memory-efficient traversal.
   * Returns immediately on first block element found rather than collecting all.
   * Integrates with ICE's block element detection for consistency.
   */
  _fragmentHasBlockElements(fragment) {
    const walker = document.createTreeWalker(
      fragment,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          return ice.dom.isBlockElement(node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_SKIP;
        },
      },
    );
    return walker.nextNode() !== null;
  }

  /**
   * Clean HTML content based on preserved tags configuration
   * @param {string} html - Raw HTML content to clean
   * @returns {string} Cleaned HTML with only preserved tags and attributes
   * @private
   * @description Comprehensive HTML cleaning process:
   * 1. Validates DOMParser support and non-empty content
   * 2. Parses HTML into isolated document context
   * 3. Recursively processes all elements for tag and attribute filtering
   * 4. Returns cleaned innerHTML while preserving document structure
   */
  _cleanHtmlContent(html) {
    if (!this._supportsDOMParser || !html.trim()) return html;

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
    const container = doc.querySelector("div");

    this._cleanElement(container);
    return container.innerHTML;
  }

  /**
   * Recursively clean DOM elements based on preserved tags configuration
   * @param {Element} element - Root element to clean recursively
   * @private
   * @description Memory-efficient DOM cleaning algorithm using TreeWalker:
   * 1. Traverses all element nodes without creating large collections
   * 2. Collects elements to remove while preserving tree structure
   * 3. Cleans attributes on preserved elements
   * 4. Removes unwanted elements while preserving their content
   * 5. Handles parent-child relationships safely during modification
   */
  _cleanElement(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_ELEMENT,
      null,
      false,
    );

    const elementsToRemove = [];
    let node;

    while ((node = walker.nextNode())) {
      const tagName = node.tagName.toLowerCase();

      if (!this._preservedTags.has(tagName)) {
        // Mark for removal - replace with contents
        elementsToRemove.push(node);
      } else {
        // Clean attributes
        this._cleanAttributes(node);
      }
    }

    // Remove unwanted elements (replace with their contents)
    elementsToRemove.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) {
          parent.insertBefore(el.firstChild, el);
        }
        parent.removeChild(el);
      }
    });
  }

  /**
   * Clean element attributes based on preserved configuration
   * @param {Element} element - Element whose attributes should be cleaned
   * @private
   * @description Attribute filtering based on preserve configuration:
   * 1. No allowed attributes: removes all attributes
   * 2. Wildcard '*': preserves all attributes
   * 3. Specific list: removes attributes not in allowed list
   * Uses Array.from to avoid live HTMLCollection issues during removal
   */
  _cleanAttributes(element) {
    const tagName = element.tagName.toLowerCase();
    const allowedAttrs = this._attributeMap.get(tagName);

    if (!allowedAttrs || allowedAttrs.length === 0) {
      // Remove all attributes
      while (element.attributes.length > 0) {
        element.removeAttribute(element.attributes[0].name);
      }
    } else if (allowedAttrs !== "*") {
      // Remove attributes not in allowed list
      const attrs = Array.from(element.attributes);
      attrs.forEach((attr) => {
        if (!allowedAttrs.includes(attr.name)) {
          element.removeAttribute(attr.name);
        }
      });
    }
    // If allowedAttrs === '*', keep all attributes
  }

  /**
   * Remove Microsoft Word and other office suite formatting artifacts
   * @param {string} html - Raw HTML content (potentially from MS Word)
   * @returns {string} Cleaned HTML with Word-specific markup removed
   * @private
   * @description Comprehensive cleaning of common Word paste artifacts:
   * 1. Removes meta/link tags and embedded stylesheets
   * 2. Strips XML namespaced tags (o:p, w:*, etc.)
   * 3. Removes class and lang attributes
   * 4. Converts legacy b/i tags to semantic strong/em
   * 5. Normalizes whitespace and removes empty content
   */
  _cleanWordContent(html) {
    return (
      html
        // Remove meta and link tags
        .replace(/<(meta|link)[^>]+>/gi, "")
        // Remove comments
        .replace(/<!--[\s\S]*?-->/g, "")
        // Remove style tags and content
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        // Remove XML tags (Word-specific)
        .replace(/<\/?\w+:[^>]*>/gi, "")
        // Remove XML declarations
        .replace(/<\??xml[^>]*>/gi, "")
        // Remove class, lang attributes
        .replace(/\s(?:class|lang)=(?:["'][^"']*["']|[^\s>]+)/gi, "")
        // Convert bold/italic to strong/em
        .replace(/<\/?b(\s|>)/gi, (match) => match.replace(/b/, "strong"))
        .replace(/<\/?i(\s|>)/gi, (match) => match.replace(/i/, "em"))
        // Clean up multiple spaces
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  /**
   * Clean up temporary marker element used during paste operations
   * @private
   * @description Safely removes temporary marker from DOM and resets reference.
   * Includes parent existence check to handle edge cases where marker
   * might be removed by other operations.
   */
  _cleanupTempMarker() {
    if (this._tempMarker && this._tempMarker.parentNode) {
      this._tempMarker.parentNode.removeChild(this._tempMarker);
      this._tempMarker = null;
    }
  }

  /**
   * Clean up all plugin resources and remove event listeners
   * @description Comprehensive cleanup for memory management:
   * 1. Calls parent class cleanup
   * 2. Removes all tracked event listeners from ICE element
   * 3. Clears handler tracking Map
   * 4. Removes any remaining temporary elements
   * 5. Resets processing state flags
   * Essential for preventing memory leaks in long-running applications
   */
  remove() {
    super.remove();

    // Remove event listeners
    const element = this._ice.element;
    this._boundHandlers.forEach((handler, event) => {
      element.removeEventListener(event, handler);
    });
    this._boundHandlers.clear();

    // Cleanup any remaining temporary elements
    this._cleanupTempMarker();
    this._isProcessing = false;
  }
}

/**
 * Establish prototype inheritance from ice.IcePlugin
 * @description Sets up inheritance chain for proper plugin integration
 * with ICE framework. Uses ICE's custom inheritance mechanism for
 * compatibility with the existing plugin system.
 * @see ice.IcePlugin
 */
ice.dom.noInclusionInherits(IceCopyPastePlugin, ice.IcePlugin);

/**
 * CommonJS module export for Node.js environments
 * @description Provides compatibility with CommonJS module systems
 * while maintaining browser global namespace support
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
 * Browser global namespace registration
 * @description Attaches plugin to global ice._plugin namespace for browser environments.
 * This registration is required for ICE's plugin discovery mechanism.
 * Creates namespace objects if they don't exist to ensure compatibility.
 * @global
 */
if (typeof window !== "undefined") {
  window.ice = window.ice || {};
  window.ice._plugin = window.ice._plugin || {};
  window.ice._plugin.IceCopyPastePlugin = IceCopyPastePlugin;
}
