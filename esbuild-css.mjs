import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/styles.css'],
  outfile: 'dist/index.css',
  
  // MINIFICATION (Critical)
  minify: true,
  minifyWhitespace: true,
  minifySyntax: true,
  
  // SOURCE MAPS (debugging)
  sourcemap: 'external',
  
  // TARGET (browser support)
  target: 'es2020',
  
  // CLEAN OUTPUT
  legalComments: 'none',
  
  // BANNER (must be object with css property)
  banner: {
    css: '/* Customizable Toast Notifications - https://github.com/sammy-cool/customizable-toast-notification */'
  }
});

console.log('✅ CSS minified and bundled to dist/index.css');
