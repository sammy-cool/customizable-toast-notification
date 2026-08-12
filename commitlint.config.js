// commitlint.config.js
//
// WHY THIS FILE EXISTS: semantic-release decides your version bump (patch/
// minor/major) entirely by reading commit messages — "fix: ..." → patch,
// "feat: ..." → minor, a footer containing "BREAKING CHANGE:" → major.
// If commit messages don't follow this format, semantic-release has
// nothing reliable to read and either does nothing or guesses wrong. This
// config + the husky hook below REJECT a commit locally, before it ever
// reaches GitHub, if it doesn't follow the format — so the automation
// always has something trustworthy to work from.
//
// Conventional Commits format: <type>(<optional scope>): <description>
// Examples that PASS:
//   fix: correct progress bar overflow for small borderRadius
//   feat(sanitizer): align DOMPurify and fallback allowlists
//   fix!: remove style attribute support from allowHtml (BREAKING CHANGE)
// Examples that FAIL (and will be rejected):
//   "fixed a bug"
//   "updates"
//   "wip"

module.exports = {
  extends: ["@commitlint/config-conventional"],
};
