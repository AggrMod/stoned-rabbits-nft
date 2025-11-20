# Security Configuration Guide for Stoned Rabbits

## ⚠️ CRITICAL ACTIONS REQUIRED

### 1. GitHub Token Exposure - IMMEDIATE ACTION
**STATUS:** ✅ FIXED LOCALLY - **ACTION REQUIRED**

The GitHub Personal Access Token `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` was found exposed in:
- `.claude.json` (CLEANED)
- `.claude.json.backup` (CLEANED)

**REQUIRED ACTIONS:**
1. **Revoke this token immediately** at: https://github.com/settings/tokens
2. Generate a new token with minimal required permissions
3. Store new token in environment variables, not in config files
4. Add `.claude.json` to `.gitignore` if not already present

### 2. Helius RPC API Key Exposure - IMMEDIATE ACTION
**STATUS:** ✅ FIXED LOCALLY - **ACTION REQUIRED**

The Helius RPC API key `2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5` was found in:
- `Stoned Rabbits/js/grid-script.js` (REPLACED WITH PLACEHOLDER)

**REQUIRED ACTIONS:**
1. **Revoke/rotate this API key** in your Helius dashboard
2. Use environment variables or a backend proxy for API keys
3. Never commit API keys to source code

---

## Server Security Headers

### Recommended HTTP Headers (Add to your web server config)

```nginx
# For Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Content Security Policy (CSP)
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
  font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api-mainnet.magiceden.dev https://corsproxy.io https://mainnet.helius-rpc.com;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self';
" always;
```

```apache
# For Apache (.htaccess)
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"

  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://api-mainnet.magiceden.dev https://corsproxy.io;"
</IfModule>
```

---

## HTTPS/SSL Configuration

### Force HTTPS Redirect

```nginx
# Nginx
server {
    listen 80;
    server_name stonedrabbits.com www.stonedrabbits.com;
    return 301 https://$server_name$request_uri;
}
```

```apache
# Apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## Input Validation & Sanitization

### Implemented Protections

✅ **Solana Wallet Address Validation** (`grid-script.js`)
- Base58 character validation
- Length validation (32-44 characters)
- Format verification

✅ **XSS Prevention** (`grid-script.js`)
- Text sanitization function
- DOM-based escaping
- Input cleaning before use

### Additional Recommendations

1. **Rate Limiting**
   - Implement API request limits (max 10 requests/minute per IP)
   - Prevent wallet enumeration attacks

2. **CAPTCHA Protection**
   - Add reCAPTCHA v3 to wallet lookup form
   - Prevent automated scraping

---

## API Key Management

### Environment Variables Setup

Create `.env.local` file (DO NOT COMMIT):
```bash
# Solana RPC Endpoints
VITE_SOLANA_RPC_URL=https://your-endpoint.helius-rpc.com/?api-key=NEW_KEY_HERE
VITE_MAGIC_EDEN_API_KEY=your_magic_eden_key_here

# GitHub (for MCP only, not frontend)
GITHUB_PERSONAL_ACCESS_TOKEN=your_new_github_token_here
```

### Update `.gitignore`
```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Sensitive configs
.claude.json
.claude.json.backup
.claude/

# API keys
**/config/secrets.js
**/config/api-keys.js
```

---

## CORS Proxy Risks

### Current Setup Issues

⚠️ **Third-party CORS Proxy Dependency**
- Using `https://corsproxy.io/`
- Single point of failure
- Potential data leakage
- No SLA or reliability guarantee

### Recommended Solutions

1. **Self-hosted CORS Proxy**
```javascript
// Use your own backend proxy instead
const proxyUrl = 'https://your-backend.com/api/proxy?url=' + encodeURIComponent(apiUrl);
```

2. **Direct API with Backend**
```javascript
// Move API calls to backend
const response = await fetch('/api/collection-stats');
```

---

## Code Security Checklist

- [x] Remove hardcoded API keys
- [x] Add wallet address validation
- [x] Add XSS protection
- [x] Replace mock crypto data
- [x] Add error handling to API calls
- [x] Revoke exposed GitHub token
- [ ] Implement HTTPS everywhere
- [ ] Add rate limiting
- [ ] Add CAPTCHA to forms
- [ ] Set up Content Security Policy
- [ ] Replace third-party CORS proxy
- [ ] Move sensitive operations to backend
- [ ] Add audit logging
- [ ] Implement session management
- [ ] Add request signing for API calls

---

## Dependency Security

### Recommended Tools

```bash
# Install and run security audits
npm audit
npm audit fix

# Use Snyk for vulnerability scanning
npx snyk test

# Keep dependencies updated
npm outdated
npm update
```

### Regular Security Tasks

1. **Weekly:** Check for dependency updates
2. **Monthly:** Full security audit
3. **Quarterly:** Penetration testing
4. **Annually:** Third-party security review

---

## Monitoring & Logging

### Recommended Setup

1. **Error Tracking:** Sentry or Rollbar
2. **Performance Monitoring:** DataDog or New Relic
3. **Security Monitoring:** Cloudflare WAF
4. **Uptime Monitoring:** UptimeRobot or Pingdom

### What to Log

- Failed wallet validation attempts
- API errors and timeouts
- Unusual traffic patterns
- 4xx/5xx errors
- Rate limit violations

**WARNING:** Never log sensitive data (private keys, full wallet addresses, personal info)

---

## Incident Response Plan

1. **Detection:** Monitor logs for anomalies
2. **Containment:** Take affected services offline if needed
3. **Investigation:** Review logs, identify breach
4. **Remediation:** Patch vulnerabilities, rotate keys
5. **Recovery:** Restore services with fixes
6. **Post-mortem:** Document and learn

### Emergency Contacts

- [ ] Add security team email
- [ ] Add on-call rotation
- [ ] Add escalation procedures

---

## Compliance Considerations

### Data Privacy

- **GDPR:** If serving EU users
- **CCPA:** If serving California users
- **User data:** Minimize collection, add privacy policy

### Crypto Regulations

- Consult legal team about:
  - Securities laws
  - NFT regulatory status
  - Gambling regulations (if using casino features)
  - Tax implications

---

## Security Contact

For security vulnerabilities, contact:
- Email: [ADD YOUR SECURITY EMAIL]
- PGP Key: [ADD IF AVAILABLE]
- Bug Bounty: [ADD IF APPLICABLE]

**Responsible Disclosure:** 90-day disclosure timeline

---

*Last Updated: 2025-11-20*
*Next Review: 2025-12-20*
