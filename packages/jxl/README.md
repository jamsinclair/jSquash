# @jsquash/jxl

[![npm version](https://badge.fury.io/js/@jsquash%2Fjxl.svg)](https://badge.fury.io/js/@jsquash%2Fjxl)

An easy experience for encoding and decoding JPEG XL images in the browser. Powered by WebAssembly ⚡️.

⚠️ Only one stable browser supports displaying JPEG XL [so far](https://caniuse.com/jpegxl). This package is intended for experimentation and testing.

Uses the [libjxl](https://github.com/libjxl/libjxl) library.

A [jSquash](https://github.com/jamsinclair/jSquash) package. Codecs and supporting code derived from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app.

## Installation

```shell
npm install --save @jsquash/jxl
# Or your favourite package manager alternative
```

## Usage

Note: You will need to either manually include the wasm files from the codec directory or use a bundler like WebPack or Rollup to include them in your app/server.

### decode(data: ArrayBuffer): Promise<ImageData>

Decodes JPEG XL binary ArrayBuffer to raw RGB image data.

#### data
Type: `ArrayBuffer`

#### Example
```js
import { decode } from '@jsquash/jxl';

const formEl = document.querySelector('form');
const formData = new FormData(formEl);
// Assuming user selected an input JPEG XL file
const imageData = await decode(await formData.get('image').arrayBuffer());
```

### encode(data: ImageData, options?: EncodeOptions): Promise<ArrayBuffer>

Encodes raw RGB image data to JPEG format and resolves to an ArrayBuffer of binary data.

#### data
Type: `ImageData`

#### options
Type: `Partial<EncodeOptions>`

The JPEG XL encoder options for the output image. [See default values](./meta.ts).

#### Example
```js
import { encode } from '@jsquash/jxl';

async function loadImage(src) {
  const img = document.createElement('img');
  img.src = src;
  await new Promise(resolve => img.onload = resolve);
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [img.width, img.height];
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

const rawImageData = await loadImage('/example.png');
const jpegBuffer = await encode(rawImageData);
```

#### Lossless Example
```js
import { encode } from '@jsquash/jxl';

const rawImageData = await loadImage('/example.png');
// Lossless encoding can be achieved by setting the `lossless` option to `true`
const jxlBuffer = await encode(rawImageData, { lossless: true });
```

## Activate Multithreading

By default, the encode function will use a single thread to encode the image. If you want to speed this up you can enable multithreading with the following.

1. Move your calls to `encode` into a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).
1. Configure your web server to use the following headers (this is [a security requirement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements))
    - `Cross-Origin-Opener-Policy: same-origin`
    - `Cross-Origin-Embedder-Policy: require-corp`

This will still only take effect in browsers and devices that support multithreading. If the browser does not support it, it will fallback to single threaded mode

## Manual WASM initialisation (not recommended)

In most situations there is no need to manually initialise the provided WebAssembly modules.
The generated glue code takes care of this and supports most web bundlers.

One situation where this arises is when using the modules in Cloudflare Workers ([See the README for more info](/README.md#usage-in-cloudflare-workers)).

The `encode` and `decode` modules both export an `init` function that can be used to manually load the wasm module.

```js
import decode, { init as initJXLDecode } from '@jsquash/jxl/decode';

initJXLDecode(WASM_MODULE); // The `WASM_MODULE` variable will need to be sourced by yourself and passed as an ArrayBuffer.
const image = await fetch('./image.jpeg').then(res => res.arrayBuffer()).then(decode);
```

You can also pass custom options to the `init` function to customise the behaviour of the module. See the [Emscripten documentation](https://emscripten.org/docs/api_reference/module.html#Module) for more information.

```js
import decode, { init as initJXLDecode } from '@jsquash/jxl/decode';

initJXLDecode(null, {
  // Customise the path to load the wasm file
  locateFile: (path, prefix) => `https://example.com/${prefix}/${path}`,
});
const image = await fetch('./image.jxl').then(res => res.arrayBuffer()).then(decode);
```

## Known Issues

See [jSquash Project README](https://github.com/jamsinclair/jSquash#known-issues)
