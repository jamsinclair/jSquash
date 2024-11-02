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
 * Notice: I (Jamie Sinclair) have copied this code from the original and modified
 * to align with the jSquash project structure.
 */
import type { QOIModule } from './codec/enc/qoi_enc.js';

import qoi_enc from './codec/enc/qoi_enc.js';
import { initEmscriptenModule } from './utils.js';

let emscriptenModule: Promise<QOIModule>;

export async function init(
  module?: WebAssembly.Module,
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<void> {
  emscriptenModule = initEmscriptenModule(
    qoi_enc,
    module,
    moduleOptionOverrides,
  );
}

export default async function encode(data: ImageData): Promise<ArrayBuffer> {
  if (!emscriptenModule) await init();

  const module = await emscriptenModule;
  const resultView = module.encode(data.data, data.width, data.height);
  // wasm can’t run on SharedArrayBuffers, so we hard-cast to ArrayBuffer.
  return resultView.buffer as ArrayBuffer;
}
