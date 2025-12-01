# Revenue Pass Contract - Complete Installation Guide

## Current Installation Status

✅ **Rust & Cargo**: Installed (v1.91.1)  
⏳ **Solana CLI**: Installing via cargo...  
⏳ **Anchor Framework**: Pending  
⏳ **Test Validator**: Pending  

---

## Method 1: Automatic Installation (Recommended)

Run this PowerShell script as Administrator:

```powershell
# Install Solana CLI (if cargo install is slow)
cd C:\Users\tjdot
Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "solana-install.exe"
.\solana-install.exe v1.18.26

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify
solana --version

# Install Anchor (requires Node.js and Yarn)
npm install -g @coral-xyz/anchor-cli

# Verify
anchor --version
```

---

## Method 2: Manual Step-by-Step

### Step 1: Install Solana CLI

**Option A - Direct Download (Fastest):**
1. Download: https://github.com/solana-labs/solana/releases/download/v1.18.26/solana-install-init-x86_64-pc-windows-msvc.exe
2. Run the installer
3. Restart your terminal
4. Verify: `solana --version`

**Option B - Via Cargo (Current method - slow but reliable):**
```bash
cargo install solana-cli --version 1.18.26
```
This takes 10-20 minutes on first install.

### Step 2: Configure Solana

```bash
# Create a test wallet
solana-keygen new --outfile ~/.config/solana/test-wallet.json

# Set to localnet
solana config set --url localhost

# Set keypair
solana config set --keypair ~/.config/solana/test-wallet.json

# Verify configuration
solana config get
```

### Step 3: Install Anchor Framework

**Prerequisites:**
- Node.js (already installed ✅)
- Yarn: `npm install -g yarn`

**Install Anchor:**
```bash
# Install via NPM
npm install -g @coral-xyz/anchor-cli

# OR install via Cargo (more reliable)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Verify
anchor --version
```

### Step 4: Test the Installation

```bash
cd "C:\Users\tjdot\Stonned rabbits\revenue-pass-contract"

# Build the contract
anchor build

# Start local validator (in new terminal)
solana-test-validator

# Run tests (in original terminal)
anchor test --skip-local-validator
```

---

## Quick Test Without Full Install

If installation is taking too long, you can test the contract logic right now:

```bash
cd "C:\Users\tjdot\Stonned rabbits\revenue-pass-contract"

# Run the simulation tests (no blockchain needed)
npx tsx test-simulation.ts

# Run the blockchain simulator
npx tsx local-blockchain.ts
```

---

## Troubleshooting

### Cargo install is slow
- It's compiling from source (544 packages!)
- Expected time: 10-20 minutes
- Alternative: Download pre-built binary (Method 1 above)

### PATH not updated
```powershell
# PowerShell - Add to PATH permanently
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";C:\Users\tjdot\.cargo\bin;C:\Users\tjdot\.local\share\solana\install\active_release\bin",
    "User"
)
```

### solana-test-validator fails to start
```bash
# Kill any existing validators
taskkill /F /IM solana-test-validator.exe

# Clear ledger data
rm -rf test-ledger

# Start fresh
solana-test-validator --reset
```

### Anchor build fails
```bash
# Update Rust
rustup update

# Clean build
anchor clean
anchor build
```

---

## What Each Tool Does

### Solana CLI
- `solana-test-validator`: Runs a local blockchain
- `solana-keygen`: Creates wallets
- `solana airdrop`: Get test SOL
- `solana balance`: Check wallet balance

### Anchor Framework
- `anchor build`: Compiles Rust smart contract
- `anchor deploy`: Deploys to blockchain
- `anchor test`: Runs test suite
- `anchor localnet`: Starts validator + deploys

### Our Contract
- **Program**: Revenue distribution logic (Rust)
- **Tests**: Transaction simulations (TypeScript)
- **Pool**: Manages 777 Revenue Pass NFTs

---

## Next Steps After Installation

1. **Start the validator:**
   ```bash
   solana-test-validator
   ```

2. **Build & deploy contract:**
   ```bash
   anchor build
   anchor deploy
   ```

3. **Run tests:**
   ```bash
   anchor test --skip-local-validator
   ```

4. **Check pool state:**
   ```bash
   solana account <POOL_ADDRESS>
   ```

5. **Simulate Gamblor deposit:**
   ```bash
   solana transfer <POOL_ADDRESS> 7.77
   ```

---

## Estimated Installation Times

| Tool | Via Cargo | Pre-built Binary |
|------|-----------|------------------|
| Rust | 2 min | 1 min |
| Solana CLI | 15 min | 2 min |
| Anchor | 10 min | 3 min |
| **Total** | **~27 min** | **~6 min** |

---

## Current Installation Progress

Solana CLI is currently installing via cargo. You can:

1. **Wait** (recommended) - Let it finish, then continue
2. **Download binary** - Cancel cargo and use direct download
3. **Test simulation** - Run `npx tsx test-simulation.ts` while waiting

---

Last updated: December 1, 2025
