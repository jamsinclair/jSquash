# jSquash 🥝

> Collection of WebAssembly image codecs that support the browser and are derived from the [Squoosh App](https://github.com/GoogleChromeLabs/squoosh)

Squoosh already provides a [Node.js library](https://github.com/GoogleChromeLabs/squoosh/tree/dev/libsquoosh).

The aim of this library is to provide an easy experience to encode, decode and modify images with the tools you know and love from Squoosh in the **Browser** and **V8 runtimes** 🖥️.

jSquash name is inspired by jQuery and Squoosh. It symbolizes the browser support focus of these packages.

## Differences with Squoosh

- The codecs and tools are built for both Web and Web Worker environments
- No dynamic code execution, the packages can be run in strict environments that do not allow code evaluation. Like Cloudflare Workers.
- Does not rely on TextEncoder/TextDecoder API (could reduce performance) but allows it to be run in simpler V8 runtimes that only support UTF-8 (Cloudflare Workers, Vercel Edge Functions etc.)

## Packages

- [@jSquash/avif](/packages/avif) - An encoder and decoder for AVIF images using the [libavif](https://github.com/AOMediaCodec/libavif) library
- [@jSquash/jpeg](/packages/jpeg) - An encoder and decoder for JPEG images using the [MozJPEG](https://github.com/mozilla/mozjpeg) library
- [@jSquash/jxl](/packages/jxl) - An encoder and decoder for JPEG XL images using the [libjxl](https://github.com/libjxl/libjxl) library
- [@jSquash/oxipng](/packages/oxipng) - A PNG image optimiser using [Oxipng](https://github.com/shssoichiro/oxipng)
- [@jSquash/png](/packages/png) - An encoder and decoder for PNG images using the [rust PNG crate](https://docs.rs/png/0.11.0/png/)
- [@jSquash/resize](/packages/resize) - An image resizer tool using rust [resize](https://github.com/PistonDevelopers/resize) and [hqx](https://github.com/CryZe/wasmboy-rs/tree/master/hqx) libraries. Supports both downscaling and upscaling.
- [@jSquash/webp](/packages/webp) - An encoder and decoder for WebP images using [libwebp](https://github.com/webmproject/libwebp)
- ...more to come

## Examples

- [Web App using image codecs bundled with Rollup](/examples/with-rollup)
- [Web App using image codecs bundled with Vite](/examples/with-vite)
- [Web App using image codecs bundled with Webpack](/examples/with-webpack)

## Usage in Cloudflare Workers

Using jSquash modules with Cloudflare Workers requires some additional steps so that the WASM binaries get included.

Depending on which format you are using check the examples below:
- [Cloudflare Worker (ES Module Format) function that upgrades images to webp](/examples/cloudflare-worker-esm-format)
- [Cloudflare Worker (Legacy Service Worker Format) function that upgrades images to webp](/examples/cloudflare-worker)

## Known Issues

### Issues with Vite and Vue build Environments

This may present itself as any of the following errors:
- `TypeError: Failed to construct 'URL': Invalid URL`
- `RuntimeError: Aborted(both async and sync fetching of the wasm failed). Build with -sASSERTIONS for more info.`
- Other console errors could also be related to this issue

As a workaround, update your `vite.config.js` file with the `optimizeDeps` property. Put affected module names in the exclude array. Vites dependency optimizer seems to be causing issues with the WASM modules.

```js
import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ["@jsquash/png"]
  }
})
```
