import {
  assert,
  assertEquals,
} from 'https://deno.land/std@0.207.0/assert/mod.ts';

import decode from '../../packages/avif/dist/decode.js';
import encode from '../../packages/avif/dist/encode.js';

Deno.test('can successfully decode image', async (t) => {
  const testImage = await Deno.readFile('fixtures/test.avif');
  const data = await decode(testImage);
  assertEquals(data.width, 50);
  assertEquals(data.height, 50);
  assertEquals(data.data.length, 4 * 50 * 50);
});

Deno.test('can successfully encode image', async (t) => {
  const data = await encode(
    new ImageData(new Uint8ClampedArray(4 * 50 * 50), 50, 50),
  );
  assert(data instanceof ArrayBuffer);
});
