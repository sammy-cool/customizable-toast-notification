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

===stat ==> https://npm-stat.com/charts.html?package=customizable-toast-notification
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

# P0:- toast ka msg dynamically update krna hai in any case like framework ke case me ya html ya khi bhi...NNED TO VALIDATE=> kya possibility hai and impact and how much useful is this and suggestions or recommendation. AND MUST BE ISKE LIYE EK NAYA UPDATE API METHOD CREATE KRNA HOGA nyc

## P0 - Progress bar as a spinner or progress bar dynamic optional for user.

*P1 - POSITION - LEFT-LINE-CENTER, RIGHT-LINE-CENTER, TOP-LINE-CENTER, BOTTOM-LINE-CENTER
*CDN Cache Bust
Version change ke baad fresh JS load ho raha hai ya purana
\*Bundle / Tree shaking
Final bundle me library size check karo (Bundlephobia jaise tool se)
Unused export import na ho

# Developer UX

Wrong usage pe dev ko useful console message mil raha hai ya nahi
setDefaultColors/setDefaultMessages multiple times call possible ya nahi

# Error Handling

\*Invalid config pe console warning ya error throw ho raha hai ya silent fail
^CSS error (e.g. wrong color) pe graceful fallback

# Responsiveness & Cross‑browser

*Chrome, Firefox, Edge, Safari
*Mobile viewport me open karo
\*Toast text ellipsis / wrapping

# Reliability & Edge Cases

🧩 Edge Cases:
Empty message & no type
Invalid type e.g. "foobar"
Negative duration: -1000
Very large duration: 9999999
Non‑string message: e.g. message: 1234

# 🧩 Memory / cleanup:

Rapid fire 100 toast → dekho memory leak nahi
Toast auto-dismiss ho raha hai ya nahi

# Multiple Toasts Test

Ek hi position par multiple toast fire
Alag‑alag position par parallel toast fire
Dekho overlap / stacking sahi kaam kar raha hai

## App‑wide Configuration

# 🧩 setDefaultColors:

Custom brand colors set karo
Fir createToast me type only pass karo → dekho custom color use ho raha ya nahi

# 🧩 setDefaultMessages:

Custom messages set karo
createToast me sirf type do, custom message aaye ya nahi

## IMP FOR UX DEV

# Re‑trigger same toast quickly

Do bar same message & same type ka toast within 100ms:
Should it stack? replace? ignore?
Expected: usually stack, but UX team decide kar sake.

####

```
🏃‍♂️ 2. Cancel in‑flight toast
Toast fire kiya duration: 5000
Phir turant manually dismiss (close button)
Dekho:
Cleanup hua ya nahi?
Memory leak nahi?
Next toast unaffected?
🧩 3. Runtime update
setDefaultColors call karo
Phir pehle se dikha hua active toast ka color update hota hai ya nahi?
By design: mostly nahi hona chahiye; nai toast pe apply ho.
🔁 4. Very high concurrency
Ek loop me 50–100 toast ek sath fire karo:
Browser crash to nahi?
Stack overflow / performance issue?
🧪 5. Super short duration
duration: 0 ya duration: 10 ms
Toast flash karke gayab hona chahiye, ya visible hi na ho?
🕰 6. Extremely long duration
duration: Infinity ya Number.MAX_SAFE_INTEGER:
Toast kabhi dismiss nahi hoga?
Memory leak ka risk?
🧙‍♂️ 7. Exotic CSS values
animationDuration: "-1s" ya "abc"
backgroundColor: "invalidColor"
Dekho: silent fail, console warning, or break?
🧪 8. Missing container / DOM context
Page load hone se pehle createToast fire
Should gracefully handle: queue & render after DOM ready, or no-op
💻 9. SSR / Node environment
Accidentally Node.js me import kiya
Kya error throw karta hai? ya safe no-op?
Ideal: library detect kare browser-only context.
🌙 10. Accessibility / a11y
Toast ARIA live region me announce hota hai ya nahi?
Screen reader read kare ya skip kare?
🌍 11. RTL / LTR language support
Position "top-left" vs "top-right" different meaning ho sakta hai RTL locales me
Visually test in RTL mode
🔐 12. Security
message me HTML / script inject karke dekho:
createToast({ message: "<script>alert('XSS')</script>", type: "info" })
XSS prevent ho raha hai ya nahi?
📦 13. Duplicate imports
Same bundle do bar import kiya (UMD + ESM)
Multiple container create ho raha hai? ya singleton?
🧰 14. Dynamic import / lazy load
Dynamically import() karo library
Pehle toast fire karo, fir import:
Race condition, crash ya no-op?
📱 15. Orientation change / resize
Toast render ho raha hai tab mobile landscape ↔ portrait
Toast reposition hota hai ya cut off?
✅ Bonus: Developer usability edge cases
Misspelled key: e.g. postion instead of position
Console warning?
Wrong type: duration: "fast"
Using deprecated API: graceful message
✨ Summary:
Ye extra use cases & edge cases tumhare library ko rock‑solid banayenge:
UX consistency
Unexpected inputs
Runtime / concurrency / performance
Accessibility & security
Dev experience
```

###

| #      | Category                   | Test Case                                                | Input / Setup                                                                                     | Expected Result                                                                                       |
| ------ | -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **1**  | Basic usage                | Default toast                                            | `{ message: "Hello" }`                                                                            | Type = "info"; default position = "bottom-right"; duration=3000ms; visible properly; dismiss after 3s |
| **2**  | Basic usage                | Type only                                                | `{ type: "success" }`                                                                             | Message = default from `setDefaultMessages` or built-in; success color applied; duration=3000ms       |
| **3**  | Basic usage                | Minimal                                                  | Empty object `{}`                                                                                 | Message=default, type="info"; no crash; toast visible                                                 |
| **4**  | Custom type                | All 4 types                                              | success, error, warning, info                                                                     | Correct default colors, icons (if any), and messages                                                  |
| **5**  | Position                   | All positions                                            | `"top-left"`, `"top-right"`, `"top-center"`, `"bottom-left"`, `"bottom-right"`, `"bottom-center"` | Toast appears exactly at specified position; does not overlap browser chrome                          |
| **6**  | Customization              | Custom `backgroundColor`                                 | e.g. `"#333"`                                                                                     | Toast rendered with exact color                                                                       |
| **7**  | Customization              | Custom `textColor`                                       | e.g. `"yellow"`                                                                                   | Text clearly visible; high contrast                                                                   |
| **8**  | Animation                  | Custom `animationDuration` and `animationEasing`         | e.g. `"1s"` + `"ease-in-out"`                                                                     | Toast animates as expected; no flicker                                                                |
| **9**  | Progress bar               | Enable + default                                         | `showProgressBar: true`                                                                           | Progress bar visible, bottom by default, auto updates                                                 |
| **10** | Progress bar               | Custom color & height                                    | `progressColor: "#f00"`, `progressHeight: "6px"`                                                  | Progress bar uses color, height correctly                                                             |
| **11** | Progress bar               | `progressPosition` = `"top"`                             |                                                                                                   | Progress bar appears above content                                                                    |
| **12** | Close button               | Enable                                                   | `showCloseButton: true`                                                                           | Close (×) button visible; click removes toast immediately                                             |
| **13** | Duration                   | Custom `duration`                                        | `5000`                                                                                            | Toast auto-dismisses after \~5s                                                                       |
| **14** | Duration                   | Zero duration                                            | `0`                                                                                               | Toast either doesn't show, or instantly dismissed                                                     |
| **15** | Duration                   | Large duration                                           | `9999999`                                                                                         | Toast stays visible for very long; no crash                                                           |
| **16** | Edge                       | Invalid type                                             | `type: "foobar"`                                                                                  | Should fallback to default type "info"; console warning                                               |
| **17** | Edge                       | Negative duration                                        | `-1000`                                                                                           | Toast auto-dismiss instantly or no show; console warning                                              |
| **18** | Edge                       | Missing message + type                                   | `{}`                                                                                              | Use default message + default type                                                                    |
| **19** | Edge                       | Non-string message                                       | `message: 123`                                                                                    | Coerce to string "123" or error/warning                                                               |
| **20** | Edge                       | Invalid color value                                      | `backgroundColor: "abc"`                                                                          | Should fallback to default; console warning; no crash                                                 |
| **21** | Multiple toasts            | Same position                                            | Fire 3 toasts `"bottom-right"`                                                                    | Stack vertically; don't overlap                                                                       |
| **22** | Multiple toasts            | Different positions                                      |                                                                                                   | Toasts show in separate corners as configured                                                         |
| **23** | Multiple toasts            | Same message & type quickly                              | Fire twice in 100ms                                                                               | Both visible (stack) or deduplicate, as per design                                                    |
| **24** | Default config             | `setDefaultColors` + `createToast({type: "success"})`    | Custom color applies; message fallback                                                            |                                                                                                       |
| **25** | Default config             | `setDefaultMessages`                                     | Custom message applies                                                                            |                                                                                                       |
| **26** | Change defaults at runtime | Change default color, then fire toast                    | Only new toast uses new default; existing toasts unchanged                                        |                                                                                                       |
| **27** | Rapid fire                 | Loop fire 50 toasts                                      | No crash; all rendered correctly; browser responsive                                              |                                                                                                       |
| **28** | Memory                     | Create and dismiss many                                  | Memory stable; no leak after GC                                                                   |                                                                                                       |
| **29** | UMD                        | Import in HTML                                           | `<script>`                                                                                        | `customizableToast.createToast` works                                                                 |
| **30** | ESM                        | `import`                                                 |                                                                                                   | Works in bundler; correct export names                                                                |
| **31** | CDN vs npm                 | Both usage                                               |                                                                                                   | Both work identically                                                                                 |
| **32** | SSR / Node                 | Import in Node                                           |                                                                                                   | Should throw clear error or no-op; no crash                                                           |
| **33** | Dynamic import             | import() after user action                               |                                                                                                   | Toast works normally                                                                                  |
| **34** | Resize                     | While toast visible                                      |                                                                                                   | Toast stays visible, keeps position                                                                   |
| **35** | Orientation change         | Mobile rotate                                            |                                                                                                   | Toast adjusts correctly                                                                               |
| **36** | RTL                        | Set page dir="rtl"                                       |                                                                                                   | "top-left" appears on visually right etc. as per RTL logic                                            |
| **37** | Accessibility              | ARIA live region                                         |                                                                                                   | Toast announces content to screen reader                                                              |
| **38** | Accessibility              | Keyboard nav                                             | Close button focusable + enter key closes                                                         |                                                                                                       |
| **39** | XSS                        | `message: "<script>alert(1)</script>"`                   | Render as text; script not executed                                                               |                                                                                                       |
| **40** | Error handling             | Misspelled option                                        | e.g. `postion: "top-left"`                                                                        | Ignored; console warning                                                                              |
| **41** | Error handling             | Wrong type option                                        | e.g. `duration: "fast"`                                                                           | Ignored or fallback; console warning                                                                  |
| **42** | Duplicate imports          | UMD + ESM                                                |                                                                                                   | Only one container; singleton works                                                                   |
| **43** | Bundle                     | Tree shaking                                             | Import only createToast                                                                           | Final bundle excludes setDefault\*                                                                    |
| **44** | Cache bust                 | Use older CDN version; update                            | New toast code loaded properly                                                                    |                                                                                                       |
| **45** | Extremely large text       | `message: "A".repeat(500)`                               | Toast text wraps properly; UI doesn't break                                                       |                                                                                                       |
| **46** | Super short text           | `message: "👍"`                                          | Toast still readable, centered                                                                    |                                                                                                       |
| **47** | Non-latin chars            | `message: "こんにちは"`                                  | Unicode shows properly                                                                            |                                                                                                       |
| **48** | Emojis                     | `message: "✅ Done"`                                     | Render ok                                                                                         |                                                                                                       |
| **49** | Invisible container        | Manually remove toast container from DOM then fire toast | Graceful recreate or no crash                                                                     |                                                                                                       |
| **50** | CSS conflict               | Page has conflicting CSS                                 | Toast still styled properly, isolated classes                                                     |                                                                                                       |

####

✍️ Explanation: why these matter (dev / UI/UX / prod)
✅ Basic, Customization, Multiple toasts → real world app UX
⚙️ Edge, Error handling, Wrong types → better developer experience
🛡 Security (XSS), Memory, Duplicate imports → production safety
📦 Bundle, Tree shaking → perf
🌍 RTL, resize, orientation → global audience, responsive
♿ Accessibility → inclusive design

HAVE TO FIND OUT ALL THE LOOPHOLES OF MY LIBRARY ALMOMST AT THE END.
