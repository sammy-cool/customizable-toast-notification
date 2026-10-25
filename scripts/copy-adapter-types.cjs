const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dist = path.join(root, "dist");

if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist, { recursive: true });
}

const adapters = ["react", "vue", "svelte", "solid", "angular"];

for (const adapter of adapters) {
  const src = path.join(root, "src", adapter, "index.d.ts");
  const dest = path.join(dist, `${adapter}.d.ts`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${adapter}.d.ts -> dist/${adapter}.d.ts`);
  } else {
    console.warn(`Warning: ${src} not found`);
  }
}
