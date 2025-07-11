import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import { sizeSnapshot } from "rollup-plugin-size-snapshot"; // For bundle size analysis
import { visualizer } from "rollup-plugin-visualizer"; // For bundle size visualization
import replace from "@rollup/plugin-replace";
import postcss from "rollup-plugin-postcss";

import pkg from "./package.json";

export default {
  input: "src/index.js",
  output: [
    // { TODO: not in use as of now will Add CJS support LATER
    //   file: "dist/index.cjs",
    //   format: "cjs",
    //   exports: "auto",
    //   interop: "auto", // handles default interop with ESM/
    //   sourcemap: true, // Enable source maps for debugging
    // },
    {
      file: "dist/index.esm.mjs",
      format: "esm",
      sourcemap: true, // Enable source maps for debugging
    },
    {
      file: "dist/index.umd.js",
      format: "umd",
      name: "customizableToast", // global name for window.customizableToast
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ], // Add any external dependencies here if needed
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("production"),
      preventAssignment: true,
      values: {
        __VERSION__: JSON.stringify(pkg.version),
        "process.env.NODE_ENV": JSON.stringify("production"),
      },
    }),
    postcss({
      extract: false, // no CSS file output yet
      minimize: true, // minify any styles you add later
      modules: false, // change to true if you use CSS modules
    }),
    resolve(),
    commonjs(),
    terser({
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true, // Remove debugger statements in production
      },
      mangle: true, // Mangle variable names
    }),
    sizeSnapshot(), // Analyze bundle size
    visualizer({ filename: "./bundle-analysis.html", open: false }), // Generate a bundle size report
  ],
};
