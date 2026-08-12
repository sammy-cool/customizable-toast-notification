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
