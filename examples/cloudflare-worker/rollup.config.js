import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';

export default {
  input: 'src/index.js',
  output: {
    file: 'worker.js',
    format: 'es'
  },
  inlineDynamicImports: true,
  plugins: [nodeResolve(), replace({ 
    preventAssignment: false,
    'import.meta.url': JSON.stringify('http://localhost'),
    'self.location.href': JSON.stringify('http://localhost'),
  })]
};
