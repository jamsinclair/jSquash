export const enum AVIFTune {
  auto,
  psnr,
  ssim,
}

export interface EncodeOptions {
  quality: number;
  denoiseLevel: number;
  qualityAlpha: number;
  tileRowsLog2: number;
  tileColsLog2: number;
  speed: number;
  subsample: number;
  chromaDeltaQ: boolean;
  sharpness: number;
  tune: AVIFTune;
  enableSharpYUV: boolean;
}

export interface AVIFModule extends EmscriptenWasm.Module {
  encode(
    data: BufferSource,
    width: number,
    height: number,
    options: EncodeOptions,
  ): Uint8Array | null;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<AVIFModule>;

export default moduleFactory;
