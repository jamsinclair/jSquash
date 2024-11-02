import test from 'ava';
import { importWasmModule } from './utils.js';

import resize, { initHqx, initMagicKernel, initResize } from '@jsquash/resize';

test('can successfully downsize an image', async (t) => {
  const testImage = {
    data: new Uint8ClampedArray(4 * 100 * 100),
    width: 100,
    height: 100,
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
