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
import type { InitOutput as PngModule } from './codec/squoosh_png';
import init, { encode as pngEncode }  from './codec/squoosh_png';

let pngModule: PngModule;

export default async function encode(
  data: ImageData
): Promise<ArrayBuffer> {
  if (!pngModule) pngModule = await init();

  // @ts-ignore - pngEncode expects a Uint8Array, check if mistake or whether we need to convert from Uint8ClampedArray
  const buffer = await pngEncode(data.data, data.width, data.height);

  if (!buffer) throw new Error('Encoding error.');

  return buffer;
}
