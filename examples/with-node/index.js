import decodeJpeg, { init as initJpegDecode } from '@jsquash/jpeg/decode.js';
import encodePng, { init as initPngEncode } from '@jsquash/png/encode.js';
import fs from 'fs';

// Load the Jpeg Decode WebAssembly Module and initialize the decoder
const jpegWasmBuffer = fs.readFileSync('node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm');
const jpegWasmModule = await WebAssembly.compile(jpegWasmBuffer);
await initJpegDecode(jpegWasmModule);

// Load the Png Encode WebAssembly Module and initialize the encoder
const pngWasmBuffer = fs.readFileSync('node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm');
const pngWasmModule = await WebAssembly.compile(pngWasmBuffer);
await initPngEncode(pngWasmModule);

// Decode the Jpeg image to ImageData format
const jpegBuffer = fs.readFileSync('example.jpg');
const imageData = await decodeJpeg(jpegBuffer);

// Encode the ImageData to Png file
fs.writeFileSync('example.png', await encodePng(imageData));
