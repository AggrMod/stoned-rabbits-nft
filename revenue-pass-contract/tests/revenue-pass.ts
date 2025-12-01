import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RevenuePass } from "../target/types/revenue_pass";
import { assert } from "chai";

describe("Revenue Pass Contract Tests", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.RevenuePass as Program<RevenuePass>;

  const TOTAL_PASSES = 777;

  let revenuePoolPda: anchor.web3.PublicKey;
  let revenuePoolBump: number;

  let authority = provider.wallet;
  let passHolder1: anchor.web3.Keypair;
  let passHolder2: anchor.web3.Keypair;
  let depositor: anchor.web3.Keypair;

  before(async () => {
    // Generate test wallets
    passHolder1 = anchor.web3.Keypair.generate();
    passHolder2 = anchor.web3.Keypair.generate();
    depositor = anchor.web3.Keypair.generate();

    // Airdrop SOL to test wallets
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        passHolder1.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        passHolder2.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        depositor.publicKey,
        10 * anchor.web3.LAMPORTS_PER_SOL
      )
    );

    // Find revenue pool PDA
    [revenuePoolPda, revenuePoolBump] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("revenue_pool")],
      program.programId
    );
  });

  it("Initializes the revenue pool", async () => {
    const tx = await program.methods
      .initializePool(TOTAL_PASSES)
      .accounts({
        revenuePool: revenuePoolPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize pool tx:", tx);

    const pool = await program.account.revenuePool.fetch(revenuePoolPda);

    assert.equal(pool.totalPasses, TOTAL_PASSES);
    assert.equal(pool.totalRevenueCollected.toNumber(), 0);
    assert.equal(pool.totalRevenueDistributed.toNumber(), 0);
    assert.equal(pool.isActive, true);
    assert.equal(pool.authority.toBase58(), authority.publicKey.toBase58());

    console.log("✓ Pool initialized with", TOTAL_PASSES, "passes");
  });

  it("Deposits revenue from Gamblor", async () => {
    const depositAmount = 7.77 * anchor.web3.LAMPORTS_PER_SOL; // 7.77 SOL

    const tx = await program.methods
      .depositRevenue(new anchor.BN(depositAmount))
      .accounts({
        revenuePool: revenuePoolPda,
        depositor: depositor.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([depositor])
      .rpc();

    console.log("Deposit revenue tx:", tx);

    const pool = await program.account.revenuePool.fetch(revenuePoolPda);

    assert.equal(pool.totalRevenueCollected.toNumber(), depositAmount);

    const perPassShare = depositAmount / TOTAL_PASSES;
    console.log("✓ Deposited 7.77 SOL");
    console.log("  Per-pass share:", (perPassShare / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
  });

  it("Pass holder #1 claims their revenue share", async () => {
    const passNumber = 1;

    const [claimRecordPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("claim"),
        Buffer.from(new Uint16Array([passNumber]).buffer)
      ],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(passHolder1.publicKey);

    const tx = await program.methods
      .claimRevenue(passNumber)
      .accounts({
        revenuePool: revenuePoolPda,
        claimRecord: claimRecordPda,
        passHolder: passHolder1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([passHolder1])
      .rpc();

    console.log("Claim revenue tx:", tx);

    const balanceAfter = await provider.connection.getBalance(passHolder1.publicKey);
    const received = balanceAfter - balanceBefore;

    const claimRecord = await program.account.claimRecord.fetch(claimRecordPda);

    assert.equal(claimRecord.passNumber, passNumber);
    assert.equal(claimRecord.holder.toBase58(), passHolder1.publicKey.toBase58());
    assert.isAbove(claimRecord.totalClaimed.toNumber(), 0);

    console.log("✓ Pass #1 claimed:", (received / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
  });

  it("Pass holder #2 claims their revenue share", async () => {
    const passNumber = 2;

    const [claimRecordPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("claim"),
        Buffer.from(new Uint16Array([passNumber]).buffer)
      ],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(passHolder2.publicKey);

    const tx = await program.methods
      .claimRevenue(passNumber)
      .accounts({
        revenuePool: revenuePoolPda,
        claimRecord: claimRecordPda,
        passHolder: passHolder2.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([passHolder2])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(passHolder2.publicKey);
    const received = balanceAfter - balanceBefore;

    console.log("✓ Pass #2 claimed:", (received / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
  });

  it("Prevents claiming when nothing is claimable", async () => {
    const passNumber = 1;

    const [claimRecordPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("claim"),
        Buffer.from(new Uint16Array([passNumber]).buffer)
      ],
      program.programId
    );

    try {
      await program.methods
        .claimRevenue(passNumber)
        .accounts({
          revenuePool: revenuePoolPda,
          claimRecord: claimRecordPda,
          passHolder: passHolder1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([passHolder1])
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.toString(), "NothingToClaim");
      console.log("✓ Correctly prevented double-claim");
    }
  });

  it("Deposits more revenue and allows re-claiming", async () => {
    const depositAmount = 3.33 * anchor.web3.LAMPORTS_PER_SOL; // 3.33 SOL

    await program.methods
      .depositRevenue(new anchor.BN(depositAmount))
      .accounts({
        revenuePool: revenuePoolPda,
        depositor: depositor.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([depositor])
      .rpc();

    console.log("✓ Deposited additional 3.33 SOL");

    // Now pass holder 1 can claim again
    const passNumber = 1;
    const [claimRecordPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("claim"),
        Buffer.from(new Uint16Array([passNumber]).buffer)
      ],
      program.programId
    );

    const balanceBefore = await provider.connection.getBalance(passHolder1.publicKey);

    await program.methods
      .claimRevenue(passNumber)
      .accounts({
        revenuePool: revenuePoolPda,
        claimRecord: claimRecordPda,
        passHolder: passHolder1.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([passHolder1])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(passHolder1.publicKey);
    const received = balanceAfter - balanceBefore;

    console.log("✓ Pass #1 claimed additional:", (received / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
  });

  it("Admin can pause the pool", async () => {
    await program.methods
      .setPoolStatus(false)
      .accounts({
        revenuePool: revenuePoolPda,
        authority: authority.publicKey,
      })
      .rpc();

    const pool = await program.account.revenuePool.fetch(revenuePoolPda);
    assert.equal(pool.isActive, false);

    console.log("✓ Pool paused");
  });

  it("Cannot claim when pool is paused", async () => {
    const passNumber = 3;
    const [claimRecordPda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("claim"),
        Buffer.from(new Uint16Array([passNumber]).buffer)
      ],
      program.programId
    );

    try {
      await program.methods
        .claimRevenue(passNumber)
        .accounts({
          revenuePool: revenuePoolPda,
          claimRecord: claimRecordPda,
          passHolder: passHolder1.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([passHolder1])
        .rpc();

      assert.fail("Should have thrown error");
    } catch (err) {
      assert.include(err.toString(), "PoolNotActive");
      console.log("✓ Correctly prevented claim while paused");
    }
  });

  it("Admin can unpause the pool", async () => {
    await program.methods
      .setPoolStatus(true)
      .accounts({
        revenuePool: revenuePoolPda,
        authority: authority.publicKey,
      })
      .rpc();

    const pool = await program.account.revenuePool.fetch(revenuePoolPda);
    assert.equal(pool.isActive, true);

    console.log("✓ Pool unpaused");
  });

  it("Shows total statistics", async () => {
    const pool = await program.account.revenuePool.fetch(revenuePoolPda);

    console.log("\n========== FINAL STATISTICS ==========");
    console.log("Total Passes:", pool.totalPasses);
    console.log("Total Revenue Collected:", (pool.totalRevenueCollected.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
    console.log("Total Revenue Distributed:", (pool.totalRevenueDistributed.toNumber() / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
    console.log("Remaining in Pool:", ((pool.totalRevenueCollected.toNumber() - pool.totalRevenueDistributed.toNumber()) / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
    console.log("Per Pass Share (current):", ((pool.totalRevenueCollected.toNumber() / pool.totalPasses) / anchor.web3.LAMPORTS_PER_SOL).toFixed(6), "SOL");
    console.log("======================================\n");
  });
});
