import test from 'ava';
import { importWasmModule, getFixturesImage } from './utils.js';

import decode, { init as initDecode } from '@jsquash/webp/decode.js';
import encode, { init as initEncode } from '@jsquash/webp/encode.js';

test('can successfully decode image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test.webp'),
    importWasmModule('node_modules/@jsquash/webp/codec/dec/webp_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully encode image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/webp/codec/enc/webp_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode({
    data: new Uint8ClampedArray(4 * 50 * 50),
    height: 50,
    width: 50,
    colorSpace: 'srgb' as const,
  });
  t.assert(data instanceof ArrayBuffer);
});

test('caps quality at qmax', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/webp/codec/enc/webp_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  // A flat image encodes to the same handful of bytes at any quality, so the
  // ceiling only shows up on something with detail in it.
  const width = 64;
  const height = 64;
  const data = new Uint8ClampedArray(4 * width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      data[i] = (x * 4) % 256;
      data[i + 1] = (y * 4) % 256;
      data[i + 2] = ((x + y) * 3) % 256;
      data[i + 3] = 255;
    }
  }
  const image = { data, width, height, colorSpace: 'srgb' as const };
  const capped = await encode(image, { quality: 90, qmax: 40 });
  const uncapped = await encode(image, { quality: 90 });
  t.true(capped.byteLength < uncapped.byteLength);
});
