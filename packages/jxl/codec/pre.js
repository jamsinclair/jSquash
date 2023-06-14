const isRunningInCloudflareWorker = caches.default !== undefined;

if (isRunningInCloudflareWorker) {
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

  if (self.location === undefined) {
    self.location = { href: '' };
  }
}
