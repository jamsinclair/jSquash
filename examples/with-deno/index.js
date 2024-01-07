/**
 * To run this example with Deno, run the following command:
 * deno run --allow-net --allow-read --allow-write index.js
 *
 * Note: Requires Deno versions greater than v1.39.0, which introduced the ImageData Web API
 */
import { decode } from 'https://unpkg.com/@jsquash/jpeg@latest?module';
import { encode } from 'https://unpkg.com/@jsquash/webp@latest?module';

const jpegBuffer = await Deno.readFile('example.jpg');
const imageData = await decode(jpegBuffer);
const webpBuffer = await encode(imageData);

// Deno writeFile requires a Uint8Array as input
Deno.writeFile('example.webp', new Uint8Array(webpBuffer));
