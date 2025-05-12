import test from 'ava';
import { importWasmModule, getFixturesImage } from './utils.js';

import { init as initDecode, decode } from '@jsquash/png/decode.js';
import encode, { init as initEncode } from '@jsquash/png/encode.js';

test('can successfully decode image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully decode png with invalid ICC profile checksum', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('bad-icc-profile.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 16);
  t.is(data.height, 16);
  t.is(data.data.length, 4 * 16 * 16);
});

test('can successfully decode png with no alpha', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-rgb.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully decode grayscale png with no alpha', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-grayscale.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully decode grayscale png with alpha', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-grayscale-alpha.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully encode image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode({
    data: new Uint8ClampedArray(4 * 50 * 50),
    height: 50,
    width: 50,
  });
  t.assert(data instanceof ArrayBuffer);
});

test('can successfully decode 16bit image to RGB8', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-16bit.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
  t.is(data.data.byteLength, 4 * 50 * 50);
});

test('can successfully decode 8bit image to RGB16', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 16 });
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
  t.is(data.data.byteLength, 8 * 50 * 50);
});

test('can successfully decode 16bit image to RGB16', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-16bit.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 16 });
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
  t.is(data.data.byteLength, 8 * 50 * 50);
});

test('can successfully decode 16bit rgb image to RGB16', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-rgb-16bit.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 16 });
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
  t.is(data.data.byteLength, 8 * 50 * 50);
});

test('can successfully decode 16bit grayscale image to RGB16', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-grayscale-16bit.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 16 });
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
  t.is(data.data.byteLength, 8 * 50 * 50);
});

test('can successfully decode 16bit grayscale alpha image to RGB16', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-grayscale-alpha-16bit.png'),
    importWasmModule('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 16 });
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
  t.is(data.data.byteLength, 8 * 50 * 50);
});

test('can successfully encode 16bit image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode(
    {
      data: new Uint16Array(4 * 50 * 50),
      height: 50,
      width: 50,
    },
    { bitDepth: 16 },
  );
  t.assert(data instanceof ArrayBuffer);
});

test('throws error if bitDepth is not 8 or 16', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm',
  );
  await initEncode(encodeWasmModule);
  const error = await t.throwsAsync(() =>
    encode(
      {
        data: new Uint8Array(4 * 50 * 50),
        height: 50,
        width: 50,
      },
      { bitDepth: 32 },
    ),
  );
  t.is(error.message, 'Invalid bit depth. Must be either 8 or 16.');
});

test('throws error if array is Uint16Array and bitDepth is 8', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm',
  );
  await initEncode(encodeWasmModule);
  const error = await t.throwsAsync(() =>
    encode(
      {
        data: new Uint16Array(4 * 50 * 50),
        height: 50,
        width: 50,
      },
      { bitDepth: 8 },
    ),
  );
  t.is(
    error.message,
    'Invalid bit depth, must be 16 for Uint16Array or manually convert to RGB8 values with Uint8Array.',
  );
});

test('throws error if array is Uint8Array and bitDepth is 16', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm',
  );
  await initEncode(encodeWasmModule);
  const error = await t.throwsAsync(() =>
    encode(
      {
        data: new Uint8Array(4 * 50 * 50),
        height: 50,
        width: 50,
      },
      { bitDepth: 16 },
    ),
  );
  t.is(
    error.message,
    'Invalid bit depth, must be 8 for Uint8Array or manually convert to RGB16 values with Uint16Array.',
  );
});
