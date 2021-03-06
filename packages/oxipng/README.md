# @jsquash/oxipng

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

Optimises a PNG image buffer and resolves to the optimised buffer output

#### data
Type: `ArrayBuffer`

#### options
Type: `Partial<OptimiseOptions>`

The Oxipng optimisation options for the output image. [See default values](./meta.ts).
- `interlace` (boolean) whether to use PNG interlacing or not. Interlacing will increase the size of an optimised image.
- `level` (number) is the optimisation level between 1 to 6. The higher the level, the higher the compression. Any level above 4 is not recommended.


#### Example
```js
import { optimise } from '@jsquash/oxipng';

const formEl = document.querySelector('form');
const formData = new FormData(formEl);
// Assuming user selected an input png file
const pngImageBuffer = await formData.get('image').arrayBuffer();

const optimisedPngBuffer = await optimise(pngImageBuffer, { level: 3 });
```

## Manual WASM initialisation (not recommended)

In most situations there is no need to manually initialise the provided WebAssembly modules.
The generated glue code takes care of this and supports most web bundlers.

One exception is CloudFlare workers. The environment at this time (this could change in the future) does not allow code to be dynamically imported. It needs to be bundled at runtime. WASM modules are set as global variables. [See the Cloudflare workers example](examples/cloudflare-worker).

The `optimise` module exports an `init` function that can be used to manually load the wasm module.

```js
import optimise, { init } from '@jsquash/oxipng/optimise';

const WASM_MODULE = // A WebAssembly.Module object of the compiled wasm binary
init(WASM_MODULE);
const image = await fetch('./image.png').then(res => res.arrayBuffer()).then(optimise);
```
