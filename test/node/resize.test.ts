import test from 'ava';
import { importWasmModule } from './utils.js';

import resize, { initHqx, initMagicKernel, initResize } from '@jsquash/resize';

test('can successfully downsize an image', async (t) => {
  const testImage = {
    data: new Uint8ClampedArray(4 * 100 * 100),
    width: 100,
    height: 100,
    colorSpace: 'srgb' as const,
  };
  const resizeWasmModule = await importWasmModule(
    'node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm',
  );
  await initResize(resizeWasmModule);
  const resizedImage = await resize(testImage, {
    width: 50,
    height: 50,
  });
  t.is(resizedImage.width, 50);
  t.is(resizedImage.width, 50);
  t.is(resizedImage.data.length, 4 * 50 * 50);
});

test('can successfully upscale an image with hqx', async (t) => {
  const testImage = {
    data: new Uint8ClampedArray(4 * 100 * 100),
    width: 100,
    height: 100,
    colorSpace: 'srgb' as const,
  };

  // Setup WASM modules
  const [hqxWasmModule, resizeWasmModule] = await Promise.all([
    importWasmModule(
      'node_modules/@jsquash/resize/lib/hqx/pkg/squooshhqx_bg.wasm',
    ),
    importWasmModule(
      'node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm',
    ),
  ]);
  await Promise.all([initHqx(hqxWasmModule), initResize(resizeWasmModule)]);

  // Upscale image
  const resizedImage = await resize(testImage, {
    width: 200,
    height: 200,
    method: 'hqx',
  });
  t.is(resizedImage.width, 200);
  t.is(resizedImage.width, 200);
  t.is(resizedImage.data.length, 4 * 200 * 200);
});

test('can successfully resize using magic kernel method', async (t) => {
  const testImage = {
    data: new Uint8ClampedArray(4 * 100 * 100),
    width: 100,
    height: 100,
    colorSpace: 'srgb' as const,
  };

  // Setup WASM modules
  const [magicKernelWasmModule, resizeWasmModule] = await Promise.all([
    importWasmModule(
      'node_modules/@jsquash/resize/lib/magic-kernel/pkg/jsquash_magic_kernel_bg.wasm',
    ),
    importWasmModule(
      'node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm',
    ),
  ]);
  await Promise.all([
    initMagicKernel(magicKernelWasmModule),
    initResize(resizeWasmModule),
  ]);

  // Upscale image
  const resizedImage = await resize(testImage, {
    width: 200,
    height: 200,
    method: 'magicKernel',
  });
  t.is(resizedImage.width, 200);
  t.is(resizedImage.width, 200);
  t.is(resizedImage.data.length, 4 * 200 * 200);
});

// --- regression tests ------------------------------------------------------

/** A gradient, so any shift in pixel values is detectable. */
function gradientImage(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = i % 256;
    data[i * 4 + 1] = (i * 3) % 256;
    data[i * 4 + 2] = (i * 7) % 256;
    data[i * 4 + 3] = 255;
  }
  return { data, width, height, colorSpace: 'srgb' as const };
}

test("contain fit does not mutate the caller's image", async (t) => {
  await initResize(
    await importWasmModule(
      'node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm',
    ),
  );

  const testImage = gradientImage(64, 64);
  const before = Uint8ClampedArray.from(testImage.data);

  // A non-matching aspect ratio forces the crop path.
  await resize(testImage, { width: 32, height: 16, fitMethod: 'contain' });

  t.deepEqual(
    Array.from(testImage.data),
    Array.from(before),
    'resize must not write through to the input ImageData',
  );
});

test('resize reads the correct bytes from an offset view', async (t) => {
  await initResize(
    await importWasmModule(
      'node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm',
    ),
  );

  const solid = gradientImage(32, 32);
  solid.data.fill(200);

  // The same pixels, but living part way into a larger allocation - which is
  // what you get from tiling or a pooled buffer.
  const backing = new Uint8ClampedArray(solid.data.length * 2);
  backing.fill(9);
  backing.set(solid.data, solid.data.length);
  const offsetView = {
    data: backing.subarray(solid.data.length),
    width: 32,
    height: 32,
    colorSpace: 'srgb' as const,
  };

  const [fromSolid, fromOffset] = await Promise.all([
    resize(solid, { width: 16, height: 16 }),
    resize(offsetView, { width: 16, height: 16 }),
  ]);

  t.deepEqual(Array.from(fromOffset.data), Array.from(fromSolid.data));
});
