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
import type { EncodeOptions, ImageData16bit } from './meta.js';
import type { AVIFModule } from './codec/enc/avif_enc.js';

import { defaultOptions } from './meta.js';
import { initEmscriptenModule } from './utils.js';
import { threads } from 'wasm-feature-detect';

let emscriptenModule: Promise<AVIFModule>;

const isRunningInNode = () =>
  typeof process !== 'undefined' &&
  process.release &&
  process.release.name === 'node';
const isRunningInCloudflareWorker = () =>
  (globalThis.caches as any)?.default !== undefined;

export async function init(
  moduleOptionOverride?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<any>;
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
    const avifEncoder = await import('./codec/enc/avif_enc_mt.js');
    emscriptenModule = initEmscriptenModule(
      avifEncoder.default,
      actualModule,
      actualOptions,
    );
    return emscriptenModule;
  }
  const avifEncoder = await import('./codec/enc/avif_enc.js');
  emscriptenModule = initEmscriptenModule(
    avifEncoder.default,
    actualModule,
    actualOptions,
  );
  return emscriptenModule;
}

export default async function encode(
  data: ImageData | ImageData16bit,
  options: Partial<EncodeOptions> = {},
): Promise<ArrayBuffer> {
  if (!emscriptenModule) emscriptenModule = init();
  const _options = { ...defaultOptions, ...options };

  if (
    _options.bitDepth !== 8 &&
    _options.bitDepth !== 10 &&
    _options.bitDepth !== 12
  ) {
    throw new Error('Invalid bit depth. Supported values are 8, 10, or 12.');
  }

  if (!(data.data instanceof Uint16Array) && _options.bitDepth !== 8) {
    throw new Error(
      'Invalid image data for bit depth. Must use Uint16Array for bit depths greater than 8.',
    );
  }

  if (_options.lossless) {
    if (options.quality !== undefined && options.quality !== 100) {
      console.warn(
        'AVIF lossless: Quality setting is ignored when lossless is enabled (quality must be 100).',
      );
    }
    if (
      options.qualityAlpha !== undefined &&
      options.qualityAlpha !== 100 &&
      options.qualityAlpha !== -1
    ) {
      console.warn(
        'AVIF lossless: QualityAlpha setting is ignored when lossless is enabled (qualityAlpha must be 100 or -1).',
      );
    }
    if (options.subsample !== undefined && options.subsample !== 3) {
      console.warn(
        'AVIF lossless: Subsample setting is ignored when lossless is enabled (subsample must be 3 for YUV444).',
      );
    }

    _options.quality = 100;
    _options.qualityAlpha = -1;
    _options.subsample = 3;
  }

  const module = await emscriptenModule;
  const output = module.encode(
    new Uint8Array(data.data.buffer),
    data.width,
    data.height,
    _options,
  );

  if (!output) {
    throw new Error('Encoding error.');
  }

  return output.buffer;
}
