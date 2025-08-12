import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import del from "rollup-plugin-delete";
import copy from "rollup-plugin-copy";
import { readFileSync } from "fs";
import archiver from "archiver";
import { createWriteStream } from "fs";
import { join } from "path";
import { env } from "process";
import { BUILD_CONFIG, createBanner } from "./build.config.js";

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
  ...(minified && {
    plugins: [terser(terserOptions)],
  }),
});

const createCopyTargets = () =>
  BUILD_CONFIG.TINYMCE_PLUGINS.map((plugin) => ({
    src: plugin.src,
    dest: join(BUILD_CONFIG.BUILD_DIR, "tinymce", "plugins", plugin.name),
  }));

const createZipArchive = async () => {
  const zipFile = `ice_${pkg.version}.zip`;
  const output = createWriteStream(join(BUILD_CONFIG.BUILD_DIR, zipFile));
  const archive = archiver("zip", {
    zlib: { level: archiveConfig.compression_level },
  });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      console.info(
        `✓ Created ${zipFile} (${(archive.pointer() / 1024).toFixed(1)} KB)`,
      );
      resolve();
    });

    archive.on("error", reject);
    archive.pipe(output);

    // Add main distribution files
    archive.file(join(BUILD_CONFIG.BUILD_DIR, BUILD_CONFIG.OUTPUT_FILES.MAIN), {
      name: BUILD_CONFIG.OUTPUT_FILES.MAIN,
    });
    archive.file(
      join(BUILD_CONFIG.BUILD_DIR, BUILD_CONFIG.OUTPUT_FILES.MINIFIED),
      { name: BUILD_CONFIG.OUTPUT_FILES.MINIFIED },
    );

    // Add TinyMCE plugins
    archive.directory(join(BUILD_CONFIG.BUILD_DIR, "tinymce"), "tinymce");

    archive.finalize();
  });
};

// Track zip creation
let zipCreated = false;

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

    // Copy assets
    copy({
      targets: createCopyTargets(),
      hook: "buildEnd",
    }),

    // Create distribution archive
    {
      name: "archive-creator",
      async closeBundle() {
        if (zipCreated || !archiveConfig.enabled) return;
        zipCreated = true;

        // Ensure file operations complete
        await new Promise((resolve) =>
          setTimeout(resolve, archiveConfig.delay_ms),
        );

        try {
          await createZipArchive();
        } catch (error) {
          console.error("✗ Archive creation failed:", error.message);
          throw error;
        }
      },
    },
  ],
};
