/**
 * To run this example with Deno, run the following command:
 * deno run --allow-net --allow-read --allow-write index.js
 */
import { decode } from 'https://unpkg.com/@jsquash/jpeg@latest?module';
import { encode } from 'https://unpkg.com/@jsquash/webp@latest?module';

// Polyfill ImageData for Deno
// Issue for tracking implementation: https://github.com/denoland/deno/issues/19288
if (typeof ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(data, width, height) {
      this.data = data;
      this.width = width;
      this.height = height;
    }
  };
}

const pngBuffer = await Deno.readFile('example.jpg');
const imageData = await decode(pngBuffer);
const webpBuffer = await encode(imageData);

// Deno writeFile requires a Uint8Array as input
Deno.writeFile('example.webp', new Uint8Array(webpBuffer));
