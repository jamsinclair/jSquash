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
import type { MozJPEGModule } from './codec/dec/mozjpeg_dec';
import { initEmscriptenModule } from './utils';

let emscriptenModule: Promise<MozJPEGModule>;

export default async function decode(buffer: ArrayBuffer): Promise<ImageData> {
  if (!emscriptenModule) {
    const decoder = await import('./codec/dec/mozjpeg_dec');
    emscriptenModule = initEmscriptenModule(decoder.default);
  }

  const [module, data] = await Promise.all([
    emscriptenModule,
    buffer,
  ]);

  const result = module.decode(data);
  if (!result) throw new Error('Decoding error');
  return result;
}
