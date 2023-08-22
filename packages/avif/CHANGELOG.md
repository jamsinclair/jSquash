# Changelog

## @jsquash/avif@next

### Misc.

- Removes *.d.ts.map files from the package

## @jsquash/avif@1.1.2

### Bug Fixes

- Stops the WebWorker module code from being instantiated when running in a Cloudflare Worker environment

## @jsquash/avif@1.1.1

### Bug Fixes

- Fixes an issue where it may not have been possible instantiate encode wasm modules manually

## @jsquash/avif@1.1.0

### Added 

- Include polyfills for Cloudflare Worker environment for easier compatibility
