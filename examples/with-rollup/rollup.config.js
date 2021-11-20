import { nodeResolve } from '@rollup/plugin-node-resolve';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';
import serve from 'rollup-plugin-serve';

export default {
  input: 'main.js',
  output: {
    dir: 'dist',
    format: 'es'
  },
  plugins: [
    nodeResolve(), // Needed to bundle the assets from node_modules
    importMetaAssets(), // Needed to resolve Wasm imports
    serve({
      open: true
    }) // Optional, for convenience when testing example
  ]
};
