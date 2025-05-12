# @jsquash/png

[![npm version](https://badge.fury.io/js/@jsquash%2Fpng.svg)](https://badge.fury.io/js/@jsquash%2Fpng)

An easy experience for encoding and decoding PNG images in the browser. Powered by WebAssembly ⚡️.

Uses the [rust PNG crate](https://docs.rs/png/0.11.0/png/).

A [jSquash](https://github.com/jamsinclair/jSquash) package. Codecs and supporting code derived from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app.

## Installation

```shell
npm install --save @jsquash/png
# Or your favourite package manager alternative
```

## Usage

Note: You will need to either manually include the wasm files from the codec directory or use a bundler like WebPack or Rollup to include them in your app/server.

### decode(data: ArrayBuffer, options?: { bitDepth?: 8 | 16 }): Promise<ImageData | ImageDataRGBA16>

Decodes PNG binary ArrayBuffer to raw image data. 
By default, it decodes to 8-bit RGBA image data. 
If `options.bitDepth` is set to 16, it decodes to 16-bit RGBA image data.

#### data
Type: `ArrayBuffer`

#### options (optional)
Type: `object`
- `bitDepth` (optional): `8 | 16` - The desired bit depth of the output. Defaults to `8`.

#### Example
```js
import { decode } from '@jsquash/png';

const formEl = document.querySelector('form');
const formData = new FormData(formEl);
// Decode to 8-bit RGBA
const imageData8bit = await decode(await formData.get('image').arrayBuffer());
// Decode to 16-bit RGBA
const imageData16bit = await decode(await formData.get('image').arrayBuffer(), { bitDepth: 16 });
```

### encode(data: ImageData | ImageDataRGBA16, options?: { bitDepth?: 8 | 16 }): Promise<ArrayBuffer>

> ℹ️ You may want to use the [@jsquash/oxipng](/packages/oxipng) package instead. It can both optimise and encode to PNG directly from raw image data.

Encodes raw RGB image data to PNG format and resolves to an ArrayBuffer of binary data.

Can optionally specify the bit depth of the output PNG. The default is 8-bit. When set to 16-bit, the input data be of the following format:

```ts
{
  data: Uint16Array;
  width: number;
  height: number;
}
```

#### data
Type: `ImageData` or for 16-bit images `{ data: Uint16Array; width: number; height: number; }`

#### Example
```js
import { encode } from '@jsquash/png';

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

const rawImageData = await loadImage('/example.jpg');
const pngBuffer = await encode(rawImageData);
```

#### Example with 16-bit image data
```js
import { encode } from '@jsquash/png';

async function create16bitImage(src) {
  const pixels = new Uint16Array(4 * 256 * 256);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = Math.floor(Math.random() * 65535); // R
    pixels[i + 1] = Math.floor(Math.random() * 65535); // G
    pixels[i + 2] = Math.floor(Math.random() * 65535); // B
    pixels[i + 3] = 65535; // A
  }
  return {
    data: pixels,
    width: 256,
    height: 256,
  };
}

const rawImageData = await create16bitImage();
const png16bitBuffer = await encode(rawImageData, { bitDepth: 16 });
```

## Manual WASM initialisation (not recommended)

In most situations there is no need to manually initialise the provided WebAssembly modules.
The generated glue code takes care of this and supports most web bundlers.

One situation where this arises is when using the modules in Cloudflare Workers ([See the README for more info](/README.md#usage-in-cloudflare-workers)).

The `encode` and `decode` modules both export an `init` function that can be used to manually load the wasm module.

```js
import decode, { init as initPngDecode } from '@jsquash/png/decode';

initPngDecode(WASM_MODULE); // The `WASM_MODULE` variable will need to be sourced by yourself and passed as an ArrayBuffer.
const image = await fetch('./image.png').then(res => res.arrayBuffer()).then(decode);
```
