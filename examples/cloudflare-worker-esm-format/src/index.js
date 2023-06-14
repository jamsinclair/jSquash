import decodeJpeg, { init as initJpegWasm } from '@jsquash/jpeg/decode';
import decodePng, { init as initPngWasm } from '@jsquash/png/decode';
import encodeWebp, { init as initWebpWasm } from '@jsquash/webp/encode';

// @Note, We need to manually import the WASM binaries below so that we can use them in the worker
// CF Workers do not support dynamic imports
import JPEG_DEC_WASM from "../node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm";
import PNG_DEC_WASM from "../node_modules/@jsquash/png/codec/squoosh_png_bg.wasm";
import WEBP_ENC_WASM from "../node_modules/@jsquash/webp/codec/enc/webp_enc_simd.wasm";

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS; // 6 Months

const decodeImage = async (buffer, format) => {
  if (format === 'jpeg' || format === 'jpg') {
    // @Note, we need to manually initialise the wasm module here from wasm import at top of file
    await initJpegWasm(JPEG_DEC_WASM);
    return decodeJpeg(buffer);
  } else if (format === 'png') {
    // @Note, we need to manually initialise the wasm module here from wasm import at top of file
    await initPngWasm(PNG_DEC_WASM);
    return decodePng(buffer);
  }

  throw new Error(`Unsupported format: ${format}`);
}

/**
 * This request handler could be used as an Image CDN example. It does the following:
 * 1. Check if the image is already cached
 * 2. If not, fetch the image from the origin
 * 3. If the client supports webp, encode the image to webp
 * 4. Cache the image
 * 5. Return the image
 */
async function handleRequest(request, _env, ctx) {
  const requestUrl = new URL(request.url);
  const extension = requestUrl.pathname.split('.').pop();
  const isWebpSupported = request.headers.get('accept').includes('image/webp');
  const cacheKeyUrl = isWebpSupported ? requestUrl.toString().replace(`.${extension}`, '.webp') : requestUrl.toString();
  const cacheKey = new Request(cacheKeyUrl, request);
  const cache = caches.default;

  const supportedExtensions = ['jpg', 'jpeg', 'png'];
  if (!supportedExtensions.includes(extension)) {
    return new Response(`<doctype html>
<title>Unsupported image format</title>
<h1>Unsupported image format or missing image path</h1>
<p>Supported formats: ${supportedExtensions.join(', ')}</p>
<p>For this @jSquash Cloudflare Worker example you need to specify the image url as a path, e.g. <a href="/jamie.tokyo/images/compressed/spare-magnets.jpg">https://&lt;worker-url&gt;/jamie.tokyo/images/compressed/spare-magnets.jpg</a></p>
    `, { status: 404, headers: { 'Content-Type': 'text/html' } });
  }

  let response = await cache.match(cacheKey);

  if (!response) {
    // Assuming the pathname includes a full url, e.g. jamie.tokyo/images/compressed/spare-magnets.jpg
    response = await fetch(`https://${requestUrl.pathname.replace(/^\//, '')}`);
    if (response.status !== 200) {
      return new Response('Not found', { status: 404 });
    }

    if (isWebpSupported) {
      const imageData = await decodeImage(await response.arrayBuffer(), extension);
      // @Note, we need to manually initialise the wasm module here from wasm import at top of file
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

export default {
  fetch: handleRequest
}
