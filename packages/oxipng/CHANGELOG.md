# Changelog

## @jsquash/oxipng@2.1.0

### Adds

- Adds Node.js ESM support

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
