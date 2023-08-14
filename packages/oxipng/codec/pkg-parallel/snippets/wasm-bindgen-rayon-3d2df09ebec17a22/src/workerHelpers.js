/**
 * Copyright 2021 Google Inc. All Rights Reserved.
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

// - Updated dynamic import, `../../../` to solve Vite Build issue
// - Removed comments that were causing build issues with Vite

function waitForMsgType(target, type) {
  return new Promise(resolve => {
    target.addEventListener('message', function onMsg({ data }) {
      if (data == null || data.type !== type) return;
      target.removeEventListener('message', onMsg);
      resolve(data);
    });
  });
}

waitForMsgType(self, 'wasm_bindgen_worker_init').then(async data => {
  const pkg = await import('../../../squoosh_oxipng.js');
  await pkg.default(data.module, data.memory);
  postMessage({ type: 'wasm_bindgen_worker_ready' });
  pkg.wbg_rayon_start_worker(data.receiver);
});

export async function startWorkers(module, memory, builder) {
  const workerInit = {
    type: 'wasm_bindgen_worker_init',
    module,
    memory,
    receiver: builder.receiver()
  };

  try {
    await Promise.all(
      Array.from({ length: builder.numThreads() }, () => {
        const worker = new Worker(new URL('./workerHelpers.js', import.meta.url), {
          type: 'module'
        });
        worker.postMessage(workerInit);
        return waitForMsgType(worker, 'wasm_bindgen_worker_ready');
      })
    );
    builder.build();
  } finally {
    builder.free();
  }
}
