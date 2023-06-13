import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ["@jsquash/avif", "@jsquash/jpeg", "@jsquash/jxl", "@jsquash/png", "@jsquash/webp"]
  }
})
