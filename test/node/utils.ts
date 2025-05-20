import { promises as fs } from 'fs';
import path from 'path';

export async function importWasmModule(path) {
  const fileBuffer = await fs.readFile(path);
  return WebAssembly.compile(fileBuffer);
}

export function getFixturesImage(imagePath: string) {
  const filePath = path.resolve(`fixtures/${imagePath}`);
  return fs.readFile(filePath).then(buffer => buffer.buffer as ArrayBuffer);
}
