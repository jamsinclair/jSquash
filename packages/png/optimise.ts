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
 * Notice: I (Jamie Sinclair) have modified the code to only use Multi-threading only 
 * if the browser has the `hasHardwareConcurrency` property. This is because it helps 
 * us support environments like Cloudflare Workers that use the V8 engine.
 */
import { defaultOptions, OptimiseOptions } from './meta';
import { threads } from 'wasm-feature-detect';

async function initMT() {
  const {
    default: init,
    initThreadPool,
    optimise,
  } = await import('./codecs/oxipng/pkg-parallel/squoosh_oxipng');
  await init();
  await initThreadPool(globalThis.navigator.hardwareConcurrency);
  return optimise;
}

async function initST() {
  const { default: init, optimise } = await import(
    './codecs/oxipng/pkg/squoosh_oxipng'
  );
  await init();
  return optimise;
}

let wasmReady: ReturnType<typeof initMT | typeof initST>;

export default async function optimise(
  data: ArrayBuffer,
  options: Partial<OptimiseOptions> = {},
): Promise<ArrayBuffer> {
  if (!wasmReady) {
    const hasHardwareConcurrency = globalThis.navigator?.hardwareConcurrency > 1;

    wasmReady = hasHardwareConcurrency ? threads().then((hasThreads: boolean) =>
      hasThreads ? initMT() : initST(),
    ) : initST();
  }

  const _options = { ...defaultOptions, ...options };
  const optimise = await wasmReady;
  return optimise(new Uint8Array(data), _options.level, _options.interlace)
    .buffer;
}
