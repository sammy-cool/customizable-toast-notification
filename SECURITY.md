# Security Policy

This library renders content into the DOM, including optionally-HTML
content via `allowHtml`. Security here isn't an afterthought — please
report issues responsibly rather than filing a public issue first.

## Reporting a vulnerability

Email **priyanshu.alt191@gmail.com** with:

- A description of the issue and its potential impact
- Steps to reproduce (a minimal `createToast(...)` call that demonstrates
  it is ideal)
- The version of `customizable-toast-notification` affected

You should get an acknowledgment within a few days. Please don't publicly
disclose the issue until a fix has been released — once a patch is out,
you're welcome to write about it, and credit is always given unless you'd
prefer otherwise.

## What's in scope

- Bypasses of the `allowHtml` sanitization (script execution, event handler
  injection, `javascript:`/`data:` URI smuggling, style-based clickjacking,
  or anything else that lets untrusted `message` content do something it
  shouldn't)
- Any way a `createToast()` call with attacker-influenced options could
  affect content or behavior outside the toast itself
- Supply-chain concerns in the published package (unexpected postinstall
  behavior, dependency issues)

## What's out of scope

- Issues that require the *page embedding this library* to already be
  vulnerable to XSS through some other means — this library can't defend
  against a host page that already executes attacker-controlled `<script>`
  tags directly
- Denial-of-service via a consumer intentionally calling `createToast()` in
  a tight loop — that's expected/self-inflicted behavior, not a
  vulnerability in the library

## Supported versions

Only the latest published major version (currently 3.x) receives security
fixes. Given how actively this project releases, please upgrade to the
latest version before reporting — there's a real chance it's already fixed.
