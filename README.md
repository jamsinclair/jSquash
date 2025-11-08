# jSquash 🥝

> Collection of WebAssembly image codecs that support the browser and are derived from the [Squoosh App](https://github.com/GoogleChromeLabs/squoosh)

The aim of this library is to provide an easy experience to encode, decode and modify images with the tools you know and love from Squoosh in the **Browser** and **Web Worker** environments.

jSquash name is inspired by jQuery and Squoosh. It symbolizes the browser support focus of these packages.

⚠️ There is limited support for Node.js environments. The experimental Node.js support is provided for convenience and is not the primary focus of this project. For much better Node based alternatives please check out the [Squoosh Node.js library](https://github.com/GoogleChromeLabs/squoosh/tree/918c596cba36a46ff3d7aa8ffd69580bd22528e2/libsquoosh) and [Sharp](https://github.com/lovell/sharp).

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
- [@jSquash/qoi](/packages/qoi) - An encoder and decoder for the "Quite Ok Image Format" using the [official library](https://github.com/phoboslab/qoi)
- [@jSquash/resize](/packages/resize) - An image resizer tool using rust [resize](https://github.com/PistonDevelopers/resize), [hqx](https://github.com/CryZe/wasmboy-rs/tree/master/hqx) and [magic-kernel](https://github.com/SevInf/magic-kernel-rust) libraries. Supports both downscaling and upscaling.
- [@jSquash/webp](/packages/webp) - An encoder and decoder for WebP images using [libwebp](https://github.com/webmproject/libwebp)
- ...more to come

⚠️ All packages are ESM modules. You may need to manually transpile the packages if your build environment still relies on Commonjs formats.

## Usage in the Browser

You can use the packages directly from the Unpkg CDN and can be the easiest way to get started.

```js
import { decode } from "https://esm.sh/@jsquash/jpeg";
import { encode } from "https://esm.sh/@jsquash/webp";

const imageResponse = await fetch("https://picsum.photos/200/300.jpg");
const imageData = await decode(await imageResponse.arrayBuffer());
const webpImageBuffer = await encode(imageData);
```

To target a specific version, you can use the `@version` syntax.
```js
import { encode } from "https://esm.sh/@jsquash/webp@1.2.0";
```

Checkout the [with CDN](/examples/with-cdn) example for a working demo.

## Usage in Node.js

Using jSquash modules with Node.js requires some additional steps so that the WASM binaries can be included.
The support is limited and the WASM modules are not optimized for speed with Node.js.

Check out the [with Node.js](/examples/with-node) example for a working demo.

## Usage in Cloudflare Workers

Using jSquash modules with Cloudflare Workers requires some additional steps so that the WASM binaries get included.

Depending on which format you are using check the examples below:
- [Cloudflare Worker (ES Module Format) function that upgrades images to webp](/examples/cloudflare-worker-esm-format)
- [Cloudflare Worker (Legacy Service Worker Format) function that upgrades images to webp](/examples/cloudflare-worker)

## Other Examples

- [Web App using image codecs bundled with Rollup](/examples/with-rollup)
- [Web App using image codecs bundled with Vite](/examples/with-vite)
- [Web App using image codecs bundled with Webpack](/examples/with-webpack)
- [Deno script that converts images from the file system](/examples/with-deno)

## Known Issues

### Issues with Vite and Vue build environments

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

### Issues with Nuxt build environments

This may present itself as a `Cannot find module` error. This is likely because Nuxt is anticipating third party modules to be in the Commonjs format.

Setting the following Nuxt config with the jSquash packages that your app uses seems to resolve it.

```js
export default defineNuxtConfig({
  build: {
    transpile: ["@jsquash/png"],
  },
  vite: {
    optimizeDeps: {
      exclude: ["@jsquash/png"],
    },
  },
});
```

### Issues with Nuxt/Vite and nested Web Workers

There is a known Vite bug breaking production code compilation when using a worker that references another worker, see [issue #19](https://github.com/jamsinclair/jSquash/issues/19) for more information.

```
Unexpected early exit. This happens when Promises returned by plugins cannot resolve. Unfinished hook action(s) on exit:
```

In the meantime, you can install special builds that don't use workers to work around this issue:
- [@jsquash/avif@1.1.2-single-thread-only](https://www.npmjs.com/package/@jsquash/avif/v/1.1.2-single-thread-only)
- [@jsquash/jxl@1.0.2-single-thread-only](https://www.npmjs.com/package/@jsquash/jxl/v/1.0.2-single-thread-only)
- [@jsquash/oxipng@1.0.1-single-thread-only](https://www.npmjs.com/package/@jsquash/oxipng/v/1.0.1-single-thread-only)
