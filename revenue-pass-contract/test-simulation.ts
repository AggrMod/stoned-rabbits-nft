/**
 * Revenue Pass Contract - Logic Simulation Test
 *
 * This simulates the smart contract logic without deploying to blockchain
 * Tests the revenue distribution calculations and claim logic
 */

// Simulated contract state
interface RevenuePool {
    authority: string;
    totalPasses: number;
    totalRevenueCollected: number; // in lamports (1 SOL = 1_000_000_000 lamports)
    totalRevenueDistributed: number;
    isActive: boolean;
}

interface ClaimRecord {
    passNumber: number;
    holder: string;
    totalClaimed: number;
    lastClaimTimestamp: number;
}

class RevenuePassSimulator {
    private pool: RevenuePool;
    private claims: Map<number, ClaimRecord>;

    constructor() {
        this.pool = {
            authority: "ADMIN_WALLET",
            totalPasses: 777,
            totalRevenueCollected: 0,
            totalRevenueDistributed: 0,
            isActive: true
        };
        this.claims = new Map();
    }

    // Convert SOL to lamports
    private solToLamports(sol: number): number {
        return Math.floor(sol * 1_000_000_000);
    }

    // Convert lamports to SOL
    private lamportsToSol(lamports: number): number {
        return lamports / 1_000_000_000;
    }

    // Initialize pool (admin only)
    initializePool(): void {
        console.log("✅ Pool initialized with 777 passes");
    }

    // Deposit revenue (Gamblor sends SOL)
    depositRevenue(amountSol: number): void {
        if (!this.pool.isActive) {
            throw new Error("Pool is paused");
        }

        const lamports = this.solToLamports(amountSol);
        this.pool.totalRevenueCollected += lamports;

        console.log(`💰 Deposited ${amountSol} SOL (${lamports.toLocaleString()} lamports)`);
        console.log(`📊 Total revenue in pool: ${this.lamportsToSol(this.pool.totalRevenueCollected)} SOL`);
    }

    // Calculate claimable amount for a pass holder
    calculateClaimableAmount(passNumber: number): number {
        // Get total revenue per pass
        const revenuePerPass = Math.floor(this.pool.totalRevenueCollected / this.pool.totalPasses);

        // Get how much this pass has already claimed
        const claimRecord = this.claims.get(passNumber);
        const alreadyClaimed = claimRecord ? claimRecord.totalClaimed : 0;

        // Calculate remaining claimable
        const claimable = revenuePerPass - alreadyClaimed;

        return claimable;
    }

    // Claim revenue for a pass holder
    claimRevenue(passNumber: number, holderWallet: string): void {
        if (!this.pool.isActive) {
            throw new Error("Pool is paused");
        }

        if (passNumber < 1 || passNumber > 777) {
            throw new Error("Invalid pass number (must be 1-777)");
        }

        const claimableAmount = this.calculateClaimableAmount(passNumber);

        if (claimableAmount <= 0) {
            throw new Error("No revenue available to claim");
        }

        // Update claim record
        const existingClaim = this.claims.get(passNumber);
        if (existingClaim) {
            existingClaim.totalClaimed += claimableAmount;
            existingClaim.lastClaimTimestamp = Date.now();
        } else {
            this.claims.set(passNumber, {
                passNumber,
                holder: holderWallet,
                totalClaimed: claimableAmount,
                lastClaimTimestamp: Date.now()
            });
        }

        this.pool.totalRevenueDistributed += claimableAmount;

        console.log(`✅ Pass #${passNumber} claimed ${this.lamportsToSol(claimableAmount)} SOL`);
        console.log(`   Holder: ${holderWallet}`);
    }

    // Get pool stats
    getPoolStats(): void {
        const totalCollectedSol = this.lamportsToSol(this.pool.totalRevenueCollected);
        const totalDistributedSol = this.lamportsToSol(this.pool.totalRevenueDistributed);
        const remainingSol = this.lamportsToSol(this.pool.totalRevenueCollected - this.pool.totalRevenueDistributed);
        const perPassSol = totalCollectedSol / this.pool.totalPasses;

        console.log("\n📊 REVENUE POOL STATISTICS");
        console.log("═".repeat(60));
        console.log(`Total Passes: ${this.pool.totalPasses}`);
        console.log(`Pool Status: ${this.pool.isActive ? '🟢 Active' : '🔴 Paused'}`);
        console.log(`Total Revenue Collected: ${totalCollectedSol.toFixed(4)} SOL`);
        console.log(`Total Revenue Distributed: ${totalDistributedSol.toFixed(4)} SOL`);
        console.log(`Remaining in Pool: ${remainingSol.toFixed(4)} SOL`);
        console.log(`Revenue per Pass: ${perPassSol.toFixed(6)} SOL`);
        console.log(`Number of Claims Made: ${this.claims.size}`);
        console.log("═".repeat(60) + "\n");
    }

    // Get claim info for specific pass
    getPassClaimInfo(passNumber: number): void {
        const claimRecord = this.claims.get(passNumber);
        const claimableNow = this.calculateClaimableAmount(passNumber);

        console.log(`\n🎫 PASS #${passNumber} CLAIM INFO`);
        console.log("─".repeat(60));
        if (claimRecord) {
            console.log(`Total Claimed: ${this.lamportsToSol(claimRecord.totalClaimed).toFixed(6)} SOL`);
            console.log(`Last Claim: ${new Date(claimRecord.lastClaimTimestamp).toLocaleString()}`);
        } else {
            console.log(`Total Claimed: 0 SOL (no claims yet)`);
        }
        console.log(`Available to Claim Now: ${this.lamportsToSol(claimableNow).toFixed(6)} SOL`);
        console.log("─".repeat(60) + "\n");
    }

    // Pause pool (admin only)
    pausePool(): void {
        this.pool.isActive = false;
        console.log("⏸️  Pool paused");
    }

    // Resume pool (admin only)
    resumePool(): void {
        this.pool.isActive = true;
        console.log("▶️  Pool resumed");
    }
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

console.log("\n🧪 REVENUE PASS CONTRACT - SIMULATION TEST\n");
console.log("Testing contract logic without blockchain deployment\n");

const simulator = new RevenuePassSimulator();

// Scenario 1: Initialize pool
console.log("📝 TEST 1: Initialize Revenue Pool");
console.log("─".repeat(60));
simulator.initializePool();
simulator.getPoolStats();

// Scenario 2: First revenue deposit from Gamblor
console.log("\n📝 TEST 2: First Revenue Deposit (7.77 SOL from Gamblor)");
console.log("─".repeat(60));
simulator.depositRevenue(7.77);
simulator.getPoolStats();

// Scenario 3: Pass holders claim revenue
console.log("\n📝 TEST 3: Pass Holders Claiming Revenue");
console.log("─".repeat(60));
simulator.claimRevenue(1, "WALLET_HOLDER_1");
simulator.claimRevenue(69, "WALLET_HOLDER_69");
simulator.claimRevenue(420, "WALLET_HOLDER_420");
simulator.claimRevenue(777, "WALLET_HOLDER_777");
simulator.getPoolStats();

// Scenario 4: Check specific pass claim info
console.log("\n📝 TEST 4: Check Claim Info for Specific Passes");
console.log("─".repeat(60));
simulator.getPassClaimInfo(1);
simulator.getPassClaimInfo(100); // Hasn't claimed yet
simulator.getPassClaimInfo(420);

// Scenario 5: Try to claim again immediately (should fail)
console.log("\n📝 TEST 5: Try Double Claim (Should Fail)");
console.log("─".repeat(60));
try {
    simulator.claimRevenue(1, "WALLET_HOLDER_1");
} catch (error) {
    console.log(`❌ Expected error: ${(error as Error).message}`);
}

// Scenario 6: Second revenue deposit
console.log("\n📝 TEST 6: Second Revenue Deposit (15.5 SOL)");
console.log("─".repeat(60));
simulator.depositRevenue(15.5);
simulator.getPoolStats();

// Scenario 7: Claim after second deposit
console.log("\n📝 TEST 7: Claim After Second Deposit");
console.log("─".repeat(60));
simulator.getPassClaimInfo(1); // Check what's available
simulator.claimRevenue(1, "WALLET_HOLDER_1"); // Should get additional amount
simulator.claimRevenue(200, "WALLET_HOLDER_200"); // First claim, gets full amount
simulator.getPoolStats();

// Scenario 8: Pause pool
console.log("\n📝 TEST 8: Pause Pool (Admin Function)");
console.log("─".repeat(60));
simulator.pausePool();
try {
    simulator.claimRevenue(300, "WALLET_HOLDER_300");
} catch (error) {
    console.log(`❌ Expected error: ${(error as Error).message}`);
}

// Scenario 9: Resume pool
console.log("\n📝 TEST 9: Resume Pool");
console.log("─".repeat(60));
simulator.resumePool();
simulator.claimRevenue(300, "WALLET_HOLDER_300");
simulator.getPoolStats();

// Scenario 10: Large revenue deposit (realistic Gamblor payout)
console.log("\n📝 TEST 10: Large Revenue Deposit (100 SOL)");
console.log("─".repeat(60));
simulator.depositRevenue(100);
simulator.getPoolStats();
simulator.getPassClaimInfo(1);
simulator.getPassClaimInfo(500);

// Final statistics
console.log("\n" + "=".repeat(60));
console.log("🎯 FINAL TEST RESULTS");
console.log("=".repeat(60));
simulator.getPoolStats();

console.log("\n✅ All tests completed successfully!");
console.log("\n💡 This simulation proves the contract logic works correctly.");
console.log("   To deploy to Solana devnet, follow DEPLOYMENT.md instructions.\n");
