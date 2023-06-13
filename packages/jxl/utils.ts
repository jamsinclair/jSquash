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
 * Notice: I (Jamie Sinclair) have modified this file
 * - Allows manual instantiation of the Wasm Module.
 * - Adds checkThreadsSupport function which handles Safari 16 edge case
 */
import { threads } from 'wasm-feature-detect';

export function initEmscriptenModule<T extends EmscriptenWasm.Module>(
  moduleFactory: EmscriptenWasm.ModuleFactory<T>,
  wasmModule?: WebAssembly.Module,
  moduleOptionOverrides: Partial<EmscriptenWasm.ModuleOpts> = {},
): Promise<T> {
  let instantiateWasm;

  if (wasmModule) {
    instantiateWasm = (imports: WebAssembly.Imports, callback: (instance: WebAssembly.Instance) => void) => {
      const instance = new WebAssembly.Instance(wasmModule, imports);
      callback(instance);
      return instance.exports;
    }
  }

  return moduleFactory({
    // Just to be safe, don't automatically invoke any wasm functions
    noInitialRun: true,
    instantiateWasm,
    ...moduleOptionOverrides
  });
}

// Sourced from: https://github.com/GoogleChromeLabs/squoosh/blob/ecc715fe557ce57ba57f2535e87d68411bbf7de2/src/features/encoders/jxl/worker/jxlEncode.ts
export async function checkThreadsSupport() {
  const supportsWasmThreads = await threads();
  if (!supportsWasmThreads) return false;

  // Safari 16 shipped with WASM threads support, but it didn't ship with nested workers support.
  // This meant Squoosh failed in Safari 16, since we call our wasm from inside a worker to begin with.

  // Right now, this check is only run from a worker.
  // More implementation is needed to run it from a page.
  if (!('importScripts' in self)) {
    return false;
  }

  return 'Worker' in self;;
}
