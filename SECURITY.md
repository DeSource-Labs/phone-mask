# Security Policy

## Reporting a Vulnerability

We take the security of `@desource/phone-mask` and its ecosystem seriously. If you believe you have found a security vulnerability in any of our packages, please report it to us as described below.

### Please Do Not

- **Do not** open a public GitHub issue for security vulnerabilities
- **Do not** disclose the vulnerability publicly until we've had a chance to address it

### How to Report

**Email us at:** [hello@desource-labs.org](mailto:hello@desource-labs.org)

Please include the following information in your report:

1. **Description** — Clear description of the vulnerability
2. **Impact** — What can an attacker achieve?
3. **Affected Versions** — Which versions are affected?
4. **Reproduction Steps** — Step-by-step instructions to reproduce
5. **Proof of Concept** — Code sample or exploit demonstration (if applicable)
6. **Suggested Fix** — Your recommendation for fixing the issue (optional)

### Example Report

```
Subject: [SECURITY] XSS vulnerability in PhoneInput component

Package: @desource/phone-mask-vue
Version: 0.2.0

Description:
The PhoneInput component does not properly sanitize user input in the
country search field, allowing XSS attacks.

Impact:
An attacker can inject malicious scripts that execute in the context
of the application.

Reproduction:
1. Open PhoneInput component
2. Enter: <script>alert('XSS')</script> in search field
3. Script executes

Suggested Fix:
Sanitize all user input before rendering or use textContent instead of innerHTML.
```

### Response Timeline

- **Initial Response:** Within 48 hours
- **Status Update:** Within 5 business days
- **Fix Timeline:** Depends on severity
  - **Critical:** 1-7 days
  - **High:** 7-30 days
  - **Medium/Low:** 30-90 days

### What to Expect

1. **Acknowledgment** — We'll confirm receipt of your report
2. **Investigation** — We'll validate and assess the severity
3. **Fix Development** — We'll work on a patch
4. **Disclosure** — We'll coordinate disclosure timing with you
5. **Credit** — We'll credit you in our security advisory (if desired)

## Security Best Practices

When using our packages, we recommend:

### Dependency Updates

Keep packages up to date:

```bash
# Check for updates
pnpm outdated

# Update to latest
pnpm update @desource/phone-mask@latest
pnpm update @desource/phone-mask-vue@latest
pnpm update @desource/phone-mask-nuxt@latest
```

## Security Updates

Security updates are released as:

- **Patch versions** for non-breaking security fixes
- **GitHub Security Advisories** for high/critical vulnerabilities
- **Changelog entries** marked with `[SECURITY]`

Subscribe to:

- [GitHub Security Advisories](https://github.com/DeSource-Labs/phone-mask/security/advisories)
- [npm Advisories](https://www.npmjs.com/advisories)

## Known Issues

There are currently no known security issues.

## Scope

### In Scope

- All packages under `@desource/phone-mask*`
  - `@desource/phone-mask`
  - `@desource/phone-mask-vue`
  - `@desource/phone-mask-nuxt`

### Out of Scope

- Denial of Service (DoS) via excessive input
- Social engineering attacks
- Physical attacks
- Issues in third-party dependencies (report to respective maintainers)
- Theoretical vulnerabilities without proof of concept

## Acknowledgments

We appreciate the security research community and will acknowledge contributors who report valid security issues (with permission).

### Hall of Fame

_No security reports yet. Be the first!_

## Contact

- **Security Email:** [hello@desource-labs.org](mailto:hello@desource-labs.org)
- **General Contact:** [hello@desource-labs.org](mailto:hello@desource-labs.org)
- **GitHub:** [@DeSource-Labs](https://github.com/DeSource-Labs)

---

<div align="center">
  <sub>We follow <a href="https://en.wikipedia.org/wiki/Responsible_disclosure">responsible disclosure</a> principles</sub>
</div>
