# @jsquash/oxipng

[![npm version](https://badge.fury.io/js/@jsquash%2Foxipng.svg)](https://badge.fury.io/js/@jsquash%2Foxipng)

An easy experience for optimising PNG images in the browser. Powered by WebAssembly ⚡️ and Rust.

Uses the lovely [Oxipng](https://github.com/shssoichiro/oxipng) for png optimisation.

A [jSquash](https://github.com/jamsinclair/jSquash) package. Codecs and supporting code derived from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app.

## Installation

```shell
npm install --save @jsquash/oxipng
# Or your favourite package manager alternative
```

## Usage

Note: You will need to either manually include the wasm files from the codec directory or use a bundler like WebPack or Rollup to include them in your app/server.

### optimise(data: ArrayBuffer, options?: OptimiseOptions): Promise<ArrayBuffer>

Optimises a PNG image buffer or raw image data and resolves to the optimised PNG image buffer output

#### data
Type: `ArrayBuffer | ImageData`

#### options
Type: `Partial<OptimiseOptions>`

The Oxipng optimisation options for the output image. [See default values](./meta.ts).
- `interlace` (boolean) whether to use PNG interlacing or not. Interlacing will increase the size of an optimised image.
- `level` (number) is the optimisation level between 1 to 6. The higher the level, the higher the compression. Any level above 4 is not recommended.
- `optimiseAlpha` (boolean) whether to allow transparent pixels to be altered to improve compression.

#### Example
```js
import { optimise } from '@jsquash/oxipng';

const formEl = document.querySelector('form');
const formData = new FormData(formEl);
// Assuming user selected an input png file
const pngImageBuffer = await formData.get('image').arrayBuffer();

const optimisedPngBuffer = await optimise(pngImageBuffer, { level: 3 });
```

## Activate Multithreading

By default, the optimise function will use a single thread to optimise the image. If you want to speed this up you can enable multithreading with the following.

1. Move your calls to `optimise` into a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).
1. Configure your web server to use the following headers (this is [a security requirement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements))
    - `Cross-Origin-Opener-Policy: same-origin`
    - `Cross-Origin-Embedder-Policy: require-corp`

This will still only take effect in browsers that support multithreading. If the browser does not support it, it will fallback to single threaded mode

## Manual WASM initialisation (not recommended)

In most situations there is no need to manually initialise the provided WebAssembly modules.
The generated glue code takes care of this and supports most web bundlers.

One situation where this arises is when using the modules in Cloudflare Workers ([See the README for more info](/README.md#usage-in-cloudflare-workers)).

The `optimise` module exports an `init` function that can be used to manually load the wasm module.

```js
import optimise, { init } from '@jsquash/oxipng/optimise';

init(WASM_MODULE); // The `WASM_MODULE` variable will need to be sourced by yourself and passed as an ArrayBuffer.
const image = await fetch('./image.png').then(res => res.arrayBuffer()).then(optimise);
```
