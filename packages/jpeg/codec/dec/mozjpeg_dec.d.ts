export interface MozJPEGModule extends EmscriptenWasm.Module {
  decode(data: BufferSource, preserveOrientation: boolean): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<MozJPEGModule>;

export default moduleFactory;
