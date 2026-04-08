# @jsquash/jxr

[![npm version](https://badge.fury.io/js/@jsquash%2Fjxr.svg)](https://badge.fury.io/js/@jsquash%2Fjxr)

An easy way to decode JPEG XR images in the browser with WebAssembly.

Uses the [`jxrlib`](https://github.com/bvibber/jpegxr) library.

A [jSquash](https://github.com/jamsinclair/jSquash) package.

## Installation

```shell
npm install --save @jsquash/jxr
```

## Usage

Note: You will need to either manually include the wasm files from the codec directory or use a bundler like WebPack or Rollup to include them in your app/server.

### `decode(data: ArrayBuffer): Promise<ImageData>`

Decodes JPEG XR binary data to `ImageData`.

#### Example

```js
import { decode } from '@jsquash/jxr';

const imageBuffer = await fetch('/example.jxr').then((res) => res.arrayBuffer());
const imageData = await decode(imageBuffer);
```

## Manual WASM initialisation (not recommended)

The `decode` module exports an `init` function that can be used to manually load the wasm module.

```js
import decode, { init as initJXRDecode } from '@jsquash/jxr/decode';

initJXRDecode(WASM_MODULE);
const image = await fetch('./image.jxr').then((res) => res.arrayBuffer()).then(decode);
```

You can also pass custom options to the `init` function to customise the behaviour of the module. See the [Emscripten documentation](https://emscripten.org/docs/api_reference/module.html#Module) for more information.

```js
import decode, { init as initJXRDecode } from '@jsquash/jxr/decode';

initJXRDecode(null, {
  locateFile: (path, prefix) => `https://example.com/${prefix}/${path}`,
});
```

## Known Issues

See [jSquash Project README](https://github.com/jamsinclair/jSquash#known-issues)
