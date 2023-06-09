# @jsquash/png

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

### decode(data: ArrayBuffer): Promise<ImageData>

Decodes PNG binary ArrayBuffer to raw RGB image data.

#### data
Type: `ArrayBuffer`

#### Example
```js
import { decode } from '@jsquash/png';

const formEl = document.querySelector('form');
const formData = new FormData(formEl);
const imageData = await decode(await formData.get('image').arrayBuffer());
```

### encode(data: ImageData): Promise<ArrayBuffer>

Encodes raw RGB image data to PNG format and resolves to an ArrayBuffer of binary data.

#### data
Type: `ImageData`

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

## Manual WASM initialisation (not recommended)

In most situations there is no need to manually initialise the provided WebAssembly modules.
The generated glue code takes care of this and supports most web bundlers.

One exception is CloudFlare workers. The environment at this time (this could change in the future) does not allow code to be dynamically imported. It needs to be bundled at runtime. WASM modules are set as global variables. [See the Cloudflare workers example](/examples/cloudflare-worker).

The `encode` and `decode` modules both export an `init` function that can be used to manually load the wasm module.

```js
import decode, { init as initPngDecode } from '@jsquash/png/decode';

initPngDecode(WASM_MODULE); // The global variable of the wasm module needs to be defined in the wrangler.toml file
const image = await fetch('./image.png').then(res => res.arrayBuffer()).then(decode);
```
