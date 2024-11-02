import type { WorkerResizeOptions } from './meta.js';
import type { InitInput as InitResizeInput } from './lib/resize/pkg/squoosh_resize.js';
import type { InitInput as InitHqxInput } from './lib/hqx/pkg/squooshhqx.js';
import type { InitInput as InitMagicKernelInput } from './lib/magic-kernel/pkg/jsquash_magic_kernel.js';
import { getContainOffsets } from './util.js';
import initResizeWasm, {
  resize as wasmResize,
} from './lib/resize/pkg/squoosh_resize.js';
import initHqxWasm, { resize as wasmHqx } from './lib/hqx/pkg/squooshhqx.js';
import initMagicKernelWasm, { resize as wasmMagicKernel } from './lib/magic-kernel/pkg/jsquash_magic_kernel.js';
import { defaultOptions } from './meta.js';

const MAGIC_KERNEL_METHODS = ['magicKernel', 'magicKernelSharp2013', 'magicKernelSharp2021'];

let resizeWasmReady: Promise<unknown>;
let hqxWasmReady: Promise<unknown>;
let magicKernelWasmReady: Promise<unknown>;

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

function optsIsMagicKernelOpts(opts: WorkerResizeOptions): opts is MagicKernelResizeOptions {
  return MAGIC_KERNEL_METHODS.includes(opts.method);
}

function crop(
  data: ImageData,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): ImageData {
  const inputPixels = new Uint32Array(data.data.buffer);

  // Copy within the same buffer for speed and memory efficiency.
  for (let y = 0; y < sh; y += 1) {
    const start = (y + sy) * data.width + sx;
    inputPixels.copyWithin(y * sw, start, start + sw);
  }

  return new ImageData(
    new Uint8ClampedArray(inputPixels.buffer.slice(0, sw * sh * 4)),
    sw,
    sh,
  );
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
    new Uint32Array(input.data.buffer),
    input.width,
    input.height,
    factor,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer),
    input.width * factor,
    input.height * factor,
  );
}

async function magicKernel(
  input: ImageData,
  opts: MagicKernelResizeOptions,
): Promise<ImageData> {
  await initMagicKernel();

  const result = wasmMagicKernel(
    new Uint8Array(input.data.buffer),
    input.width,
    input.height,
    opts.width,
    opts.height,
    opts.method
  );

  return result;
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

  initResize();

  if (optsIsHqxOpts(options)) {
    input = await hqx(input, options);
    // Regular resize to make up the difference
    options = { ...options, method: 'catrom' };
  }

  await resizeWasmReady;

  if (options.fitMethod === 'contain') {
    const { sx, sy, sw, sh } = getContainOffsets(
      data.width,
      data.height,
      options.width,
      options.height,
    );
    input = crop(
      input,
      Math.round(sx),
      Math.round(sy),
      Math.round(sw),
      Math.round(sh),
    );
  }

  if (optsIsMagicKernelOpts(options)) {
    return magicKernel(input, options);
  }

  const result = wasmResize(
    new Uint8Array(input.data.buffer),
    input.width,
    input.height,
    options.width,
    options.height,
    resizeMethods.indexOf(options.method),
    options.premultiply,
    options.linearRGB,
  );

  return new ImageData(
    new Uint8ClampedArray(result.buffer),
    options.width,
    options.height,
  );
}
