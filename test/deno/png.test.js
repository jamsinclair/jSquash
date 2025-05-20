import test from 'ava';
import { importWasmModule, getFixturesImage } from './utils.js';

import decode, { init as initDecode } from '@jsquash/png/decode.js';
import encode, { init as initEncode } from '@jsquash/png/encode.js';

test('can successfully decode image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test.png'),
    importWasmModule(
      'node_modules/@jsquash/png/codec/png/pkg/squoosh_png_bg.wasm',
    ),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully decode png with invalid ICC profile checksum', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('broken.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 16);
  t.is(data.height, 16);
  t.is(data.data.length, 4 * 16 * 16);
});

test('can successfully encode image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/png/codec/png/pkg/squoosh_png_bg.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode({
    data: new Uint8ClampedArray(4 * 50 * 50),
    height: 50,
    width: 50,
  });
  // @TODO Next breaking change, make PNG encode return an ArrayBuffer to match other packages
  t.assert(!(data instanceof ArrayBuffer));
});
