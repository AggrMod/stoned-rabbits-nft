# Deployment Guide

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Domain Setup](#domain-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

This guide covers deployment procedures for all components of the Stoned Rabbits NFT ecosystem:

- **Main Site** (`/Stoned Rabbits/`)
- **Revenue Pass Page** (`/Stoned Rabbits/pages/revenue-pass.html`)
- **Lottery System** (`/Stoned Rabbits/pages/lottery.html`)
- **NFT Utility Factory** (`/NFT Utility Factory/`)

All components are static frontends that can be deployed to any static hosting service.

---

## Prerequisites

### Required Tools

```bash
# Git (for version control)
git --version  # Should be 2.0+

# Node.js (optional, for local server)
node --version  # Should be 18+
npm --version   # Should be 9+

# Python (alternative for local server)
python --version  # Should be 3.7+
```

### Required Accounts

1. **GitHub Account** - For repository access
2. **Hosting Provider Account** - Choose one:
   - Vercel (Recommended)
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront
   - Cloudflare Pages
3. **Helius Account** - For RPC access (already configured)
4. **Domain Registrar** - For custom domain (optional)

### Access Requirements

- **Treasury Wallet Access** - For testing payments
- **Collection Authority** - For NFT operations (if needed)
- **API Keys:**
  - Helius: `2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5` (already in code)
  - CoinGecko: No key required (public API)
  - Magic Eden: No key required (public API)

---

## Local Development Setup

### Method 1: Python HTTP Server (Simplest)

```bash
# Navigate to project root
cd /path/to/stoned-rabbits-nft

# Serve Stoned Rabbits main site
cd "Stoned Rabbits"
python3 -m http.server 8000

# Access at: http://localhost:8000

# For Utility Factory (in separate terminal)
cd "NFT Utility Factory"
python3 -m http.server 8001

# Access at: http://localhost:8001
```

### Method 2: Node.js HTTP Server

```bash
# Install http-server globally
npm install -g http-server

# Serve Stoned Rabbits main site
cd "Stoned Rabbits"
http-server -p 8000 -c-1

# Serve Utility Factory (separate terminal)
cd "NFT Utility Factory"
http-server -p 8001 -c-1

# -c-1 disables caching for development
```

### Method 3: VS Code Live Server

```bash
# Install Live Server extension in VS Code
# Extension ID: ritwickdey.LiveServer

# Right-click on index.html
# Select "Open with Live Server"
# Default: http://127.0.0.1:5500
```

### Local Testing Checklist

- [ ] Main site loads at localhost:8000
- [ ] All navigation links work
- [ ] Revenue Pass page accessible
- [ ] Lottery page accessible
- [ ] Utility Factory loads at localhost:8001
- [ ] Wallet connection works (use devnet for testing if needed)
- [ ] No console errors
- [ ] All images load
- [ ] AOS animations trigger on scroll
- [ ] Mobile responsive design works

---

## Production Deployment

### Option 1: Vercel (Recommended)

**Why Vercel:**
- Free tier available
- Automatic HTTPS
- Global CDN
- Git integration
- Zero configuration
- Preview deployments

**Step-by-Step:**

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to project root
cd /path/to/stoned-rabbits-nft

# 3. Login to Vercel
vercel login

# 4. Initialize project
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? stoned-rabbits-nft
# - Directory? ./
# - Override settings? No

# 5. Deploy to production
vercel --prod
```

**Configuration File** (`vercel.json`):

```json
{
  "version": 2,
  "name": "stoned-rabbits-nft",
  "builds": [
    {
      "src": "Stoned Rabbits/**",
      "use": "@vercel/static"
    },
    {
      "src": "NFT Utility Factory/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/utility-factory/(.*)",
      "dest": "/NFT Utility Factory/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/Stoned Rabbits/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Post-Deployment:**

```bash
# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>

# Set environment variables (if needed later)
vercel env add HELIUS_API_KEY
```

### Option 2: Netlify

**Step-by-Step:**

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Navigate to project root
cd /path/to/stoned-rabbits-nft

# 3. Login to Netlify
netlify login

# 4. Initialize site
netlify init

# Follow prompts:
# - Create new site? Yes
# - Team? Your team
# - Site name? stoned-rabbits-nft
# - Build command? (leave empty)
# - Directory to deploy? ./

# 5. Deploy
netlify deploy --prod
```

**Configuration File** (`netlify.toml`):

```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/utility-factory/*"
  to = "/NFT Utility Factory/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/Stoned Rabbits/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### Option 3: GitHub Pages

**Step-by-Step:**

```bash
# 1. Ensure you're on the correct branch
git checkout claude/plan-nft-repo-016rTM48Zzz9dkqHsXFFKb6v

# 2. Push to GitHub
git push -u origin claude/plan-nft-repo-016rTM48Zzz9dkqHsXFFKb6v

# 3. Merge to main via PR (on GitHub web interface)

# 4. Create gh-pages branch
git checkout -b gh-pages
git push -u origin gh-pages

# 5. Enable GitHub Pages in repository settings
# Settings > Pages > Source: gh-pages branch > Save
```

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
          cname: your-custom-domain.com  # Optional
```

**Access URL:**
```
https://aggmod.github.io/stoned-rabbits-nft/
```

### Option 4: AWS S3 + CloudFront

**Prerequisites:**
- AWS account
- AWS CLI installed and configured

**Step-by-Step:**

```bash
# 1. Create S3 bucket
aws s3 mb s3://stoned-rabbits-nft

# 2. Enable static website hosting
aws s3 website s3://stoned-rabbits-nft \
  --index-document index.html \
  --error-document error.html

# 3. Upload files
aws s3 sync . s3://stoned-rabbits-nft \
  --exclude ".git/*" \
  --exclude "docs/*" \
  --cache-control "public, max-age=3600"

# 4. Set bucket policy (public read)
aws s3api put-bucket-policy \
  --bucket stoned-rabbits-nft \
  --policy file://bucket-policy.json

# 5. Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name stoned-rabbits-nft.s3.amazonaws.com \
  --default-root-object index.html
```

**Bucket Policy** (`bucket-policy.json`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::stoned-rabbits-nft/*"
    }
  ]
}
```

### Option 5: Cloudflare Pages

**Step-by-Step:**

```bash
# 1. Install Wrangler CLI
npm install -g wrangler

# 2. Login to Cloudflare
wrangler login

# 3. Create Pages project
wrangler pages project create stoned-rabbits-nft

# 4. Deploy
wrangler pages publish . \
  --project-name=stoned-rabbits-nft \
  --branch=main
```

---

## Environment Configuration

### Production Environment Variables

Currently, the application uses hardcoded values. For production, consider creating a config file:

**`Stoned Rabbits/js/config.js`:**

```javascript
// Production configuration
const CONFIG = {
  // Blockchain
  RPC_URL: "https://mainnet.helius-rpc.com/?api-key=2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5",
  NETWORK: "mainnet-beta",

  // Wallets
  TREASURY_WALLET: "FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL",

  // Collections
  STONED_RABBITS_COLLECTION: "4aP8AfV7uYjvAdSGHanmkAdQPHM1NauKPs2cBFJigj5K",
  REVENUE_PASS_COLLECTION: "[TBD]",

  // APIs
  MAGIC_EDEN_API: "https://api-mainnet.magiceden.dev/v2",
  COINGECKO_API: "https://api.coingecko.com/api/v3",

  // Feature Flags
  ENABLE_LOTTERY: true,
  ENABLE_STAKING: false,
  ENABLE_REVENUE_PASS: true,

  // Pricing
  LOTTERY_PRICE_TIERS: [
    { min: 50, each: 10 },
    { min: 10, each: 4 },
    { min: 1, each: 5 }
  ],

  // UI
  ENABLE_ANIMATIONS: true,
  ANIMATION_DURATION: 1000
};

// Expose to window
window.APP_CONFIG = CONFIG;
```

**Development Config** (`js/config.dev.js`):

```javascript
const CONFIG = {
  RPC_URL: "https://api.devnet.solana.com",
  NETWORK: "devnet",
  TREASURY_WALLET: "YOUR_DEV_WALLET",
  // ... other dev values
};

window.APP_CONFIG = CONFIG;
```

### Loading Config

**In `index.html`:**

```html
<!-- Load appropriate config based on environment -->
<script src="./js/config.js"></script>
<!-- OR -->
<script src="./js/config.dev.js"></script>

<!-- Then load app scripts -->
<script src="./js/app.js"></script>
```

---

## Domain Setup

### Custom Domain Configuration

#### For Vercel:

```bash
# Add domain via CLI
vercel domains add stonedrabbitsnft.com

# Vercel will provide DNS records:
# A Record: 76.76.21.21
# CNAME: cname.vercel-dns.com
```

**DNS Configuration:**

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 3600 |
| CNAME | www | cname.vercel-dns.com | 3600 |
| CNAME | utility-factory | cname.vercel-dns.com | 3600 |

#### For Netlify:

```bash
# Add domain via CLI
netlify domains:add stonedrabbitsnft.com

# Netlify provides:
# A Record: 75.2.60.5
# CNAME: your-site.netlify.app
```

#### For Cloudflare Pages:

```bash
# Add custom domain
wrangler pages domains add stonedrabbitsnft.com

# Cloudflare automatically handles DNS
# if domain is already on Cloudflare
```

### SSL/TLS Configuration

**Automatic HTTPS** (Vercel/Netlify/Cloudflare):
- SSL certificates are automatically provisioned
- No configuration needed
- Certificates auto-renew

**Manual Setup** (AWS S3):
```bash
# Request certificate via ACM
aws acm request-certificate \
  --domain-name stonedrabbitsnft.com \
  --subject-alternative-names www.stonedrabbitsnft.com \
  --validation-method DNS

# Verify domain ownership via DNS

# Associate with CloudFront distribution
aws cloudfront update-distribution \
  --id YOUR_DISTRIBUTION_ID \
  --viewer-certificate ACMCertificateArn=YOUR_CERT_ARN
```

### Subdomain Structure

Recommended setup:

```
https://stonedrabbitsnft.com              → Main site
https://stonedrabbitsnft.com/revenue-pass → Revenue Pass page
https://stonedrabbitsnft.com/lottery      → Lottery page
https://utility.stonedrabbitsnft.com      → Utility Factory
```

**OR separate domains:**

```
https://stonedrabbitsnft.com   → Main site
https://nftutilityfactory.com  → Utility Factory
```

---

## Monitoring & Maintenance

### Health Checks

Create a simple monitoring script:

**`monitor.sh`:**

```bash
#!/bin/bash

# Check main site
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://stonedrabbitsnft.com)
if [ "$MAIN_STATUS" != "200" ]; then
  echo "ALERT: Main site down (Status: $MAIN_STATUS)"
  # Send alert (email, SMS, Discord webhook, etc.)
fi

# Check Utility Factory
UTILITY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://utility.stonedrabbitsnft.com)
if [ "$UTILITY_STATUS" != "200" ]; then
  echo "ALERT: Utility Factory down (Status: $UTILITY_STATUS)"
fi

# Check RPC endpoint
RPC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  https://mainnet.helius-rpc.com/?api-key=2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5)
if [ "$RPC_STATUS" != "200" ]; then
  echo "ALERT: Helius RPC down (Status: $RPC_STATUS)"
fi

# Check Magic Eden API
ME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  https://api-mainnet.magiceden.dev/v2/collections/stonned_rabitts)
if [ "$ME_STATUS" != "200" ]; then
  echo "WARNING: Magic Eden API down (Status: $ME_STATUS)"
fi

echo "All checks passed at $(date)"
```

**Set up cron job:**

```bash
# Run every 5 minutes
crontab -e

# Add line:
*/5 * * * * /path/to/monitor.sh >> /var/log/monitor.log 2>&1
```

### Performance Monitoring

**Vercel Analytics:**

```bash
# Enable Vercel Analytics
# In vercel.json:
{
  "analytics": {
    "enable": true
  }
}
```

**Google Analytics:**

Add to all HTML files before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Error Tracking

**Sentry Integration:**

```html
<!-- Add to <head> -->
<script
  src="https://js.sentry-cdn.com/YOUR_KEY.min.js"
  crossorigin="anonymous"
></script>

<script>
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    environment: "production",
    release: "1.0.0"
  });
</script>
```

### Uptime Monitoring

**Third-Party Services:**

1. **UptimeRobot** (Free)
   - Monitor up to 50 URLs
   - 5-minute intervals
   - Email/SMS alerts

2. **Pingdom** (Paid)
   - Advanced monitoring
   - Performance insights
   - Real user monitoring

3. **StatusCake** (Free/Paid)
   - Global monitoring
   - Page speed tests
   - SSL monitoring

### Log Management

**Vercel Logs:**

```bash
# View recent logs
vercel logs

# Stream live logs
vercel logs --follow

# Filter by deployment
vercel logs <deployment-url>
```

**Netlify Logs:**

```bash
# View function logs (if using functions)
netlify logs:function <function-name>

# View deploy logs
netlify logs
```

---

## Rollback Procedures

### Vercel Rollback

```bash
# List deployments
vercel ls

# Example output:
# stoned-rabbits-nft
#   prod: https://stoned-rabbits-nft.vercel.app
#   Deployments:
#     abc123 - 2 hours ago (READY)
#     def456 - 1 day ago (READY)

# Rollback to previous deployment
vercel rollback <deployment-url>

# Or promote specific deployment to production
vercel promote <deployment-url>
```

### Netlify Rollback

```bash
# List deployments
netlify sites:list

# View specific site deploys
netlify deploys:list

# Rollback to specific deploy
netlify rollback <deploy-id>
```

### GitHub Pages Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin gh-pages

# OR hard reset (dangerous)
git reset --hard HEAD~1
git push origin gh-pages --force
```

### Manual Rollback (S3)

```bash
# Re-upload from previous backup
aws s3 sync ./backup/ s3://stoned-rabbits-nft

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### Emergency Procedures

**If site is completely broken:**

1. **Immediate Action:**
   ```bash
   # Put up maintenance page
   echo "<html><body><h1>Maintenance in Progress</h1></body></html>" > maintenance.html

   # Deploy maintenance page
   vercel --prod maintenance.html
   ```

2. **Investigate Issue:**
   - Check deployment logs
   - Review recent commits
   - Test locally
   - Check external dependencies (RPC, APIs)

3. **Fix & Redeploy:**
   ```bash
   # Fix issue in code
   git commit -m "Emergency fix: [issue description]"
   git push

   # Deploy fixed version
   vercel --prod
   ```

4. **Verify Fix:**
   - Check all pages load
   - Test wallet connection
   - Test critical paths (payments, transfers)
   - Monitor error logs

### Backup Strategy

**Automated Git Backups:**

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="backups/$(date +%Y-%m-%d)"
mkdir -p "$BACKUP_DIR"

# Copy entire project
cp -r . "$BACKUP_DIR/"

# Compress
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"

# Upload to cloud storage (optional)
aws s3 cp "$BACKUP_DIR.tar.gz" s3://stoned-rabbits-backups/
```

**Database Backups** (when backend is implemented):

```bash
# Backup PostgreSQL database
pg_dump -h localhost -U user -d stoned_rabbits > backup.sql

# Backup to S3
aws s3 cp backup.sql s3://stoned-rabbits-backups/db/$(date +%Y-%m-%d).sql
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code committed to Git
- [ ] Tests pass locally (manual testing)
- [ ] No console errors in browser
- [ ] All assets load correctly
- [ ] Mobile responsive checked
- [ ] Wallet connections tested
- [ ] Payment flows tested (small amounts)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance audit (Lighthouse score >90)

### Deployment

- [ ] Deploy to staging first (if available)
- [ ] Test staging environment thoroughly
- [ ] Review deployment preview
- [ ] Check DNS configuration
- [ ] Verify SSL certificate
- [ ] Deploy to production
- [ ] Smoke test production

### Post-Deployment

- [ ] Verify all pages accessible
- [ ] Test wallet connection on production
- [ ] Check all external links
- [ ] Monitor error logs for 1 hour
- [ ] Update status page (if applicable)
- [ ] Announce deployment in Discord
- [ ] Tweet about new features (if applicable)

---

## Troubleshooting Deployment

### Common Issues

**Issue: 404 on Routes**

```bash
# Ensure proper redirects configured
# For Vercel, check vercel.json routes
# For Netlify, check _redirects or netlify.toml
```

**Issue: Wallet Not Connecting**

```bash
# Check if HTTPS is enabled (required for wallets)
# Verify RPC endpoint is accessible
curl https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
```

**Issue: Slow Load Times**

```bash
# Enable compression
# Add to vercel.json:
{
  "headers": [{
    "source": "/(.*)",
    "headers": [{
      "key": "Content-Encoding",
      "value": "gzip"
    }]
  }]
}
```

**Issue: CORS Errors**

```javascript
// Check API endpoints allow cross-origin requests
// Add CORS headers if self-hosting
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}
```

---

## Continuous Deployment

### GitHub Actions Setup

**`.github/workflows/deploy.yml`:**

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Notify Discord
        uses: sarisia/actions-status-discord@v1
        with:
          webhook: ${{ secrets.DISCORD_WEBHOOK }}
          title: "Deployment Successful"
          description: "New version deployed to production"
```

### Automated Testing (Future)

```yaml
# .github/workflows/test.yml
name: Run Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm test

      - name: Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://stonedrabbitsnft.com
            https://utility.stonedrabbitsnft.com
          uploadArtifacts: true
```

---

## Next Steps

1. Choose hosting provider (Vercel recommended)
2. Deploy to staging environment
3. Test thoroughly
4. Deploy to production
5. Set up monitoring
6. Configure custom domain
7. Implement CI/CD pipeline

**Related Documentation:**
- [03-api-integration.md](./03-api-integration.md) - API setup
- [07-security.md](./07-security.md) - Security measures
- [08-operations.md](./08-operations.md) - Day-to-day operations

---

**Last Updated:** November 2025
**Maintainer:** Stoned Rabbits Development Team
**Status:** ✅ Ready for Deployment
