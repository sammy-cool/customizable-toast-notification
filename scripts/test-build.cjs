// scripts/test-build.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const zlib = require("zlib");

const distDir = path.join(__dirname, "..", "dist");

console.log("🧪 Testing builds...\n");

function getFilePath(file) {
  return path.join(distDir, file);
}

function assertFileExists(file) {
  const filePath = getFilePath(file);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ ${file} missing`);
    process.exit(1);
  }

  const stats = fs.statSync(filePath);

  if (stats.size === 0) {
    console.error(`❌ ${file} is empty`);
    process.exit(1);
  }

  console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
}

// ---------------------------------------------------------
// 1. Verify required build files exist
// ---------------------------------------------------------

const requiredFiles = [
  "index.esm.mjs",
  "index.cjs",
  "index.umd.js",
  "index.d.ts",
  "index.css",
  "index.css.d.ts",
  "react.esm.mjs",
  "react.cjs",
  "react.d.ts",
  "vue.esm.mjs",
  "vue.cjs",
  "vue.d.ts",
  "svelte.esm.mjs",
  "svelte.cjs",
  "svelte.d.ts",
  "solid.esm.mjs",
  "solid.cjs",
  "solid.d.ts",
  "angular.esm.mjs",
  "angular.cjs",
  "angular.d.ts",
];

requiredFiles.forEach(assertFileExists);

// ---------------------------------------------------------
// 2. Verify source maps exist
// ---------------------------------------------------------

const sourceMapFiles = [
  "index.esm.mjs.map",
  "index.cjs.map",
  "index.umd.js.map",
];

sourceMapFiles.forEach(assertFileExists);

const adapterList = ["react", "vue", "svelte", "solid", "angular"];

// ---------------------------------------------------------
// 3. Test CJS build
// ---------------------------------------------------------

try {
  const cjs = require("../dist/index.cjs");

  if (!cjs || typeof cjs !== "object") {
    throw new Error("CJS module did not return an object");
  }

  console.log("✅ CJS build works");
  console.log("   Exports:", Object.keys(cjs).join(", "));

  for (const ad of adapterList) {
    const mod = require(`../dist/${ad}.cjs`);
    if (!mod || typeof mod !== "object") {
      throw new Error(`CJS adapter ${ad} did not return an object`);
    }
    console.log(`✅ CJS adapter ${ad} works`);
  }
} catch (error) {
  console.error("❌ CJS build failed:", error.message);
  process.exit(1);
}

// ---------------------------------------------------------
// 4. Test ESM build
// ---------------------------------------------------------

(async () => {
  try {
    const esm = await import("../dist/index.esm.mjs");

    if (!esm || typeof esm !== "object") {
      throw new Error("ESM module did not return a module namespace");
    }

    console.log("✅ ESM build works");
    console.log("   Exports:", Object.keys(esm).join(", "));

    for (const ad of adapterList) {
      const mod = await import(`../dist/${ad}.esm.mjs`);
      if (!mod || typeof mod !== "object") {
        throw new Error(`ESM adapter ${ad} did not return a module namespace`);
      }
      console.log(`✅ ESM adapter ${ad} works`);
    }
  } catch (error) {
    console.error("❌ ESM build failed:", error.message);
    process.exit(1);
  }

  // -------------------------------------------------------
  // 5. Test UMD build
  // -------------------------------------------------------

  try {
    const umdPath = getFilePath("index.umd.js");
    const umdCode = fs.readFileSync(umdPath, "utf8");

    const context = {
      console,
      globalThis: {},
    };

    vm.createContext(context);
    vm.runInContext(umdCode, context, {
      filename: "dist/index.umd.js",
    });

    const customizableToast =
      context.customizableToast || context.globalThis.customizableToast;

    if (!customizableToast) {
      throw new Error("UMD global `customizableToast` was not created");
    }

    console.log("✅ UMD build works");
    console.log("   Exports:", Object.keys(customizableToast).join(", "));

    // Verify UMD gzipped bundle size does not exceed 50KB mandate
    const gzippedUmd = zlib.gzipSync(umdCode);
    const umdGzipKb = (gzippedUmd.length / 1024).toFixed(1);
    if (gzippedUmd.length > 50 * 1024) {
      throw new Error(`UMD bundle size exceeds 50KB budget: ${umdGzipKb}KB`);
    }
    console.log(`✅ UMD bundle within budget: ${umdGzipKb}KB gzipped (< 50KB budget)`);
  } catch (error) {
    console.error("❌ UMD build failed:", error.message);
    process.exit(1);
  }

  // -------------------------------------------------------
  // 6. Final result
  // -------------------------------------------------------

  console.log("\n✅ All builds successful!");
})().catch((error) => {
  console.error("❌ Build verification failed:", error.message);
  process.exit(1);
});
