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

import type { AVIFModule } from './codec/dec/avif_dec.js';
import { initEmscriptenModule } from './utils.js';

import avif_dec from './codec/dec/avif_dec.js';
import { ImageData16bit } from 'meta.js';

let emscriptenModule: Promise<AVIFModule>;

export async function init(
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<void>;
export async function init(
  module?: WebAssembly.Module,
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<void> {
  let actualModule: WebAssembly.Module | undefined = module;
  let actualOptions: Partial<EmscriptenWasm.ModuleOpts> | undefined =
    moduleOptionOverrides;

  // If only one argument is provided and it's not a WebAssembly.Module
  if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
    actualModule = undefined;
    actualOptions = module as unknown as Partial<EmscriptenWasm.ModuleOpts>;
  }

  emscriptenModule = initEmscriptenModule(
    avif_dec,
    actualModule,
    actualOptions,
  );
}

type DecodeOptions = {
  bitDepth?: 8 | 10 | 12 | 16;
};

export default async function decode(
  buffer: ArrayBuffer,
): Promise<ImageData | null>;
export default async function decode(
  buffer: ArrayBuffer,
  options: { bitDepth?: 8 },
): Promise<ImageData | null>;
export default async function decode(
  buffer: ArrayBuffer,
  options: { bitDepth: 10 | 12 | 16 },
): Promise<ImageData16bit | null>;
export default async function decode(
  buffer: ArrayBuffer,
  options?: DecodeOptions,
): Promise<ImageData | ImageData16bit | null> {
  if (!emscriptenModule) {
    init();
  }

  const module = await emscriptenModule;
  const bitDepth = options?.bitDepth ?? 8;
  const result = module.decode(buffer, bitDepth);
  if (!result) throw new Error('Decoding error');
  return result;
}
