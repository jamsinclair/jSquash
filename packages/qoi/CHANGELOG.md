# Changelog

## @jsquash/qoi@1.1.0

### Adds

- Adds support for only providing a module option override to the `init` function directly

  **Example:**
  ```ts
  import encode, { init } from '@jsquash/qoi/encode';
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

## @jsquash/qoi@1.0.0

### Adds

- Initial release of the QOI codec
