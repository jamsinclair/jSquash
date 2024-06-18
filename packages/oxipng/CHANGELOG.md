# Changelog

## @jsquash/oxipng@2.3.0

### Adds

- Better compilation with Vite Bundler. Solves issues with circular dependencies for Vite v5.1.6+.

## @jsquash/oxipng@2.2.0

### Adds

- Updates oxipng to v9.0
- Adds support to optimise raw image data directly and output as an optimised PNG. This is useful for when you have raw image data and want to optimise it without having to encode to a PNG first.

## @jsquash/oxipng@2.1.0

### Adds

- Adds Node.js ESM support
    - Updates relative imports to use file extensions
    - Adds `module` field to relevant `package.json`
    - Updates pre.js to polyfill ImageData for Node.js

## @jsquash/oxipng@2.0.0

### Breaking Changes

- Upgrades several major versions to oxipng 8.0.0

### Adds

- Adds support for `optimiseAlpha` option to control whether alpha channels are optimised or not

## @jsquash/oxipng@1.0.2

### Fixes

- Only allow multithreading when running in a WebWorker, otherwise it will throw an error

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/oxipng@1.0.1

### Fixes

- Update the rayon dynamic import path so it can be handled better by bundlers. Particularly Vite.
