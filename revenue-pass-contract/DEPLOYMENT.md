# Revenue Pass Contract - Deployment Guide (TEST)

## ⚠️ THIS IS A TEST CONTRACT
This contract is for TESTING purposes only. Do not use in production without thorough auditing and security review.

## Prerequisites Installation

### 1. Install Rust
```bash
# Windows (PowerShell as Administrator)
Invoke-WebRequest -Uri "https://win.rustup.rs/x86_64" -OutFile "rustup-init.exe"
.\rustup-init.exe

# After installation, restart terminal and verify
rustc --version
cargo --version
```

### 2. Install Solana CLI
```bash
# Windows (PowerShell)
cmd /c "curl https://release.solana.com/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\solana-install-tmp\solana-install-init.exe --create-dirs"
C:\solana-install-tmp\solana-install-init.exe v1.18.4

# Add to PATH, then restart terminal and verify
solana --version
```

### 3. Install Anchor Framework
```bash
# Install avm (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force

# Install Anchor CLI
avm install latest
avm use latest

# Verify installation
anchor --version
```

## Setup Devnet Wallet

### 1. Create Test Wallet
```bash
# Generate new keypair for testing
solana-keygen new -o ~/test-wallet.json

# Set Solana to use devnet
solana config set --url https://api.devnet.solana.com

# Set default keypair
solana config set --keypair ~/test-wallet.json

# Check balance (should be 0)
solana balance
```

### 2. Request Devnet SOL (Airdrop)
```bash
# Request 2 SOL for testing (may need to run multiple times)
solana airdrop 2

# Check balance
solana balance
```

## Build and Deploy

### 1. Build the Program
```bash
cd "C:\Users\tjdot\Stonned rabbits\revenue-pass-contract"

# Build the smart contract
anchor build
```

### 2. Deploy to Devnet
```bash
# Deploy (requires devnet SOL for rent)
anchor deploy --provider.cluster devnet

# This will output your Program ID - save it!
```

### 3. Update Program ID in Code
After deploying, you'll get a Program ID like: `7X9...abc`

Update `Anchor.toml`:
```toml
[programs.devnet]
revenue_pass = "YOUR_PROGRAM_ID_HERE"
```

Update `lib.rs` (line 3):
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

### 4. Rebuild and Redeploy
```bash
# After updating Program ID
anchor build
anchor deploy --provider.cluster devnet
```

## Testing on Devnet

### 1. Run Tests Against Devnet
```bash
# Run all tests on devnet
anchor test --provider.cluster devnet --skip-local-validator
```

### 2. Manual Testing with Solana CLI

**Initialize Revenue Pool:**
```bash
# This would be done through a custom script or frontend
# The authority wallet must sign this transaction
```

**Check Pool Status:**
```bash
# View the revenue pool account
solana account YOUR_POOL_ADDRESS --url devnet
```

**Deposit Revenue (Gamblor → Pool):**
```bash
# Transfer SOL to the pool (simulating Gamblor revenue)
solana transfer POOL_ADDRESS 7.77 --url devnet
```

## Frontend Integration

Once deployed, update your Revenue Pass page to interact with the contract:

```javascript
// In revenue-pass.html
const REVENUE_PASS_PROGRAM_ID = "YOUR_PROGRAM_ID_HERE";
const DEVNET_RPC = "https://api.devnet.solana.com";

// Connect wallet and claim revenue
async function claimRevenue(passNumber) {
    // Use @solana/web3.js and @coral-xyz/anchor
    // to call the claim_revenue instruction
}
```

## Monitoring

### View Program Logs
```bash
# View recent transactions
solana transaction-history YOUR_PROGRAM_ID --url devnet

# View specific transaction
solana confirm -v TRANSACTION_SIGNATURE --url devnet
```

### View Pool Account
```bash
# Decode pool account data
anchor account revenue_pass.RevenuePool POOL_ADDRESS --provider.cluster devnet
```

## Cost Estimates (Devnet)

- **Initial Deployment:** ~2-5 SOL (rent + deployment)
- **Initialize Pool:** ~0.01 SOL (transaction fee + rent)
- **Deposit Revenue:** ~0.000005 SOL (transaction fee)
- **Claim Revenue:** ~0.000005 SOL per claim (transaction fee)

## Security Checklist (Before Mainnet)

- [ ] Professional audit by Solana security firm
- [ ] Comprehensive test coverage (>90%)
- [ ] Stress testing with 777 concurrent claims
- [ ] Time-lock mechanisms tested
- [ ] Emergency procedures documented
- [ ] Multi-sig authority wallet configured
- [ ] Bug bounty program established
- [ ] Legal compliance review

## Next Steps

1. ✅ Contract code written
2. ✅ Test suite created
3. ⏳ **Install Solana/Anchor tools**
4. ⏳ **Deploy to devnet**
5. ⏳ **Test claiming mechanism**
6. ⏳ **Frontend integration**
7. ⏳ **Security audit** (required before mainnet)

## Support

- Solana Docs: https://docs.solana.com
- Anchor Docs: https://www.anchor-lang.com
- Solana Discord: https://discord.gg/solana
- Anchor Discord: https://discord.gg/anchorlang

---

**REMINDER:** This is a TEST contract for learning and experimentation. Do NOT use in production without professional security audit!
