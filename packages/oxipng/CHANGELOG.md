# Changelog

## @jsquash/oxipng@1.0.2

### Fixes

- Only allow multithreading when running in a WebWorker, otherwise it will throw an error

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/oxipng@1.0.1

### Fixes

- Update the rayon dynamic import path so it can be handled better by bundlers. Particularly Vite.
