const isServiceWorker = globalThis.ServiceWorkerGlobalScope !== undefined;
const isRunningInCloudFlareWorkers = isServiceWorker && typeof self !== 'undefined' && globalThis.caches && globalThis.caches.default !== undefined;
const isRunningInNode = typeof process === 'object' && process.release && process.release.name === 'node';

if (isRunningInCloudFlareWorkers || isRunningInNode) {
  if (!globalThis.ImageData) {
    // Simple Polyfill for ImageData Object
    globalThis.ImageData = class ImageData {
      constructor(data, width, height) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }

  if (import.meta.url === undefined) {
    import.meta.url = 'https://localhost';
  }

  if (typeof self !== 'undefined' && self.location === undefined) {
    self.location = { href: '' };
  }
}
