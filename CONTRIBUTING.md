# Contributing

Thanks for considering a contribution — genuinely appreciated. This project
has a real test suite and a real release pipeline, so a few things here
matter more than they might in a smaller repo.

## Getting set up

```bash
git clone https://github.com/sammy-cool/customizable-toast-notification.git
cd customizable-toast-notification
npm install
```

This also installs a git hook (via husky) that checks your commit messages
follow [Conventional Commits](https://www.conventionalcommits.org/) — see
below for why that matters here specifically.

## Running things locally

```bash
npm run lint            # ESLint
node --test tests/logic/  # fast unit-style tests, no browser needed
npm run zone-build       # full build: JS bundles + TypeScript types
npx playwright test      # full end-to-end suite (Chromium/Firefox/WebKit)
```

Please run at least `npm run lint` and `node --test tests/logic/` before
opening a PR — both are fast (well under a minute) and CI will catch
anything you miss anyway, but catching it locally saves a round trip.

## Commit message format matters here

This repo uses [semantic-release](https://semantic-release.gitbook.io/) —
merging to `master` with a properly-formatted commit message triggers an
automatic version bump and npm publish. That means commit *type* isn't
just style, it has a real effect:

- `fix: ...` → patch release
- `feat: ...` → minor release
- `fix!: ...` or a `BREAKING CHANGE:` footer → major release
- `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `style:` → no release triggered

If your PR is a real bug fix or new capability, use `fix:`/`feat:` even if
part of the same PR also includes chores — classify by the most significant
change in the commit, not the easiest label. The commit-msg hook will
reject anything that doesn't parse as a valid Conventional Commit, so
you'll find out immediately if something's off.

## What a good PR looks like here

- **Tests for behavior changes.** If you're fixing a bug, a regression test
  that fails before your fix and passes after is the most convincing thing
  you can include — look at `tests/logic/logic-verification.test.mjs` or
  `tests/e2e/*.spec.js` for the existing style.
- **Security-sensitive changes get extra scrutiny.** Anything touching
  `src/utils/html-sanitizer.js` or the `allowHtml` code path — please
  explain your reasoning in the PR description, and expect follow-up
  questions. This library's whole pitch includes "sanitized by default,"
  so that code path doesn't get casual changes.
- **Don't hand-edit `CHANGELOG.md`, `package.json`'s `version` field, or
  anything under `dist/`.** All three are generated automatically by the
  release pipeline — a manual edit will just get overwritten (or fought
  with) on the next release.

## Reporting bugs / requesting features

Please use the issue templates — they ask for the couple of details that
almost always end up being the first follow-up question anyway (repro
steps, expected vs. actual, environment), so using them gets you a real
answer faster.

## Found a security issue?

Please don't open a public issue — see [SECURITY.md](SECURITY.md) instead.

## Code style

ESLint (`npm run lint`) is the source of truth — if it passes, style is
fine. No separate style guide to memorize.

## License

By contributing, you agree your contribution is licensed under this
project's [Apache-2.0 License](LICENSE).
