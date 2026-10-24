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

/**
 * Parse CSS file and extract all class names
 * @param {string} cssContent - Raw CSS content
 * @returns {string[]} - Sorted array of unique class names
 */
function extractCssClasses(cssContent) {
  // Match class selectors only: .className (must be preceded by . and followed by specific chars)
  // Avoid matching time values like 2s, animation values, etc.
  const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)(?:\s|,|{|\[|:|$)/g;
  const classes = new Set();
  let match;

  while ((match = classRegex.exec(cssContent)) !== null) {
    classes.add(match[1]);
  }

  return Array.from(classes).sort();
}

/**
 * Generate TypeScript declarations for CSS classes
 * @param {string[]} classNames - Array of class names
 * @returns {string} - TypeScript declaration content
 */
function generateCssTypeDeclarations(classNames) {
  const toCamel = (str) => str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

  // Named exports must be valid JS identifiers (TS error TS1005 if hyphens used in `export const`)
  const namedExports = new Set();
  classNames.forEach((name) => {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
      namedExports.add(`export const ${name}: string;`);
    } else {
      const camel = toCamel(name);
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(camel)) {
        namedExports.add(`export const ${camel}: string;`);
      }
    }
  });

  const propertyDeclarations = classNames
    .map(className => `  readonly "${className}": string;`)
    .join('\n');

  return `/**
 * Auto-generated CSS class name types from src/styles.css
 * Generated at build time - do not edit manually
 *
 * Usage:
 *   import styles, { toast, toastCloseBtn } from 'customizable-toast-notification/index.css';
 */

${Array.from(namedExports).sort().join('\n')}

export interface CssClasses {
  readonly [key: string]: string;
${propertyDeclarations}
}

declare const styles: CssClasses;
export default styles;
`;
}

// Read CSS file and generate types
const cssContent = fs.readFileSync('src/styles.css', 'utf8');
const classNames = extractCssClasses(cssContent);

const typeDeclarations = generateCssTypeDeclarations(classNames);
fs.writeFileSync('dist/index.css.d.ts', typeDeclarations);

console.log(`✅ CSS minified and ${classNames.length} class types generated`);
console.log(`   Classes: ${classNames.slice(0, 5).join(', ')}${classNames.length > 5 ? '...' : ''}`);

