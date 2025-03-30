import test from 'ava';
import { importWasmModule, getFixturesImage } from './utils.js';

import decode, { decodeAnimated, init as initDecode } from '@jsquash/webp/decode.js';
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

test('can successfully decode animated webp image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-animated.webp'),
    importWasmModule('node_modules/@jsquash/webp/codec/dec/webp_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const frames = await decodeAnimated(testImage);
  t.is(frames.length, 3);
  for (const frame of frames) {
    t.is(frame.imageData.width, 100);
    t.is(frame.imageData.height, 100);
    t.is(frame.imageData.data.length, 4 * 100 * 100);
    t.is(frame.duration, 500);
  }
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
  });
  t.assert(data instanceof ArrayBuffer);
});
