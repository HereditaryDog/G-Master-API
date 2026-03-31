# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

## Reporting a vulnerability

Please do not report security issues in public GitHub issues.

Use one of these channels instead:

- GitHub Security Advisories: [Open a draft advisory](https://github.com/yangjunyu/G-Master-API/security/advisories/new)
- A previously agreed private maintainer contact channel, if available

## What to include

Please include:

1. Affected component or endpoint
2. Reproduction steps
3. Impact assessment
4. Proof of concept if safe to share
5. Suggested fix if available

## Deployment reminders

- Set strong values for `SESSION_SECRET`, `CRYPTO_SECRET`, and database passwords
- Keep PostgreSQL and Redis off the public internet whenever possible
- Use HTTPS and a reverse proxy before public rollout
- Create and test database backups before upgrades

## Disclaimer

This project is provided as-is. You are responsible for evaluating its security posture in your own environment.
