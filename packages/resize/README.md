# @jsquash/resize

[![npm version](https://badge.fury.io/js/@jsquash%2Fresize.svg)](https://badge.fury.io/js/@jsquash%2Fresize)

An easy experience for resizing images in the browser or V8 environment. Powered by WebAssembly ⚡️ and Rust.

ℹ️ You will need to have an already decoded ImageData object to resize. This can be accomplished by using other jSquash modules or using the Canvas API, if available.

Uses squoosh's [Resize module](https://github.com/GoogleChromeLabs/squoosh/blob/dev/src/features/processors/resize/worker/resize.ts).
Composed of:
- https://github.com/PistonDevelopers/resize
- https://github.com/CryZe/wasmboy-rs/tree/master/hqx

Addtionally we have added support for the Magic Kernel algorithm for resizing images. This is a Rust implementation of the algorithm.
- https://github.com/SevInf/magic-kernel-rust

A [jSquash](https://github.com/jamsinclair/jSquash) package. Codecs and supporting code derived from the [Squoosh](https://github.com/GoogleChromeLabs/squoosh) app.

## Installation

```shell
npm install --save @jsquash/resize
# Or your favourite package manager alternative
```

## Usage

Note: You will need to either manually include the wasm files from the codec directory or use a bundler like WebPack or Rollup to include them in your app/server.

### resize(data: ImageData, options: ResizeOptions): Promise<ImageData>

Resizes an ImageData object to the specified dimensions.

#### data
Type: `ImageData`

#### options
Type: `Partial<ResizeOptions> & { width: number, height: number }`

The resize options for the output image. [See default values](./meta.ts).
- `width` (number) the width to resize the image to 
- `height` (number) the height to resize the image to
- `method?` (`'triangle'` | `'catrom'` | `'mitchell'` | `'lanczos3'` | `'hqx'` | `'magicKernel'` | `'magicKernelSharp2013'` | `'magicKernelSharp2021'`) the algorithm used to resize the image. Defaults to `lanczos3`.
- `fitMethod?` (`'stretch'` | `'contain'`) whether the image is stretched to fit the dimensions or cropped. Defaults to `stretch`.
- `premultiply?` (boolean) Defaults to `true`
- `linearRGB?` (boolean) Defaults to `true`


#### Example
```js
import { decode } from '@jsquash/jpeg';
import resize from '@jsquash/resize';

const imageBuffer = fetch('/images/example.jpg').then(res => res.arrayBuffer());
const originalImageData = await decode(imageBuffer);
const resizedImageData = await resize(originalImageData, { height: 300, width: 400 };
```

## Manual WASM initialisation (not recommended)

In most situations there is no need to manually initialise the provided WebAssembly modules.
The generated glue code takes care of this and supports most web bundlers.

One situation where this arises is when using the modules in Cloudflare Workers ([See the README for more info](/README.md#usage-in-cloudflare-workers)).

The main module exports `initHqx` and `initResize` functions that can be used to manually load their respective wasm module.

```js
import resize, { initResize } from '@jsquash/resize';

initResize(WASM_MODULE); // The `WASM_MODULE` variable will need to be sourced by yourself and passed as an ArrayBuffer.

resize(image, options);

// Optionally if you know you are using the hqx method or magicKernel method you can also initialise those modules
import { initHqx, initMagicKernel } from '@jsquash/resize';

initHqx(HQX_WASM_MODULE);
initMagicKernel(MAGIC_KERNEL_WASM_MODULE);
```
