# TODO List for MyLibrary

## Features

- [ ] Add support for JSON schema validation
- [ ] Implement caching for repeated API calls
- [ ] Add CLI interface
- [x] Optional Animated Progress Bar synced to duration
- [ ] Accessibility improvements:
  - Add ARIA roles and labels to toast container
  - Ensure close button is keyboard-accessible (`tab`, `Enter`)
- [ ] Runtime validation for user options (e.g., types, required values)
- [ ] Improved error handling and input sanitization

## Refactoring

- [ ] Simplify `Parser` class logic
- [ ] Replace old logging with new `Logger` utility

## Documentation

- [ ] Adding a prepublish hook in package.json to verify the readme or run a linter/check.
- [x] Write README examples
- [x] Add usage guide for developers
- [P0] Post published need to clear the cache of umd url.

## Tests

- [ ] Add integration tests for edge cases

NEXT = supports dark mode, accessibility (ARIA), or custom animation hooks enhancement.
