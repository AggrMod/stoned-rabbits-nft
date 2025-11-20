# Smart Contracts Specification

**Document Version:** 1.0.0
**Last Updated:** November 2025
**Status:** Planning Phase (Q1 2026)

---

## Table of Contents

1. [Overview](#overview)
2. [Revenue Distribution Contract](#revenue-distribution-contract)
3. [Lottery System Contract](#lottery-system-contract)
4. [Staking Contract](#staking-contract)
5. [Development Roadmap](#development-roadmap)
6. [Security Considerations](#security-considerations)
7. [Testing Strategy](#testing-strategy)

---

## Overview

The Stoned Rabbits ecosystem will deploy three main smart contracts on Solana:

| Contract | Purpose | Timeline | Priority |
|----------|---------|----------|----------|
| Revenue Distribution | Automate monthly payments to 777 pass holders | Q1 2026 | High |
| Lottery System | Handle ticket minting and prize distribution | Q1 2026 | High |
| Staking Platform | Allow NFT staking for rewards | Q2 2026 | Medium |

**Development Framework:** Anchor (Solana's smart contract framework)
**Language:** Rust
**Audit:** Required before mainnet deployment

---

## Revenue Distribution Contract

### Purpose

Automate monthly revenue sharing from slot machines to 777 Revenue Pass holders.

### Contract Architecture

```rust
// Program ID: [To be generated]

pub mod revenue_distribution {
    use anchor_lang::prelude::*;

    #[program]
    pub mod revenue_distribution {
        use super::*;

        // Initialize the program
        pub fn initialize(
            ctx: Context<Initialize>,
            collection_address: Pubkey,
            total_passes: u16,
        ) -> Result<()> { ... }

        // Deposit revenue from slot machines
        pub fn deposit_revenue(
            ctx: Context<DepositRevenue>,
            amount: u64,
            source: String, // "Stoned Rabbits Classic" slot name
        ) -> Result<()> { ... }

        // Claim distribution (per pass holder)
        pub fn claim_distribution(
            ctx: Context<ClaimDistribution>,
            pass_mint: Pubkey,
        ) -> Result<()> { ... }

        // Admin: Trigger monthly distribution
        pub fn trigger_distribution(
            ctx: Context<TriggerDistribution>,
            month: String, // "2026-02"
        ) -> Result<()> { ... }
    }
}
```

### Account Structures

```rust
#[account]
pub struct RevenuePool {
    pub authority: Pubkey,           // Program authority
    pub collection: Pubkey,          // Revenue Pass collection ID
    pub total_passes: u16,           // 777
    pub accumulated_revenue: u64,    // Total SOL deposited
    pub last_distribution_date: i64, // Unix timestamp
    pub total_distributions: u64,    // Total amount distributed
    pub bump: u8,                    // PDA bump
}

#[account]
pub struct Distribution {
    pub month: String,               // "2026-02"
    pub total_amount: u64,           // Total SOL for this month
    pub per_pass_amount: u64,        // SOL per pass
    pub claimed_count: u16,          // Number of passes claimed
    pub timestamp: i64,              // Distribution date
    pub sources: Vec<RevenueSource>, // Breakdown by slot machine
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RevenueSource {
    pub name: String,                // Slot machine name
    pub amount: u64,                 // Revenue from this source
}

#[account]
pub struct ClaimRecord {
    pub pass_mint: Pubkey,           // Revenue Pass NFT mint
    pub owner: Pubkey,               // Current owner
    pub distribution_month: String,  // "2026-02"
    pub amount: u64,                 // Amount claimed
    pub claimed_at: i64,             // Claim timestamp
}
```

### Key Functions

**1. Initialize:**
```rust
pub fn initialize(
    ctx: Context<Initialize>,
    collection_address: Pubkey,
    total_passes: u16,
) -> Result<()> {
    let pool = &mut ctx.accounts.revenue_pool;

    pool.authority = ctx.accounts.authority.key();
    pool.collection = collection_address;
    pool.total_passes = total_passes;
    pool.accumulated_revenue = 0;
    pool.last_distribution_date = Clock::get()?.unix_timestamp;
    pool.total_distributions = 0;
    pool.bump = *ctx.bumps.get("revenue_pool").unwrap();

    Ok(())
}
```

**2. Deposit Revenue:**
```rust
pub fn deposit_revenue(
    ctx: Context<DepositRevenue>,
    amount: u64,
    source: String,
) -> Result<()> {
    // Transfer SOL from depositor to pool PDA
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.depositor.to_account_info(),
                to: ctx.accounts.revenue_pool.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update pool state
    let pool = &mut ctx.accounts.revenue_pool;
    pool.accumulated_revenue += amount;

    emit!(RevenueDeposited {
        source,
        amount,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

**3. Claim Distribution:**
```rust
pub fn claim_distribution(
    ctx: Context<ClaimDistribution>,
    pass_mint: Pubkey,
) -> Result<()> {
    let distribution = &ctx.accounts.distribution;
    let pool = &ctx.accounts.revenue_pool;

    // Verify user owns the Revenue Pass NFT
    require!(
        verify_nft_ownership(&ctx, &pass_mint, &pool.collection)?,
        ErrorCode::NotPassHolder
    );

    // Check if already claimed
    require!(
        !has_claimed(&ctx, &pass_mint, &distribution.month)?,
        ErrorCode::AlreadyClaimed
    );

    // Transfer SOL from pool to pass holder
    **pool.to_account_info().try_borrow_mut_lamports()? -= distribution.per_pass_amount;
    **ctx.accounts.pass_holder.try_borrow_mut_lamports()? += distribution.per_pass_amount;

    // Record claim
    let claim = &mut ctx.accounts.claim_record;
    claim.pass_mint = pass_mint;
    claim.owner = ctx.accounts.pass_holder.key();
    claim.distribution_month = distribution.month.clone();
    claim.amount = distribution.per_pass_amount;
    claim.claimed_at = Clock::get()?.unix_timestamp;

    emit!(DistributionClaimed {
        pass_mint,
        owner: ctx.accounts.pass_holder.key(),
        amount: distribution.per_pass_amount,
        month: distribution.month.clone(),
    });

    Ok(())
}
```

### Security Features

- **Access Control:** Only authorized wallets can deposit revenue
- **Reentrancy Protection:** Use `invoke` guards
- **Claim Verification:** Prevent double-claiming
- **NFT Ownership Validation:** Verify current owner via Metaplex
- **Time Locks:** Distributions can only occur monthly
- **Emergency Pause:** Admin can pause in case of exploit

---

## Lottery System Contract

### Purpose

Handle lottery ticket minting, NFT burning for tickets, and prize distribution.

### Contract Architecture

```rust
#[program]
pub mod lottery_system {
    use super::*;

    pub fn initialize_lottery(
        ctx: Context<InitializeLottery>,
        prize_pool: u64,
        end_date: i64,
    ) -> Result<()> { ... }

    pub fn purchase_tickets(
        ctx: Context<PurchaseTickets>,
        quantity: u16,
        payment_method: PaymentMethod,
    ) -> Result<()> { ... }

    pub fn burn_nft_for_tickets(
        ctx: Context<BurnNFTForTickets>,
        nft_mint: Pubkey,
    ) -> Result<()> { ... }

    pub fn draw_winner(
        ctx: Context<DrawWinner>,
        lottery_id: String,
    ) -> Result<()> { ... }

    pub fn claim_prize(
        ctx: Context<ClaimPrize>,
        lottery_id: String,
    ) -> Result<()> { ... }
}
```

### Account Structures

```rust
#[account]
pub struct Lottery {
    pub lottery_id: String,          // "lottery_001"
    pub prize_pool: u64,             // Total prize in lamports
    pub ticket_price_sol: u64,       // Price per ticket
    pub start_date: i64,             // Start timestamp
    pub end_date: i64,               // End timestamp
    pub total_tickets_sold: u32,     // Total tickets issued
    pub winner: Option<Pubkey>,      // Winner's wallet (after draw)
    pub status: LotteryStatus,       // Active, Ended, Claimed
    pub randomness_account: Pubkey,  // Switchboard VRF account
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum LotteryStatus {
    Active,
    Drawing,
    Ended,
    Claimed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PaymentMethod {
    SOL,
    USDC,
}

#[account]
pub struct TicketAccount {
    pub owner: Pubkey,               // Ticket owner
    pub lottery_id: String,          // Associated lottery
    pub ticket_numbers: Vec<u32>,    // [1234, 1235, 1236]
    pub purchase_method: String,     // "purchase" or "burn"
    pub purchase_timestamp: i64,     // When acquired
}
```

### Randomness (Switchboard VRF)

For provably fair winner selection:

```rust
use switchboard_v2::VrfAccountData;

pub fn request_randomness(ctx: Context<RequestRandomness>) -> Result<()> {
    // Request random number from Switchboard oracle
    let vrf = VrfAccountData::new(&ctx.accounts.vrf_account)?;

    vrf.request_randomness(
        CpiContext::new(
            ctx.accounts.switchboard_program.to_account_info(),
            switchboard_v2::RequestRandomness {
                vrf: ctx.accounts.vrf_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
            },
        ),
    )?;

    Ok(())
}

pub fn consume_randomness(ctx: Context<ConsumeRandomness>) -> Result<()> {
    let vrf = VrfAccountData::new(&ctx.accounts.vrf_account)?;
    let result = vrf.get_result()?;

    // Use randomness to select winner
    let lottery = &mut ctx.accounts.lottery;
    let winning_ticket = (result.value[0] as u32) % lottery.total_tickets_sold;

    // Find owner of winning ticket
    lottery.winner = Some(find_ticket_owner(winning_ticket)?);
    lottery.status = LotteryStatus::Ended;

    Ok(())
}
```

---

## Staking Contract

### Purpose

Allow Stoned Rabbits NFT holders to stake their NFTs for rewards.

### Contract Architecture

```rust
#[program]
pub mod staking {
    use super::*;

    pub fn initialize_staking_pool(
        ctx: Context<InitializePool>,
        reward_rate: u64, // Rewards per day per NFT
    ) -> Result<()> { ... }

    pub fn stake_nft(
        ctx: Context<StakeNFT>,
        nft_mint: Pubkey,
    ) -> Result<()> { ... }

    pub fn unstake_nft(
        ctx: Context<UnstakeNFT>,
        nft_mint: Pubkey,
    ) -> Result<()> { ... }

    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
    ) -> Result<()> { ... }
}
```

### Account Structures

```rust
#[account]
pub struct StakingPool {
    pub authority: Pubkey,           // Pool authority
    pub collection: Pubkey,          // Stoned Rabbits collection
    pub reward_rate: u64,            // Lamports per day per NFT
    pub total_staked: u32,           // Total NFTs currently staked
    pub total_rewards_distributed: u64,
    pub bump: u8,
}

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,               // NFT owner
    pub nft_mint: Pubkey,            // Staked NFT mint
    pub staked_at: i64,              // Stake timestamp
    pub last_claim: i64,             // Last reward claim
    pub total_rewards_earned: u64,   // Lifetime earnings
}
```

### Reward Calculation

```rust
pub fn calculate_rewards(stake_account: &StakeAccount, pool: &StakingPool) -> Result<u64> {
    let current_time = Clock::get()?.unix_timestamp;
    let time_staked = current_time - stake_account.last_claim;
    let days_staked = time_staked / 86400; // Seconds in a day

    let rewards = (days_staked as u64) * pool.reward_rate;

    Ok(rewards)
}
```

---

## Development Roadmap

### Phase 1: Development (Q1 2026)

**Week 1-2: Setup & Architecture**
- [ ] Set up Anchor project
- [ ] Define all account structures
- [ ] Design instruction interfaces
- [ ] Create development environment

**Week 3-4: Revenue Distribution**
- [ ] Implement initialize function
- [ ] Implement deposit_revenue
- [ ] Implement claim_distribution
- [ ] Add NFT ownership verification

**Week 5-6: Lottery System**
- [ ] Implement ticket purchase
- [ ] Implement NFT burning mechanics
- [ ] Integrate Switchboard VRF
- [ ] Implement winner selection

**Week 7-8: Staking**
- [ ] Implement stake/unstake functions
- [ ] Implement reward calculation
- [ ] Add time-lock features

### Phase 2: Testing (Q1 2026)

**Week 9-10: Unit Tests**
- [ ] Test all instructions
- [ ] Test error cases
- [ ] Test edge cases
- [ ] Achieve 100% code coverage

**Week 11: Integration Tests**
- [ ] Test end-to-end flows
- [ ] Test with real NFTs on devnet
- [ ] Stress test with multiple users

**Week 12: Devnet Deployment**
- [ ] Deploy to Solana devnet
- [ ] Public beta testing
- [ ] Bug fixes and improvements

### Phase 3: Audit & Launch (Q2 2026)

**Week 13-16: Security Audit**
- [ ] Third-party audit (OtterSec or Neodyme)
- [ ] Fix identified vulnerabilities
- [ ] Re-audit if needed

**Week 17: Mainnet Deployment**
- [ ] Deploy to mainnet
- [ ] Verify deployment
- [ ] Initialize contracts
- [ ] Announcement & documentation

---

## Security Considerations

### Best Practices

1. **Access Control**
   ```rust
   #[access_control(is_admin(&ctx.accounts.authority))]
   pub fn admin_function(ctx: Context<AdminFunction>) -> Result<()> { ... }
   ```

2. **Input Validation**
   ```rust
   require!(amount > 0 && amount <= MAX_DEPOSIT, ErrorCode::InvalidAmount);
   ```

3. **Reentrancy Protection**
   ```rust
   // Update state BEFORE external calls
   pool.balance -= amount;
   transfer_sol(amount)?;
   ```

4. **Overflow Protection**
   ```rust
   use checked_add, checked_sub, checked_mul
   ```

5. **PDA Security**
   ```rust
   #[account(
       seeds = [b"revenue_pool", collection.key().as_ref()],
       bump = pool.bump,
   )]
   pub revenue_pool: Account<'info, RevenuePool>,
   ```

### Common Vulnerabilities

| Vulnerability | Mitigation |
|---------------|------------|
| Reentrancy | Update state before external calls |
| Integer Overflow | Use checked arithmetic |
| Missing Signer Check | Use `#[account(signer)]` |
| Account Injection | Validate all account relationships |
| Frontrunning | Use commit-reveal schemes |

### Audit Checklist

- [ ] All accounts properly validated
- [ ] Signer checks on all privileged functions
- [ ] No arithmetic overflows
- [ ] Reentrancy protection
- [ ] Access control implemented
- [ ] Error handling comprehensive
- [ ] Events emitted for all state changes
- [ ] PDA derivation secure
- [ ] No hardcoded addresses
- [ ] Upgradeable if needed

---

## Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::prelude::*;

    #[test]
    fn test_initialize_revenue_pool() {
        // Setup
        let collection = Pubkey::new_unique();
        let total_passes = 777;

        // Execute
        let result = initialize(
            mock_context(),
            collection,
            total_passes,
        );

        // Assert
        assert!(result.is_ok());
        assert_eq!(pool.total_passes, 777);
        assert_eq!(pool.accumulated_revenue, 0);
    }

    #[test]
    fn test_claim_distribution() {
        // Test happy path
        // Test double claim (should fail)
        // Test non-holder claim (should fail)
    }
}
```

### Integration Tests

```typescript
// tests/revenue-distribution.ts
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { assert } from "chai";

describe("revenue-distribution", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RevenueDistribution;

  it("Initializes revenue pool", async () => {
    const tx = await program.methods
      .initialize(collectionAddress, 777)
      .accounts({
        revenuePool: poolPDA,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pool = await program.account.revenuePool.fetch(poolPDA);
    assert.equal(pool.totalPasses, 777);
  });

  it("Deposits revenue", async () => {
    const amount = new anchor.BN(1_000_000_000); // 1 SOL

    await program.methods
      .depositRevenue(amount, "Stoned Rabbits Classic")
      .accounts({ ... })
      .rpc();

    const pool = await program.account.revenuePool.fetch(poolPDA);
    assert.equal(pool.accumulatedRevenue.toNumber(), amount.toNumber());
  });
});
```

---

## Next Steps

1. **Hire Rust Developer** - Experienced with Anchor framework
2. **Set Up Development Environment** - Local validator, Anchor CLI
3. **Begin Development** - Start with Revenue Distribution contract
4. **Schedule Audit** - Book slot with reputable auditor
5. **Plan Launch** - Coordinate with slot machine launch

**Related Documentation:**
- [01-architecture.md](./01-architecture.md) - System architecture
- [07-security.md](./07-security.md) - Security best practices
- [08-operations.md](./08-operations.md) - Operations manual

---

**Last Updated:** November 2025
**Maintainer:** Stoned Rabbits Development Team
**Status:** 📅 Planned for Q1 2026
