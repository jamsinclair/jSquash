export interface HEICModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<HEICModule>;

export default moduleFactory;
