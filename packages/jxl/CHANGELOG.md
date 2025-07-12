# Changelog

## @jsquash/jxl@1.3.0

### Fixes

- Adds a convenience option to set lossless encoding (`encode(imageData, { lossless: true })`)

## @jsquash/jxl@1.2.0

### Adds
- Adds support for only providing a module option override to the `init` function directly

  **Example:**
  ```ts
  import encode, { init } from '@jsquash/jxl/encode';
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

## @jsquash/jxl@1.1.0

### Adds

- Adds Node.js ESM support
    - Updates relative imports to use file extensions
    - Adds `module` field to relevant `package.json`
    - Updates pre.js to polyfill ImageData for Node.js
- Correctly exports init method from encode module

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/jxl@1.0.3

### Fixes

- Add missing `wasm-feature-detect` dependency

## @jsquash/jxl@1.0.2

### Fixes

- Stops the WebWorker module code from being instantiated when running in a Cloudflare Worker environment

## @jsquash/jxl@1.0.1

### Fixes

- Removed check threads util method that would have prevented threads not working outside of a worker context. That util was specific to the Squoosh app use case.

## @jsquash/jxl@1.0.0

Initial Release.
