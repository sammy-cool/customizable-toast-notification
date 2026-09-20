## [3.12.2](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.12.1...v3.12.2) (2026-09-20)


### Bug Fixes

* align Babel dependency versions ([7b50f5f](https://github.com/sammy-cool/customizable-toast-notification/commit/7b50f5f48865670a28d0a00501365fa158667509))

## [3.12.1](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.12.0...v3.12.1) (2026-09-11)


### Bug Fixes

* decouple progress bar border-radius from toast borderRadius ([7f316ac](https://github.com/sammy-cool/customizable-toast-notification/commit/7f316acd98c23d7cceeb59c1864de9bcfa60da43)), closes [#28a745](https://github.com/sammy-cool/customizable-toast-notification/issues/28a745)

# [3.12.0](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.11.5...v3.12.0) (2026-08-31)


### Features

* add toastPromise() and targeted per-toast dismissal handles ([2acd46a](https://github.com/sammy-cool/customizable-toast-notification/commit/2acd46a7b004ff68e078f5a08b4be1cc1d4e3ce7))

## [3.11.5](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.11.4...v3.11.5) (2026-08-23)


### Bug Fixes

* correct README defaults and add real TypeScript types ([8f262d3](https://github.com/sammy-cool/customizable-toast-notification/commit/8f262d387363cc7931b8431594d9147fd45ef2c1))

## [3.11.4](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.11.3...v3.11.4) (2026-08-19)


### Bug Fixes

* toast config and positioning regressions ([b35037a](https://github.com/sammy-cool/customizable-toast-notification/commit/b35037a93ef2e72e12e102160d276396dad222a9))

## [3.11.3](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.11.2...v3.11.3) (2026-08-12)


### Bug Fixes

* parse hsl()/var() and deterministic color fallback ([3b5978d](https://github.com/sammy-cool/customizable-toast-notification/commit/3b5978d2373aa85b3007eeee46399b964e6d1b45))

## [3.11.2](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.11.1...v3.11.2) (2026-08-12)


### Bug Fixes

* improve package builds and release verification ([84d3150](https://github.com/sammy-cool/customizable-toast-notification/commit/84d3150fa258bb77005001c467702ea10dc954cf))

## [3.11.1](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.11.0...v3.11.1) (2026-08-12)


### Bug Fixes

* upgrade Node.js to v24 and add git verification ([7668b45](https://github.com/sammy-cool/customizable-toast-notification/commit/7668b4520b1b88bfff08fdd8baf6ae8715cbc51f))

# Changelog

## [3.9.0] - 2025-09-16

### ✨ Major Release - Production Ready

Added
CTA support with button/link variants: options.cta { label, onClick, href, variant, target, rel, autoClose, ariaLabel }.

Pause-on-hover/focus for interactive toasts using a pausable timer; auto-enabled when CTA is present (can be overridden via options.pauseOnHover).

Robust grouping for identical notifications using full-message hashing plus same-frame coalescing to avoid race conditions under rapid clicks.

Grouped-count badge rendered at toast’s top-right; visible above the toast surface with subtle pulse on updates.

Strict queueing with MAX_VISIBLE=3; overflow toasts are queued and displayed when a slot frees after exit animation.

Container singleton per normalized position id; reuses the same DOM node and reattaches if detached to prevent duplicate containers.

Accessibility improvements: toast containers use role=status and aria-atomic to announce updates without stealing focus.

Changed
Toast DOM structure now uses outer(overflow: visible) + inner(overflow: hidden) wrappers so badges can extend visually while progress bars remain clipped by border-radius.

Dismiss timing refactored to a PausableTimer utility for accurate pause/resume semantics.

Fixed
Duplicate toasts created during rapid consecutive calls now group reliably instead of stacking.

Enforced visible limit so more than 3 toasts never render concurrently.

Badge layering ensured above toast and no clipping behind rounded corners, even with large border-radius (e.g., 50px).

Progress bar overflow prevented with inner clipping wrapper.

Eliminated duplicate container elements with the same id and cleaned up stray nodes.

Transition-aware removal uses transitionend with a safe fallback to prevent stuck toasts or early slot release.

Documentation
README updated with installation (npm/CDN), API tables, CTA usage examples, pause-on-hover behavior, grouping/queue semantics, and accessibility notes.

Migration Notes
No breaking changes. All new features are opt-in via options.cta and options.pauseOnHover. Existing integrations continue to work as-is.

Internal
Stress tests for grouping/queue/CTA interactions added.

Housekeeping around timers and DOM cleanup for reliability.

[3.4.x] - 2025-08-xx
Previous fixes and enhancements (see prior entries).

**Author:** Priyanshu Patel | **License:** Apache-2.0
