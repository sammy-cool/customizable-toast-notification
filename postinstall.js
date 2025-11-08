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

    console.log(lines);
  }
} catch (error) {
  process.exit(0); // Exit silently
}
