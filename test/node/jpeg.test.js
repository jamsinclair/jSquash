import test from 'ava';
import { importWasmModule, getFixturesImage } from './utils.js';

import decode, { init as initDecode } from '@jsquash/jpeg/decode.js';
import encode, { init as initEncode } from '@jsquash/jpeg/encode.js';

test('can successfully decode image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test.jpeg'),
    importWasmModule('node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('should decode pixel data orientation as is by default', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('exif-rotated-270.jpeg'),
    importWasmModule('node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 100);
  t.is(data.height, 30);
  t.is(data.data.length, 4 * 100 * 30);
  // First pixel should be red
  t.is(data.data[0], 254);
  t.is(data.data[1], 0);
  t.is(data.data[2], 0);
});

test('should decode pixel data in respect to orientation when preserveOrientation is true', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('exif-rotated-270.jpeg'),
    importWasmModule('node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { preserveOrientation: true });
  t.is(data.width, 30);
  t.is(data.height, 100);
  t.is(data.data.length, 4 * 30 * 100);
  // First pixel should be green
  t.is(data.data[0], 0);
  t.is(data.data[1], 255);
  t.is(data.data[2], 1);
});

test('[regression] should correctly decode pixel data for jpeg with orientation 6 (90° CW)', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('exif-rotated-90.jpeg'),
    importWasmModule('node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { preserveOrientation: true });
  t.is(data.width, 30);
  t.is(data.height, 100);
  t.is(data.data.length, 4 * 30 * 100);
  // First pixel should be red
  t.is(data.data[0], 254);
  t.is(data.data[1], 0);
  t.is(data.data[2], 0);
});

test('can successfully encode image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode({
    data: new Uint8ClampedArray(4 * 50 * 50),
    height: 50,
    width: 50,
  });
  t.assert(data instanceof ArrayBuffer);
});
