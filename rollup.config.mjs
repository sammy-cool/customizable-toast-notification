import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import { visualizer } from "rollup-plugin-visualizer";
import replace from "@rollup/plugin-replace";

const buildTime = new Date().toISOString().slice(0, 19).replace("T", " ");

const banner = `/*!
 * Customizable Toast Notifications
 * Build: ${buildTime}
 * Cache-Buster: ${Date.now()}
 * Author: Priyanshu Patel
 * Email: priyanshu.alt191@gmail.com
 * License: Apache-2.0
 * Dependencies: None
 * Created: July 31, 2024
 * A lightweight and fully customizable toast notification library
 * designed for seamless integration with any JavaScript or framework-based UI.
 * Supports flexible positioning, theming, icons, animations, and timing options
 * out of the box — with CTA support and zero dependencies.
 */`;

const getCommonPlugins = (target) => [
  replace({
    preventAssignment: true,
    values: {
      __VERSION__: JSON.stringify(pkg.version),
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  }),
  // AUDIT CLEANUP: rollup-plugin-postcss removed — this library has zero
  // .css files anywhere (all styling is inline via JS Object.assign on
  // element.style throughout src/), so this step processed nothing on
  // every single build. Pure overhead (install size, build time) with no
  // functional benefit. If CSS-based theming is ever added later,
  // re-adding this is a quick `npm install rollup-plugin-postcss` plus
  // this block back — no need to carry it speculatively until then.
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
              ? { node: "14.0.0" }
              : target === "umd"
                ? {
                    browsers:
                      "> 0.25%, not dead, chrome >= 49, firefox >= 45, safari >= 10, edge >= 14",
                  }
                : { browsers: "> 0.25%, not dead, chrome >= 60", node: "14" },
          useBuiltIns: false,
          modules: false,
        },
      ],
    ],
  }),
  terser({
    compress: {
      drop_console: ["log", "info", "debug"],
      drop_debugger: true,
    },
    mangle: true,
    format: {
      comments: /^!/,
    },
  }),
];

export default [
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
      visualizer({
        filename: "./bundle-analysis.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
  },

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
    plugins: [...getCommonPlugins("esm")],
  },

  {
    input: "src/index.js",
    output: {
      file: "dist/index.cjs",
      format: "cjs",
      exports: "named",
      sourcemap: true,
      banner,
    },
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],
    plugins: [...getCommonPlugins("cjs")],
  },
];
