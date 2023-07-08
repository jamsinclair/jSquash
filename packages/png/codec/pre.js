(function () {
  const isRunningInCloudFlareWorkers = caches.default !== undefined;
  if (isRunningInCloudFlareWorkers) {
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
  }
})();
