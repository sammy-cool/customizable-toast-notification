# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x     | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

We take the security of `@sammy-cool/customizable-toast-notification` seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

### Reporting Steps

1. **Email**: Send a detailed description of the vulnerability to `sammy-cool@protonmail.com`.
2. **What to include**:
   - Type of issue (e.g. XSS, prototype pollution, SSRF, dependency leak)
   - Full paths of source file(s) related to the issue
   - Description of the attack scenario
   - PoC or proof-of-concept code (highly appreciated)
   - Impact assessment (what an attacker can achieve)
   - Your contact information for coordination

3. **Expectations**:
   - You will receive an acknowledgment within 48 hours.
   - A first response regarding a remediation timeline will be provided within 7 days.
   - If you do not receive a response within 7 days, please follow up.
   - We will keep you informed of the progress toward a fix.

## Security Measures in Place

- **No runtime dependencies**: The core library depends on zero npm packages, eliminating supply chain risk from third-party code.
- **DOMPurify with Fallback**: HTML content is sanitized by DOMPurify in browsers, with a same-origin fallback sanitizer for headless environments.
- **XSS Hardening**: Script tags, event handler attributes, and `javascript:` URIs are neutralized in all user-supplied content.
- **Strict Type Guards**: All inputs are validated at entry points; frozen objects and non-object options do not crash or corrupt state.

## Security Updates

Security advisories are published as GitHub Releases and, where applicable, via npm audit advisory notifications.
