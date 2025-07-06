import fs from "fs";
import os from "os";
import path from "path";
import cp from "child_process";

if (
  process.env.CI ||
  process.env.npm_config_global ||
  process.env.NODE_ENV === "production"
) {
  process.exit(0);
}

const appName = "customizable-toast";

let configDir;
switch (process.platform) {
  case "win32":
    configDir = path.join(
      process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"),
      appName
    );
    break;
  case "darwin":
    configDir = path.join(
      os.homedir(),
      "Library",
      "Application Support",
      appName
    );
    break;
  default:
    configDir = path.join(
      process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"),
      appName
    );
}

const storeFile = path.join(configDir, "install-count.json");

// Ensure config dir
fs.mkdirSync(configDir, { recursive: true });

// Read + increment count
let count = 0;
try {
  if (fs.existsSync(storeFile)) {
    if (process.platform === "win32") {
      try {
        cp.execSync(`attrib -h "${storeFile}"`);
      } catch (err) {
        process.exit(0);
      }
    }
    const data = JSON.parse(fs.readFileSync(storeFile, "utf8"));
    count = data.count || 0;
  }
} catch {
  count = 0;
}

count++;

// Save count back
try {
  fs.writeFileSync(storeFile, JSON.stringify({ count }), "utf8");
  if (process.platform === "win32" && count === 1) {
    try {
      cp.execSync(`attrib +h "${storeFile}"`);
    } catch (err) {
      process.exit(0);
    }
  }
} catch (err) {
  process.exit(0);
}

// --- Message Logic ---
if (count === 1 || count === 2 || count === 5) {
  showMessage(count);
} else {
  process.exit(0); // Silent for other installs
}

// --- Spinner + Delayed Message Box ---
function showMessage(count) {
  const width = process.stdout.columns || 80;
  const boxWidth = 60;

  const spinnerFrames = ["|", "/", "-", "\\"];
  let i = 0;

  const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, "");
  const pad = (text) =>
    " ".repeat(Math.max(boxWidth - stripAnsi(text).length, 0));
  const center = (text) =>
    " ".repeat(Math.max(Math.floor((width - stripAnsi(text).length) / 2), 0)) +
    text;

  const lines = [
    count === 5
      ? "🎯Thanks for sticking with it!\nThis is the final message. 🚀"
      : `📦Thanks for using this package!`,
    "",
    "📘 For help: Check the README.md",
    "🤝 Open to collaboration & teamwork.",
    "💼 Looking for exciting dev opportunities.",
    "🔗 Contact: priyanshu.alt191@gmail.com",
    "🚀 Built different. Stay creative.",
  ];

  const spinner = setInterval(() => {
    process.stdout.write(
      `\r⏳ Finalizing install ${spinnerFrames[i++ % spinnerFrames.length]} `
    );
  }, 100);

  setTimeout(() => {
    clearInterval(spinner);
    process.stdout.write("\r".padEnd(40, " ") + "\r"); // Clear spinner line

    console.log(
      "\n" + center(`\x1b[36m\x1b[1m╔${"═".repeat(boxWidth)}╗\x1b[0m`)
    );
    lines.forEach((line) => {
      line.split("\n").forEach((sub) => {
        console.log(
          center(`\x1b[36m║ \x1b[0m${sub}${pad(sub)}\x1b[36m ║\x1b[0m`)
        );
      });
    });
    console.log(center(`\x1b[36m╚${"═".repeat(boxWidth)}╝\x1b[0m`) + "\n");

    process.exit(0); // ✅ Exit only after message shown
  }, 1200);
}
