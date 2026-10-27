import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json");

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { visualizer } from "rollup-plugin-visualizer";
import replace from "@rollup/plugin-replace";
import esbuild from "esbuild";

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

/**
 * High-performance native esbuild plugin for Rollup.
 * Replaces legacy Babel and Terser with ultra-fast Go-based compilation and minification.
 * @param {"umd" | "esm" | "cjs"} target
 * @returns {import("rollup").Plugin}
 */
const esbuildPlugin = (target) => ({
  name: "rollup-plugin-esbuild-native",
  async transform(code, id) {
    if (id.includes("node_modules")) return null;
    const result = await esbuild.transform(code, {
      loader: id.endsWith(".ts") ? "ts" : "js",
      target: target === "cjs" ? "node14" : "es2020",
      sourcemap: true,
      sourcefile: id,
    });
    return {
      code: result.code,
      map: result.map,
    };
  },
  async renderChunk(code, chunk) {
    const result = await esbuild.transform(code, {
      minify: true,
      target: target === "cjs" ? "node14" : "es2020",
      sourcemap: true,
      sourcefile: chunk.fileName,
      legalComments: "inline",
      drop: ["debugger"],
      pure: ["console.log", "console.info", "console.debug"],
    });
    return {
      code: result.code,
      map: result.map,
    };
  },
});

const getCommonPlugins = (target) => [
  replace({
    preventAssignment: true,
    values: {
      __VERSION__: JSON.stringify(pkg.version),
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
  }),
  resolve({
    browser: target === "umd",
    preferBuiltins: target !== "umd",
  }),
  commonjs(),
  esbuildPlugin(target),
];

export default [
  {
    input: "src/index.js",
    output: {
      file: "dist/index.umd.js",
      format: "umd",
      name: "customizableToast",
      exports: "named",
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

  ...["react", "vue", "svelte", "solid", "angular"].flatMap((adapter) => [
    {
      input: `src/${adapter}/index.js`,
      output: {
        file: `dist/${adapter}.esm.mjs`,
        format: "esm",
        sourcemap: true,
        banner: adapter === "react" ? '"use client";\n' + banner : banner,
      },
      external: [
        "react",
        "vue",
        "svelte",
        "solid-js",
        "@angular/core",
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
      ],
      plugins: [...getCommonPlugins("esm")],
    },
    {
      input: `src/${adapter}/index.js`,
      output: {
        file: `dist/${adapter}.cjs`,
        format: "cjs",
        exports: "named",
        sourcemap: true,
        banner: adapter === "react" ? '"use client";\n' + banner : banner,
      },
      external: [
        "react",
        "vue",
        "svelte",
        "solid-js",
        "@angular/core",
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
      ],
      plugins: [...getCommonPlugins("cjs")],
    },
  ]),
];
