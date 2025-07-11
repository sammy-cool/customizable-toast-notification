try {
  if (
    process.env.CI ||
    process.env.NODE_ENV === "prod" ||
    process.env.NODE_ENV === "production"
  ) {
    process.exit(0);
  } else {
    showMessage(5);
  }

  function showMessage(count) {
    const width = process.stdout.columns || 80;
    const boxWidth = 60;

    const spinnerFrames = ["|", "/", "-", "\\"];
    let i = 0;

    const stripAnsi = (text) => text.replace(/\x1b\[[0-9;]*m/g, "");
    const pad = (text) =>
      " ".repeat(Math.max(boxWidth - stripAnsi(text).length, 0));
    const center = (text) =>
      " ".repeat(
        Math.max(Math.floor((width - stripAnsi(text).length) / 2), 0)
      ) + text;

    const lines = [
      count === 5
        ? "🎯Thanks for sticking with it!\nThis is the final message. 🚀"
        : `📦Thanks for using this package!`,
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
} catch (error) {
  process.exit(0); // Exit silently
}
