# Security Policy

## Supported Versions

| Version | Terraform | AWS Provider | Supported |
|---------|-----------|--------------|-----------|
| main    | >= 1.9    | ~> 5.0       | Yes       |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. Email the maintainer directly: bernardo.trindade-de-abreu@ustwo.com
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Affected blueprint(s)
   - Potential impact
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release cycle

### Security Best Practices for Users

When using these blueprints:

1. **Review before deploying** - Always review Terraform plans before applying
2. **Use remote state** - Store state in S3 with encryption and versioning
3. **Enable state locking** - Use DynamoDB for state locking
4. **Rotate credentials** - Regularly rotate AWS access keys
5. **Use OIDC** - Prefer OIDC over long-lived credentials in CI/CD
6. **Scan regularly** - Run Trivy and Checkov on your infrastructure
7. **Keep updated** - Regularly update Terraform and provider versions

### Security Scanning

All blueprints include:

- **Trivy** - Vulnerability and misconfiguration scanning
- **Checkov** - Policy-as-code compliance checking
- **TFLint** - Terraform linting with AWS ruleset

### Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers in our release notes (with permission).
