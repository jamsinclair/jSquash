import create from '../../packages/avif/codec/enc/avif_enc.js';

void create({ wasmBinary: new Uint8Array(), noInitialRun: true });
// @ts-expect-error wasmBinary must contain bytes, not a path.
void create({ wasmBinary: 'encoder.wasm' });
