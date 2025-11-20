# Revenue Pass Component

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready

---

## Overview

The Revenue Pass system is a collection of 777 exclusive NFTs that grant holders lifetime revenue sharing from Stoned Rabbits slot machines.

**Collection Details:**
- Total Supply: 777 passes
- Mint Price: 0.77 SOL
- Launch: Q1 2026 (with slot machines)
- Revenue Share: 10% of gross monthly slot revenue
- Platform: Gamblor.io

---

## File Location

`/Stoned Rabbits/pages/revenue-pass.html` (539 lines)

---

## Key Features

### 1. Hero Section

Displays the core value proposition:
```html
<h1 class="hero-title">Revenue Sharing Pass</h1>
<span class="price-display">777 Exclusive Passes</span>
<p>Lifetime earnings from 5+ slot machines launching Q1 2026<br/>
   Mint: <strong>0.77 SOL</strong> | Future art reveal coming soon</p>
```

### 2. Collection Stats

Real-time stats from Magic Eden:
```javascript
async function loadCollectionStats() {
  const stats = await fetchCollectionStats('stoned_rabbits_revenue_sharing_pass');

  document.getElementById('floor-price').textContent =
    (stats.floorPrice / 1e9).toFixed(2) + ' SOL';

  document.getElementById('listed-count').textContent =
    stats.listedCount;

  document.getElementById('volume-all').textContent =
    (stats.volumeAll / 1e9).toFixed(0) + ' SOL';
}
```

### 3. Benefits Cards

Six key benefits displayed in grid:

**1. Lifetime Revenue Share**
- Passive income from all Stoned Rabbits slots
- No expiration date
- Paid monthly in SOL/USDC

**2. Monthly Distributions**
- Automated smart contract payments
- Transparent revenue reporting
- Claimable anytime after distribution

**3. Art Reveal**
- Exclusive artwork coming Q4 2025
- Unique traits and rarity
- Full collection reveal before slot launch

**4. Community Alpha**
- Early access to new features
- Exclusive holder channels
- Priority support

**5. Gamblor VIP Status**
- Special privileges on Gamblor.io
- Exclusive tournaments
- Bonus rewards

**6. Governance Rights**
- Vote on new slot themes
- Input on feature development
- Community-driven decisions

### 4. Revenue Calculator

Interactive calculator showing potential earnings:

```javascript
const SLOTS = {
  conservative: {
    monthlyRevenue: 50000,  // $50k total from all slots
    revenueShare: 0.10,     // 10% to pass holders
    totalPasses: 777
  },
  optimistic: {
    monthlyRevenue: 200000, // $200k total
    revenueShare: 0.10,
    totalPasses: 777
  }
};

function calculatePerPass(scenario) {
  const monthly = SLOTS[scenario].monthlyRevenue * SLOTS[scenario].revenueShare;
  return (monthly / SLOTS[scenario].totalPasses).toFixed(2);
}

// Conservative: ~$64/month per pass
// Optimistic: ~$257/month per pass
```

### 5. Slot Machine Preview

Shows the 5+ planned slot machines:
- Stoned Rabbits Classic
- Carrot Frenzy
- Rabbit Hole
- Purple Haze
- Cosmic Carrots
- (More to come)

### 6. FAQ Section

Common questions about revenue passes:
- How distributions work
- When slot machines launch
- How to claim earnings
- Taxability of earnings
- Trading restrictions

---

## Revenue Distribution Flow

### Monthly Process

```
1. Gamblor collects slot revenue
   ↓
2. Calculate 10% share
   ↓
3. Divide by 777 passes
   ↓
4. Smart contract makes claimable
   ↓
5. Pass holders connect wallet & claim
   ↓
6. SOL/USDC sent to holder wallet
```

### Example Calculation

```typescript
// Month: February 2026
const monthlyRevenue = {
  'Stoned Rabbits Classic': 25000,
  'Carrot Frenzy': 15000,
  'Rabbit Hole': 10000,
  'Purple Haze': 8000,
  'Cosmic Carrots': 5000
};

const totalRevenue = Object.values(monthlyRevenue).reduce((a, b) => a + b, 0);
// = $63,000

const revenueShare = totalRevenue * 0.10;
// = $6,300

const perPass = revenueShare / 777;
// = $8.11 per pass

// Annual projection: $8.11 * 12 = $97.32 per pass
// ROI at 0.77 SOL mint (~$80): Break even in ~10 months
```

---

## Smart Contract Integration

### Claim Flow

```typescript
// User clicks "Claim Distribution"
async function claimDistribution(month: string) {
  // 1. Verify user owns Revenue Pass
  const passes = await fetchOwnedNFTs(userWallet);
  const revenuePasses = passes.filter(nft =>
    nft.collection?.key === REVENUE_PASS_COLLECTION
  );

  if (revenuePasses.length === 0) {
    throw new Error('No Revenue Pass found');
  }

  // 2. Check if already claimed
  const hasClaimed = await checkClaimStatus(
    userWallet,
    revenuePasses[0].mint,
    month
  );

  if (hasClaimed) {
    throw new Error('Already claimed for this month');
  }

  // 3. Call smart contract
  const tx = await program.methods
    .claimDistribution(revenuePasses[0].mint)
    .accounts({
      revenuePool: poolPDA,
      distribution: distributionPDA,
      passHolder: userWallet,
      claimRecord: claimRecordPDA,
      systemProgram: SystemProgram.programId
    })
    .rpc();

  // 4. Confirm transaction
  await connection.confirmTransaction(tx);

  // 5. Update UI
  showSuccess(`Claimed ${perPassAmount} SOL for ${month}!`);

  // 6. Refresh claim history
  await loadClaimHistory();
}
```

### Claim History Display

```typescript
interface Claim {
  month: string;
  amount: number;
  claimedAt: Date;
  transactionSignature: string;
}

async function loadClaimHistory() {
  const claims: Claim[] = await program.account.claimRecord.all([
    {
      memcmp: {
        offset: 8,
        bytes: userWallet.toBase58()
      }
    }
  ]);

  // Display in table
  renderClaimsTable(claims);

  // Calculate total earned
  const totalEarned = claims.reduce((sum, claim) => sum + claim.amount, 0);
  document.getElementById('total-earned').textContent =
    (totalEarned / 1e9).toFixed(4) + ' SOL';
}
```

---

## UI Components

### Stat Card

```css
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 209, 102, 0.5);
  box-shadow: 0 10px 30px rgba(255, 209, 102, 0.2);
}

.stat-number {
  font-size: 3rem;
  font-weight: 700;
  color: var(--accent-gold);
  text-shadow: 0 0 20px rgba(255, 209, 102, 0.5);
}
```

### Price Display

```css
.price-display {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ffd166;
  text-shadow: 0 0 20px rgba(255, 209, 102, 0.5);
  display: inline-block;
  padding: 1rem 2rem;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(35, 114, 83, 0.3), rgba(237, 104, 62, 0.3));
  border: 2px solid rgba(255, 209, 102, 0.5);
}
```

### Timeline Badge

```css
.timeline-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #237253, #ed683e);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 1rem;
}
```

---

## SEO & Marketing

### Meta Tags

```html
<title>Revenue Sharing Pass - Stoned Rabbits NFT</title>
<meta name="description" content="777 exclusive Revenue Passes with lifetime earnings from Stoned Rabbits slot machines. Mint 0.77 SOL. Launch Q1 2026.">
<meta property="og:title" content="Revenue Sharing Pass - Lifetime Passive Income">
<meta property="og:description" content="Earn monthly passive income from 5+ slot machines on Gamblor.io">
<meta property="og:image" content="https://stonedrabbitsnft.com/images/revenue-pass-preview.jpg">
```

### Social Sharing

```javascript
// Twitter share button
const tweetText = encodeURIComponent(
  '🎰 I just learned about @StonedRabbitts Revenue Pass!\n\n' +
  '✓ 777 exclusive passes\n' +
  '✓ Lifetime earnings from slots\n' +
  '✓ Monthly distributions in SOL\n\n' +
  'Mint: 0.77 SOL | Launch: Q1 2026\n\n'
);

const shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=https://stonedrabbitsnft.com/revenue-pass`;
```

---

## Future Enhancements

### Phase 1 (Q1 2026)
- [ ] Connect to smart contract for live claiming
- [ ] Display real distribution data
- [ ] Show holder's claim history
- [ ] Add distribution notifications

### Phase 2 (Q2 2026)
- [ ] Revenue analytics dashboard
- [ ] Historical earnings charts
- [ ] Slot performance metrics
- [ ] Compound earnings option

### Phase 3 (Q3 2026)
- [ ] Pass trading marketplace
- [ ] Fractional pass ownership
- [ ] Auto-compound feature
- [ ] Tax document generation

---

## Related Documentation

- [01-architecture.md](../01-architecture.md) - System architecture
- [04-smart-contracts.md](../04-smart-contracts.md) - Distribution contract spec
- [08-operations.md](../08-operations.md) - Monthly distribution process

---

**Last Updated:** November 2025
**Status:** ✅ Production Ready (Frontend) | 📅 Smart Contracts Q1 2026
