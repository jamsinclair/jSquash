// import { assert, assertEquals } from "jsr:@std/assert@1";

import decode from '../../packages/jxl/dist/decode.js';
import encode from '../../packages/jxl/dist/encode.js';

// Deno.test('can successfully decode image', async () => {
//   const data = await decode(await Deno.readFile('fixtures/test.avif'));
//   assertEquals(data.width, 50);
//   assertEquals(data.height, 50);
//   assertEquals(data.data.length, 4 * 50 * 50);
// });

// Deno.test('can successfully encode image', async () => {
console.log('test start');
const data = await encode(new ImageData(50, 50));
console.log('finish encode');
console.log('you should see this');
//   assert(data instanceof ArrayBuffer);
// });
