// IceSmartQuotesPlugin.js - ES6 version
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later

/**
 * @class IceSmartQuotesPlugin
 * @description Converts straight quotes to smart quotes within block elements.
 */
class IceSmartQuotesPlugin extends ice.IcePlugin {
  /**
   * @param {Object} ice_instance - The ice instance.
   */
  constructor(ice_instance) {
    super(ice_instance);
    this._ice = ice_instance;
  }

  /**
   * Finds each block in `element` and converts quotes into smart quotes.
   * @param {Element} element - The DOM element containing blocks to convert.
   */
  convert(element) {
    try {
      this._ice.placeholdDeletes();
      ice.dom.each(element.getElementsByTagName(this._ice.blockEl), (i, el) => {
        this._convertBlock(el);
      });
    } catch (e) {
      if (window.console) console.error(e);
    } finally {
      this._ice.revertDeletePlaceholders();
    }
  }

  /**
   * Converts the quotes in the given element to smart quotes.
   * @param {Element} el - The block element to convert quotes in.
   * @private
   */
  _convertBlock(el) {
    // If there are less than 2 characters, we don't have enough to go on.
    if (ice.dom.getNodeTextContent(el) < 2) return;

    let previous, current, next;
    let data;
    const regularSingle = "'";
    const regularDouble = '"';
    const smartSingleLeft = String.fromCharCode(8216); // aka - open curly single quote
    const smartSingleRight = String.fromCharCode(8217); // aka - close curly single quote
    const smartDoubleLeft = String.fromCharCode(8220); // aka - open curly double quote
    const smartDoubleRight = String.fromCharCode(8221); // aka - close curly double quote
    /**
     * @param {string} c
     * @returns {boolean}
     */
    const isDigit = (c) => /\d/.test(c);
    /**
     * @param {string} c
     * @returns {boolean}
     */
    const isChar = (c) => /\w/.test(c);
    /**
     * @param {string} c
     * @returns {boolean}
     */
    const isSpace = (c) =>
      c === String.fromCharCode(160) || c === String.fromCharCode(32);
    /**
     * @param {string} c
     * @returns {boolean}
     */
    const isStartChar = (c) => isSpace(c) || c === "(";
    /**
     * @param {string} c
     * @returns {boolean}
     */
    const isEndChar = (c) =>
      isSpace(c) ||
      c === null ||
      c === ";" ||
      c === ")" ||
      c === "." ||
      c === "!" ||
      c === "," ||
      c === "?" ||
      c === ":";
    /**
     * @param {string} c
     * @returns {boolean}
     */
    const isNonSpace = (c) => !isSpace(c);
    /**
     * @param {string} c
     * @returns {boolean}
     */
    const isSingle = (c) =>
      c === regularSingle || c === smartSingleLeft || c === smartSingleRight;

    // Split the html into array allocations with the following criteria:
    //   html tags: starts with "<" and ends with ">"
    //   html entities: starts with "&" and ends with ";"
    //   characters: any character outside of an html tag or entity
    // So the following html:
    //   n&ce <b id="bold">test</b>
    // Would split into the following array:
    //  ['n', '&amp;', 'c', 'e', ' ', '<b id="bold">', 't', 'e', 's', 't', '</b>'];
    data = el.innerHTML.match(/(<("[^"]*"|'[^']*'|[^'">])*>|&.*;|.)/g);

    /**
     * Searches through the `data` array from the given index a given number of
     * characters forward or backward and returns the found character.
     * @param {Array} data
     * @param {number} fromIndex
     * @param {number} nCharacters
     * @returns {string|null}
     */
    const getNextChar = (data, fromIndex, nCharacters) => {
      const dLength = data.length;
      const addWith = nCharacters < 0 ? -1 : 1;
      const getChar = (data, fromIndex, nCharacters) => {
        // Base case - did we move outside of the bounds of the data array?
        if (fromIndex < 0 || fromIndex >= dLength) return null;

        const next = data[fromIndex + addWith];

        // If we find a character and we have moved through the
        // nCharacters, then the recursion is done.
        if (next && next.length === 1) {
          nCharacters += addWith * -1;
          if (!nCharacters) return next;
        }
        return getChar(data, fromIndex + addWith, nCharacters);
      };
      return getChar(data, fromIndex, nCharacters);
    };

    ice.dom.each(data, (pos, val) => {
      // Convert space entities so that they can be processed as normal characters.
      if (val === "&nbsp;") data[pos] = " ";
      // If the val is a character, then examine the surroundings and convert smart quotes, if necessary.
      if (data[pos].length === 1) {
        previous = getNextChar(data, pos, -1);
        current = data[pos];
        next = getNextChar(data, pos, 1);
        switch (current) {
          /**
           * Conversion Rules:
           * ----------------
           *
           * START: assign smart left/open
           *   [SPACE|START_PARENTHESIS]'word
           *   [SPACE|START_PARENTHESIS]"word
           *
           * END: assign smart right/close
           *   word'[SPACE|SEMICOLON|COLON|PERIOD|COMMA|EXCLAMATION_MARK|QUESTION_MARK|END_PARENTHESIS|NULL]
           *   word"[SPACE|SEMICOLON|COLON|PERIOD|COMMA|EXCLAMATION_MARK|QUESTION_MARK|END_PARENTHESIS|NULL]
           *
           * PLURAL_CONTRACTION: assign smart right/close
           *   Matt's
           *   can't
           *   O'Reilly
           *
           * YEAR_ABBREVIATION: assign smart right/close
           *   [SPACE|NULL]'99[SPACE|SEMICOLON|COLON|PERIOD|COMMA|EXCLAMATION_MARK|QUESTION_MARK|END_PARENTHESIS|NULL]
           *
           * NESTED_START: assign smart left/open
           *   [SPACE|NULL]"[SPACE]'word
           *
           * NESTED_END: assign smart left/open
           *   word'[SPACE]"[SPACE|SEMICOLON|COLON|PERIOD|COMMA|EXCLAMATION_MARK|QUESTION_MARK|END_PARENTHESIS|NULL]
           *
           * Notes:
           *  - The following will not be converted correctly - ...word 'Til Death - it should
           *  get a right/close smart quote, but will get a left/open.
           *  - Distinguishing between year abbreviation, '99, and when to use an open single quote
           *  could fail if a single quoted region starts with a double digit number - '99 problems'
           *  - Since they are a rare case and there are many permutations, measurements are not being
           *  handled (6'8", 6' 8", 6', 8").
           */

          // Convert smart single quotes to non-smart quote and fall through to single quote
          // handling, in case the context has changed and we need to update the smart quote.
          case smartSingleLeft:
          case smartSingleRight:
            current = regularSingle;
            break;
          case regularSingle:
            // YEAR_ABBREVIATION - look 2 ahead to see if there are two digits in a row - not fool proof
            if (
              (previous === null || isSpace(previous)) &&
              isDigit(next) &&
              isDigit(getNextChar(data, pos, 2)) &&
              isEndChar(getNextChar(data, pos, 3))
            )
              current = smartSingleRight;
            // START
            else if (
              previous === null ||
              (isStartChar(previous) && isNonSpace(next))
            )
              current = smartSingleLeft;
            // END
            else if (next === null || (isNonSpace(previous) && isEndChar(next)))
              current = smartSingleRight;
            // PLURAL_CONTRACTION
            else if (isChar(previous) && isChar(next))
              current = smartSingleRight;
            break;

          // Convert smart double quotes to non-smart quote and fall through to double quote
          // handling, in case the context has changed and we need to update the smart quote.
          case smartDoubleLeft:
          case smartDoubleRight:
            current = regularDouble;
            break;
          case regularDouble:
            // NESTED_END
            if (
              isEndChar(next) &&
              isSpace(previous) &&
              isSingle(getNextChar(data, pos, -2))
            )
              current = smartDoubleRight;
            // START
            else if (
              previous === null ||
              (isStartChar(previous) && isNonSpace(next))
            )
              current = smartDoubleLeft;
            // END
            else if (next === null || (isNonSpace(previous) && isEndChar(next)))
              current = smartDoubleRight;
            // NESTED_START
            else if (
              (previous === null || isSpace(previous)) &&
              isSpace(next) &&
              isSingle(getNextChar(data, pos, 1))
            )
              current = smartDoubleLeft;
            break;
        }
        if (current !== null) data[pos] = current;
      }
    });
    el.innerHTML = data.join("");
  }
}

/**
 * Sets up inheritance for IceSmartQuotesPlugin from ice.IcePlugin.
 * @see ice.IcePlugin
 */
ice.dom.noInclusionInherits(IceSmartQuotesPlugin, ice.IcePlugin);

/**
 * Exports the IceSmartQuotesPlugin for CommonJS and attaches it to the global ice object in browsers.
 * @module IceSmartQuotesPlugin
 */
if (
  typeof window === "undefined" &&
  typeof module !== "undefined" &&
  module.exports
) {
  module.exports = IceSmartQuotesPlugin;
}
/**
 * Attaches IceSmartQuotesPlugin to the global ice._plugin object in browsers.
 * @global
 */
if (typeof window !== "undefined") {
  window.ice = window.ice || {};
  window.ice._plugin = window.ice._plugin || {};
  window.ice._plugin.IceSmartQuotesPlugin = IceSmartQuotesPlugin;
}
