// scripts/clean.cjs
const fs = require("fs");
const path = require("path");

const targets = process.argv.slice(2);
for (const target of targets) {
  const fullPath = path.resolve(__dirname, "..", target);
  try {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to clean ${target}:`, err);
  }
}
