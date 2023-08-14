# Changelog

## @jsquash/jxl@1.0.2

### Bug Fixes

- Stops the WebWorker module code from being instantiated when running in a Cloudflare Worker environment

## @jsquash/jxl@1.0.1

### Bug Fixes

- Removed check threads util method that would have prevented threads not working outside of a worker context. That util was specific to the Squoosh app use case.

## @jsquash/jxl@1.0.0

Initial Release.
