import { promises as fs } from 'fs';
import path from 'path';

export function imageDataPolyfill() {
  if (typeof ImageData === 'undefined') {
    globalThis.ImageData = class ImageData {
      constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }
}

export async function importWasmModule(path) {
  const fileBuffer = await fs.readFile(path);
  return WebAssembly.compile(fileBuffer);
}

export function getFixturesImage(imagePath) {
  const filePath = path.resolve(`fixtures/${imagePath}`);
  return fs.readFile(filePath);
}
