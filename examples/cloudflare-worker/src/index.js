import decodeJpeg, { init as initJpegWasm } from '@jsquash/jpeg/decode';
import decodePng, { init as initPngWasm } from '@jsquash/png/decode';
import encodeWebp, { init as initWebpWasm } from '@jsquash/webp/encode';

// Simple Polyfill ImageData Object
globalThis.ImageData = class ImageData {
  constructor(data, width, height) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
};

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS; // 6 Months

const decodeImage = async (buffer, format) => {
  if (format === 'jpeg' || format === 'jpg') {
    // @Note, we need to manually instantiate the wasm module here
    // CF Workers do not support dynamic imports and inject the WASM binary as a global var
    initJpegWasm(JPEG_DEC_WASM);
    return decodeJpeg(buffer);
  } else if (format === 'png') {
    // @Note, we need to manually instantiate the wasm module here
    // CF Workers do not support dynamic imports and inject the WASM binary as a global var
    initPngWasm(PNG_DEC_WASM);
    return decodePng(buffer);
  }

  throw new Error(`Unsupported format: ${format}`);
}

async function handleRequest(request, ctx) {
  const requestUrl = new URL(request.url);
  const extension = requestUrl.pathname.split('.').pop();
  const isWebpSupported = request.headers.get('accept').includes('image/webp');
  const cacheKeyUrl = isWebpSupported ? requestUrl.toString().replace(`.${extension}`, '.webp') : requestUrl.toString();
  const cacheKey = new Request(cacheKeyUrl, request);
  const cache = caches.default;
  
  let response = await cache.match(cacheKey);

  if (!response) {
    // Assuming the pathname includes a full url, e.g. jamie.tokyo/images/compressed/spare-magnets.jpg
    response = await fetch(`https://${requestUrl.pathname.replace(/^\//, '')}`);
    if (response.status !== 200) {
      return new Response('Not found', { status: 404 });
    }

    if (isWebpSupported) {
      const imageData = await decodeImage(await response.arrayBuffer(), extension);
      // @Note, we need to manually instantiate the wasm module here
      // CF Workers do not support dynamic imports and inject the WASM binary as a global var
      await initWebpWasm(WEBP_ENC_WASM);
      const webpImage = await encodeWebp(imageData);
      response = new Response(webpImage, response);
      response.headers.set('Content-Type', 'image/webp');
    }

    response = new Response(response.body, response);
    response.headers.append("Cache-Control", `s-maxage=${CDN_CACHE_AGE}`);

    // Use waitUntil so you can return the response without blocking on
    // writing to cache
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
});
