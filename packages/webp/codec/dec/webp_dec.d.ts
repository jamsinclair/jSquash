export type WebPFrame = {
  imageData: ImageData;
  duration: number;
};

export interface WebPModule extends EmscriptenWasm.Module {
  decode(data: BufferSource): ImageData | null;
  decodeAnimated(data: BufferSource): WebPFrame[] | null;
  isAnimated(data: BufferSource): boolean;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<WebPModule>;

export default moduleFactory;
