# Build System Documentation

This document describes the optimized build system for the ICE library.

## Overview

The build system uses Rollup.js with a modular configuration approach for better maintainability. The configuration is split between:

- `rollup.config.js` - Main Rollup configuration
- `build.config.js` - Build constants and settings
- `src/ice-bundle.js` - Entry point that imports all dependencies

## Build Output

The build process creates:

- `dist/ice.js` - Full library with banner comments
- `dist/ice.min.js` - Minified version
- `dist/tinymce/` - TinyMCE plugin directories
- `dist/ice_<version>.zip` - Complete distribution archive

## Available Scripts

### Core Build Commands
- `pnpm build` - Production build
- `pnpm build:dev` - Development build (preserves debugging)
- `pnpm clean` - Remove all build artifacts

### Demo Commands
- `pnpm demo:prepare` - Build and prepare demo files
- `pnpm demo:copy` - Copy dist files to demo directory

### Quality Assurance
- `pnpm lint` - Fix code style issues
- `pnpm lint:check` - Check code style
- `pnpm format` - Fix code formatting
- `pnpm format:check` - Check code formatting
- `pnpm test` - Run tests
- `pnpm test:headed` - Run tests with browser UI

### CI/CD
- `pnpm ci` - Complete CI pipeline (lint + format + build + test)

## Configuration

### Modifying Build Settings

Edit `build.config.js` to change:

- **Directories**: `BUILD_DIR`, `DEMO_DIR`, `SRC_DIR`
- **Output files**: `OUTPUT_FILES.MAIN`, `OUTPUT_FILES.MINIFIED`
- **Minification**: `TERSER_OPTIONS`
- **Archive settings**: `ARCHIVE.compression_level`, `ARCHIVE.delay_ms`

### Adding New TinyMCE Plugins

Add to `BUILD_CONFIG.TINYMCE_PLUGINS` array:

```javascript
{
  name: "my-plugin",
  src: "src/tinymce/plugins/my-plugin/**/*"
}
```

### Customizing Banner

Modify the `createBanner` function in `build.config.js`.

## File Structure

```
├── rollup.config.js       # Main Rollup configuration
├── build.config.js        # Build constants and settings
├── src/
│   ├── ice-bundle.js      # Entry point (imports all dependencies)
│   ├── ice.js             # Core ICE library
│   ├── dom.js             # DOM utilities
│   ├── selection.js       # Selection handling
│   ├── plugins/           # ICE plugins
│   └── tinymce/           # TinyMCE integration
└── dist/                  # Build output (generated)
```

## Build Process Flow

1. **Clean**: Remove existing build artifacts
2. **Bundle**: Process main entry point through Rollup
3. **Copy**: Copy TinyMCE plugin assets
4. **Archive**: Create distribution zip file

## Performance

The optimized build system:
- ✅ Reduces configuration duplication
- ✅ Separates concerns (config vs logic)
- ✅ Provides clear error messages
- ✅ Supports development workflows
- ✅ Maintains backward compatibility
