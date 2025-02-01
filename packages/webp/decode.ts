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
 * Notice: I (Jamie Sinclair) have modified this file to accept an ArrayBuffer instead of typed array
 * and manually allow instantiation of the Wasm Module.
 */
import type { WebPFrame, WebPModule } from './codec/dec/webp_dec.js';

import webp_dec from './codec/dec/webp_dec.js';
import { initEmscriptenModule } from './utils.js';

let emscriptenModule: Promise<WebPModule>;

export async function init(
  module?: WebAssembly.Module,
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<void> {
  emscriptenModule = initEmscriptenModule(
    webp_dec,
    module,
    moduleOptionOverrides,
  );
}

export default async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) init();

  const module = await emscriptenModule;
  const result = module.decode(buffer);
  if (!result) throw new Error('Decoding error');
  return result;
}

export async function decodeAnimated(buffer: ArrayBuffer): Promise<WebPFrame[]> {
  if (!emscriptenModule) init();

  const module = await emscriptenModule;
  const result = module.decodeAnimated(buffer);
  if (!result) throw new Error('Decoding error');
  return result;
}
