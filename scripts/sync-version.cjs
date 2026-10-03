const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "../package.json");
const indexPath = path.join(__dirname, "../src/index.js");

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const newVersion = pkg.version;

  if (!newVersion) {
    console.error("sync-version: No version found in package.json");
    process.exit(1);
  }

  let indexContent = fs.readFileSync(indexPath, "utf8");
  const versionRegex = /const version =\s*(?:typeof __VERSION__ !== "undefined"\s*\?\s*__VERSION__\s*:\s*)?"[^"]+";/;
  const replacement = `const version = typeof __VERSION__ !== "undefined" ? __VERSION__ : "${newVersion}";`;

  if (versionRegex.test(indexContent)) {
    indexContent = indexContent.replace(versionRegex, replacement);
    fs.writeFileSync(indexPath, indexContent, "utf8");
    console.log(`✅ Synced src/index.js version to ${newVersion}`);
  } else {
    console.warn("sync-version: Could not find version declaration in src/index.js");
  }
} catch (err) {
  console.error("sync-version failed:", err);
  process.exit(1);
}
