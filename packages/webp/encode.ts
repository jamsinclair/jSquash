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
 * Updated to support a partial subset of WebP encoding options to be provided.
 * The WebP options are defaulted to defaults from the meta.ts file.
 * Also manually allow instantiation of the Wasm Module.
 */
import type { WebPModule } from './codec/enc/webp_enc';
import type { EncodeOptions } from './meta';

import { defaultOptions } from './meta';
import { initEmscriptenModule } from './utils';
import { simd } from 'wasm-feature-detect';

let emscriptenModule: Promise<WebPModule>;

export async function init(module?: WebAssembly.Module): Promise<void> {
  if (await simd()) {
    const webpEncoder = await import('./codec/enc/webp_enc_simd');
    emscriptenModule = initEmscriptenModule(webpEncoder.default, module);
  }
  const webpEncoder = await import('./codec/enc/webp_enc');
  emscriptenModule = initEmscriptenModule(webpEncoder.default, module);
}

export default async function encode(
  data: ImageData,
  options: Partial<EncodeOptions> = {},
): Promise<ArrayBuffer> {
  if (!emscriptenModule) init();

  const _options: EncodeOptions = { ...defaultOptions, ...options };
  const module = await emscriptenModule;
  const result = module.encode(data.data, data.width, data.height, _options);

  if (!result) throw new Error('Encoding error.');

  return result.buffer;
}