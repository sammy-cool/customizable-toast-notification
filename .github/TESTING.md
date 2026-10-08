# Pre-Release Testing & Quality Assurance Protocol

This document outlines the mandatory testing matrix and verification gates required before every npm release.

---

## 1. Automated Test Verification

Run all test suites locally:

```bash
# 1. Run all unit & logic tests (100% pass required)
npm run ci:test

# 2. Run ESLint code quality checks (0 errors required)
npm run lint

# 3. Verify bundle builds for CJS, ESM, UMD, and DTS
npm run zone-build
npm run test:builds

# 4. Check for production vulnerabilities (0 vulnerabilities required)
npm audit --omit=dev
```

---

## 2. Browser & Environment Matrix

- [x] **Chrome / Chromium** (Latest 2 versions)
- [x] **Firefox** (Latest 2 versions)
- [x] **Safari / WebKit** (Latest 2 versions)
- [x] **Mobile Safari (iOS)** (Touch swipe & pinch gestures)
- [x] **Mobile Chrome (Android)** (Touch swipe & audio playback)
- [x] **Node.js SSR** (v18, v20, v22, v24)
- [x] **JSDOM / Headless Runner**

---

## 3. Feature Verification Checklist

### Core Features
- [ ] 4 Toast Types (success, error, warning, info) with accessible contrast colors
- [ ] 13 Supported Positions (corners, center alignments, full-width)
- [ ] Progress bar countdown (linear, pause-on-hover, custom height/colors)
- [ ] CTA Button / Link with auto-close and custom async handlers
- [ ] Grouping & deduplication with count badge

### Phase 2 & Phase 3 Advanced Features
- [ ] Stacked iOS card-deck layout (`stacked: true`) with hover expansion
- [ ] Swipe-to-dismiss touch/mouse drag with flick velocity detection
- [ ] Web Audio API notification tones with mute toggle
- [ ] Virtual scrolling element pool under 100+ rapid toasts
- [ ] Cross-tab sync via BroadcastChannel (`syncTabs: true`)
- [ ] AI priority routing (`aiPrioritization: true`)
- [ ] 6 Built-in Themes (light, dark, high-contrast, compact, spacious, glass)

---

## 4. Performance Gates

- [ ] `dist/index.umd.js` bundle size is strictly **< 50 KB**.
- [ ] No memory leaks on 1,000+ continuous toast cycles.
- [ ] No layout thrashing during entrance or exit animations (60 FPS).
