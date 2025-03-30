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
 * and modified it to encode PNG images and also optimise them.
 */

import type {
  InitInput,
  InitOutput as PngModule,
} from './codec/pkg/squoosh_png.js';
import initPngModule, { encode as pngEncode } from './codec/pkg/squoosh_png.js';

type ImageDataRGBA16 = {
  data: Uint16Array;
  width: number;
  height: number;
};

let pngModule: Promise<PngModule>;

export async function init(moduleOrPath?: InitInput): Promise<PngModule> {
  if (!pngModule) {
    pngModule = initPngModule(moduleOrPath);
  }

  return pngModule;
}

export default async function encode(
  data: ImageDataRGBA16,
  options: { bitDepth: 16 },
): Promise<ArrayBuffer>;
export default async function encode(
  data: ImageData | ImageDataRGBA16,
  options?: { bitDepth?: 8 | 16 },
): Promise<ArrayBuffer> {
  await init();

  const bitDepth = options?.bitDepth ?? 8;

  if (bitDepth !== 8 && bitDepth !== 16) {
    throw new Error('Invalid bit depth. Must be either 8 or 16.');
  }

  const isUint16Array = data.data instanceof Uint16Array;
  if (isUint16Array && bitDepth !== 16) {
    throw new Error(
      'Invalid bit depth, must be 16 for Uint16Array or manually convert to RGB8 values with Uint8Array.',
    );
  }
  if (!isUint16Array && bitDepth === 16) {
    throw new Error(
      'Invalid bit depth, must be 8 for Uint8Array or manually convert to RGB16 values with Uint16Array.',
    );
  }

  const encodeData = new Uint8Array(data.data.buffer);
  const output = await pngEncode(encodeData, data.width, data.height, bitDepth);
  if (!output) throw new Error('Encoding error.');

  return output.buffer;
}
