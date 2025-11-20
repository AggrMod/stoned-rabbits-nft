# Security Best Practices

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Table of Contents

1. [Frontend Security](#frontend-security)
2. [Smart Contract Security](#smart-contract-security)
3. [Backend Security](#backend-security)
4. [Infrastructure Security](#infrastructure-security)
5. [Incident Response](#incident-response)

---

## Frontend Security

### Input Validation

```javascript
// Validate Solana addresses
function isValidSolanaAddress(address) {
  if (!address || typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;

  try {
    const pubkey = new solanaWeb3.PublicKey(address);
    return solanaWeb3.PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

// Sanitize user input
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 255); // Limit length
}

// Validate amounts
function isValidAmount(amount, max = Number.MAX_SAFE_INTEGER) {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && num <= max && Number.isFinite(num);
}
```

### XSS Prevention

```javascript
// Escape HTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Safe DOM manipulation
function safeSetInnerHTML(element, content) {
  // Only use for trusted content
  element.textContent = content; // Safer than innerHTML
}

// Use textContent instead of innerHTML
function displayUserData(name) {
  document.getElementById('username').textContent = name; // ✓ Safe
  // document.getElementById('username').innerHTML = name; // ✗ Dangerous
}
```

### CSRF Protection

```javascript
// Generate CSRF token
function generateCSRFToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Store in session
sessionStorage.setItem('csrfToken', generateCSRFToken());

// Include in requests
async function makeSecureRequest(url, data) {
  const csrf = sessionStorage.getItem('csrfToken');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf
    },
    body: JSON.stringify(data)
  });

  return response.json();
}
```

### Wallet Security

```javascript
// Never store private keys in frontend
// ✗ BAD
const privateKey = "..."; // NEVER DO THIS

// ✓ GOOD - Use wallet providers
const provider = window.solana;
await provider.connect(); // User controls their keys

// Verify wallet connection
async function verifyWalletConnection() {
  if (!window.provider || !window.provider.isConnected) {
    throw new Error('Wallet not connected');
  }

  // Verify public key hasn't changed
  const currentKey = window.provider.publicKey.toString();
  const storedKey = AppState.wallet.address;

  if (currentKey !== storedKey) {
    AppState.setWallet({ connected: false, address: null });
    throw new Error('Wallet changed, please reconnect');
  }
}

// Sign messages for authentication
async function signAuthMessage(message) {
  const encodedMessage = new TextEncoder().encode(message);
  const signature = await window.provider.signMessage(encodedMessage);
  return signature;
}
```

### Transaction Verification

```javascript
// Verify transaction before showing success
async function verifyTransaction(signature, expectedRecipient, expectedAmount) {
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed'
  });

  if (!tx) {
    throw new Error('Transaction not found');
  }

  // Verify recipient
  const recipientInTx = tx.transaction.message.accountKeys.some(
    key => key.toString() === expectedRecipient
  );

  if (!recipientInTx) {
    throw new Error('Recipient mismatch - possible phishing attempt');
  }

  // Verify amount (for SOL transfers)
  const instructions = tx.transaction.message.instructions;
  const transferInstruction = instructions[0];

  // Additional verification logic...

  return true;
}
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://mainnet.helius-rpc.com https://api-mainnet.magiceden.dev https://api.coingecko.com;
  frame-src 'none';
  object-src 'none';
">
```

---

## Smart Contract Security

### Access Control

```rust
// Require signer
#[derive(Accounts)]
pub struct AdminFunction<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Account<'info, Pool>,

    #[account(signer)]
    pub authority: Signer<'info>,
}

// Verify ownership
pub fn verify_nft_ownership(
    token_account: &AccountInfo,
    owner: &Pubkey,
    mint: &Pubkey,
) -> Result<bool> {
    let account_data = TokenAccount::try_deserialize(&mut &token_account.data.borrow()[..])?;

    require!(
        account_data.owner == *owner,
        ErrorCode::NotOwner
    );

    require!(
        account_data.mint == *mint,
        ErrorCode::WrongNFT
    );

    Ok(true)
}
```

### Integer Overflow Protection

```rust
use anchor_lang::solana_program::program_error::ProgramError;

// Use checked arithmetic
pub fn safe_add(a: u64, b: u64) -> Result<u64> {
    a.checked_add(b)
        .ok_or(ProgramError::ArithmeticOverflow.into())
}

pub fn safe_sub(a: u64, b: u64) -> Result<u64> {
    a.checked_sub(b)
        .ok_or(ProgramError::ArithmeticOverflow.into())
}

pub fn safe_mul(a: u64, b: u64) -> Result<u64> {
    a.checked_mul(b)
        .ok_or(ProgramError::ArithmeticOverflow.into())
}

// Example usage
let total = safe_add(pool.balance, deposit_amount)?;
pool.balance = total;
```

### Reentrancy Protection

```rust
// Update state before external calls
pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // ✓ GOOD: Update state first
    pool.balance = safe_sub(pool.balance, amount)?;

    // Then make external call
    **pool.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.user.try_borrow_mut_lamports()? += amount;

    Ok(())
}

// ✗ BAD: External call before state update
pub fn vulnerable_withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    // External call first (vulnerable to reentrancy)
    **pool.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.user.try_borrow_mut_lamports()? += amount;

    // State update after (attacker can re-enter)
    pool.balance = safe_sub(pool.balance, amount)?;

    Ok(())
}
```

### PDA Security

```rust
// Derive PDAs securely
#[derive(Accounts)]
pub struct SecurePDA<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + RevenuePool::LEN,
        seeds = [b"revenue_pool", collection.key().as_ref()],
        bump
    )]
    pub revenue_pool: Account<'info, RevenuePool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Verify PDA derivation
pub fn verify_pda(
    pda: &AccountInfo,
    seeds: &[&[u8]],
    program_id: &Pubkey,
) -> Result<u8> {
    let (expected_pda, bump) = Pubkey::find_program_address(seeds, program_id);

    require!(
        *pda.key == expected_pda,
        ErrorCode::InvalidPDA
    );

    Ok(bump)
}
```

---

## Backend Security

### Authentication

```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Hash passwords (for admin users)
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

// Verify password
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate secure JWT
export function generateToken(payload: object): string {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    {
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: 'stoned-rabbits-api',
      audience: 'stoned-rabbits-frontend'
    }
  );
}

// Verify JWT
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
      issuer: 'stoned-rabbits-api',
      audience: 'stoned-rabbits-frontend'
    });
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  skipSuccessfulRequests: false,
});

// Usage
app.use('/api/', apiLimiter);
app.use('/api/auth/', strictLimiter);
```

### SQL Injection Prevention

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✓ GOOD: Parameterized queries
export async function getUserByWallet(walletAddress: string) {
  const query = 'SELECT * FROM users WHERE wallet_address = $1';
  const result = await pool.query(query, [walletAddress]);
  return result.rows[0];
}

// ✗ BAD: String concatenation (vulnerable to SQL injection)
export async function vulnerableQuery(walletAddress: string) {
  const query = `SELECT * FROM users WHERE wallet_address = '${walletAddress}'`;
  return pool.query(query); // NEVER DO THIS
}

// Use prepared statements for repeated queries
export async function batchInsert(tickets: any[]) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const query = 'INSERT INTO lottery_tickets (wallet_address, ticket_number, lottery_round) VALUES ($1, $2, $3)';

    for (const ticket of tickets) {
      await client.query(query, [ticket.wallet, ticket.number, ticket.round]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Environment Variables

```typescript
// .env (NEVER commit this file)
JWT_SECRET=use-a-long-random-string-here-min-32-chars
DATABASE_URL=postgresql://user:pass@host:5432/db
HELIUS_API_KEY=your-key
SENDGRID_API_KEY=your-key

// Validate required env vars on startup
const requiredEnvVars = [
  'JWT_SECRET',
  'DATABASE_URL',
  'HELIUS_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}
```

---

## Infrastructure Security

### HTTPS Only

```nginx
# Force HTTPS redirect
server {
    listen 80;
    server_name stonedrabbitsnft.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name stonedrabbitsnft.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/stonedrabbitsnft.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/stonedrabbitsnft.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Database Security

```sql
-- Create read-only user for analytics
CREATE USER analytics_readonly WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE stoned_rabbits TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;

-- Revoke unnecessary permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- Enable row-level security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_isolation ON users
    USING (wallet_address = current_setting('app.current_user')::text);

-- Encrypt sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Store encrypted email
INSERT INTO users (wallet_address, email_encrypted)
VALUES (
    'FR1Lz5mt...',
    pgp_sym_encrypt('user@example.com', 'encryption-key')
);

-- Decrypt when needed
SELECT pgp_sym_decrypt(email_encrypted, 'encryption-key') as email
FROM users
WHERE wallet_address = 'FR1Lz5mt...';
```

### Secrets Management

```bash
# Use AWS Secrets Manager or similar
aws secretsmanager create-secret \
    --name stoned-rabbits/prod/database \
    --secret-string '{"username":"admin","password":"strong-password"}'

# Retrieve in application
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getSecret(secretName) {
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    return JSON.parse(data.SecretString);
}

// Usage
const dbCreds = await getSecret('stoned-rabbits/prod/database');
```

---

## Incident Response

### Incident Response Plan

**1. Detection**
- Monitor error logs
- Set up alerts for unusual activity
- Track failed authentication attempts

**2. Containment**
- Immediately pause affected smart contracts
- Rate limit or block suspicious IPs
- Disable compromised accounts

**3. Investigation**
- Collect logs and evidence
- Identify attack vector
- Assess damage and impact

**4. Recovery**
- Deploy fixes
- Restore from backups if needed
- Verify integrity

**5. Post-Mortem**
- Document incident
- Identify root cause
- Implement preventive measures

### Emergency Contacts

```
Security Lead: [contact]
Backend Developer: [contact]
Smart Contract Developer: [contact]
Hosting Provider: [support]
```

### Security Audit Checklist

- [ ] Third-party smart contract audit
- [ ] Penetration testing
- [ ] Code review (peer review)
- [ ] Dependency vulnerability scan
- [ ] OWASP Top 10 compliance
- [ ] Wallet security audit
- [ ] Infrastructure security review

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready
