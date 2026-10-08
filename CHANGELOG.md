# [3.16.0](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.15.0...v3.16.0) (2026-10-08)


### Bug Fixes

* **broadcast:** implement 64-bit CSPRNG cross-process tab ID generator ([6e37e6c](https://github.com/sammy-cool/customizable-toast-notification/commit/6e37e6cccf9ae55d15372c57c0047d91f68e7ae7))
* **dom:** support 4-digit hex color parsing and clean up emergency toast listeners ([c190ae3](https://github.com/sammy-cool/customizable-toast-notification/commit/c190ae31b3dea9e6d84a415a6b884e0ccf83f451))
* **e2e:** eliminate cross-browser swipe gesture and CTA click race conditions ([f6efd70](https://github.com/sammy-cool/customizable-toast-notification/commit/f6efd70dd5db4f8139b4b8a81ef9284a94e59ba6))
* **e2e:** eliminate entry animation click race in close button test and extend CI timeouts ([bfb7aff](https://github.com/sammy-cool/customizable-toast-notification/commit/bfb7aff986d2fa4577371e27f7d73d4f8f1ba746))
* **e2e:** eliminate entry animation click race in CTA async autoClose test ([91f9ffa](https://github.com/sammy-cool/customizable-toast-notification/commit/91f9ffa3910011a2b2f704099d580f0a1752844c))
* **e2e:** harden cross-browser E2E suite for Firefox, WebKit, and Chromium ([fa2573f](https://github.com/sammy-cool/customizable-toast-notification/commit/fa2573f5cb65329ca1d4b9b8a055a2625d9ca627))
* guard cross-tab broadcaster with syncTabs and constrain mobile swipe viewport bounds ([8dc73cf](https://github.com/sammy-cool/customizable-toast-notification/commit/8dc73cfe8b15b792d3b49be9bfd3a1fc34a726f4))
* harden Phase 3 architecture with deterministic scoring, config reset, and pool lifecycle ([00158ef](https://github.com/sammy-cool/customizable-toast-notification/commit/00158ef38759e125ac7a0627d524ccfaad3b9243))
* **id:** align ID generator with Smart Hybrid sessionSalt and monotonic counter ([7df6847](https://github.com/sammy-cool/customizable-toast-notification/commit/7df6847606508766af3a8c7307593827580c3cfd))
* **lifecycle:** prevent DOM/listener leaks and bound high-frequency queue bursts ([af60f37](https://github.com/sammy-cool/customizable-toast-notification/commit/af60f379c7d5844053882bd450ab2bdbc131322c)), closes [hi#frequency](https://github.com/hi/issues/frequency)
* **test:** replace invalid touchscreen.swipe API with touch dispatch in phase2 E2E spec ([0263208](https://github.com/sammy-cool/customizable-toast-notification/commit/02632080df26bc529952b6c0917d3ce41e799e73))
* upgrade to zero-collision monotonic ID generator and CSPRNG tab entropy ([94646a5](https://github.com/sammy-cool/customizable-toast-notification/commit/94646a5472252d02fc36d50b442864b35e7cbc59))


### Features

* add CSS variables system with 6 built-in themes and auto-generated types ([9a268b0](https://github.com/sammy-cool/customizable-toast-notification/commit/9a268b0623a8175270d52bcd7513b98e46aec8c0)), closes [hi#contrast](https://github.com/hi/issues/contrast) [hi#contrast](https://github.com/hi/issues/contrast)
* add Phase 2 global config for stacked layout, swipe-to-dismiss, and audio ([f38e3e8](https://github.com/sammy-cool/customizable-toast-notification/commit/f38e3e8f634f7b65a13c242929041bb9bb5fd6af))
* add virtual scrolling toast element pool for efficient 100+ toast handling ([4f50a9f](https://github.com/sammy-cool/customizable-toast-notification/commit/4f50a9f34f1d3010a5ca53de59a89876ab2f3b18))
* **animation:** add configurable spring physics animation engine ([948da3b](https://github.com/sammy-cool/customizable-toast-notification/commit/948da3b9dcd94ed111942891f1c7b9b5da9417e2))
* **audio:** add zero-asset chime presets and custom synthesizer registry ([4e424e1](https://github.com/sammy-cool/customizable-toast-notification/commit/4e424e1e0c9a472fe3cc28e0c2e86fdaccbb30d3))
* **cta:** support multi-action CTA arrays, add developer cookbook and production recipes ([60bc073](https://github.com/sammy-cool/customizable-toast-notification/commit/60bc073a2de63f8545c276b7d04c456cc754a6e2))
* **dx:** add CodeQL security workflow, trust badges, and StackBlitz sandbox starters ([2d15ecc](https://github.com/sammy-cool/customizable-toast-notification/commit/2d15ecc32418d44d17303bfad5efeb9569db9b37))
* global configuration API with CSP mode and framework adapters ([9a30a50](https://github.com/sammy-cool/customizable-toast-notification/commit/9a30a502e67d2987cb81ab2c0fcec52b25fbc2cf))
* phase 3 advanced features, docs, and coverage infrastructure ([abda556](https://github.com/sammy-cool/customizable-toast-notification/commit/abda556382aa83756218354df73e8a5d75d97ccd))
* **recipes:** add TypeSafe AI smart triage, framework HTML demos, and playground oscilloscope ([5ec3a2c](https://github.com/sammy-cool/customizable-toast-notification/commit/5ec3a2cf16ac03e087543b08c4e5512cfb31ea34))
* **telemetry:** add onMetrics hook, framework adapters, and playground burst simulator ([be06cf2](https://github.com/sammy-cool/customizable-toast-notification/commit/be06cf22ecd6a093c0b69fb94c7899d5b03bfd82))
* **undo:** add action undo with live dynamic countdown badge ([0ef736d](https://github.com/sammy-cool/customizable-toast-notification/commit/0ef736d311771faff9d8dd8d0ad603b39e28737a))


### Performance Improvements

* **core:** optimize render pipeline, add CSS containment and eliminate forced reflows ([bb4e4ce](https://github.com/sammy-cool/customizable-toast-notification/commit/bb4e4ce0f83bfa94c9d445daf45d92f25e9325f0))

# [3.16.0](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.15.0...v3.16.0) (2026-10-04)

### Features

* **phase-3:** virtual scrolling with DOM element recycling for 100+ toasts ([xxx](commit))
* **phase-3:** cross-tab toast synchronization via BroadcastChannel API ([xxx](commit))
* **phase-3:** advanced gestures (flick detection and pinch-to-expand) ([xxx](commit))
* **phase-3:** AI-powered priority routing with TypeSafe AI integration ([xxx](commit))
* **testing:** expand E2E test coverage for Phase 2 features (stacked, swipe, audio) ([xxx](commit))
* **testing:** add code coverage tracking with c8 and Codecov integration ([xxx](commit))
* **ci/cd:** run E2E tests on all pushes (not just PRs) ([xxx](commit))
* **ci/cd:** add automated weekly security audits workflow ([xxx](commit))
* **docs:** add comprehensive Phase 3 features documentation to README ([xxx](commit))
* **docs:** create 7 new documentation files (API, integration guides, troubleshooting) ([xxx](commit))

### Changed

* enhanced CI/CD pipeline with code coverage thresholds (80% minimum) ([xxx](commit))
* updated E2E test infrastructure with retry logic and improved reporting ([xxx](commit))
* improved documentation organization with separate docs directory ([xxx](commit))

# [3.15.0](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.14.0...v3.15.0) (2026-10-03)


### Features

* automate package version synchronization across release lifecycle ([203a260](https://github.com/sammy-cool/customizable-toast-notification/commit/203a260f3fd912e6065d001777b905b944dad5a1))

# [3.14.0](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.13.0...v3.14.0) (2026-10-03)


### Features

* elevate playground UI/UX and fix release workflow git notes ([7a06f36](https://github.com/sammy-cool/customizable-toast-notification/commit/7a06f360716eb9ad7120203981135f781742ff4a))

# [3.13.0](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.12.4...v3.13.0) (2026-10-03)


### Bug Fixes

* correct wrapText truncate logic, enhance CTA href handling, and prune dead code ([6252d35](https://github.com/sammy-cool/customizable-toast-notification/commit/6252d35d0552b2207a767d40d35545c58a00e0a8))
* eliminate postinstall anti-pattern, harden CI gates, and add defensive edge-case handling ([7856d30](https://github.com/sammy-cool/customizable-toast-notification/commit/7856d3064437b048cdaa20328c9c9bf5decd914b))
* harden edge cases across id generator, timers, container registry, and promise wrappers ([0678f85](https://github.com/sammy-cool/customizable-toast-notification/commit/0678f85c93731796800cec3a179feef1ed033359))
* harden progress option, ensure strict typings, and defend against NaN ([fd8a082](https://github.com/sammy-cool/customizable-toast-notification/commit/fd8a0824f9810d41d0b77a3aa5f79f774dc4261e))
* harden workflows, make toast dismissal concurrent, and document className ([8d4ad60](https://github.com/sammy-cool/customizable-toast-notification/commit/8d4ad607b182ad7ac673ced996989c77aa991f6b))
* **package:** remove duplicate author field and remove postinstall from files array ([125ece6](https://github.com/sammy-cool/customizable-toast-notification/commit/125ece6a44f44e3760e191f7ce0bbe3423a6321e))
* preserve loader element during text rendering and add loader types and tests ([fa30711](https://github.com/sammy-cool/customizable-toast-notification/commit/fa30711d5330f921401e85a6996892d2bd022003))
* prioritize active toasts in dismissMostRecent to drain queue ([ab6d0a3](https://github.com/sammy-cool/customizable-toast-notification/commit/ab6d0a37c2c721412f64f70c420e3c3b2d2a2045))
* resolve 28 bugs across positioning, sanitization, timers, workflows, and a11y ([9f21ee7](https://github.com/sammy-cool/customizable-toast-notification/commit/9f21ee7fb9d90d6673d61695e82c5953a14174db))
* standardize toast exit animation transform to downward movement ([3e4e273](https://github.com/sammy-cool/customizable-toast-notification/commit/3e4e273dd0f8fe521832082250b7a7b35bfc5da5))


### Features

* add live updates, stacked card deck, swipe dismiss, and audio synth ([67b2ede](https://github.com/sammy-cool/customizable-toast-notification/commit/67b2eded62c9443be119319daae7c6da738807c6))
* add loader controls to playground and TypeSafe AI smart toast recipe ([b8e84e7](https://github.com/sammy-cool/customizable-toast-notification/commit/b8e84e7c91c5794e6333cef2e61d51a0823bdd85))
* **animation:** add custom animation, exit transitions, and memory safeguards ([f8cf63c](https://github.com/sammy-cool/customizable-toast-notification/commit/f8cf63cfb600c606e8fd77fc5ebac9f0b275181c))
* auto-convert numeric dimensional options to px and restore forceReflow ([6a42f71](https://github.com/sammy-cool/customizable-toast-notification/commit/6a42f718f5bbc6b1366956c875e2fd8fa22657b1))

## [3.12.4](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.12.3...v3.12.4) (2026-10-03)


### Bug Fixes

* resolve 22 bugs across positioning, sanitization, timers, cleanup, and a11y ([cdbf56a](https://github.com/sammy-cool/customizable-toast-notification/commit/cdbf56a5b54ad2cb45506ea9f424a54a137a90fa))
* resolve 28 bugs across positioning, sanitization, timers, workflows, and a11y… ([#45](https://github.com/sammy-cool/customizable-toast-notification/issues/45)) ([a60bd70](https://github.com/sammy-cool/customizable-toast-notification/commit/a60bd70155a2255b28fbec45d07f27f21e34d38b))

## [3.12.3](https://github.com/sammy-cool/customizable-toast-notification/compare/v3.12.2...v3.12.3) (2026-09-29)


### Bug Fixes

* resolve 22 bugs across positioning, sanitization, timers, cleanup, and a11y ([8d8c181](https://github.com/sammy-cool/customizable-toast-notification/commit/8d8c18195384b2058128817ff823d15c785c8252))

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
