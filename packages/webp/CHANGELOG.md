# Changelog

## @jsquash/webp@1.4.0

### Adds

- Adds ability to customise Emscripten module options, e.g. define your own `locateFile` method.

## @jsquash/webp@1.3.0

### Adds

- Adds Node.js ESM support
    - Updates relative imports to use file extensions
    - Adds `module` field to relevant `package.json`
    - Updates pre.js to polyfill ImageData for Node.js

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/webp@1.2.0

### Added 

- Include polyfills for Cloudflare Worker environment for easier compatibility
