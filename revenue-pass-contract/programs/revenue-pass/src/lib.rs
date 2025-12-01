use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111"); // Will be replaced after deployment

#[program]
pub mod revenue_pass {
    use super::*;

    /// Initialize the revenue pool
    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        total_passes: u16,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.revenue_pool;
        pool.authority = ctx.accounts.authority.key();
        pool.total_passes = total_passes;
        pool.total_revenue_collected = 0;
        pool.total_revenue_distributed = 0;
        pool.is_active = true;

        msg!("Revenue pool initialized with {} passes", total_passes);
        Ok(())
    }

    /// Deposit revenue from Gamblor slot machine
    pub fn deposit_revenue(
        ctx: Context<DepositRevenue>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.revenue_pool;

        require!(pool.is_active, ErrorCode::PoolNotActive);

        // Transfer SOL to revenue pool
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.depositor.key(),
            &pool.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.depositor.to_account_info(),
                pool.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        pool.total_revenue_collected += amount;

        msg!("Deposited {} lamports to revenue pool", amount);
        msg!("Total revenue collected: {}", pool.total_revenue_collected);

        Ok(())
    }

    /// Claim revenue share for a pass holder
    pub fn claim_revenue(
        ctx: Context<ClaimRevenue>,
        pass_number: u16,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.revenue_pool;
        let claim_record = &mut ctx.accounts.claim_record;

        require!(pool.is_active, ErrorCode::PoolNotActive);
        require!(pass_number > 0 && pass_number <= pool.total_passes, ErrorCode::InvalidPassNumber);

        // Calculate claimable amount
        let total_claimable = pool.total_revenue_collected;
        let per_pass_share = total_claimable / pool.total_passes as u64;
        let already_claimed = claim_record.total_claimed;
        let claimable_now = per_pass_share.saturating_sub(already_claimed);

        require!(claimable_now > 0, ErrorCode::NothingToClaim);

        // Transfer SOL to pass holder
        **pool.to_account_info().try_borrow_mut_lamports()? -= claimable_now;
        **ctx.accounts.pass_holder.to_account_info().try_borrow_mut_lamports()? += claimable_now;

        // Update claim record
        claim_record.pass_number = pass_number;
        claim_record.holder = ctx.accounts.pass_holder.key();
        claim_record.total_claimed += claimable_now;
        claim_record.last_claim_timestamp = Clock::get()?.unix_timestamp;

        pool.total_revenue_distributed += claimable_now;

        msg!("Pass #{} claimed {} lamports", pass_number, claimable_now);
        msg!("Total distributed: {} / {}", pool.total_revenue_distributed, pool.total_revenue_collected);

        Ok(())
    }

    /// Admin: Pause/unpause the pool
    pub fn set_pool_status(
        ctx: Context<SetPoolStatus>,
        is_active: bool,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.revenue_pool;
        pool.is_active = is_active;

        msg!("Pool status set to: {}", is_active);
        Ok(())
    }

    /// Admin: Withdraw unclaimed revenue (emergency only)
    pub fn emergency_withdraw(
        ctx: Context<EmergencyWithdraw>,
        amount: u64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.revenue_pool;

        **pool.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.authority.to_account_info().try_borrow_mut_lamports()? += amount;

        msg!("Emergency withdrawal: {} lamports", amount);
        Ok(())
    }
}

// Account structures
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + RevenuePool::INIT_SPACE,
        seeds = [b"revenue_pool"],
        bump
    )]
    pub revenue_pool: Account<'info, RevenuePool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositRevenue<'info> {
    #[account(
        mut,
        seeds = [b"revenue_pool"],
        bump
    )]
    pub revenue_pool: Account<'info, RevenuePool>,

    #[account(mut)]
    pub depositor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(pass_number: u16)]
pub struct ClaimRevenue<'info> {
    #[account(
        mut,
        seeds = [b"revenue_pool"],
        bump
    )]
    pub revenue_pool: Account<'info, RevenuePool>,

    #[account(
        init_if_needed,
        payer = pass_holder,
        space = 8 + ClaimRecord::INIT_SPACE,
        seeds = [b"claim", pass_number.to_le_bytes().as_ref()],
        bump
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    #[account(mut)]
    pub pass_holder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPoolStatus<'info> {
    #[account(
        mut,
        seeds = [b"revenue_pool"],
        bump,
        has_one = authority
    )]
    pub revenue_pool: Account<'info, RevenuePool>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EmergencyWithdraw<'info> {
    #[account(
        mut,
        seeds = [b"revenue_pool"],
        bump,
        has_one = authority
    )]
    pub revenue_pool: Account<'info, RevenuePool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// State accounts
#[account]
#[derive(InitSpace)]
pub struct RevenuePool {
    pub authority: Pubkey,
    pub total_passes: u16,
    pub total_revenue_collected: u64,
    pub total_revenue_distributed: u64,
    pub is_active: bool,
}

#[account]
#[derive(InitSpace)]
pub struct ClaimRecord {
    pub pass_number: u16,
    pub holder: Pubkey,
    pub total_claimed: u64,
    pub last_claim_timestamp: i64,
}

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Revenue pool is not active")]
    PoolNotActive,
    #[msg("Invalid pass number")]
    InvalidPassNumber,
    #[msg("Nothing to claim")]
    NothingToClaim,
}
