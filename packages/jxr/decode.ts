import type { JXRModule } from './codec/dec/jxr_dec.js';
import { initEmscriptenModule } from './utils.js';

import jxr_dec from './codec/dec/jxr_dec.js';

let emscriptenModule: Promise<JXRModule>;

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

  if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
    actualModule = undefined;
    actualOptions = module as unknown as Partial<EmscriptenWasm.ModuleOpts>;
  }

  emscriptenModule = initEmscriptenModule(
    jxr_dec,
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
