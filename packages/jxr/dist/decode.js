import { initEmscriptenModule } from './utils.js';
import jxr_dec from './codec/dec/jxr_dec.js';
let emscriptenModule;
export async function init(module, moduleOptionOverrides) {
    let actualModule = module;
    let actualOptions = moduleOptionOverrides;
    if (arguments.length === 1 && !(module instanceof WebAssembly.Module)) {
        actualModule = undefined;
        actualOptions = module;
    }
    emscriptenModule = initEmscriptenModule(jxr_dec, actualModule, actualOptions);
}
export default async function decode(buffer) {
    if (!emscriptenModule) {
        init();
    }
    const module = await emscriptenModule;
    const result = module.decode(buffer);
    if (!result)
        throw new Error('Decoding error');
    return result;
}
