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
 * and modified it to decode JPEG images.
 */

import type { MozJPEGModule } from './codec/dec/mozjpeg_dec.js';
import { initEmscriptenModule } from './utils.js';

import mozjpeg_dec from './codec/dec/mozjpeg_dec.js';
import { DecodeOptions, defaultDecodeOptions } from 'meta.js';

let emscriptenModule: Promise<MozJPEGModule>;

export async function init(
  module?: WebAssembly.Module,
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<void> {
  emscriptenModule = initEmscriptenModule(
    mozjpeg_dec,
    module,
    moduleOptionOverrides,
  );
}

export default async function decode(
  buffer: ArrayBuffer,
  options: Partial<DecodeOptions> = {},
): Promise<ImageData> {
  if (!emscriptenModule) init();

  const _options = { ...defaultDecodeOptions, ...options };
  const module = await emscriptenModule;
  const result = module.decode(buffer, _options.preserveOrientation);
  if (!result) throw new Error('Decoding error');
  return result;
}
