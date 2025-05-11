import test from 'ava';
import { importWasmModule, getFixturesImage } from './utils.js';

import decode, { init as initDecode } from '@jsquash/avif/decode.js';
import encode, { init as initEncode } from '@jsquash/avif/encode.js';

test('can successfully decode image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test.avif'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 50);
  t.is(data.height, 50);
  t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully decode 10-bit image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-10bit.avif'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 10 });
  t.is(data.width, 128);
  t.is(data.height, 128);
  t.is(data.data.length, 4 * 128 * 128);

  for (let i = 0; i < data.data.length; i++) {
    const pixelValue = data.data[i];
    t.true(
      pixelValue >= 0 && pixelValue <= 1023,
      `Pixel value at index ${i} (value: ${pixelValue}) should be in the 0-1023 range.`,
    );
  }

  // Additionally, check that some pixel values are greater than 255 (greater than 8-bit)
  t.true(data.data.some((value) => value > 255));
});

test('can successfully decode 12-bit image', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-12bit.avif'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 12 });
  t.is(data.width, 128);
  t.is(data.height, 128);
  t.is(data.data.length, 4 * 128 * 128);

  for (let i = 0; i < data.data.length; i++) {
    const pixelValue = data.data[i];
    t.true(
      pixelValue >= 0 && pixelValue <= 4095,
      `Pixel value at index ${i} (value: ${pixelValue}) should be in the 0-4095 range.`,
    );
  }

  // Additionally, check that some pixel values are greater than 1023 (greater than 10-bit)
  t.true(data.data.some((value) => value > 1023));
});

test('can successfully decode 12-bit image to 10-bit precision', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-12bit.avif'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage, { bitDepth: 10 });
  t.is(data.width, 128);
  t.is(data.height, 128);
  t.is(data.data.length, 4 * 128 * 128);

  for (let i = 0; i < data.data.length; i++) {
    const pixelValue = data.data[i];
    t.true(
      pixelValue >= 0 && pixelValue <= 1023,
      `Pixel value at index ${i} (value: ${pixelValue}) should be in the 0-1023 range.`,
    );
  }

  // Additionally, check that some pixel values are greater than 255 (greater than 8-bit)
  t.true(data.data.some((value) => value > 255));
});

test('can successfully decode 12-bit image to 8-bit precision', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-12bit.avif'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 128);
  t.is(data.height, 128);
  t.is(data.data.length, 4 * 128 * 128);

  for (let i = 0; i < data.data.length; i++) {
    const pixelValue = data.data[i];
    t.true(
      pixelValue >= 0 && pixelValue <= 255,
      `Pixel value at index ${i} (value: ${pixelValue}) should be in the 0-255 range.`,
    );
  }
});

test('can successfully decode 10-bit image to 8-bit precision', async (t) => {
  const [testImage, decodeWasmModule] = await Promise.all([
    getFixturesImage('test-10bit.avif'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  initDecode(decodeWasmModule);
  const data = await decode(testImage);
  t.is(data.width, 128);
  t.is(data.height, 128);
  t.is(data.data.length, 4 * 128 * 128);

  for (let i = 0; i < data.data.length; i++) {
    const pixelValue = data.data[i];
    t.true(
      pixelValue >= 0 && pixelValue <= 255,
      `Pixel value at index ${i} (value: ${pixelValue}) should be in the 0-255 range.`,
    );
  }
});

test('can successfully encode image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode({
    data: new Uint8ClampedArray(4 * 50 * 50),
    height: 50,
    width: 50,
  });
  t.assert(data instanceof ArrayBuffer);
});

test('can successfully encode 10-bit image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode(
    {
      data: new Uint16Array(4 * 50 * 50),
      height: 50,
      width: 50,
    },
    {
      bitDepth: 10,
    },
  );
  t.assert(data instanceof ArrayBuffer);
});

test('can successfully encode 12-bit image', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  const data = await encode(
    {
      data: new Uint16Array(4 * 50 * 50),
      height: 50,
      width: 50,
    },
    {
      bitDepth: 12,
    },
  );
  t.assert(data instanceof ArrayBuffer);
});

test('throws error when encoding 10-bit image with Uint8Array-like data', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  const error = await t.throwsAsync(() =>
    encode(
      {
        data: new Uint8Array(4 * 50 * 50),
        height: 50,
        width: 50,
      },
      { bitDepth: 10 },
    ),
  );

  t.is(
    error.message,
    'Invalid image data for bit depth. Must use Uint16Array for bit depths greater than 8.',
  );
});

test('throws error when encoding 12-bit image with Uint8Array-like data', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm',
  );
  await initEncode(encodeWasmModule);
  const error = await t.throwsAsync(() =>
    encode(
      {
        data: new Uint8Array(4 * 50 * 50),
        height: 50,
        width: 50,
      },
      { bitDepth: 12 },
    ),
  );

  t.is(
    error.message,
    'Invalid image data for bit depth. Must use Uint16Array for bit depths greater than 8.',
  );
});
