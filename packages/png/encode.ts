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

import type { InitOutput as PngModule } from './codecs/squoosh-png/squoosh_png';
import type { OptimiseOptions } from './meta';
import init, { encode as pngEncode }  from './codecs/squoosh-png/squoosh_png';
import { defaultOptions as defaultOptimiseOptions } from 'meta';
import optimise from './optimise';

let pngModule: PngModule;

type EncodeOptions = OptimiseOptions & {
  skipOptimisation: boolean;
};

const defaultOptions: EncodeOptions = {
  ...defaultOptimiseOptions,
  skipOptimisation: false,
};

export default async function encode(
  data: ImageData,
  options: Partial<EncodeOptions>
): Promise<ArrayBuffer> {
  if (!pngModule) pngModule = await init();

  // @ts-ignore - pngEncode expects a Uint8Array, check if mistake or whether we need to convert from Uint8ClampedArray
  const buffer = await pngEncode(data.data, data.width, data.height);
  if (!buffer) throw new Error('Encoding error.');
  
  const { skipOptimisation, ...optimiseOptions} = { ...defaultOptions, ...options };
  if (skipOptimisation) {
    return buffer;
  }

  return optimise(buffer, optimiseOptions);
}
