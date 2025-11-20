# Backend Systems Design

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Planning Phase (Q4 2025 - Q1 2026)

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Database Design](#database-design)
4. [API Endpoints](#api-endpoints)
5. [Authentication System](#authentication-system)
6. [Email & Notifications](#email--notifications)
7. [Admin Dashboard](#admin-dashboard)
8. [Infrastructure](#infrastructure)

---

## Overview

The backend system will handle:
- Lottery ticket management
- Utility Factory project submissions
- Revenue Pass distribution tracking
- Email notifications
- Admin operations
- Analytics & reporting

**Status:** Currently all frontend-only. Backend implementation planned for Q4 2025.

---

## Technology Stack

### Core Framework
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js 4.x
- **Language:** TypeScript 5.x

### Database
- **Primary:** PostgreSQL 15
- **Caching:** Redis 7.x
- **Search:** (Optional) Elasticsearch for advanced queries

### Infrastructure
- **Hosting:** AWS (EC2 + RDS) or Railway
- **CDN:** Cloudflare
- **File Storage:** AWS S3
- **Monitoring:** Datadog or New Relic

---

## Database Design

### Schema Overview

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    preferences JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- Lottery tickets table
CREATE TABLE lottery_tickets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    wallet_address VARCHAR(44) NOT NULL,
    ticket_number INTEGER NOT NULL,
    lottery_round VARCHAR(50) NOT NULL,
    acquisition_method VARCHAR(20) NOT NULL, -- 'purchase' or 'burn'
    payment_method VARCHAR(20), -- 'SOL', 'USDC', or NULL for burns
    transaction_signature VARCHAR(88) NOT NULL,
    amount_paid DECIMAL(18,9),
    nft_burned VARCHAR(44), -- Mint address if acquired via burn
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(lottery_round, ticket_number)
);

CREATE INDEX idx_tickets_user ON lottery_tickets(user_id);
CREATE INDEX idx_tickets_wallet ON lottery_tickets(wallet_address);
CREATE INDEX idx_tickets_round ON lottery_tickets(lottery_round);

-- Lottery rounds table
CREATE TABLE lottery_rounds (
    id VARCHAR(50) PRIMARY KEY,
    prize_pool DECIMAL(18,9) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    drawing_date TIMESTAMP,
    winner_wallet VARCHAR(44),
    winner_ticket INTEGER,
    total_tickets_sold INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, drawing, completed
    created_at TIMESTAMP DEFAULT NOW()
);

-- Revenue distributions table
CREATE TABLE revenue_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month VARCHAR(7) NOT NULL, -- '2026-02'
    total_revenue DECIMAL(18,9) NOT NULL,
    distribution_amount DECIMAL(18,9) NOT NULL,
    per_pass_amount DECIMAL(18,9) NOT NULL,
    distribution_date TIMESTAMP NOT NULL,
    transaction_signature VARCHAR(88),
    sources JSONB NOT NULL, -- Array of {name, amount}
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_distributions_month ON revenue_distributions(month);

-- Revenue claims table
CREATE TABLE revenue_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distribution_id UUID REFERENCES revenue_distributions(id),
    pass_mint VARCHAR(44) NOT NULL,
    wallet_address VARCHAR(44) NOT NULL,
    amount DECIMAL(18,9) NOT NULL,
    transaction_signature VARCHAR(88) NOT NULL,
    claimed_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(distribution_id, pass_mint)
);

CREATE INDEX idx_claims_distribution ON revenue_claims(distribution_id);
CREATE INDEX idx_claims_wallet ON revenue_claims(wallet_address);

-- Utility Factory projects table
CREATE TABLE utility_projects (
    id VARCHAR(50) PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_wallet VARCHAR(44),
    package VARCHAR(50) NOT NULL, -- starter, professional, enterprise
    services JSONB NOT NULL, -- Array of selected services
    payment_method VARCHAR(50) NOT NULL,
    budget DECIMAL(10,2),
    timeline VARCHAR(100),
    details TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_review',
    assigned_to VARCHAR(255),
    estimated_completion DATE,
    actual_completion DATE,
    total_cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON utility_projects(status);
CREATE INDEX idx_projects_email ON utility_projects(email);

-- Project updates table
CREATE TABLE project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id VARCHAR(50) REFERENCES utility_projects(id),
    message TEXT NOT NULL,
    progress INTEGER, -- 0-100
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_updates_project ON project_updates(project_id);

-- Email notifications table
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_emails_status ON email_notifications(status);
CREATE INDEX idx_emails_created ON email_notifications(created_at);

-- Analytics events table
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id),
    wallet_address VARCHAR(44),
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_type ON analytics_events(event_type);
CREATE INDEX idx_events_created ON analytics_events(created_at);
```

---

## API Endpoints

### Lottery API

```typescript
// POST /api/v1/lottery/purchase
interface PurchaseTicketsRequest {
  walletAddress: string;
  ticketCount: number;
  paymentMethod: 'SOL' | 'USDC';
  transactionSignature: string;
  amountPaid: number;
}

interface PurchaseTicketsResponse {
  success: boolean;
  ticketsIssued: number[];
  totalTickets: number;
  transactionVerified: boolean;
}

// POST /api/v1/lottery/burn-claim
interface BurnClaimRequest {
  walletAddress: string;
  nftsBurned: string[]; // Mint addresses
  transactionSignatures: string[];
  ticketsClaimed: number;
}

// GET /api/v1/lottery/tickets/:walletAddress
interface UserTicketsResponse {
  walletAddress: string;
  totalTickets: number;
  ticketNumbers: number[];
  entries: TicketEntry[];
}

// GET /api/v1/lottery/rounds/current
interface CurrentRoundResponse {
  id: string;
  prizePool: number;
  startDate: string;
  endDate: string;
  totalTicketsSold: number;
  status: string;
}
```

### Utility Factory API

```typescript
// POST /api/v1/utility-factory/project
interface ProjectSubmissionRequest {
  projectName: string;
  email: string;
  package: 'starter' | 'professional' | 'enterprise';
  services: string[];
  paymentMethod: string;
  details: string;
  timeline?: string;
  budget?: number;
}

interface ProjectSubmissionResponse {
  success: boolean;
  projectId: string;
  status: string;
  estimatedReviewTime: string;
}

// GET /api/v1/utility-factory/project/:projectId
interface ProjectStatusResponse {
  projectId: string;
  status: string;
  progress: number;
  estimatedCompletion?: string;
  updates: ProjectUpdate[];
}
```

### Revenue Pass API

```typescript
// GET /api/v1/revenue-pass/distributions
interface DistributionsResponse {
  distributions: Distribution[];
  totalDistributed: number;
}

// GET /api/v1/revenue-pass/distributions/:month
interface MonthDistributionResponse {
  month: string;
  totalRevenue: number;
  distributionAmount: number;
  perPassAmount: number;
  sources: RevenueSource[];
  claimedCount: number;
}

// GET /api/v1/revenue-pass/claims/:walletAddress
interface UserClaimsResponse {
  walletAddress: string;
  totalClaimed: number;
  claimHistory: Claim[];
}
```

---

## Authentication System

### Wallet-Based Authentication

```typescript
// POST /api/v1/auth/request-challenge
interface ChallengeRequest {
  walletAddress: string;
}

interface ChallengeResponse {
  challenge: string; // "Sign this message to authenticate: [random string]"
  expiresAt: string;
}

// POST /api/v1/auth/verify-signature
interface VerifyRequest {
  walletAddress: string;
  signature: string; // Signed challenge
  challenge: string;
}

interface VerifyResponse {
  success: boolean;
  token: string; // JWT token
  expiresAt: string;
}

// Implementation
import jwt from 'jsonwebtoken';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export async function verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(walletAddress);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
  } catch (error) {
    return false;
  }
}

export function generateJWT(walletAddress: string): string {
  return jwt.sign(
    { walletAddress },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}
```

### Middleware

```typescript
import { Request, Response, NextFunction } from 'express';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin middleware
export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const adminWallets = process.env.ADMIN_WALLETS?.split(',') || [];

  if (!adminWallets.includes(req.user.walletAddress)) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
}
```

---

## Email & Notifications

### SendGrid Integration

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  templateId?: string
) {
  const msg = {
    to,
    from: 'noreply@stonedrabbitsnft.com',
    subject,
    html,
    ...(templateId && { templateId })
  };

  try {
    await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

// Templates
export const emailTemplates = {
  projectSubmitted: (projectName: string, projectId: string) => ({
    subject: `Project Submission Received - ${projectName}`,
    html: `
      <h1>Thank you for your submission!</h1>
      <p>Your project "${projectName}" has been received.</p>
      <p>Project ID: <strong>${projectId}</strong></p>
      <p>We'll review it within 24 hours and get back to you.</p>
    `
  }),

  ticketsPurchased: (ticketCount: number, ticketNumbers: number[]) => ({
    subject: `Lottery Tickets Confirmed - ${ticketCount} Tickets`,
    html: `
      <h1>Your lottery tickets are confirmed!</h1>
      <p>Ticket numbers: ${ticketNumbers.join(', ')}</p>
      <p>Drawing date: [TBD]</p>
      <p>Good luck!</p>
    `
  }),

  distributionAvailable: (month: string, amount: number) => ({
    subject: `Revenue Distribution Available - ${month}`,
    html: `
      <h1>Your revenue share is ready!</h1>
      <p>Distribution for ${month}: ${amount} SOL</p>
      <p>Claim now at [link]</p>
    `
  })
};
```

---

## Admin Dashboard

### Tech Stack
- **Frontend:** React + TypeScript
- **UI Library:** Tailwind CSS + shadcn/ui
- **Data Fetching:** TanStack Query
- **Auth:** JWT tokens

### Features

**Dashboard Overview:**
- Total lottery tickets sold
- Current prize pool
- Revenue distributions summary
- Utility Factory project queue
- System health metrics

**Lottery Management:**
- Create new lottery rounds
- View ticket sales
- Trigger winner drawing
- Manage prize pools

**Revenue Pass Management:**
- Upload monthly revenue data
- Trigger distributions
- View claim status
- Export reports

**Utility Factory Management:**
- Review project submissions
- Update project status
- Assign projects to developers
- Send client updates

**User Management:**
- View all users
- User activity logs
- Email communication history

---

## Infrastructure

### AWS Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CloudFront CDN                     │
│           (Static assets + API caching)              │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              Application Load Balancer               │
│            (SSL termination + routing)               │
└──────────────────┬──────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
┌────────▼────────┐  ┌───────▼────────┐
│   EC2 Instance   │  │  EC2 Instance   │
│   (Node.js API)  │  │  (Node.js API)  │
│   - Express      │  │  - Express      │
│   - TypeScript   │  │  - TypeScript   │
└────────┬────────┘  └───────┬─────────┘
         │                   │
         └─────────┬─────────┘
                   │
         ┌─────────▼─────────┐
         │                   │
┌────────▼────────┐  ┌───────▼────────┐
│   RDS Postgres   │  │ ElastiCache   │
│   (Primary DB)   │  │  (Redis)      │
│   - Multi-AZ     │  │  - Caching    │
│   - Auto-backup  │  │  - Sessions   │
└──────────────────┘  └────────────────┘
         │
┌────────▼────────┐
│   S3 Bucket     │
│   - Logs        │
│   - Backups     │
└─────────────────┘
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/stoned_rabbits
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET=your-secret-key
ADMIN_WALLETS=wallet1,wallet2,wallet3

# Solana
HELIUS_API_KEY=2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5
RPC_URL=https://mainnet.helius-rpc.com
TREASURY_WALLET=FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL

# Email
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@stonedrabbitsnft.com

# AWS
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=stoned-rabbits-assets

# Monitoring
DATADOG_API_KEY=your-datadog-key
SENTRY_DSN=your-sentry-dsn

# App
NODE_ENV=production
PORT=3000
API_VERSION=v1
```

---

**Last Updated:** November 2025
**Status:** 📅 Planned for Q4 2025 - Q1 2026
