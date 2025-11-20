# Stoned Rabbits NFT - Complete Project Framework

**Version:** 1.0.0
**Last Updated:** November 2025
**Project Status:** Production Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Getting Started](#getting-started)
4. [Documentation Index](#documentation-index)
5. [Quick Links](#quick-links)

---

## 🎯 Project Overview

The Stoned Rabbits NFT ecosystem is a comprehensive Solana-based NFT project featuring:

- **3,333 Stoned Rabbits NFTs** - Main collection on Magic Eden
- **777 Revenue Sharing Passes** - Lifetime earnings from slot machines
- **Lottery/Ticket System** - Burn NFTs for entries or buy with SOL/USDC
- **NFT Utility Factory** - Monetized B2B utility services platform

### Key Statistics

| Metric | Value |
|--------|-------|
| Total Collections | 2 (Main + Revenue Pass) |
| Blockchain | Solana |
| Total Supply | 4,110 NFTs |
| Treasury Wallet | `FR1Lz5mtbvyiF7vxnPv2MQU3jUNbsuhyjvpsYJnn5LsL` |
| RPC Provider | Helius |
| Supported Wallets | Phantom, Solflare, Backpack |

---

## 🏗️ Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    STONED RABBITS ECOSYSTEM                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐    ┌────────────────┐    ┌───────────┐ │
│  │  Main Site     │    │  Revenue Pass  │    │  Lottery  │ │
│  │  (index.html)  │    │  Page          │    │  Page     │ │
│  └────────┬───────┘    └───────┬────────┘    └─────┬─────┘ │
│           │                    │                    │        │
│           └────────────────────┴────────────────────┘        │
│                              │                               │
│                    ┌─────────▼──────────┐                   │
│                    │   Shared Components │                   │
│                    │  - Wallet Connect   │                   │
│                    │  - Payment System   │                   │
│                    │  - NFT Interactions │                   │
│                    └─────────┬──────────┘                   │
│                              │                               │
├──────────────────────────────┼───────────────────────────────┤
│        NFT UTILITY FACTORY   │                               │
│                              │                               │
│  ┌──────────────────────────▼────────────────────────────┐ │
│  │  B2B Platform (7 Services + Pricing + Onboarding)     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │  SOLANA BLOCKCHAIN  │
                    │  - Magic Eden       │
                    │  - Smart Contracts  │
                    │  - Token Programs   │
                    └────────────────────┘
```

### Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS (Utility Factory)
- Custom CSS (Stoned Rabbits)
- AOS Animation Library

**Blockchain:**
- Solana Web3.js
- Metaplex SDK
- SPL Token Program
- Helius RPC

**Integrations:**
- Magic Eden Marketplace API
- Gamblor.io Casino Platform
- Imperious Games (Slot Development)

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required
- Modern web browser (Chrome, Firefox, Safari)
- Solana wallet (Phantom, Solflare, or Backpack)
- Helius API key for RPC access

# Optional for Development
- Node.js 18+ (for local server)
- Git
- Code editor (VS Code recommended)
```

### Quick Start

```bash
# Clone repository
git clone https://github.com/AggrMod/stoned-rabbits-nft.git
cd stoned-rabbits-nft

# Serve locally (using Python)
cd "Stoned Rabbits"
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000

# Open browser
# http://localhost:8000
```

---

## 📚 Documentation Index

### Core Documentation

| Document | Description | Link |
|----------|-------------|------|
| **Technical Architecture** | Complete system design and data flows | [01-architecture.md](./01-architecture.md) |
| **Deployment Guide** | Step-by-step deployment instructions | [02-deployment.md](./02-deployment.md) |
| **API Integration** | All API endpoints and integrations | [03-api-integration.md](./03-api-integration.md) |
| **Smart Contracts** | Solana program specifications | [04-smart-contracts.md](./04-smart-contracts.md) |
| **Backend Systems** | Database design and backend services | [05-backend-systems.md](./05-backend-systems.md) |
| **Frontend Guide** | UI/UX implementation details | [06-frontend-guide.md](./06-frontend-guide.md) |
| **Security** | Security measures and best practices | [07-security.md](./07-security.md) |
| **Operations Manual** | Day-to-day operations and workflows | [08-operations.md](./08-operations.md) |
| **Marketing Strategy** | Growth and marketing plans | [09-marketing.md](./09-marketing.md) |
| **Troubleshooting** | Common issues and solutions | [10-troubleshooting.md](./10-troubleshooting.md) |

### Component Documentation

| Component | Description | Link |
|-----------|-------------|------|
| **Revenue Pass System** | 777 passes and revenue distribution | [components/revenue-pass.md](./components/revenue-pass.md) |
| **Lottery System** | Ticket minting and burn mechanics | [components/lottery-system.md](./components/lottery-system.md) |
| **Utility Factory** | B2B platform operations | [components/utility-factory.md](./components/utility-factory.md) |
| **Wallet Integration** | Multi-wallet connection guide | [components/wallet-integration.md](./components/wallet-integration.md) |

---

## 🔗 Quick Links

### Production URLs
- **Main Site:** TBD
- **Utility Factory:** TBD
- **Magic Eden (Main):** https://magiceden.io/marketplace/stonned_rabitts
- **Magic Eden (Pass):** https://magiceden.io/marketplace/stoned_rabbits_revenue_sharing_pass

### External Resources
- **Gamblor Casino:** https://gamblor.io
- **Imperious Games:** https://www.imperious.games
- **Discord:** https://discord.gg/px9kyxbBhc
- **Twitter:** https://x.com/StonedRabbitts
- **Telegram:** https://t.me/+9PlKBM3aBeY0MTU0

### Development Resources
- **Solana Docs:** https://docs.solana.com
- **Metaplex Docs:** https://docs.metaplex.com
- **Helius Docs:** https://docs.helius.dev

---

## 🎯 Project Milestones

### Phase 1: Foundation (✅ Complete)
- [x] Main website design and deployment
- [x] Revenue Pass page created
- [x] Lottery system designed
- [x] NFT Utility Factory launched
- [x] Wallet integration complete
- [x] Unified branding applied

### Phase 2: Backend Integration (🔄 In Progress)
- [ ] Form submission backend API
- [ ] Email notification system
- [ ] Payment processing automation
- [ ] Admin dashboard for Utility Factory
- [ ] Real-time Magic Eden stats integration

### Phase 3: Smart Contracts (📅 Q1 2026)
- [ ] Revenue distribution smart contract
- [ ] Lottery/ticket minting program
- [ ] Staking contract development
- [ ] Security audit completion

### Phase 4: Slot Machines (🎰 Q1 2026)
- [ ] 5+ Stoned Rabbits slots on Gamblor.io
- [ ] Revenue pass art reveal
- [ ] Automated monthly distributions
- [ ] Analytics dashboard for pass holders

### Phase 5: Expansion (📅 Q2 2026+)
- [ ] Additional slot machines
- [ ] New casino partnerships
- [ ] Utility Factory client acquisition
- [ ] Merchandise store launch

---

## 👥 Team

- **Skyes** - Founder & Artist
- **Roland K** - Technical Lead & Developer
- **Trashpanda** - Community Manager
- **PandaFX** - Community Manager
- **Pirate Ogif Cowboy** - Community Manager
- **ŤΞ_𝓠Ħῗ𝕃Ɐ** - Gamblor Partnership

---

## 📄 License

All rights reserved © 2025 Stoned Rabbits NFT. Built by the Stoned Rabbits team.

---

## 📞 Support

For technical support or questions:
- **Discord:** https://discord.gg/px9kyxbBhc
- **Email:** Contact via website forms
- **Twitter DM:** @StonedRabbitts

---

**Next Steps:** Review the [Technical Architecture](./01-architecture.md) document to understand the complete system design.
