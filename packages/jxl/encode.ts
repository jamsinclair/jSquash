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
 * Notice: I (Jamie Sinclair) have modified this file.
 * Updated to support a partial subset of JPEG XL encoding options to be provided.
 * The options are defaulted to defaults from the meta.ts file.
 */
import type { EncodeOptions } from './meta';
import type { JXLModule } from './codec/enc/jxl_enc';

import { defaultOptions } from './meta';
import { simd, threads } from 'wasm-feature-detect';
import { initEmscriptenModule } from './utils';

let emscriptenModule: Promise<JXLModule>;

const isRunningInCloudflareWorker = () => (caches as any).default !== undefined;

async function init(
  module?: WebAssembly.Module,
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
) {
  if (!isRunningInCloudflareWorker() && (await threads())) {
    if (await simd()) {
      const jxlEncoder = await import('./codec/enc/jxl_enc_mt_simd');
      emscriptenModule = initEmscriptenModule(
        jxlEncoder.default,
        module,
        moduleOptionOverrides,
      );
      return emscriptenModule;
    }
    const jxlEncoder = await import('./codec/enc/jxl_enc_mt');
    emscriptenModule = initEmscriptenModule(
      jxlEncoder.default,
      module,
      moduleOptionOverrides,
    );
    return emscriptenModule;
  }
  const jxlEncoder = await import('./codec/enc/jxl_enc');
  emscriptenModule = initEmscriptenModule(
    jxlEncoder.default,
    module,
    moduleOptionOverrides,
  );
  return emscriptenModule;
}

export default async function encode(
  data: ImageData,
  options: Partial<EncodeOptions> = {},
): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const module = await emscriptenModule;
  const _options = { ...defaultOptions, ...options };
  const resultView = module.encode(
    data.data,
    data.width,
    data.height,
    _options,
  );
  if (!resultView) {
    throw new Error('Encoding error.');
  }

  return resultView.buffer as ArrayBuffer;
}
