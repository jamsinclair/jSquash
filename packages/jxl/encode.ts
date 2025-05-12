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
import type { EncodeOptions } from './meta.js';
import type { JXLModule } from './codec/enc/jxl_enc.js';

import { defaultOptions } from './meta.js';
import { simd, threads } from 'wasm-feature-detect';
import { initEmscriptenModule } from './utils.js';

let emscriptenModule: Promise<JXLModule>;

const isRunningInNode = () =>
  typeof process !== 'undefined' &&
  process.release &&
  process.release.name === 'node';
const isRunningInCloudflareWorker = () =>
  (globalThis.caches as any)?.default !== undefined;

export async function init(
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<JXLModule>;
export async function init(
  module?: WebAssembly.Module,
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
) {
  let actualModule: WebAssembly.Module | undefined = module;
  let actualOptions: Partial<EmscriptenWasm.ModuleOpts> | undefined =
    moduleOptionOverrides;

  // If only one argument is provided and it's not a WebAssembly.Module
  if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
    actualModule = undefined;
    actualOptions = module as unknown as Partial<EmscriptenWasm.ModuleOpts>;
  }

  if (
    !isRunningInNode() &&
    !isRunningInCloudflareWorker() &&
    (await threads())
  ) {
    if (await simd()) {
      const jxlEncoder = await import('./codec/enc/jxl_enc_mt_simd.js');
      emscriptenModule = initEmscriptenModule(
        jxlEncoder.default,
        actualModule,
        actualOptions,
      );
      return emscriptenModule;
    }
    const jxlEncoder = await import('./codec/enc/jxl_enc_mt.js');
    emscriptenModule = initEmscriptenModule(
      jxlEncoder.default,
      actualModule,
      actualOptions,
    );
    return emscriptenModule;
  }
  const jxlEncoder = await import('./codec/enc/jxl_enc.js');
  emscriptenModule = initEmscriptenModule(
    jxlEncoder.default,
    actualModule,
    actualOptions,
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
