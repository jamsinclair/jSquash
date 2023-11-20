import test from 'ava';
import { imageDataPolyfill, importWasmModule, getFixturesImage } from './utils.js';

import decode, { init as initDecode } from '@jsquash/jxl/decode.js';
import encode, { init as initEncode } from '@jsquash/jxl/encode.js';

imageDataPolyfill();

test('can successfully decode image', async t => {
    const [testImage, decodeWasmModule] = await Promise.all([
        getFixturesImage('test.jxl'),
        importWasmModule('node_modules/@jsquash/jxl/codec/dec/jxl_dec.wasm'),
    ]);
    initDecode(decodeWasmModule);
    const data = await decode(testImage);
    t.is(data.width, 50);
    t.is(data.height, 50);
    t.is(data.data.length, 4 * 50 * 50);
});

test('can successfully encode image', async t => {
    const encodeWasmModule = await importWasmModule('node_modules/@jsquash/jxl/codec/enc/jxl_enc.wasm');
    await initEncode(encodeWasmModule);
    const data = await encode(new ImageData(new Uint8ClampedArray(4 * 50 * 50), 50, 50));
    t.assert(data instanceof ArrayBuffer);
});
