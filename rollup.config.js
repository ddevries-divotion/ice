import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import del from "rollup-plugin-delete";
import copy from "rollup-plugin-copy";
import { readFileSync, writeFileSync } from "fs";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { join } from "path";
import { env } from "process";
import { BUILD_CONFIG, createBanner } from "./build.config.js";

// Constants
const COPY_DELAY_MS = 100;

// Read package info and environment
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const banner = createBanner(pkg);
const isDevelopment = env.NODE_ENV === "development";
const isProduction = env.NODE_ENV === "production";

// Get environment-specific configurations
const terserOptions = BUILD_CONFIG.createTerserOptions(isProduction);
const archiveConfig = BUILD_CONFIG.createArchiveConfig(isDevelopment);

// Utility functions
const createOutput = (filename, minified = false) => ({
  file: join(BUILD_CONFIG.BUILD_DIR, filename),
  format: "iife",
  name: "ice",
  banner,
  sourcemap: isDevelopment,
  extend: true,
  ...(minified && {
    plugins: [terser(terserOptions)],
  }),
});

// Generate copy targets for TinyMCE plugins dynamically
const createCopyTargets = () => {
  const targets = [];
  
  BUILD_CONFIG.TINYMCE_PLUGINS.forEach(plugin => {
    const pluginSrc = `src/tinymce/plugins/${plugin.name}`;
    const pluginDest = join(BUILD_CONFIG.BUILD_DIR, "tinymce", "plugins", plugin.name);
    
    // Add plugin.js file
    targets.push({
      src: `${pluginSrc}/plugin.js`,
      dest: pluginDest,
    });
    
    // Add subdirectories
    BUILD_CONFIG.PLUGIN_SUBDIRS.forEach(subdir => {
      targets.push({
        src: `${pluginSrc}/${subdir}/**/*`,
        dest: join(pluginDest, subdir),
      });
    });
  });
  
  return targets;
};

// Create TinyMCE plugin minifier
const createPluginMinifier = () => ({
  name: "plugin-minifier",
  async closeBundle() {
    // Small delay to ensure copy operations complete
    await new Promise(resolve => setTimeout(resolve, COPY_DELAY_MS));
    
    const { minify } = await import("terser");
    
    // Process each plugin
    for (const plugin of BUILD_CONFIG.TINYMCE_PLUGINS) {
      const pluginDir = join(BUILD_CONFIG.BUILD_DIR, "tinymce", "plugins", plugin.name);
      const pluginPath = join(pluginDir, "plugin.js");
      const minifiedPath = join(pluginDir, "plugin.min.js");
      
      try {
        const pluginContent = readFileSync(pluginPath, "utf8");
        const result = await minify(pluginContent, terserOptions);
        
        if (!result.code) {
          throw new Error("Minification produced empty result");
        }
        
        writeFileSync(minifiedPath, result.code, "utf8");
        console.info(`✓ Created ${plugin.name}/plugin.min.js`);
      } catch (error) {
        console.warn(`⚠ Failed to minify ${plugin.name}/plugin.js:`, error.message);
      }
    }
  },
});

// Create distribution archive
const createArchivePlugin = () => ({
  name: "archive-creator",
  async closeBundle() {
    if (!archiveConfig.enabled) return;
    
    // Ensure file operations complete
    await new Promise(resolve => setTimeout(resolve, archiveConfig.delay_ms));
    
    const zipFile = `ice_${pkg.version}.zip`;
    const output = createWriteStream(join(BUILD_CONFIG.BUILD_DIR, zipFile));
    const archive = archiver("zip", { zlib: { level: archiveConfig.compression_level } });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        console.info(`✓ Created ${zipFile} (${(archive.pointer() / 1024).toFixed(1)} KB)`);
        resolve();
      });

      archive.on("error", reject);
      archive.pipe(output);

      // Add main files
      Object.values(BUILD_CONFIG.OUTPUT_FILES).forEach(file => {
        archive.file(join(BUILD_CONFIG.BUILD_DIR, file), { name: file });
      });

      // Add TinyMCE plugins
      archive.directory(join(BUILD_CONFIG.BUILD_DIR, "tinymce"), "tinymce");
      archive.finalize();
    });
  },
});

export default {
  input: BUILD_CONFIG.MAIN_ENTRY,

  output: [
    createOutput(BUILD_CONFIG.OUTPUT_FILES.MAIN),
    createOutput(BUILD_CONFIG.OUTPUT_FILES.MINIFIED, true),
  ],

  external: ["tinymce"],
  context: "window",

  plugins: [
    // Clean build directory
    del({
      targets: [join(BUILD_CONFIG.BUILD_DIR, "*")],
      verbose: true,
    }),

    // Bundle resolution
    nodeResolve({ browser: true }),
    commonjs(),

    // Copy TinyMCE plugin assets
    copy({
      targets: createCopyTargets(),
      hook: "buildEnd",
    }),

    // Create minified plugin.js files
    createPluginMinifier(),

    // Create distribution archive
    createArchivePlugin(),
  ],
};
