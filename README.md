# jSquash 🥝

> Collection of WebAssemebly image codecs that support the browser and are derived from the [Squoosh App](https://github.com/GoogleChromeLabs/squoosh)

Squoosh already provides a [Node.js library](https://github.com/GoogleChromeLabs/squoosh/tree/dev/libsquoosh).

The aim of this library is to provide an easy experience to encode, decode and modify images with the tools you know and love from Squoosh in the **Browser** and **V8 runtimes** 🖥️.

jSquash name is inspired by jQuery and Squoosh. It symbolizes the browser support focus of these packages.

## Differences with Squoosh

- The codecs and tools are built for both Web and Web Worker environments
- No dynamic code execution, can be run in strict environments that do not allow code evaluation. Like Cloudflare Workers.
- Does not rely on TextEncoder/TextDecoder API (could reduce performance) but allows it to be run in simpler V8 runtimes that only support UTF-8 (Cloudflare Workers, Vercel Edge Functions etc.)

## Packages

- [@jSquash/avif](/packages/avif) - An encoder and decoder for AVIF images using the [libavif](https://github.com/AOMediaCodec/libavif) library
- [@jSquash/jpeg](/packages/jpeg) - An encoder and decoder for JPEG images using the [MozJPEG](https://github.com/mozilla/mozjpeg) library
- [@jSquash/oxipng](/packages/oxipng) - A PNG image optimiser using [Oxipng](https://github.com/shssoichiro/oxipng)
- [@jSquash/png](/packages/png) - An encoder and decoder for PNG images using the [rust PNG crate](https://docs.rs/png/0.11.0/png/)
- [@jSquash/resize](/packages/resize) - An image resizer tool using rust [resize](https://github.com/PistonDevelopers/resize) and [hqx](https://github.com/CryZe/wasmboy-rs/tree/master/hqx) libraries. Supports both downscaling and upscaling.
- [@jSquash/webp](/packages/webp) - An encoder and decoder for WebP images using [libwebp](https://github.com/webmproject/libwebp)
- ...more to come

## Examples

- [Cloudflare Worker function that upgrades images to webp](/examples/cloudflare-worker)
- [Web App using image codecs bundled with Rollup](/examples/with-rollup)
- [Web App using image codecs bundled with Webpack](/examples/with-webpack)
