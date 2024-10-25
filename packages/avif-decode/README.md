# @jsquash/avif

[![npm version](https://badge.fury.io/js/@jsquash%2Favif.svg)](https://badge.fury.io/js/@jsquash%2Favif)

An easy experience for encoding and decoding AVIF images in the browser. Powered by WebAssembly ⚡️.

Uses the [libavif](https://github.com/AOMediaCodec/libavif) library.

A [jSquash](https://github.com/jamsinclair/jSquash) package. Codecs and supporting code derived from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app.

## Installation

```shell
npm install --save @jsquash/avif
# Or your favourite package manager alternative
```

## Usage

Note: You will need to either manually include the wasm files from the codec directory or use a bundler like WebPack or Rollup to include them in your app/server.

### decode(data: ArrayBuffer): Promise<ImageData>

Decodes AVIF binary ArrayBuffer to raw RGB image data.

#### data
Type: `ArrayBuffer`

#### Example
```js
import { decode } from '@jsquash/avif';

const formEl = document.querySelector('form');
const formData = new FormData(formEl);
// Assuming user selected an input avif file
const imageData = await decode(await formData.get('image').arrayBuffer());
```

### encode(data: ImageData, options?: EncodeOptions): Promise<ArrayBuffer>

Encodes raw RGB image data to AVIF format and resolves to an ArrayBuffer of binary data.

#### data
Type: `ImageData`

#### options
Type: `Partial<EncodeOptions>`

The AVIF encoder options for the output image. [See default values](./meta.ts).

#### Example
```js
import { encode } from '@jsquash/avif';

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
const avifBuffer = await encode(rawImageData);
```

## Manual WASM initialisation (not recommended)

In most situations there is no need to manually initialise the provided WebAssembly modules.
The generated glue code takes care of this and supports most web bundlers.

One situation where this arises is when using the modules in Cloudflare Workers ([See the README for more info](/README.md#usage-in-cloudflare-workers)).

The `encode` and `decode` modules both export an `init` function that can be used to manually load the wasm module.

```js
import decode, { init as initAvifDecode } from '@jsquash/avif/decode';

initAvifDecode(WASM_MODULE); // The `WASM_MODULE` variable will need to be sourced by yourself and passed as an ArrayBuffer.
const image = await fetch('./image.avif').then(res => res.arrayBuffer()).then(decode);
```

You can also pass custom options to the `init` function to customise the behaviour of the module. See the [Emscripten documentation](https://emscripten.org/docs/api_reference/module.html#Module) for more information.

```js
import decode, { init as initAvifDecode } from '@jsquash/avif/decode';

initAvifDecode(null, {
  // Customise the path to load the wasm file
  locateFile: (path, prefix) => `https://example.com/${prefix}/${path}`,
});
const image = await fetch('./image.avif').then(res => res.arrayBuffer()).then(decode);
```

## Known Issues

See [jSquash Project README](https://github.com/jamsinclair/jSquash#known-issues)
