// scripts/test-builds.js
const fs = require("fs");
const path = require("path");

console.log("🧪 Testing builds...");

// Test CJS
try {
  const cjs = require("../dist/index.cjs");
  console.log("✅ CJS build works", Object.keys(cjs));
} catch (e) {
  console.error("❌ CJS build failed:", e.message);
  process.exit(1);
}

// Test file existence
const files = ["index.esm.mjs", "index.cjs", "index.umd.js", "index.d.ts"];
files.forEach((file) => {
  const filePath = path.join(__dirname, "..", "dist", file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)}KB)`);
  } else {
    console.error(`❌ ${file} missing`);
    process.exit(1);
  }
});

console.log("✅ All builds successful!");
