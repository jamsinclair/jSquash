import test from 'ava';
import { imageDataPolyfill, importWasmModule, getFixturesImage } from './utils.js';

import decode, { init as initDecode } from '@jsquash/webp/decode.js';
import encode, { init as initEncode } from '@jsquash/webp/encode.js';

imageDataPolyfill();

test('can successfully decode image', async t => {
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

test('can successfully encode image', async t => {
    const encodeWasmModule = await importWasmModule('node_modules/@jsquash/webp/codec/enc/webp_enc.wasm');
    await initEncode(encodeWasmModule);
    const data = await encode(new ImageData(new Uint8ClampedArray(4 * 50 * 50), 50, 50));
    t.assert(data instanceof ArrayBuffer);
});
