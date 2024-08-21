import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { sizeSnapshot } from 'rollup-plugin-size-snapshot'; // For bundle size analysis
import { visualizer } from 'rollup-plugin-visualizer'; // For bundle size visualization

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      exports: 'named',
      sourcemap: true // Enable source maps for debugging
    },
    {
      file: 'dist/index.esm.mjs',
      format: 'esm',
      sourcemap: true // Enable source maps for debugging
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    terser({
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true // Remove debugger statements in production
      },
      mangle: true, // Mangle variable names
    }),
    sizeSnapshot(), // Analyze bundle size
    visualizer({ filename: 'bundle-analysis.html' }) // Generate a bundle size report
  ],
  //TODO external: ['react', 'react-dom',] // Add any external dependencies here if needed
};
