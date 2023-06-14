# Cloudflare Worker Example (Service Worker Format)

For this example, we will be using the [Cloudflare Worker](https://workers.cloudflare.com/) platform to upgrade images to WebP.

The example uses the legacy "Service Worker Format" which is still supported by Cloudflare Workers.

We can use the latest Wrangler CLI to run the example locally and deploy it to Cloudflare Workers.

## Running the example locally

1. Run `npm install`
2. Run `npm run start` to start the development server

## Usage of jSquash packages in Cloudflare Worker

One caveat is wrangler won't dynamically bundle the WASM modules with the worker.

You will need to ensure you configure the Worker to set these as global variables in the [wrangler.toml](wrangler.toml) file.
```
# wrangler.toml
[wasm_modules]
# Manually specify the path to the WASM module for each codec
JPEG_DEC_WASM = "node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm"
```

If using Wrangler v2 or above, you can also import the WASM modules from the node_modules folder [as seen in the ES Module Format example](/examples/cloudflare-worker-esm-format/README.md#usage-of-jsquash-packages-in-cloudflare-worker).

The `encode` and `decode` modules both export an `init` function that can be used to manually load the wasm module.

```js
import decode, { init as initJpegDecode } from '@jsquash/jpeg/decode';

await initJpegDecode(JPEG_DEC_WASM); // The global variable of the wasm module needs to be defined in the wrangler.toml file
const image = await fetch('./image.jpeg').then(res => res.arrayBuffer()).then(decode);
```
