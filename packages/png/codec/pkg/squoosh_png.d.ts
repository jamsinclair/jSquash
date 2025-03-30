/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} data
* @param {number} width
* @param {number} height
* @param {number} bit_depth
* @returns {Uint8Array}
*/
export function encode(data: Uint8Array, width: number, height: number, bit_depth: number): Uint8Array;
/**
* @param {Uint8Array} data
* @returns {ImageData}
*/
export function decode(data: Uint8Array): ImageData;
/**
* @param {Uint8Array} data
* @returns {ImageDataRGBA16}
*/
export function decode_rgba16(data: Uint8Array): ImageDataRGBA16;
/**
*/
export class ImageDataRGBA16 {
  free(): void;
/**
*/
  readonly data: Uint16Array;
/**
*/
  readonly height: number;
/**
*/
  readonly width: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_imagedatargba16_free: (a: number) => void;
  readonly imagedatargba16_width: (a: number) => number;
  readonly imagedatargba16_height: (a: number) => number;
  readonly imagedatargba16_data: (a: number) => number;
  readonly encode: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly decode: (a: number, b: number) => number;
  readonly decode_rgba16: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
