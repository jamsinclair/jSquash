# Cloudflare Worker Example (ES Module Format)

For this example, we will be using the [Cloudflare Worker](https://workers.cloudflare.com/) platform to upgrade images to WebP.

The example also uses the ES Module Format which is now the preferred way to use Cloudflare Workers.

We can use the latest Wrangler CLI to run the example locally and deploy it to Cloudflare Workers.

## Running the example locally

1. Run `npm install`
2. Run `npm run start` to start the development server

## Usage of jSquash packages in Cloudflare Worker

One caveat is wrangler won't dynamically bundle the WASM modules with the worker.

You will need to "import" the correct WASM module manually. Behind the scenes, on deployment, the WASM modules are set as global variables.

The `encode` and `decode` modules both export an `init` function that can be used to manually load the wasm module.

```js
import decode, { init as initJpegDecode } from '@jsquash/jpeg/decode';

// Import the correct WASM module from the node_modules folder
import JPEG_DEC_WASM from '../node_modules/@jsquash/jpeg/decode/dist/decode.wasm';

await initJpegDecode(JPEG_DEC_WASM); // JPEG_DEC_WASM is the name of the imported file
const image = await fetch('./image.jpeg').then(res => res.arrayBuffer()).then(decode);
```
