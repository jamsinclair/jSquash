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

let pngModule: Promise<PngModule>;

export async function init(moduleOrPath?: InitInput): Promise<PngModule> {
  if (!pngModule) {
    pngModule = initPngModule(moduleOrPath);
  }

  return pngModule;
}

export default async function encode(data: ImageData): Promise<ArrayBuffer> {
  await init();
  // @ts-ignore - pngEncode expects a Uint8Array, check if mistake or whether we need to convert from Uint8ClampedArray
  const buffer = await pngEncode(data.data, data.width, data.height);
  if (!buffer) throw new Error('Encoding error.');

  return buffer;
}
