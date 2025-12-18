// ICE Bundle Entry Point - Concatenates all dependencies in the correct order
// This file defines the module loading order for the complete ICE library

// Import and expose all ICE modules to maintain global compatibility
import "./ice.js";
import "./dom.js";
import "./bookmark.js";
import "./selection.js";
import "./icePlugin.js";
import "./icePluginManager.js";

// Import plugins
import "./plugins/IceAddTitlePlugin/IceAddTitlePlugin.js";
import "./plugins/IceCopyPastePlugin/IceCopyPastePlugin.js";
import "./plugins/IceSmartQuotesPlugin/IceSmartQuotesPlugin.js";
import "./plugins/IceEmdashPlugin/IceEmdashPlugin.js";

// Ensure ice is available globally for backwards compatibility
if (typeof window !== "undefined") {
  window.ice = window.ice || {};
}
