# Changelog

## @jsquash/avif@2.1.1

### Fixes

- Fixes the type definitions for the `encode` method to work correctly with the intended bitDepths.

## @jsquash/avif@2.1.0

### Adds

- Adds support for encoding and decoding AVIF images with higher bit depths
    - 10-bit and 12-bit images are supported for encoding. Pixel data must be provided as 16-bit integers.
    - 10-bit, 12-bit and 16-bit images are supported for decoding
    - See [README](./README.md) for bit depth configuration options

- Adds easy support for lossless encoding with the `lossless` option
    - When `lossless` is set to `true`, the `quality` and `qualityAlpha` options are ignored
    - The `subsample` option is ignored when `lossless` is set to `true`

- Adds support for only providing a module option override to the `init` function directly

  **Example:**
  ```ts
  import encode, { init } from '@jsquash/avif/encode';
  await init({
    locateFile: (path) => {
        const remoteLocation = 'https://cdn.mydomain.com/wasm';
        return remoteLocation + path;
    }
  });
  const buffer = await encode(/* image data */);
  ```

### Fixes

- Updates `locateFile` emscripten module option type to support prefix parameter.

## @jsquash/avif@2.0.0

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
