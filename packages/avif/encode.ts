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
 * Updated to support a partial subset of Avif encoding options to be provided.
 * The avif options are defaulted to defaults from the meta.ts file.
 */
import type { EncodeOptions } from './meta';
import type { AVIFModule } from './codec/enc/avif_enc';

import { defaultOptions } from './meta';
import { initEmscriptenModule } from './utils';
import { threads } from 'wasm-feature-detect';

let emscriptenModule: Promise<AVIFModule>;

const isRunningInCloudflareWorker = () => (caches as any).default !== undefined;

export async function init(module?: WebAssembly.Module) {
  if (!isRunningInCloudflareWorker() && (await threads())) {
    const avifEncoder = await import('./codec/enc/avif_enc_mt');
    emscriptenModule = initEmscriptenModule(avifEncoder.default, module);
    return emscriptenModule;
  }
  const avifEncoder = await import('./codec/enc/avif_enc');
  emscriptenModule = initEmscriptenModule(avifEncoder.default, module);
  return emscriptenModule;
}

export default async function encode(
  data: ImageData,
  options: Partial<EncodeOptions> = {},
): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();

  const module = await emscriptenModule;
  const _options = { ...defaultOptions, ...options };
  const output = module.encode(data.data, data.width, data.height, _options);

  if (!output) {
    throw new Error('Encoding error.');
  }

  return output.buffer;
}
