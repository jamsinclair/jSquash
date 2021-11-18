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
