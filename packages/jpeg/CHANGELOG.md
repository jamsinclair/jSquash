# Changelog

## @jsquash/jpeg@1.6.0

### Adds

- Adds support for only providing a module option override to the `init` function directly

  **Example:**
  ```ts
  import encode, { init } from '@jsquash/jpeg/encode';
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

## @jsquash/jpeg@1.5.0

### Adds

- Adds ability to preserve the orientation of the image when decoding. When set to `true`, the image will be rotated to the correct orientation. This is useful when the image has an orientation metadata tag that needs to be respected. By default, this is set to `false`. Note: if you are constrained on memory usage, you may want to consider rotating the image yourself either before or after decoding.

## @jsquash/jpeg@1.4.0

### Adds

- Adds ability to customise Emscripten module options, e.g. define your own `locateFile` method.

## @jsquash/jpeg@1.3.0

### Adds

- Adds Node.js ESM support
    - Updates relative imports to use file extensions
    - Adds `module` field to relevant `package.json`
    - Updates pre.js to polyfill ImageData for Node.js

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/jpeg@1.2.0

### Added 

- Include polyfills for Cloudflare Worker environment for easier compatibility
