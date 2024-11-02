export interface QOIModule extends EmscriptenWasm.Module {
    encode(
        data: BufferSource,
        width: number,
        height: number
    ): Uint8Array;
}

declare var moduleFactory: EmscriptenWasm.ModuleFactory<QOIModule>;

export default moduleFactory;
