# jpegxr - Rust and JavaScript wrapper library for decoding JPEG XR images

This provides Rust and JavaScript wrappers around the C libjpegxr / jxrlib codec open-sourced by Microsoft. The code is included in-tree as it's no longer actively maintained, and the Codeplex source downloads may not last.

Currently only decoding is supported, but adding an encoder interface should be straightforward.

# Authors

The wrapped C JPEG XR library was written by many fine folks at Microsoft!
Rust and JS code wrapping it, and tweaks to the C code, are by Brooke Vibber `<bvibber@pobox.com>`.

# License

BSD-style license; see `license.md` or the headers in source files.

# Usage (Rust)

```rust
use fs;
use jpegxr::{ImageDecode, PixelInfo};

// ...

let input = File::open(filename)?;
let mut decoder = ImageDecode::with_reader(input)?;

let (width, height) = decoder.get_size()?;
let info = PixelInfo::from_format(get_pixel_format()?);
let stride = width * info.bytes_per_pixel() / 8;
let size = stride * height;

let buffer = Vec::<u8>::with_capacity(size);
buffer.resize(size, 0);
decoder.copy_all(&mut buffer, stride)?;

// now do stuff with the data
```

# Usage (JS)

Quick start:

```js
let fs = require('fs');
let jpegxr = require('jpegxr');

let bytes = fs.readFileSync(filename);
jpegxr().then((codec) => {
    let image = codec.decode(bytes);
    let stride = image.width * image.pixelInfo.bitsPerPixel / 8;
    // do stuff with image.bytes
});
```

The `jpegxr` module exports a factory function which asynchronously prepares the WebAssembly modules and returns an API wrapper object via a `Promise`.

Call its `decode` method with a `Uint8Array` of input bytes to get back an object with the following structure:

```js
{
    width: number,
    height: number,
    pixelInfo: {
        channels: number, // 3, 4 etc
        colorFormat: string, // "RGB" etc
        bitDepth: string, // "8", "32Float" etc
        bitsPerPixel: number, // 24, 32, 128 etc
        hasAlpha: boolean,
        premultipliedAlpha: boolean,
        bgr: boolean, // indicates RGB has blue channel first, not red
    },
    bytes: Uint8Array
}
```

Exceptions may be thrown in case of invalid data. The `bytes` array is standalone and backed by its own buffer, and does not need to be manually freed -- however this all incurs the cost of a single copy of both input and output data in/out of the WebAssembly module.


# Features

Currently sports the ability to read basic image format (width/height/pixel format) from a JPEG XR image and decode its data to memory. Plan to add encoding, all the pieces are there, just haven't set it up yet.

In Rust API you can ask for a subset of the image, which should allow progressive display during decoding, or to save time decoding unused macroblocks on a cropped view.

HDR images with 32-bit floating point RGBA elements, as saved from the NVIDIA game screen capture tool, appear to decode correctly.


# Future plans

* add encoder interface
* more testing of obscure stuff


# Building (JS)

Building the JS via emscripten should work on macOS and Linux. On Windows I recommend using WSL to set up a Linux environment.

Install the [emscripten SDK](https://emscripten.org/) and set it up in `PATH`. Either run `make` directly, or `npm run-script build` which runs `make` itself.

Run `npm test` to run a verification script which loads a sample floating point HDR screenshot and calculates average red, green, and blue intensities to prove it loaded correctly. Results should look something like this, with no exceptions thrown:

```
% make test
node wasm/test.js
{ decode: [Function: decode] }
{
  width: 3440,
  height: 1440,
  pixelInfo: {
    channels: 4,
    colorFormat: 'RGB',
    bitDepth: '32Float',
    bitsPerPixel: 128,
    hasAlpha: true,
    premultipledAlpha: false,
    bgr: false
  },
  bytes: Uint8Array(79257600) [
    0, 0, 136, 58, 0, 0, 250, 58, 0, 0,  63, 59,
    0, 0,   0,  0, 0, 0, 136, 58, 0, 0, 250, 58,
    0, 0,  63, 59, 0, 0,   0,  0, 0, 0, 136, 58,
    0, 0, 248, 58, 0, 0,  63, 59, 0, 0,   0,  0,
    0, 0, 136, 58, 0, 0, 246, 58, 0, 0,  62, 59,
    0, 0,   0,  0, 0, 0, 136, 58, 0, 0, 250, 58,
    0, 0,  63, 59, 0, 0,   0,  0, 0, 0, 136, 58,
    0, 0, 250, 58, 0, 0,  63, 59, 0, 0,   0,  0,
    0, 0, 136, 58,
    ... 79257500 more items
  ]
}
average red brightness: 1.4860534716607372
average green brightness: 2.4572176722254246
average blue brightness: 3.867482314063597
```

