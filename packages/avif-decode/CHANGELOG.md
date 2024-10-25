# Changelog


## @jsquash/avif@next

### Breaking Changes

- Upgrades libavif to v1.0.1

## @jsquash/avif@1.3.0

### Adds

- Adds ability to customise Emscripten module options, e.g. define your own `locateFile` method.

## @jsquash/avif@1.2.0

### Adds

- Adds Node.js ESM support
    - Updates relative imports to use file extensions
    - Adds `module` field to relevant `package.json`
    - Updates pre.js to polyfill ImageData for Node.js

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/avif@1.1.2

### Bug Fixes

- Stops the WebWorker module code from being instantiated when running in a Cloudflare Worker environment

## @jsquash/avif@1.1.1

### Bug Fixes

- Fixes an issue where it may not have been possible instantiate encode wasm modules manually

## @jsquash/avif@1.1.0

### Added 

- Include polyfills for Cloudflare Worker environment for easier compatibility
