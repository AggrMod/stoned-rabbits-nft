# Lottery System Component

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Production Ready (Frontend) | Backend Q1 2026

---

## Overview

The lottery system allows users to purchase tickets with SOL/USDC or burn Stoned Rabbits NFTs for bonus entries. Winners are selected randomly via Switchboard VRF.

**File Location:** `/Stoned Rabbits/pages/lottery.html` (673 lines)

---

## Key Features

### 1. Dual Entry Methods

**Method A: Purchase with Crypto**
- Buy 1-50+ tickets
- Pay with SOL or USDC
- Tiered pricing for bulk purchases

**Method B: Burn NFTs**
- Burn Stoned Rabbits NFTs
- Earn tickets based on floor price
- +1 bonus ticket per NFT burned

### 2. Pricing Tiers

```javascript
const PRICE_TIERS = [
  { min: 50, each: 10 }, // 50+ tickets @ $10 each (best value)
  { min: 10, each: 4 },  // 10-49 tickets @ $4 each
  { min: 1, each: 5 }    // 1-9 tickets @ $5 each
];

function calculatePrice(quantity) {
  for (const tier of PRICE_TIERS) {
    if (quantity >= tier.min) {
      return quantity * tier.each;
    }
  }
}

// Examples:
// 5 tickets = 5 * $5 = $25
// 15 tickets = 15 * $4 = $60
// 100 tickets = 100 * $10 = $1000 (lowest per-ticket cost)
```

### 3. NFT Burn Mechanics

```javascript
const FLOOR_PRICE_SOL = 3.2; // Current floor
const RABBITS_PER_TICKET = 1; // 1 SOL worth = 1 ticket
const BONUS_PER_RABBIT = 1;  // +1 bonus

function calculateTicketsFromBurn(numNFTs) {
  const baseTickets = Math.floor(FLOOR_PRICE_SOL / RABBITS_PER_TICKET);
  const bonusTickets = BONUS_PER_RABBIT;
  const perNFT = baseTickets + bonusTickets;

  return numNFTs * perNFT;
}

// Example with 3.2 SOL floor:
// floor(3.2 / 1) + 1 = 4 tickets per NFT
// Burn 3 NFTs = 12 tickets
```

---

## Purchase Flow

### Step 1: Select Quantity

```html
<input
  type="number"
  id="ticket-quantity"
  min="1"
  max="100"
  value="5"
  onchange="updatePriceDisplay()"
>

<div id="total-cost">
  Total: $25.00 USD
</div>
```

### Step 2: Choose Payment Method

```javascript
async function purchaseWithSOL(totalUSD) {
  // 1. Get SOL price
  const solPrice = await getSolPrice();

  // 2. Calculate lamports needed
  const solAmount = totalUSD / solPrice;
  const lamports = Math.floor(solAmount * solanaWeb3.LAMPORTS_PER_SOL);

  // 3. Build transaction
  const tx = new solanaWeb3.Transaction().add(
    solanaWeb3.SystemProgram.transfer({
      fromPubkey: userPublicKey,
      toPubkey: new solanaWeb3.PublicKey(TREASURY_WALLET),
      lamports
    })
  );

  // 4. Sign & send
  const signature = await window.provider.signAndSendTransaction(tx);

  // 5. Confirm
  await connection.confirmTransaction(signature);

  // 6. Backend records purchase
  await recordTicketPurchase({
    walletAddress: userPublicKey.toString(),
    ticketCount: quantity,
    paymentMethod: 'SOL',
    transactionSignature: signature,
    amountPaid: totalUSD
  });

  showSuccess(`${quantity} tickets purchased! Signature: ${signature}`);
}

async function purchaseWithUSDC(totalUSD) {
  // USDC has 6 decimals
  const usdcAmount = Math.floor(totalUSD * 1e6);

  // Get user's USDC token account
  const userUSDC = await getAssociatedTokenAddress(
    USDC_MINT,
    userPublicKey
  );

  // Get treasury's USDC token account
  const treasuryUSDC = await getAssociatedTokenAddress(
    USDC_MINT,
    new solanaWeb3.PublicKey(TREASURY_WALLET)
  );

  // Build transfer instruction
  const transferIx = createTransferInstruction(
    userUSDC,
    treasuryUSDC,
    userPublicKey,
    usdcAmount
  );

  const tx = new solanaWeb3.Transaction().add(transferIx);

  const signature = await window.provider.signAndSendTransaction(tx);
  await connection.confirmTransaction(signature);

  await recordTicketPurchase({
    walletAddress: userPublicKey.toString(),
    ticketCount: quantity,
    paymentMethod: 'USDC',
    transactionSignature: signature,
    amountPaid: totalUSD
  });

  showSuccess(`${quantity} tickets purchased with USDC!`);
}
```

---

## Burn Flow

### Step 1: Load User's NFTs

```javascript
async function loadBurnableNFTs() {
  // Fetch all user NFTs
  const allNFTs = await fetchOwnedNFTs(userWallet);

  // Filter for Stoned Rabbits collection
  const stonedRabbits = allNFTs.filter(nft =>
    nft.grouping?.some(g =>
      g.group_key === 'collection' &&
      g.group_value === STONED_RABBITS_COLLECTION
    )
  );

  // Display in grid
  renderNFTGrid(stonedRabbits);

  return stonedRabbits;
}
```

### Step 2: Select NFTs to Burn

```html
<div class="nft-grid">
  <div class="nft-card" data-mint="mint1">
    <input type="checkbox" class="nft-select">
    <img src="image1.jpg">
    <p>#1234</p>
  </div>
  <!-- ... more NFTs ... -->
</div>

<div class="burn-summary">
  Selected: <span id="selected-count">0</span> NFTs
  Tickets: <span id="tickets-earned">0</span>
</div>
```

```javascript
document.querySelectorAll('.nft-select').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    const selectedCount = document.querySelectorAll('.nft-select:checked').length;
    const ticketsEarned = calculateTicketsFromBurn(selectedCount);

    document.getElementById('selected-count').textContent = selectedCount;
    document.getElementById('tickets-earned').textContent = ticketsEarned;
  });
});
```

### Step 3: Enter Burn Address

```html
<input
  type="text"
  id="burn-address"
  placeholder="Burn wallet address"
  value="1nc1nerator11111111111111111111111111111111"
>

<div class="warning">
  ⚠️ Warning: This action is irreversible!
  NFTs will be permanently removed from your wallet.
</div>
```

### Step 4: Execute Burns

```javascript
async function burnSelectedNFTs() {
  const selectedNFTs = Array.from(
    document.querySelectorAll('.nft-select:checked')
  ).map(cb => cb.closest('.nft-card').dataset.mint);

  const burnAddress = document.getElementById('burn-address').value;

  // Validate burn address
  if (!isValidSolanaAddress(burnAddress)) {
    throw new Error('Invalid burn address');
  }

  // Confirm action
  const confirmed = confirm(
    `Burn ${selectedNFTs.length} NFTs for ${calculateTicketsFromBurn(selectedNFTs.length)} tickets?\n\n` +
    'This action cannot be undone!'
  );

  if (!confirmed) return;

  // Execute burns
  const signatures = [];

  for (const mint of selectedNFTs) {
    try {
      showProgress(`Burning NFT ${signatures.length + 1}/${selectedNFTs.length}...`);

      const signature = await transferNFT(mint, burnAddress);
      signatures.push(signature);

      await connection.confirmTransaction(signature);
    } catch (error) {
      console.error('Failed to burn NFT:', mint, error);
      showError(`Failed to burn NFT ${signatures.length + 1}. Please try again.`);
      throw error;
    }
  }

  // Record burn claim
  await recordBurnClaim({
    walletAddress: userWallet,
    nftsBurned: selectedNFTs,
    transactionSignatures: signatures,
    ticketsClaimed: calculateTicketsFromBurn(selectedNFTs.length)
  });

  showSuccess(
    `Successfully burned ${selectedNFTs.length} NFTs!\n` +
    `Earned ${calculateTicketsFromBurn(selectedNFTs.length)} tickets.`
  );

  // Refresh NFT list
  await loadBurnableNFTs();
}
```

---

## Backend API Integration

### Record Ticket Purchase

```typescript
// POST /api/v1/lottery/purchase
interface PurchaseRequest {
  walletAddress: string;
  ticketCount: number;
  paymentMethod: 'SOL' | 'USDC';
  transactionSignature: string;
  amountPaid: number;
}

async function recordTicketPurchase(data: PurchaseRequest) {
  // 1. Verify transaction on-chain
  const tx = await connection.getTransaction(data.transactionSignature);

  if (!tx) {
    throw new Error('Transaction not found');
  }

  // 2. Verify recipient and amount
  // ... validation logic ...

  // 3. Insert into database
  const ticketNumbers = await generateTicketNumbers(data.ticketCount);

  await db.query(
    `INSERT INTO lottery_tickets
     (wallet_address, ticket_number, lottery_round, acquisition_method, payment_method, transaction_signature, amount_paid)
     VALUES ...`,
    // ... bulk insert ...
  );

  // 4. Send confirmation email
  await sendEmail(
    data.walletAddress,
    'Lottery Tickets Confirmed',
    `You purchased ${data.ticketCount} tickets: ${ticketNumbers.join(', ')}`
  );

  return { success: true, ticketNumbers };
}
```

### Record Burn Claim

```typescript
// POST /api/v1/lottery/burn-claim
interface BurnClaimRequest {
  walletAddress: string;
  nftsBurned: string[];
  transactionSignatures: string[];
  ticketsClaimed: number;
}

async function recordBurnClaim(data: BurnClaimRequest) {
  // 1. Verify each NFT was transferred to burn address
  for (let i = 0; i < data.nftsBurned.length; i++) {
    const mint = data.nftsBurned[i];
    const sig = data.transactionSignatures[i];

    const tx = await connection.getTransaction(sig);
    // Verify transfer occurred
  }

  // 2. Issue tickets
  const ticketNumbers = await generateTicketNumbers(data.ticketsClaimed);

  await db.query(
    `INSERT INTO lottery_tickets
     (wallet_address, ticket_number, lottery_round, acquisition_method, nft_burned, transaction_signature)
     VALUES ...`
  );

  return { success: true, ticketNumbers };
}
```

---

## Drawing Process

### Smart Contract Integration

```typescript
// When lottery round ends
async function drawWinner(lotteryRound: string) {
  // 1. Close ticket sales
  await closeLotteryRound(lotteryRound);

  // 2. Get total tickets sold
  const totalTickets = await getTotalTickets(lotteryRound);

  // 3. Request randomness from Switchboard VRF
  const vrfAccount = await initializeVRF();

  await program.methods
    .requestRandomness()
    .accounts({
      vrf: vrfAccount,
      authority: authority.publicKey,
      payer: payer.publicKey
    })
    .rpc();

  // 4. Wait for VRF callback
  await waitForVRFResult(vrfAccount);

  // 5. Get random number
  const vrfData = await program.account.vrf.fetch(vrfAccount);
  const randomValue = vrfData.result.value[0];

  // 6. Select winning ticket
  const winningTicket = randomValue % totalTickets;

  // 7. Find winner
  const winner = await db.query(
    'SELECT wallet_address FROM lottery_tickets WHERE lottery_round = $1 AND ticket_number = $2',
    [lotteryRound, winningTicket]
  );

  // 8. Transfer prize
  await transferPrize(winner.wallet_address, prizePool);

  // 9. Announce winner
  await announceWinner({
    lotteryRound,
    winningTicket,
    winner: winner.wallet_address,
    prizeAmount: prizePool
  });

  return winner;
}
```

### Winner Announcement

```typescript
async function announceWinner(data: WinnerData) {
  // Discord
  await postToDiscord(`
    🎉 **LOTTERY WINNER!** 🎉

    Winning Ticket: #${data.winningTicket}
    Winner: ${data.winner.slice(0, 6)}...${data.winner.slice(-4)}
    Prize: ${data.prizeAmount} SOL

    Congratulations! 🚀

    New lottery starting now: [link]
  `);

  // Twitter
  await postToTwitter(`
    🎰 LOTTERY WINNER 🎰

    Ticket #${data.winningTicket} wins ${data.prizeAmount} SOL!

    Congrats to ${data.winner.slice(0, 6)}...${data.winner.slice(-4)} 🎉

    New round starts now: [link]

    #SolanaNFT #StonedRabbits
  `);

  // Email to winner
  await sendEmail(
    data.winner,
    '🎉 You Won the Stoned Rabbits Lottery!',
    `Congratulations! Your ticket #${data.winningTicket} won ${data.prizeAmount} SOL...`
  );
}
```

---

## UI Components

### Ticket Counter

```css
.ticket-counter {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 1rem 2rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.counter-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-gold);
  color: black;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.counter-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 15px rgba(255, 209, 102, 0.5);
}

.counter-value {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  min-width: 60px;
  text-align: center;
}
```

### Payment Method Toggle

```html
<div class="payment-toggle">
  <button class="toggle-btn active" data-method="sol">
    <i class="fab fa-solana"></i>
    SOL
  </button>
  <button class="toggle-btn" data-method="usdc">
    <i class="fas fa-dollar-sign"></i>
    USDC
  </button>
</div>
```

### NFT Burn Grid

```css
.nft-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.nft-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.nft-card.selected {
  border-color: var(--accent-gold);
  transform: scale(1.05);
}

.nft-card img {
  width: 100%;
  height: auto;
  display: block;
}

.nft-select {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  cursor: pointer;
}
```

---

## Related Documentation

- [01-architecture.md](../01-architecture.md) - Data flow diagrams
- [04-smart-contracts.md](../04-smart-contracts.md) - Lottery contract spec
- [08-operations.md](../08-operations.md) - Drawing procedures

---

**Last Updated:** November 2025
**Status:** ✅ Frontend Ready | 📅 Backend Q1 2026
