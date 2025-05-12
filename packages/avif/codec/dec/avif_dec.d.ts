export interface AVIFModule extends EmscriptenWasm.Module {
  decode(data: BufferSource, bitDepth: 10 | 12 | 16): { data: Uint16Array, height: number, width: number } | null;
  decode(data: BufferSource, bitDepth: 8): ImageData | null;
  decode(data: BufferSource, bitDepth: 8 | 10 | 12 | 16): { data: Uint16Array, height: number, width: number } | ImageData | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<AVIFModule>;

export default moduleFactory;
