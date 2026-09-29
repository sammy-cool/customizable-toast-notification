// scripts/test-build.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

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
