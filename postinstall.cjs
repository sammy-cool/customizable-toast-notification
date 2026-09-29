try {
  if (
    process.env.CI ||
    process.env.NODE_ENV === "prod" ||
    process.env.NODE_ENV === "production"
  ) {
    process.exit(0);
  } else {
    showMessage();
  }

  function showMessage() {
    const lines = [
      "🎯Thanks for sticking with it! This is the final message. 🚀...📦Thanks for using this package!",
      "📘 In README.md - More professional",
      "👨‍💻 Author **Priyanshu Patel** -",
      "🤝 Open to collaboration & teamwork",
      "💼 Looking for exciting dev opportunities.",
      "🔗 Contact: priyanshu.alt191@gmail.com",
      "🚀 Built different. Stay creative.",
    ];

    // AUDIT FIX (L4): console.log(lines) on an array prints Node's array-
    // inspection format (`[ 'line1', 'line2', ... ]`), not clean
    // multi-line text. join("\n") prints it the way it was obviously
    // meant to look.
    console.log(lines.join("\n"));
  }
} catch (error) {
  process.exit(0);
}
