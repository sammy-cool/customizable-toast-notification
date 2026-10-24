const fs = require("fs");
const path = require("path");

const pkgPath = path.join(__dirname, "../package.json");
const indexPath = path.join(__dirname, "../src/index.js");
const readmePath = path.join(__dirname, "../README.md");
const docsIndexPath = path.join(__dirname, "../docs/index.html");
const bugReportPath = path.join(__dirname, "../.github/ISSUE_TEMPLATE/bug_report.yml");

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const newVersion = pkg.version;

  if (!newVersion) {
    console.error("sync-version: No version found in package.json");
    process.exit(1);
  }

  // 1. Sync src/index.js
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

  // 2. Sync README.md CDN version pins
  if (fs.existsSync(readmePath)) {
    let readmeContent = fs.readFileSync(readmePath, "utf8");
    const readmeCdnRegex = /(customizable-toast-notification@)\d+\.\d+\.\d+/g;
    if (readmeCdnRegex.test(readmeContent)) {
      readmeContent = readmeContent.replace(readmeCdnRegex, `$1${newVersion}`);
      fs.writeFileSync(readmePath, readmeContent, "utf8");
      console.log(`✅ Synced README.md CDN pins to ${newVersion}`);
    }
  }

  // 3. Sync docs/index.html version badge and CDN snippets
  if (fs.existsSync(docsIndexPath)) {
    let docsContent = fs.readFileSync(docsIndexPath, "utf8");
    let docsUpdated = false;

    const badgeRegex = /(id="versionBadge">)v\d+\.\d+\.\d+(<\/span>)/;
    if (badgeRegex.test(docsContent)) {
      docsContent = docsContent.replace(badgeRegex, `$1v${newVersion}$2`);
      docsUpdated = true;
    }

    const docsCdnRegex = /(customizable-toast-notification@)\d+\.\d+\.\d+/g;
    if (docsCdnRegex.test(docsContent)) {
      docsContent = docsContent.replace(docsCdnRegex, `$1${newVersion}`);
      docsUpdated = true;
    }

    if (docsUpdated) {
      fs.writeFileSync(docsIndexPath, docsContent, "utf8");
      console.log(`✅ Synced docs/index.html version and badges to ${newVersion}`);
    }
  }

  // 4. Sync .github/ISSUE_TEMPLATE/bug_report.yml version placeholder
  if (fs.existsSync(bugReportPath)) {
    let bugReportContent = fs.readFileSync(bugReportPath, "utf8");
    const placeholderRegex = /(label: Package version[\s\S]*?placeholder:\s*")\d+\.\d+\.\d+(")/;
    if (placeholderRegex.test(bugReportContent)) {
      bugReportContent = bugReportContent.replace(placeholderRegex, `$1${newVersion}$2`);
      fs.writeFileSync(bugReportPath, bugReportContent, "utf8");
      console.log(`✅ Synced bug_report.yml version placeholder to ${newVersion}`);
    }
  }
} catch (err) {
  console.error("sync-version failed:", err);
  process.exit(1);
}
