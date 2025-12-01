# Stoned Rabbits Revenue Pass Contract

A Solana smart contract for distributing revenue from Gamblor slot machine profits to 777 Revenue Pass NFT holders.

## Features

✅ **Revenue Pool** - Collect revenue from Gamblor slot machines
✅ **Fair Distribution** - Equal split among 777 pass holders
✅ **Claim Anytime** - Pass holders claim their share when ready
✅ **Cumulative Claims** - Tracks lifetime claims per pass
✅ **Admin Controls** - Pause/unpause, emergency withdraw
✅ **Fully Tested** - Comprehensive test suite included

## How It Works

### 1. Initialize Pool
```typescript
await program.methods
  .initializePool(777) // Total number of passes
  .rpc();
```

### 2. Deposit Revenue (Gamblor)
```typescript
await program.methods
  .depositRevenue(new BN(amount_in_lamports))
  .rpc();
```

### 3. Pass Holders Claim
```typescript
await program.methods
  .claimRevenue(passNumber) // 1-777
  .rpc();
```

## Revenue Distribution Formula

```
Per-Pass Share = Total Revenue Collected / 777
Claimable Amount = Per-Pass Share - Already Claimed
```

**Example:**
- Gamblor deposits 777 SOL in revenue
- Each pass can claim: 777 / 777 = 1 SOL
- Next month, Gamblor deposits 1554 SOL (total: 2331 SOL)
- Each pass can now claim: (2331 / 777) - 1 = 2 SOL more

## Installation & Setup

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli

# Install Node dependencies
npm install -g yarn
yarn install
```

### Build
```bash
anchor build
```

### Test
```bash
anchor test
```

### Deploy to Devnet
```bash
# Set to devnet
solana config set --url devnet

# Airdrop SOL for deployment
solana airdrop 2

# Deploy
anchor deploy
```

### Deploy to Mainnet
```bash
# Set to mainnet
solana config set --url mainnet-beta

# Deploy (requires SOL for deployment fees)
anchor deploy
```

## Contract Functions

### Initialize Pool
**Who:** Contract authority (admin)
**Purpose:** Set up the revenue pool with total number of passes
```rust
pub fn initialize_pool(ctx: Context<InitializePool>, total_passes: u16) -> Result<()>
```

### Deposit Revenue
**Who:** Gamblor revenue wallet
**Purpose:** Add monthly slot machine profits to the pool
```rust
pub fn deposit_revenue(ctx: Context<DepositRevenue>, amount: u64) -> Result<()>
```

### Claim Revenue
**Who:** Revenue Pass NFT holders
**Purpose:** Claim their share of accumulated revenue
```rust
pub fn claim_revenue(ctx: Context<ClaimRevenue>, pass_number: u16) -> Result<()>
```

### Set Pool Status
**Who:** Contract authority (admin)
**Purpose:** Pause/unpause claims (emergency use)
```rust
pub fn set_pool_status(ctx: Context<SetPoolStatus>, is_active: bool) -> Result<()>
```

### Emergency Withdraw
**Who:** Contract authority (admin)
**Purpose:** Withdraw funds in emergency situations
```rust
pub fn emergency_withdraw(ctx: Context<EmergencyWithdraw>, amount: u64) -> Result<()>
```

## State Accounts

### RevenuePool
```rust
pub struct RevenuePool {
    pub authority: Pubkey,              // Admin wallet
    pub total_passes: u16,              // 777
    pub total_revenue_collected: u64,   // Cumulative revenue
    pub total_revenue_distributed: u64, // Total claimed
    pub is_active: bool,                // Can claim?
}
```

### ClaimRecord
```rust
pub struct ClaimRecord {
    pub pass_number: u16,           // 1-777
    pub holder: Pubkey,             // Current holder wallet
    pub total_claimed: u64,         // Lifetime claims
    pub last_claim_timestamp: i64,  // Last claim time
}
```

## Integration Example

### Frontend Integration (React/Next.js)
```typescript
import * as anchor from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";

const ClaimRevenue = () => {
  const wallet = useWallet();
  const program = // ... initialize program
  
  const handleClaim = async (passNumber: number) => {
    const [revenuePoolPda] = await PublicKey.findProgramAddress(
      [Buffer.from("revenue_pool")],
      program.programId
    );
    
    const [claimRecordPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("claim"),
        Buffer.from(new Uint16Array([passNumber]).buffer)
      ],
      program.programId
    );
    
    const tx = await program.methods
      .claimRevenue(passNumber)
      .accounts({
        revenuePool: revenuePoolPda,
        claimRecord: claimRecordPda,
        passHolder: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    console.log("Claimed! TX:", tx);
  };
  
  return <button onClick={() => handleClaim(1)}>Claim Pass #1</button>;
};
```

## Security Considerations

✅ **PDA-based accounts** - No direct wallet transfers
✅ **Ownership verification** - Pass holder must sign
✅ **Overflow protection** - Using checked math
✅ **Pause mechanism** - Admin can halt operations
✅ **Per-pass tracking** - Individual claim records

## Testing Results

Run `anchor test` to see:
- ✓ Pool initialization
- ✓ Revenue deposits
- ✓ Single claims
- ✓ Double-claim prevention
- ✓ Multi-deposit claims
- ✓ Pause/unpause functionality
- ✓ Final statistics

## Next Steps

1. **Deploy to Devnet** - Test with fake SOL
2. **Frontend Integration** - Add claim button to revenue-pass.html
3. **Verify Passes** - Link to actual 777 pass NFTs
4. **Gamblor Integration** - Set up automated deposits
5. **Deploy to Mainnet** - Go live!

## Support

- Solana Docs: https://docs.solana.com
- Anchor Docs: https://www.anchor-lang.com/docs
- Solana Stack Exchange: https://solana.stackexchange.com

## License

MIT License - Use freely for Stoned Rabbits project
