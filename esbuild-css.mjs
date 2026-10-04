import esbuild from 'esbuild';
import fs from 'fs';

await esbuild.build({
  entryPoints: ['src/styles.css'],
  outfile: 'dist/index.css',
  
  minify: true,
  minifyWhitespace: true,
  minifySyntax: true,
  
  sourcemap: 'external',
  target: 'es2020',
  legalComments: 'none',
  
  banner: {
    css: '/* Customizable Toast Notifications - https://github.com/sammy-cool/customizable-toast-notification */'
  }
});

// Generate CSS type stub
const cssStub = `declare const content: string;
export default content;
`;

fs.writeFileSync('dist/index.css.d.ts', cssStub);
console.log('✅ CSS minified and type stub generated');
