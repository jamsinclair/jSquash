# Changelog

## @jsquash/png@2.2.0

### Adds

- Adds Node.js ESM support
    - Updates relative imports to use file extensions
    - Adds `module` field to relevant `package.json`
    - Updates pre.js to polyfill ImageData for Node.js

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/png@2.1.4

### Fixes

- Removes unused wasm-feature-detect dependency

## @jsquash/png@2.1.2

Re-release of 2.1.1 with correct dist files
### Fixes

- Check for caches object on `globalThis` before using it

## @jsquash/png@2.1.1

### Fixes

- Check for caches object on `globalThis` before using it

## @jsquash/png@2.1.0

### Added

- Include polyfills for Cloudflare Worker environment for easier compatibility
