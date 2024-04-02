# Changelog

## @jsquash/resize@2.0.0

### Breaking Changes

- Moves compiled wasm and js files to the 'lib/*/pkg' directory. If you were using the wasm file directly you will need to update your paths to reference the following
    - `node_modules/@jsquash/resize/lib/hqx/pkg/squooshhqx_bg.wasm`
    - `node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm`

### Fixes

- Fixes memory leak caused by a bug with wee_alloc

## @jsquash/resize@1.1.1

### Fixes

- Add same ImageData polyfill and tweaks to better support Cloudflare Workers and Node.js 

### Misc

- Ensures license is properly included in the package

## @jsquash/resize@1.1.0

### Adds

- Adds Node.js ESM support

### Misc.

- Removes *.d.ts.map files from the package
