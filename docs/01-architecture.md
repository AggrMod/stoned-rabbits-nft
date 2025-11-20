# Technical Architecture

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Component Details](#component-details)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Blockchain Integration](#blockchain-integration)
6. [Technology Stack](#technology-stack)
7. [Security Architecture](#security-architecture)

---

## System Overview

The Stoned Rabbits NFT ecosystem consists of three interconnected web applications and one B2B platform, all built on the Solana blockchain.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER (Frontend)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Main Site       │  │  Revenue Pass    │  │  Lottery System  │  │
│  │  (index.html)    │  │  (revenue-pass)  │  │  (lottery.html)  │  │
│  │                  │  │                  │  │                  │  │
│  │  • Hero          │  │  • 777 Passes    │  │  • Buy Tickets   │  │
│  │  • Collection    │  │  • Benefits      │  │  • Burn NFTs     │  │
│  │  • Roadmap       │  │  • Calculator    │  │  • Prize Pool    │  │
│  │  • Team          │  │  • Magic Eden    │  │  • Winners       │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │             │
│           └─────────────────────┴─────────────────────┘             │
│                                 │                                   │
│                    ┌────────────▼───────────┐                       │
│                    │  Shared UI Components  │                       │
│                    │  • Wallet Connect      │                       │
│                    │  • Navigation          │                       │
│                    │  • Animations (AOS)    │                       │
│                    │  • Glass Morphism UI   │                       │
│                    └────────────┬───────────┘                       │
│                                                                       │
├───────────────────────────────┬───────────────────────────────────────┤
│        B2B PLATFORM           │                                       │
│                               │                                       │
│  ┌────────────────────────────▼─────────────────────────────────┐   │
│  │  NFT Utility Factory (Tailwind-based)                        │   │
│  │                                                               │   │
│  │  • Service Showcase (7 utilities)                            │   │
│  │  • Pricing Tiers (Starter/Pro/Enterprise)                    │   │
│  │  • Project Onboarding Form                                   │   │
│  │  • Payment Options (SOL/USDC/Revenue Share)                  │   │
│  └───────────────────────────────┬───────────────────────────────┘   │
│                                  │                                   │
└──────────────────────────────────┼───────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────┐
│                     BLOCKCHAIN INTEGRATION LAYER                      │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Wallet Adapter  │  │  Web3.js SDK     │  │  Metaplex SDK    │  │
│  │                  │  │                  │  │                  │  │
│  │  • Phantom       │  │  • Transactions  │  │  • NFT Metadata  │  │
│  │  • Solflare      │  │  • Transfers     │  │  • Token Std     │  │
│  │  • Backpack      │  │  • Signatures    │  │  • Collections   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────┐
│                          RPC / API LAYER                               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Helius RPC      │  │  Magic Eden API  │  │  Price Feeds     │  │
│  │                  │  │                  │  │                  │  │
│  │  • Mainnet RPCs  │  │  • Collection    │  │  • SOL/USD       │  │
│  │  • Token Data    │  │  • Floor Price   │  │  • USDC Rate     │  │
│  │  • NFT Queries   │  │  • Volume Stats  │  │  • CoinGecko     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                       │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │
┌───────────────────────────────────▼───────────────────────────────────┐
│                        SOLANA BLOCKCHAIN                               │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  On-Chain Programs & Data                                     │   │
│  │                                                                │   │
│  │  • Collection: 4aP8AfV7uYjvAdSGHanmkAdQPHM1NauKPs2cBFJigj5K   │   │
│  │  • Revenue Pass Collection: [TBD]                             │   │
│  │  • Treasury: FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL     │   │
│  │  • SPL Token Program                                          │   │
│  │  • Token Metadata Program                                     │   │
│  │  • System Program (SOL transfers)                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### 1. Presentation Layer

**Purpose:** User-facing interfaces for all ecosystem interactions

**Components:**
- **Main Site (`/Stoned Rabbits/index.html`)**: Landing page, collection info, roadmap
- **Revenue Pass Page**: 777 passes, benefits, slot machine details
- **Lottery Page**: Ticket purchasing and NFT burning
- **Utility Factory**: B2B service showcase

**Technologies:**
- HTML5, CSS3 (Custom + Tailwind)
- Vanilla JavaScript (ES6+)
- AOS Animation Library
- Font Awesome Icons

**Design Patterns:**
- Glass morphism UI
- Responsive grid layouts
- Mobile-first approach
- Unified color scheme

### 2. Blockchain Integration Layer

**Purpose:** Bridge between frontend and Solana blockchain

**Key Libraries:**
```javascript
// Core Solana interaction
@solana/web3.js v1.87.6
@solana/spl-token v0.3.9

// NFT standards
@metaplex-foundation/js v0.19.4
@metaplex-foundation/mpl-token-metadata v2.13.0

// Wallet adapters
@solana/wallet-adapter-wallets
@solana/wallet-adapter-base
```

**Wallet Detection System:**
```javascript
function getAllProviders() {
  const w = window;
  const s = new Set();

  // Check for multiple wallet providers
  asArray(w?.solana?.providers).forEach(p => p && s.add(p));
  if (w?.solana && !asArray(w.solana.providers).length) s.add(w.solana);
  if (w?.backpack?.solana) s.add(w.backpack.solana);
  if (w?.phantom?.solana) s.add(w.phantom.solana);
  if (w?.solflare) s.add(w.solflare);

  return Array.from(s);
}
```

### 3. RPC / API Layer

**Purpose:** Data retrieval and external service integration

**Helius RPC:**
- Endpoint: `https://mainnet.helius-rpc.com/?api-key=2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5`
- Rate Limits: Standard tier
- Used for: NFT queries, token data, transaction submission

**Magic Eden API:**
- Collections API: `https://api-mainnet.magiceden.dev/v2/collections/{symbol}`
- Stats endpoint for floor price and volume
- No authentication required (public endpoints)

**Price Feeds:**
- CoinGecko API for SOL/USD conversion
- Cached for 60 seconds to reduce API calls
- Fallback to static rate if API unavailable

### 4. Blockchain Layer

**Purpose:** Immutable ledger and smart contract execution

**Network:** Solana Mainnet Beta
- Cluster URL: `https://api.mainnet-beta.solana.com`
- Helius RPC (primary)

**Key Accounts:**
- **Treasury Wallet:** `FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL`
- **Main Collection:** `4aP8AfV7uYjvAdSGHanmkAdQPHM1NauKPs2cBFJigj5K`
- **Revenue Pass Collection:** [To be deployed]

---

## Component Details

### Main Site Component

**File:** `/Stoned Rabbits/index.html`
**Lines:** ~600

**Key Sections:**
```html
<!-- Hero Section -->
<section id="home" class="hero">
  - Animated title with gradient effects
  - Collection stats (3,333 supply)
  - Magic Eden CTA buttons
</section>

<!-- About Section -->
<section id="about">
  - Project backstory
  - Community focus
  - Revenue sharing introduction
</section>

<!-- NFT Actions Section -->
<section id="downloadnft">
  - Wallet connection
  - View owned NFTs
  - Transfer functionality
</section>

<!-- Roadmap Section -->
<section id="roadmap">
  - Phase 1-5 milestones
  - Q1 2026 slot launch target
  - Future expansion plans
</section>

<!-- Utilities Section -->
<section id="utilities">
  - Staking (coming soon)
  - Revenue pass benefits
  - NFT Utility Factory promo banner
</section>
```

**JavaScript Modules:**
```javascript
// Wallet connection
async function connectWallet() {
  const providers = getAllProviders();
  window.provider = providers[0];
  await provider.connect();
  window.publicKey = provider.publicKey.toString();
}

// NFT fetching
async function fetchOwnedNFTs(walletAddress) {
  const response = await fetch(
    `${heliusUrl}/v0/addresses/${walletAddress}/nfts?api-key=${apiKey}`
  );
  const nfts = await response.json();
  return nfts.filter(nft =>
    nft.grouping.some(g => g.group_value === COLLECTION_ADDRESS)
  );
}

// NFT transfer
async function transferNFT(mintAddress, recipientAddress) {
  const mintPk = new solanaWeb3.PublicKey(mintAddress);
  const toPk = new solanaWeb3.PublicKey(recipientAddress);

  const sourceATA = await getAssociatedTokenAddress(mintPk, fromPk);
  const destATA = await getOrCreateAssociatedTokenAccount(
    connection, fromPk, mintPk, toPk
  );

  const tx = new solanaWeb3.Transaction().add(
    createTransferInstruction(sourceATA, destATA, fromPk, 1)
  );

  const sig = await window.provider.signAndSendTransaction(tx);
  await connection.confirmTransaction(sig);
}
```

### Revenue Pass Component

**File:** `/Stoned Rabbits/pages/revenue-pass.html`
**Lines:** 539

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Revenue Pass Page               │
├─────────────────────────────────────────┤
│                                         │
│  1. Hero Section                        │
│     • 777 supply badge                  │
│     • 0.77 SOL mint price               │
│     • Q1 2026 launch date               │
│                                         │
│  2. Collection Stats Grid               │
│     • Total Supply: 777                 │
│     • Floor Price: [Magic Eden API]     │
│     • Unique Holders: [On-chain]        │
│     • Total Volume: [Magic Eden API]    │
│                                         │
│  3. Benefits Cards (6 items)            │
│     • Lifetime Revenue Share            │
│     • Monthly Distributions             │
│     • Art Reveal (Q4 2025)              │
│     • Community Alpha                   │
│     • Gamblor VIP Status                │
│     • Governance Rights                 │
│                                         │
│  4. Slot Machine Preview                │
│     • 5+ themed slots                   │
│     • Revenue calculator                │
│     • Conservative: $50/month           │
│     • Optimistic: $200/month            │
│                                         │
│  5. Magic Eden Integration              │
│     • Direct buy link                   │
│     • Real-time floor price             │
│     • Collection verification           │
│                                         │
│  6. FAQ Section                         │
│     • How distributions work            │
│     • Slot launch timeline              │
│     • Pass utility details              │
│                                         │
└─────────────────────────────────────────┘
```

**Revenue Calculator Logic:**
```javascript
// Conservative estimate
const monthlyGrossRevenue = 50000; // $50k from all slots
const revenueSharePercent = 10; // 10% goes to pass holders
const monthlyPool = monthlyGrossRevenue * (revenueSharePercent / 100);
const perPassMonthly = monthlyPool / 777;
// Result: ~$64/month per pass

// Optimistic estimate
const monthlyGrossRevenueHigh = 200000; // $200k
const perPassMonthlyHigh = (monthlyGrossRevenueHigh * 0.10) / 777;
// Result: ~$257/month per pass
```

### Lottery System Component

**File:** `/Stoned Rabbits/pages/lottery.html`
**Lines:** 673

**Data Flow:**
```
User Action: Buy Tickets with Crypto
  │
  ├─> Select quantity (1-50+)
  │   └─> Calculate total USD
  │       └─> Tier pricing applied
  │           • 1-9 tickets: $5 each
  │           • 10-49 tickets: $4 each
  │           • 50+ tickets: $10 each
  │
  ├─> Choose payment method
  │   ├─> SOL
  │   │   └─> Fetch SOL/USD rate
  │   │       └─> Convert to lamports
  │   │           └─> Create transfer instruction
  │   │               └─> Sign & send transaction
  │   │
  │   └─> USDC
  │       └─> Find USDC token account
  │           └─> Convert to smallest units
  │               └─> Create SPL token transfer
  │                   └─> Sign & send transaction
  │
  └─> On success
      └─> Log transaction signature
          └─> Update UI with ticket count
              └─> Store tickets in backend [TODO]

User Action: Burn NFTs for Tickets
  │
  ├─> Connect wallet
  │   └─> Fetch owned Stoned Rabbits NFTs
  │       └─> Display in selection grid
  │
  ├─> Select NFTs to burn (up to 10)
  │   └─> Calculate tickets earned
  │       • Base: floor_price / RABBITS_PER_TICKET
  │       • Bonus: +1 ticket per NFT
  │       • Example: 3.2 SOL floor = 4 tickets/NFT
  │
  ├─> Enter burn destination address
  │   └─> Validate Solana address format
  │
  └─> Execute burn
      └─> For each selected NFT:
          ├─> Transfer to burn address
          └─> Confirm transaction
      └─> Calculate total tickets earned
          └─> Credit to user account [TODO]
```

**Pricing Tier Implementation:**
```javascript
const PRICE_TIERS = [
  { min: 50, each: 10 }, // 50+ tickets @ $10 each
  { min: 10, each: 4 },  // 10-49 tickets @ $4 each
  { min: 1, each: 5 }    // 1-9 tickets @ $5 each
];

function calculateTotalCost(qty) {
  for (const tier of PRICE_TIERS) {
    if (qty >= tier.min) {
      return qty * tier.each;
    }
  }
  return 0;
}
```

**NFT Burn Mechanics:**
```javascript
const FLOOR_PRICE_SOL = 3.2; // Current floor
const RABBITS_PER_TICKET = 1; // 1 SOL worth = 1 ticket
const BONUS_PER_RABBIT = 1;  // +1 bonus ticket per NFT

function ticketsFromRabbitsCount(numNFTs) {
  const baseTickets = Math.floor(FLOOR_PRICE_SOL / RABBITS_PER_TICKET);
  const bonusTickets = BONUS_PER_RABBIT;
  const perNFT = baseTickets + bonusTickets;
  return numNFTs * perNFT;
}

// Example: Burn 3 NFTs at 3.2 SOL floor
// Base: floor(3.2/1) = 3 tickets per NFT
// Bonus: +1 ticket per NFT
// Total: (3+1) * 3 = 12 tickets
```

### NFT Utility Factory Component

**File:** `/NFT Utility Factory/index.html`
**Lines:** ~800

**Service Architecture:**
```
┌─────────────────────────────────────────────────────────────┐
│                  NFT UTILITY FACTORY                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SERVICE CATALOG (7 Offerings)                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  1. Staking Platform             From $500          │    │
│  │     • Custom pools & lock periods                    │    │
│  │     • Automated reward distribution                  │    │
│  │     • Real-time analytics dashboard                  │    │
│  │                                                       │    │
│  │  2. Airdrop Manager              From $300          │    │
│  │     • Snapshot tools (by trait/rarity)               │    │
│  │     • Automated distribution                         │    │
│  │     • Claim page generation                          │    │
│  │                                                       │    │
│  │  3. Lottery/Raffle System        From $600          │    │
│  │     • Multiple entry methods                         │    │
│  │     • Provably fair drawing                          │    │
│  │     • Winner announcement automation                 │    │
│  │                                                       │    │
│  │  4. Custom Website               From $800          │    │
│  │     • Responsive design                              │    │
│  │     • Wallet integration                             │    │
│  │     • NFT display galleries                          │    │
│  │                                                       │    │
│  │  5. Discord Bot                  From $400          │    │
│  │     • Holder verification                            │    │
│  │     • Role management                                │    │
│  │     • Floor alerts & stats                           │    │
│  │                                                       │    │
│  │  6. Minting Site                 From $700          │    │
│  │     • Candy Machine integration                      │    │
│  │     • Whitelist management                           │    │
│  │     • Payment processing (SOL/USDC)                  │    │
│  │                                                       │    │
│  │  7. Token Management             From $500          │    │
│  │     • SPL token creation                             │    │
│  │     • Distribution tools                             │    │
│  │     • Burn mechanics                                 │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  PRICING PACKAGES                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                       │    │
│  │  🥉 STARTER - $500                                   │    │
│  │     • 1 basic utility                                │    │
│  │     • Standard UI with client branding               │    │
│  │     • 30 days support                                │    │
│  │     • Documentation included                         │    │
│  │                                                       │    │
│  │  🥈 PROFESSIONAL - $2,000 (POPULAR)                 │    │
│  │     • Up to 3 utilities                              │    │
│  │     • Custom UI design & branding                    │    │
│  │     • 90 days support + updates                      │    │
│  │     • Priority development                           │    │
│  │     • Analytics integration                          │    │
│  │                                                       │    │
│  │  🥇 ENTERPRISE - Custom Quote                       │    │
│  │     • Unlimited utilities                            │    │
│  │     • Fully custom solutions                         │    │
│  │     • 1 year support + maintenance                   │    │
│  │     • Dedicated developer                            │    │
│  │     • White-label options                            │    │
│  │                                                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  PAYMENT OPTIONS                                              │
│  • SOL (instant discount)                                     │
│  • USDC (standard)                                            │
│  • Revenue Share (for established projects)                   │
│  • Monthly Installments (Professional+ only)                  │
│                                                               │
│  ONBOARDING FLOW                                              │
│  1. Fill project form (name, email, details)                  │
│  2. Select package tier                                       │
│  3. Choose utilities from catalog                             │
│  4. Describe requirements                                     │
│  5. Submit → Backend processes [TODO]                         │
│  6. Team reviews within 24 hours                              │
│  7. Custom quote + timeline provided                          │
│  8. Payment → Development starts                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Form Data Structure:**
```javascript
{
  projectName: "string",
  email: "string",
  package: "starter" | "professional" | "enterprise",
  services: [
    "staking",
    "airdrop",
    "lottery",
    "website",
    "discord-bot",
    "minting",
    "token-management"
  ],
  paymentMethod: "sol" | "usdc" | "revenue-share" | "monthly",
  details: "string (project description)",
  timeline: "string (desired launch date)",
  budget: "number (optional)"
}
```

---

## Data Flow Diagrams

### Wallet Connection Flow

```
User clicks "Connect Wallet"
  │
  ├─> Detect available providers
  │   └─> Check window.solana
  │   └─> Check window.phantom
  │   └─> Check window.solflare
  │   └─> Check window.backpack
  │
  ├─> Display provider selection modal
  │   └─> User selects preferred wallet
  │
  ├─> Call provider.connect()
  │   └─> Wallet extension opens
  │   └─> User approves connection
  │
  ├─> On success
  │   └─> Store provider reference
  │   └─> Store public key
  │   └─> Update UI (show address)
  │   └─> Enable wallet-dependent features
  │
  └─> On error
      └─> Display error message
      └─> Reset UI to disconnected state
```

### NFT Transfer Flow

```
User selects NFT to transfer
  │
  ├─> Enter recipient address
  │   └─> Validate format (base58, 32-44 chars)
  │
  ├─> Click "Transfer"
  │   └─> Find source token account (ATA)
  │       └─> getAssociatedTokenAddress(mint, owner)
  │
  │   └─> Get/Create destination token account
  │       └─> getOrCreateAssociatedTokenAccount(mint, recipient)
  │
  │   └─> Build transfer instruction
  │       └─> createTransferInstruction(source, dest, owner, amount=1)
  │
  │   └─> Create transaction
  │       └─> Add instruction
  │       └─> Set recent blockhash
  │       └─> Set fee payer
  │
  │   └─> Sign & send via wallet
  │       └─> provider.signAndSendTransaction(tx)
  │
  │   └─> Wait for confirmation
  │       └─> connection.confirmTransaction(signature)
  │
  ├─> On success
  │   └─> Display success message
  │   └─> Show transaction signature
  │   └─> Refresh NFT list
  │
  └─> On error
      └─> Parse error type
      │   ├─> Insufficient SOL → "Add SOL for fees"
      │   ├─> User rejected → "Transfer cancelled"
      │   └─> Network error → "Try again"
      └─> Display user-friendly message
```

### Payment Processing Flow (Lottery)

```
User purchases lottery tickets
  │
  ├─> Select quantity (1-50+)
  │   └─> Calculate USD total
  │       └─> Apply tier pricing
  │
  ├─> Choose payment method
  │
  ├─> IF SOL:
  │   │
  │   ├─> Fetch SOL/USD rate from CoinGecko
  │   │   └─> Cache for 60 seconds
  │   │
  │   ├─> Calculate lamports needed
  │   │   └─> (USD total / SOL price) * 1e9
  │   │
  │   ├─> Build SOL transfer
  │   │   └─> SystemProgram.transfer({
  │   │         fromPubkey: user,
  │   │         toPubkey: treasury,
  │   │         lamports: calculated
  │   │       })
  │   │
  │   └─> Sign & send transaction
  │
  ├─> IF USDC:
  │   │
  │   ├─> Find user's USDC token account
  │   │   └─> getAssociatedTokenAddress(USDC_MINT, user)
  │   │
  │   ├─> Check balance
  │   │   └─> Ensure sufficient USDC
  │   │
  │   ├─> Calculate USDC amount (6 decimals)
  │   │   └─> USD total * 1e6
  │   │
  │   ├─> Build SPL token transfer
  │   │   └─> createTransferInstruction({
  │   │         source: userUSDC,
  │   │         destination: treasuryUSDC,
  │   │         owner: user,
  │   │         amount: calculated
  │   │       })
  │   │
  │   └─> Sign & send transaction
  │
  ├─> On transaction success
  │   │
  │   ├─> Get transaction signature
  │   │
  │   ├─> [TODO] Call backend API
  │   │   └─> POST /api/lottery/purchase
  │   │       {
  │   │         walletAddress: user.toString(),
  │   │         ticketCount: quantity,
  │   │         transactionSignature: sig,
  │   │         paymentMethod: "SOL" | "USDC",
  │   │         amountPaid: calculated
  │   │       }
  │   │
  │   ├─> Backend validates transaction on-chain
  │   │   └─> Confirm signature exists
  │   │   └─> Verify recipient = treasury
  │   │   └─> Verify amount matches expected
  │   │
  │   ├─> Backend credits tickets to user
  │   │   └─> Store in database
  │   │   └─> Generate ticket numbers
  │   │
  │   └─> Return success + ticket details
  │       └─> Frontend displays confirmation
  │
  └─> On error
      └─> Display user-friendly error
      └─> Log to monitoring system [TODO]
```

### NFT Burn for Tickets Flow

```
User burns NFTs for lottery tickets
  │
  ├─> Connect wallet
  │   └─> Fetch owned NFTs from Helius
  │       └─> Filter by collection ID
  │
  ├─> Display NFT grid with selection
  │   └─> User selects up to 10 NFTs
  │
  ├─> Calculate tickets earned
  │   └─> Per NFT: floor(floorPrice/1) + 1 bonus
  │   └─> Total = sum for all selected
  │
  ├─> Enter burn destination address
  │   └─> Validate Solana address
  │   └─> Show warning about irreversibility
  │
  ├─> User confirms burn
  │   │
  │   └─> For each selected NFT:
  │       │
  │       ├─> Build transfer transaction
  │       │   └─> transferNFT(mintAddress, burnAddress)
  │       │
  │       ├─> Sign & send
  │       │   └─> await provider.signAndSendTransaction(tx)
  │       │
  │       └─> Wait for confirmation
  │           └─> await connection.confirmTransaction(sig)
  │
  ├─> All transfers successful
  │   │
  │   ├─> Calculate total tickets
  │   │   └─> numNFTs * ticketsPerNFT
  │   │
  │   ├─> [TODO] Call backend API
  │   │   └─> POST /api/lottery/burn-claim
  │   │       {
  │   │         walletAddress: user.toString(),
  │   │         nftsBurned: [mint1, mint2, ...],
  │   │         transactionSignatures: [sig1, sig2, ...],
  │   │         ticketsClaimed: totalTickets
  │   │       }
  │   │
  │   ├─> Backend validates burns on-chain
  │   │   └─> Confirm transfers occurred
  │   │   └─> Verify NFTs now at burn address
  │   │   └─> Check collection membership
  │   │
  │   ├─> Backend credits tickets
  │   │   └─> Store in database
  │   │   └─> Generate ticket numbers
  │   │
  │   └─> Return success + ticket details
  │       └─> Frontend displays confirmation
  │
  └─> On error
      └─> Identify which NFTs failed
      └─> Retry failed transfers
      └─> Partial success handling [TODO]
```

---

## Blockchain Integration

### Solana Connection Setup

```javascript
// Primary RPC (Helius)
const HELIUS_API_KEY = "2bcbdde3-7750-4d83-b13b-9c6f1e2da2a5";
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Initialize connection
const connection = new solanaWeb3.Connection(
  RPC_URL,
  {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000
  }
);

// Fallback to public RPC if Helius fails
const FALLBACK_RPC = "https://api.mainnet-beta.solana.com";
```

### Key Addresses

```javascript
// Treasury wallet (receives all payments)
const TREASURY_WALLET = "FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL";

// NFT Collections
const STONED_RABBITS_COLLECTION = "4aP8AfV7uYjvAdSGHanmkAdQPHM1NauKPs2cBFJigj5K";
const REVENUE_PASS_COLLECTION = "[TBD - To be deployed]";

// Token Mints
const SOL_MINT = "So11111111111111111111111111111111111111112"; // Wrapped SOL
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC

// Burn address (dead wallet for NFT burns)
const BURN_ADDRESS = "1nc1nerator11111111111111111111111111111111";
```

### Transaction Construction

**SOL Transfer:**
```javascript
async function sendSolPayment(amountLamports) {
  const fromPubkey = window.provider.publicKey;
  const toPubkey = new solanaWeb3.PublicKey(TREASURY_WALLET);

  const transaction = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports: amountLamports
    })
  );

  transaction.feePayer = fromPubkey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash('finalized')
  ).blockhash;

  const signed = await window.provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}
```

**USDC Transfer:**
```javascript
async function sendUsdcPayment(amountUsdc) {
  const fromPubkey = window.provider.publicKey;
  const toPubkey = new solanaWeb3.PublicKey(TREASURY_WALLET);
  const usdcMint = new solanaWeb3.PublicKey(USDC_MINT);

  // Get source token account
  const fromTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    fromPubkey
  );

  // Get destination token account
  const toTokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    toPubkey
  );

  // Build transfer instruction
  const transferInstruction = createTransferInstruction(
    fromTokenAccount,
    toTokenAccount,
    fromPubkey,
    amountUsdc * 1e6, // USDC has 6 decimals
    [],
    TOKEN_PROGRAM_ID
  );

  const transaction = new solanaWeb3.Transaction().add(transferInstruction);
  transaction.feePayer = fromPubkey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash('finalized')
  ).blockhash;

  const signed = await window.provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}
```

**NFT Transfer (for burns):**
```javascript
async function transferNFT(mintAddress, recipientAddress) {
  const fromPubkey = window.provider.publicKey;
  const toPubkey = new solanaWeb3.PublicKey(recipientAddress);
  const mintPubkey = new solanaWeb3.PublicKey(mintAddress);

  // Get source ATA
  const fromAta = await getAssociatedTokenAddress(
    mintPubkey,
    fromPubkey
  );

  // Get or create destination ATA
  const toAta = await getAssociatedTokenAddress(
    mintPubkey,
    toPubkey
  );

  // Check if destination ATA exists
  const toAccount = await connection.getAccountInfo(toAta);

  const instructions = [];

  // Create ATA if it doesn't exist
  if (!toAccount) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        fromPubkey, // payer
        toAta,      // ata
        toPubkey,   // owner
        mintPubkey  // mint
      )
    );
  }

  // Add transfer instruction
  instructions.push(
    createTransferInstruction(
      fromAta,
      toAta,
      fromPubkey,
      1, // NFTs have amount of 1
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const transaction = new solanaWeb3.Transaction().add(...instructions);
  transaction.feePayer = fromPubkey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash('finalized')
  ).blockhash;

  const signed = await window.provider.signTransaction(transaction);
  const signature = await connection.sendRawTransaction(signed.serialize());

  await connection.confirmTransaction(signature, 'confirmed');

  return signature;
}
```

### NFT Metadata Fetching

```javascript
async function fetchNFTMetadata(mintAddress) {
  const url = `${RPC_URL}/v0/token-metadata?mint=${mintAddress}`;

  const response = await fetch(url);
  const data = await response.json();

  return {
    name: data.onChainData?.data?.name,
    symbol: data.onChainData?.data?.symbol,
    uri: data.onChainData?.data?.uri,
    image: data.offChainData?.image,
    attributes: data.offChainData?.attributes,
    collection: data.onChainData?.collection,
    verified: data.onChainData?.collection?.verified
  };
}
```

### Collection Verification

```javascript
async function verifyNFTInCollection(mintAddress, collectionId) {
  const metadata = await fetchNFTMetadata(mintAddress);

  if (!metadata.collection) {
    return false;
  }

  return (
    metadata.collection.key === collectionId &&
    metadata.collection.verified === true
  );
}
```

---

## Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| HTML5 | - | Semantic markup |
| CSS3 | - | Styling & animations |
| JavaScript | ES6+ | Client-side logic |
| Tailwind CSS | 3.3.0 | Utility Factory styling |
| AOS | 2.3.1 | Scroll animations |
| Font Awesome | 6.0.0 | Icons |

### Blockchain Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| @solana/web3.js | 1.87.6 | Solana interactions |
| @solana/spl-token | 0.3.9 | Token operations |
| @metaplex-foundation/js | 0.19.4 | NFT standard |
| @metaplex-foundation/mpl-token-metadata | 2.13.0 | Metadata program |

### External APIs

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Helius RPC | mainnet.helius-rpc.com | Primary RPC |
| Magic Eden | api-mainnet.magiceden.dev | Collection stats |
| CoinGecko | api.coingecko.com | Price feeds |

### Development Tools

| Tool | Purpose |
|------|---------|
| Git | Version control |
| VS Code | Code editor |
| Python HTTP Server | Local testing |
| Chrome DevTools | Debugging |

---

## Security Architecture

### Frontend Security

**1. Input Validation:**
```javascript
function validateSolanaAddress(address) {
  try {
    const pubkey = new solanaWeb3.PublicKey(address);
    return solanaWeb3.PublicKey.isOnCurve(pubkey.toBytes());
  } catch {
    return false;
  }
}

function sanitizeInput(input) {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove HTML tags
    .substring(0, 255);   // Limit length
}
```

**2. Transaction Verification:**
```javascript
async function verifyTransaction(signature, expectedRecipient, expectedAmount) {
  const tx = await connection.getTransaction(signature, {
    commitment: 'confirmed'
  });

  if (!tx) {
    throw new Error('Transaction not found');
  }

  // Verify recipient
  const recipientMatch = tx.transaction.message.accountKeys.some(
    key => key.toString() === expectedRecipient
  );

  if (!recipientMatch) {
    throw new Error('Recipient mismatch');
  }

  // Verify amount (for SOL transfers)
  const transferInstruction = tx.transaction.message.instructions[0];
  const amount = transferInstruction.data.readBigUInt64LE(4);

  if (amount < expectedAmount) {
    throw new Error('Amount mismatch');
  }

  return true;
}
```

**3. Wallet Connection Security:**
- Only connect when user initiates
- Never auto-connect on page load
- Clear stored data on disconnect
- Validate wallet provider authenticity

**4. Rate Limiting (Client-Side):**
```javascript
const rateLimiter = {
  attempts: {},
  maxAttempts: 5,
  windowMs: 60000, // 1 minute

  check(key) {
    const now = Date.now();
    const attempts = this.attempts[key] || [];

    // Filter recent attempts
    const recentAttempts = attempts.filter(
      time => now - time < this.windowMs
    );

    if (recentAttempts.length >= this.maxAttempts) {
      throw new Error('Too many attempts, please wait');
    }

    recentAttempts.push(now);
    this.attempts[key] = recentAttempts;

    return true;
  }
};
```

### Smart Contract Security (Future)

**Planned Security Measures:**

1. **Multi-Signature Treasury:**
   - Require 2-of-3 signatures for large withdrawals
   - Separate hot/cold wallet architecture

2. **Revenue Distribution Contract:**
   - Time-locked distributions
   - Merkle tree proof system for claims
   - Admin controls with timelock

3. **Lottery Contract:**
   - Chainlink VRF for randomness
   - Emergency pause functionality
   - Prize pool escrow

4. **Security Audits:**
   - Third-party smart contract audit (Q1 2026)
   - Bug bounty program
   - Continuous monitoring

### API Security

**1. Rate Limiting:**
- Helius RPC: Respect tier limits
- Magic Eden: Max 60 requests/minute
- CoinGecko: Max 50 requests/minute

**2. Error Handling:**
```javascript
async function safeApiCall(apiFunction, fallbackValue) {
  try {
    return await apiFunction();
  } catch (error) {
    console.error('API call failed:', error);
    return fallbackValue;
  }
}
```

**3. Data Caching:**
```javascript
const cache = {
  data: {},
  ttl: {},

  set(key, value, ttlMs) {
    this.data[key] = value;
    this.ttl[key] = Date.now() + ttlMs;
  },

  get(key) {
    if (Date.now() > this.ttl[key]) {
      delete this.data[key];
      delete this.ttl[key];
      return null;
    }
    return this.data[key];
  }
};
```

---

## Performance Considerations

### Frontend Optimization

1. **Lazy Loading:**
   - Load wallet adapters only when needed
   - Defer non-critical JavaScript
   - Use intersection observer for images

2. **Caching Strategy:**
   - Cache API responses (60s for prices, 5m for stats)
   - Store NFT metadata in sessionStorage
   - Memoize expensive calculations

3. **Bundle Size:**
   - Minimize external dependencies
   - Use CDN for common libraries
   - Compress and minify production code

### Blockchain Optimization

1. **Transaction Batching:**
   - Combine multiple instructions when possible
   - Use versioned transactions for lower fees

2. **RPC Efficiency:**
   - Use Helius for reduced latency
   - Implement retry logic with exponential backoff
   - Fallback to public RPC if needed

3. **Query Optimization:**
   - Batch NFT metadata requests
   - Use getParsedTokenAccountsByOwner for bulk fetching
   - Implement pagination for large result sets

---

## Scalability

### Current Limitations

- **Static Frontend:** All pages are static HTML
- **No Backend:** Form submissions log to console
- **Manual Processes:** Revenue distributions not automated
- **Limited Analytics:** No user behavior tracking

### Future Scalability Plans

**Phase 2: Backend Integration (Q4 2025)**
- Node.js + Express API server
- PostgreSQL database
- Redis for caching
- Automated form processing

**Phase 3: Smart Contracts (Q1 2026)**
- On-chain revenue distribution
- Automated lottery drawings
- Staking rewards program

**Phase 4: Infrastructure (Q2 2026)**
- CDN for static assets
- Load balancing for API
- Database replication
- Monitoring & alerting (Datadog/New Relic)

---

## Next Steps

1. **Read [Deployment Guide](./02-deployment.md)** for hosting instructions
2. **Review [API Integration](./03-api-integration.md)** for external services
3. **Study [Smart Contracts](./04-smart-contracts.md)** for blockchain programs
4. **Check [Security](./07-security.md)** for best practices

---

**Last Updated:** November 2025
**Maintainer:** Stoned Rabbits Development Team
**Status:** ✅ Production Ready (Frontend) | 🔄 Backend In Progress
