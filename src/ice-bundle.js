// ICE Bundle Entry Point - Concatenates all dependencies in the correct order
// This file defines the module loading order for the complete ICE library

// Import rangy core
import 'rangy';

// Import core ICE modules
import './ice.js';
import './dom.js'; 
import './bookmark.js';
import './selection.js';
import './icePlugin.js';
import './icePluginManager.js';

// Import plugins
import './plugins/IceAddTitlePlugin/IceAddTitlePlugin.js';
import './plugins/IceCopyPastePlugin/IceCopyPastePlugin.js';
import './plugins/IceSmartQuotesPlugin/IceSmartQuotesPlugin.js';
import './plugins/IceEmdashPlugin/IceEmdashPlugin.js';
