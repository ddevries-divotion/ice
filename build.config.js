// Build configuration constants
export const BUILD_CONFIG = {
  // Directories
  BUILD_DIR: "dist",
  DEMO_DIR: "demo",
  SRC_DIR: "src",
  
  // Entry points
  MAIN_ENTRY: "src/ice-bundle.js",
  
  // Output files
  OUTPUT_FILES: {
    MAIN: "ice.js",
    MINIFIED: "ice.min.js"
  },
  
  // Copy targets for TinyMCE plugins
  TINYMCE_PLUGINS: [
    {
      name: "ice",
      src: "src/tinymce/plugins/ice/**/*",
    },
    {
      name: "icesearchreplace", 
      src: "src/tinymce/plugins/icesearchreplace/**/*",
    }
  ],
  
  // Environment-specific settings
  DEVELOPMENT: {
    sourcemap: true,
    watch: {
      clearScreen: false,
      exclude: ['node_modules/**']
    }
  },
  
  // Terser options factory (environment will be passed in)
  createTerserOptions: (isProduction = true) => ({
    format: { 
      ascii_only: true,
      comments: false
    },
    compress: { 
      drop_console: isProduction,
      drop_debugger: isProduction
    },
    mangle: {
      reserved: ['ice']
    }
  }),
  
  // Archive settings factory (environment will be passed in)
  createArchiveConfig: (isDevelopment = false) => ({
    compression_level: 9,
    delay_ms: 200,
    enabled: !isDevelopment
  })
};

// Banner template function
export const createBanner = (pkg) => `//
// ${pkg.name} - v${pkg.version}
// Copyright (c) The New York Times, CMS Group, Matthew DeLambo
// Copyright (c) Divotion B.V., Conflux, Dennis de Vries
// Licensed under the GNU General Public License v2.0 or later
//`;
