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

test('throws error when encoding 10-bit image with non-Uint16Array data', async (t) => {
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

test('throws error when encoding 12-bit image with non-Uint16Array data', async (t) => {
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

test('can successfully encode and decode lossless image', async (t) => {
  const [encodeWasmModule, decodeWasmModule] = await Promise.all([
    importWasmModule('node_modules/@jsquash/avif/codec/enc/avif_enc.wasm'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  await initEncode(encodeWasmModule);
  initDecode(decodeWasmModule);

  const originalImageData = {
    width: 10,
    height: 10,
    data: new Uint8ClampedArray(4 * 10 * 10),
  };
  // Fill with some non-zero data
  for (let i = 0; i < originalImageData.data.length; i++) {
    originalImageData.data[i] = (i * 3 + 7) % 256;
  }

  const encodedData = await encode(originalImageData, { lossless: true });
  t.assert(encodedData instanceof ArrayBuffer);

  const decodedData = await decode(encodedData);

  t.is(decodedData.width, originalImageData.width);
  t.is(decodedData.height, originalImageData.height);
  t.deepEqual(
    decodedData.data,
    originalImageData.data,
    'Decoded data should match original for lossless',
  );
});

test('encodes lossless even with conflicting quality option', async (t) => {
  const [encodeWasmModule, decodeWasmModule] = await Promise.all([
    importWasmModule('node_modules/@jsquash/avif/codec/enc/avif_enc.wasm'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  await initEncode(encodeWasmModule);
  initDecode(decodeWasmModule);

  const originalImageData = {
    width: 8,
    height: 8,
    data: new Uint8ClampedArray(4 * 8 * 8),
  };
  for (let i = 0; i < originalImageData.data.length; i++) {
    originalImageData.data[i] = (i * 5) % 256;
  }

  // Encode with lossless true but also a lossy quality setting
  const encodedData = await encode(originalImageData, {
    lossless: true,
    quality: 50,
  });
  t.assert(encodedData instanceof ArrayBuffer);

  const decodedData = await decode(encodedData);

  t.deepEqual(
    decodedData.data,
    originalImageData.data,
    'Decoded data should match original even with conflicting quality',
  );
});

test('encodes lossless (YUV444) even with conflicting subsample option', async (t) => {
  const [encodeWasmModule, decodeWasmModule] = await Promise.all([
    importWasmModule('node_modules/@jsquash/avif/codec/enc/avif_enc.wasm'),
    importWasmModule('node_modules/@jsquash/avif/codec/dec/avif_dec.wasm'),
  ]);
  await initEncode(encodeWasmModule);
  initDecode(decodeWasmModule);

  const originalImageData = {
    width: 8,
    height: 8,
    data: new Uint8ClampedArray(4 * 8 * 8),
  };
  // Create specific colors to check subsampling didn't occur
  for (let i = 0; i < originalImageData.data.length; i += 4) {
    originalImageData.data[i] = i % 256; // R
    originalImageData.data[i + 1] = (i + 64) % 256; // G
    originalImageData.data[i + 2] = (i + 128) % 256; // B
    originalImageData.data[i + 3] = 255; // A
  }

  // Encode with lossless true but also a chroma-subsampled setting
  const encodedData = await encode(originalImageData, {
    lossless: true,
    subsample: 1,
  }); // subsample: 1 is YUV422
  t.assert(encodedData instanceof ArrayBuffer);

  const decodedData = await decode(encodedData);

  t.deepEqual(
    decodedData.data,
    originalImageData.data,
    'Decoded data should match original even with conflicting subsample option',
  );
});

test('throws error for invalid bitDepth setting', async (t) => {
  const encodeWasmModule = await importWasmModule(
    'node_modules/@jsquash/avif/codec/enc/avif_enc.wasm',
  );
  await initEncode(encodeWasmModule);

  const imageData = {
    data: new Uint8ClampedArray(4 * 10 * 10),
    height: 10,
    width: 10,
  };

  const error = await t.throwsAsync(() => encode(imageData, { bitDepth: 9 }));

  t.is(error.message, 'Invalid bit depth. Supported values are 8, 10, or 12.');
});
