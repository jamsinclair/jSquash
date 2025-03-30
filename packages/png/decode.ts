/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Notice: I (Jamie Sinclair) have copied this code from the JPEG encode module
 * and modified it to decode PNG images.
 */

import type {
  ImageDataRGBA16,
  InitInput,
  InitOutput as PngModule,
} from './codec/pkg/squoosh_png.js';
import initPngModule, { decode as pngDecode, decode_rgba16 } from './codec/pkg/squoosh_png.js';

let pngModule: Promise<PngModule>;

export async function init(moduleOrPath?: InitInput): Promise<PngModule> {
  if (!pngModule) {
    pngModule = initPngModule(moduleOrPath);
  }

  return pngModule;
}

export async function decode(data: ArrayBuffer): Promise<ImageData> {
  await init();

  const imageData = await pngDecode(new Uint8Array(data));

  if (!imageData) throw new Error('Encoding error.');

  return imageData;
}

export async function decodeRgba16(data: ArrayBuffer): Promise<ImageDataRGBA16> {
  await init();

  const imageData = await decode_rgba16(new Uint8Array(data));

  if (!imageData) throw new Error('Encoding error.');

  return imageData;
}

export default decode;
