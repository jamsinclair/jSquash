/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint8Array} data
* @param {number} level
* @param {boolean} interlace
* @param {boolean} optimize_alpha
* @returns {Uint8Array}
*/
export function optimise(data: Uint8Array, level: number, interlace: boolean, optimize_alpha: boolean): Uint8Array;
/**
* @param {Uint8ClampedArray} data
* @param {number} width
* @param {number} height
* @param {number} level
* @param {boolean} interlace
* @param {boolean} optimize_alpha
* @returns {Uint8Array}
*/
export function optimise_raw(data: Uint8ClampedArray, width: number, height: number, level: number, interlace: boolean, optimize_alpha: boolean): Uint8Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly optimise: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
  readonly optimise_raw: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
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
