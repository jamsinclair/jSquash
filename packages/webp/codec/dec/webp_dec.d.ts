export interface WebPModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
  decodeAnimated(data: BufferSource): WebPFrame[] | null;
}

export type WebPFrame = { imageData: ImageData, duration: number };

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WebPModule>;

export default moduleFactory;
