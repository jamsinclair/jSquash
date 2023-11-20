import test from 'ava';
import { importWasmModule, getFixturesImage } from './utils.js';

import optimise, { init } from '@jsquash/oxipng/optimise.js';

test('can successfully optimise png image', async (t) => {
  const [testImage, optimiseWasmModule] = await Promise.all([
    getFixturesImage('test.png'),
    importWasmModule(
      'node_modules/@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm',
    ),
  ]);
  await init(optimiseWasmModule);
  const optimisedImage = await optimise(testImage);
  t.assert(optimisedImage instanceof ArrayBuffer);
  t.assert(optimisedImage.byteLength < testImage.byteLength);
});
