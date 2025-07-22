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

## **\*\*\***FALLBACK MECHANISM FOR EVERY CODE BASE WHICH I HAVE TO FOLLOW ALWAYS EVERYTIME FOR EVERYTHING.**\*\*\***

**\*\*\*\*** \***\*BACKWARD COMPATIBILITY NEEED TO TAKE CARE IN CODE MIGRATION**\*\*\*\*\*
Flexible (future upgrades ke liye restrict na kare: aage progress bar, confirm modal, ya notification bell bhi ho paye!)
\*\*IMPORTANT NEED TO BE DONE\*\*\* >>> Like if we have or document.getElementById, document.createElement jo bhi element create ho wo random id bhi sath add rkhe taki agar same element user ke existing project me ho to conflict create na ho. thank you
✅ 3. Using Telemetry / Opt-In Tracking
Aap ek opt-in system bana sakte ho jahan users voluntarily tracking enable karte hain — jaise VS Code ya Next.js karte hain.

- [ ] Adding a prepublish hook in package.json to verify the readme or run a linter/check.
- [x] Write README examples
- [x] Add usage guide for developers
- [P0] Everytime Post published need to clear the cache of umd url (https://cdn.jsdelivr.net/npm/customizable-toast-notification/dist/index.umd.js).

## Tests

- [ ] Add integration tests for edge cases

---

NEXT = supports dark mode, accessibility (ARIA), or custom animation hooks enhancement.
Agar future mein kabhi:
Usage analytics chahiye ho
Auto-update checker
Better devX (TypeScript, tests, etc.)
Edge-case handling — e.g., stacking multiple toasts, responsive design, accessibility (screen-reader announcements).
Callback/Promise API support — such as onClick, onClose, jaisa kuch advanced alternatives mein hota hai.
Theming support — like global light/dark mode or CSS variables to simplify customization.
Better documentation & demos — showing integration and various use-cases in README ya on GitHub.
Toast customize karna (colors, icon, etc.)
Custom animations
Better accessibility (ARIA roles, screen-reader support)
Headless + styled options
Dark mode / theme support
Tiny size (~2KB)

Framework-agnostic (vanilla JS, React, Vue wrappers)

- How to stand out from the crowd for my package as there is Already popular options available hain:
  react-toastify
  notistack
  toastify-js
  So, it is clear to that I have to differentiate from these to win better
  🧭 It depends on:
  Problem-solving level — kya aap real issue solve kar rahe ho?
  Community reach — kitne log use kar rahe hain?
  Consistency — updates, docs, bugs fix etc.
  Marketing — GitHub stars, Hacker News, Reddit, Dev.to, etc.

Basic Month Goal but I have to make it early for all the option
0–1 MVP banana, GitHub pe publish karna, NPM pe upload
1–3 Documentation, Examples, Demo page, Share on forums
3–6 Early adopters, Feedback, 1K+ downloads aim
6–12 GitHub stars, sponsorship, pro version plan ya SaaS integration

Idea: Toast + Pro Features Combo
Basic free version:
Simple toasts
Color themes

Pro Version:
Push notification support
Sound/vibration support
Undo/Action buttons with backend integration
Analytics (kitne toasts dikhaye, kitne close hue)
SaaS dashboard for managing templates

\*\*Later ===> Free version ke README me likho:
👉 "Pro version with extended features available upon request or via license"

Piblic repo for free/basic version
Separate private repo for "Pro" Version

==============================
✨ Tips for Differentiating Your Toast Package
🎨 Custom animations or themes
🧑‍🦯 Accessibility support (screen readers)
🌙 Dark mode support
🪶 Lightweight (under 2KB if possible)

=============================================
PRO\_\_
🔁 Action buttons (Undo, Retry)
🔔 Push notification integration
📊 Analytics (Pro)
🔐 License key / SaaS hooks (Pro)

===stat ==> https://npm-stat.com/charts.html?package=customizable-toast-notification&from=2025-06-01&to=2025-07-16
\*\*\*\*IMPORTANT BUT TODO BE LATER
✅ 6. Using Sentry, LogRocket, or Self-Hosted Analytics
Agar aapka package frontend ke liye hai (e.g., React component library), to aap runtime pe analytics SDKs integrate kar sakte ho (with user consent):
Sentry (for error tracking)
LogRocket
Google Analytics (lite browser-based)
📌 Summary
Method Insight Ethical/Safe?
npmjs.com / npm-stat.com Downloads, versions ✅ Yes
postinstall script Custom install tracking ⚠️ Use with caution
GitHub Traffic Visitor + Clone data ✅ Yes
Dependents tab Package consumers ✅ Yes
Opt-in telemetry Usage analytics ✅ Yes

---

have to promote my library
Interceptor or intercept the console error and based on that show the popup

P0:- toast ka msg dynamically update krna hai in any case like framework ke case me ya html ya khi bhi...NNED TO VALIDATE=> kya possibility hai and impact and how much useful is this and suggestions or recommendation. AND MUST BE ISKE LIYE EK NAYA UPDATE API METHOD CREATE KRNA HOGA nyc

---

HAVE TO FIND OUT ALL THE LOOPHOLES OF MY LIBRARY ALMOMST AT THE END.
