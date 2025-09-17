import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import filesize from "rollup-plugin-filesize";
import { visualizer } from "rollup-plugin-visualizer";
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";

const buildTime = new Date().toISOString().slice(0, 19).replace("T", " ");

// SINGLE DEFINITION - DRY Principle
const banner = `/*!
 * Customizable Toast Notifications ${pkg.version}
 * Build: ${buildTime}
 * Cache-Buster: ${Date.now()} 
 * Author: Priyanshu Patel
 * Email: [priyanshu.alt191@gmail.com](mailto:priyanshu.alt191@gmail.com)
 * License: Apache-2.0
 * Dependencies: None
 * Created: July 31, 2024
 * A lightweight and fully customizable toast notification library
 * designed for seamless integration with any JavaScript or framework-based UI.
 * Supports flexible positioning, theming, icons, animations, and timing options
 * out of the box — with CTA support and zero dependencies.
 */`;

// 🎯 Common plugins for all builds
const getCommonPlugins = (target) => [
  replace({
    "process.env.NODE_ENV": JSON.stringify("production"),
    preventAssignment: true,
    values: {
      __VERSION__: JSON.stringify(pkg.version),
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  }),
  postcss({
    extract: false,
    minimize: true,
    modules: false,
  }),
  resolve({
    browser: target === "umd",
    preferBuiltins: target !== "umd",
  }),
  commonjs(),
  babel({
    babelHelpers: "bundled",
    exclude: "node_modules/**",
    presets: [
      [
        "@babel/preset-env",
        {
          targets:
            target === "cjs"
              ? { node: "14.0.0" } // CJS: Conservative Node support
              : target === "umd"
              ? {
                  browsers:
                    "> 0.25%, not dead, chrome >= 49, firefox >= 45, safari >= 10, edge >= 14",
                } // UMD: Wide browser support
              : { browsers: "> 0.25%, not dead, chrome >= 60", node: "14" }, // ESM: Modern but compatible
          useBuiltIns: false, // 🛡️ NEVER inject polyfills
          modules: false, // 🌲 Preserve ESM for tree-shaking
        },
      ],
    ],
  }),
  terser({
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ["console.log", "console.info", "console.debug"],
    },
    mangle: true,
    format: {
      comments: /^!/, // Keep banner comments
    },
  }),
];

export default [
  // 🟡 UMD build (CDN, script tags, global usage)
  {
    input: "src/index.js",
    output: {
      file: "dist/index.umd.js",
      format: "umd",
      name: "customizableToast",
      sourcemap: true,
      banner,
    },
    plugins: [
      ...getCommonPlugins("umd"),
      filesize({ showMinifiedSize: true, showGzippedSize: true }),
      visualizer({
        filename: "./bundle-analysis.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
  },

  // 🟢 ESM build (modern bundlers, tree-shakable)
  {
    input: "src/index.js",
    output: {
      file: "dist/index.esm.mjs",
      format: "esm",
      sourcemap: true,
      banner,
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
      ...getCommonPlugins("esm"),
      filesize({ showMinifiedSize: false, showGzippedSize: true }),
    ],
  },

  // 🔵 CJS build (Node.js, older bundlers)
  {
    input: "src/index.js",
    output: {
      file: "dist/index.cjs",
      format: "cjs",
      exports: "named", // 🎯 Ensure named exports work
      sourcemap: true,
      banner,
      interop: "auto",
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [
      ...getCommonPlugins("cjs"),
      filesize({ showMinifiedSize: false, showGzippedSize: true }),
    ],
  },
];
