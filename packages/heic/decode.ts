import type { HEICModule } from './codec/dec/heic_dec.js';
import { initEmscriptenModule } from './utils.js';

import heic_dec from './codec/dec/heic_dec.js';

let emscriptenModule: Promise<HEICModule>;

export async function init(
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<void>;
export async function init(
  module?: WebAssembly.Module,
  moduleOptionOverrides?: Partial<EmscriptenWasm.ModuleOpts>,
): Promise<void> {
  let actualModule: WebAssembly.Module | undefined = module;
  let actualOptions: Partial<EmscriptenWasm.ModuleOpts> | undefined =
    moduleOptionOverrides;

  // If only one argument is provided and it's not a WebAssembly.Module
  if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
    actualModule = undefined;
    actualOptions = module as unknown as Partial<EmscriptenWasm.ModuleOpts>;
  }

  emscriptenModule = initEmscriptenModule(
    heic_dec,
    actualModule,
    actualOptions,
  );
}

export default async function decode(
  buffer: ArrayBuffer,
): Promise<ImageData> {
  if (!emscriptenModule) {
    init();
  }

  const module = await emscriptenModule;
  const result = module.decode(buffer);
  if (!result) throw new Error('Decoding error');
  return result;
}
