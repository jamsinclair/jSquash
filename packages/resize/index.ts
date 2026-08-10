import type { WorkerResizeOptions } from './meta.js';
import type { InitInput as InitResizeInput } from './lib/resize/pkg/squoosh_resize.js';
import type { InitInput as InitHqxInput } from './lib/hqx/pkg/squooshhqx.js';
import type { InitInput as InitMagicKernelInput } from './lib/magic-kernel/pkg/jsquash_magic_kernel.js';
import { getContainOffsets } from './util.js';
import initResizeWasm, {
  resize as wasmResize,
} from './lib/resize/pkg/squoosh_resize.js';
import initHqxWasm, { resize as wasmHqx } from './lib/hqx/pkg/squooshhqx.js';
import initMagicKernelWasm, {
  resize as wasmMagicKernel,
} from './lib/magic-kernel/pkg/jsquash_magic_kernel.js';
import { defaultOptions } from './meta.js';

const MAGIC_KERNEL_METHODS = [
  'magicKernel',
  'magicKernelSharp2013',
  'magicKernelSharp2021',
];

let resizeWasmReady: Promise<unknown> | undefined;
let hqxWasmReady: Promise<unknown> | undefined;
let magicKernelWasmReady: Promise<unknown> | undefined;

export function initResize(moduleOrPath?: InitResizeInput) {
  if (!resizeWasmReady) {
    resizeWasmReady = initResizeWasm(moduleOrPath);
  }
  return resizeWasmReady;
}

export function initHqx(moduleOrPath?: InitHqxInput) {
  if (!hqxWasmReady) {
    hqxWasmReady = initHqxWasm(moduleOrPath);
  }
  return hqxWasmReady;
}

export function initMagicKernel(moduleOrPath?: InitMagicKernelInput) {
  if (!magicKernelWasmReady) {
    magicKernelWasmReady = initMagicKernelWasm(moduleOrPath);
  }
  return magicKernelWasmReady;
}

interface HqxResizeOptions extends WorkerResizeOptions {
  method: 'hqx';
}

interface MagicKernelResizeOptions extends WorkerResizeOptions {
  method: 'magicKernel' | 'magicKernelSharp2013' | 'magicKernelSharp2021';
}

function optsIsHqxOpts(opts: WorkerResizeOptions): opts is HqxResizeOptions {
  return opts.method === 'hqx';
}

function optsIsMagicKernelOpts(
  opts: WorkerResizeOptions,
): opts is MagicKernelResizeOptions {
  return MAGIC_KERNEL_METHODS.includes(opts.method);
}

/**
 * A Uint8Array over the same bytes as the given pixel buffer.
 *
 * `ImageData.data` is not guaranteed to start at offset 0 of its backing
 * ArrayBuffer — it may be a view into a larger allocation. Reading
 * `.buffer` alone would silently pick up the wrong bytes.
 */
function asUint8(data: Uint8ClampedArray | Uint8Array): Uint8Array {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/**
 * A Uint32Array over the same pixels as the given buffer. Uint32Array views
 * require 4-byte alignment, so an unaligned source is copied instead.
 */
function asUint32(data: Uint8ClampedArray | Uint8Array): Uint32Array {
  if (data.byteOffset % 4 === 0 && data.byteLength % 4 === 0) {
    return new Uint32Array(data.buffer, data.byteOffset, data.byteLength / 4);
  }
  return new Uint32Array(asUint8(data).slice().buffer);
}

function crop(
  data: ImageData,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): ImageData {
  const source = data.data;
  const output = new Uint8ClampedArray(sw * sh * 4);
  const rowBytes = sw * 4;

  // Copy row by row into a fresh buffer. Copying within the source buffer
  // would be marginally cheaper but destroys the caller's ImageData.
  for (let y = 0; y < sh; y += 1) {
    const start = ((y + sy) * data.width + sx) * 4;
    output.set(source.subarray(start, start + rowBytes), y * rowBytes);
  }

  return new ImageData(output, sw, sh);
}

interface ClampOpts {
  min?: number;
  max?: number;
}

function clamp(
  num: number,
  { min = Number.MIN_VALUE, max = Number.MAX_VALUE }: ClampOpts,
): number {
  return Math.min(Math.max(num, min), max);
}

/** Resize methods by index */
const resizeMethods: WorkerResizeOptions['method'][] = [
  'triangle',
  'catrom',
  'mitchell',
  'lanczos3',
];

async function hqx(
  input: ImageData,
  opts: HqxResizeOptions,
): Promise<ImageData> {
  await initHqx();

  const widthRatio = opts.width / input.width;
  const heightRatio = opts.height / input.height;
  const ratio = Math.max(widthRatio, heightRatio);
  const factor = clamp(Math.ceil(ratio), { min: 1, max: 4 }) as 1 | 2 | 3 | 4;

  if (factor === 1) return input;

  const result = wasmHqx(
    asUint32(input.data),
    input.width,
    input.height,
    factor,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer, result.byteOffset, result.byteLength),
    input.width * factor,
    input.height * factor,
  );
}

async function magicKernel(
  input: ImageData,
  opts: MagicKernelResizeOptions,
): Promise<ImageData> {
  await initMagicKernel();

  return wasmMagicKernel(
    asUint8(input.data),
    input.width,
    input.height,
    opts.width,
    opts.height,
    opts.method,
  );
}

export default async function resize(
  data: ImageData,
  overrideOptions: Partial<WorkerResizeOptions> & {
    width: number;
    height: number;
  },
): Promise<ImageData> {
  let options: WorkerResizeOptions = {
    ...(defaultOptions as WorkerResizeOptions),
    ...overrideOptions,
  };
  let input = data;

  // Magic kernel resizes never touch the resize module, so only warm it up
  // when this call will actually reach it. An hqx resize still does, because
  // it falls through to catrom to make up the remaining difference.
  const resizeReady = optsIsMagicKernelOpts(options) ? undefined : initResize();

  if (optsIsHqxOpts(options)) {
    input = await hqx(input, options);
    // Regular resize to make up the difference
    options = { ...options, method: 'catrom' };
  }

  if (options.fitMethod === 'contain') {
    // Offsets must come from the image we are about to crop, which is not
    // necessarily the caller's — hqx has already upscaled it by this point.
    const { sx, sy, sw, sh } = getContainOffsets(
      input.width,
      input.height,
      options.width,
      options.height,
    );
    const cropX = clamp(Math.round(sx), { min: 0, max: input.width });
    const cropY = clamp(Math.round(sy), { min: 0, max: input.height });

    input = crop(
      input,
      cropX,
      cropY,
      Math.min(Math.round(sw), input.width - cropX),
      Math.min(Math.round(sh), input.height - cropY),
    );
  }

  if (optsIsMagicKernelOpts(options)) {
    return magicKernel(input, options);
  }

  await resizeReady;

  const result = wasmResize(
    asUint8(input.data),
    input.width,
    input.height,
    options.width,
    options.height,
    resizeMethods.indexOf(options.method),
    options.premultiply,
    options.linearRGB,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer, result.byteOffset, result.byteLength),
    options.width,
    options.height,
  );
}
