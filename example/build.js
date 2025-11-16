// @ts-check
import esbuild from 'esbuild';
import { llm } from 'esbuild-plugin-llm';

await esbuild.build({
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm', // Output an ES Module
  platform: 'node', // Target node environment
  plugins: [llm()], // Use our plugin
});
