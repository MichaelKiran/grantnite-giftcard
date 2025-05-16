import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { GiftProtocol } from "../target/types/gift_protocol";
import {
  PublicKey, 
  Keypair, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  Connection
} from "@solana/web3.js";
import { assert } from "chai";

describe("gift-protocol", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.GiftProtocol as Program<GiftProtocol>;
  const provider = anchor.getProvider();
  
  // Test accounts
  const authority = anchor.web3.Keypair.generate();
  const creator = anchor.web3.Keypair.generate();
  const recipient = anchor.web3.Keypair.generate();
  const referrer = anchor.web3.Keypair.generate();
  
  // PDAs
  let configPDA: PublicKey;
  let treasuryPDA: PublicKey;
  let giftCardPDA: PublicKey;
  let referralPDA: PublicKey;
  
  // Constants for tests
  const defaultCommissionRate = 300; // 3%
  const defaultReferralRate = 100;  // 1%
  const giftCardAmount = LAMPORTS_PER_SOL; // 1 SOL
  
  before(async () => {
    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(authority.publicKey, 100 * LAMPORTS_PER_SOL)
    );
    
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 10 * LAMPORTS_PER_SOL)
    );
    
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(referrer.publicKey, 10 * LAMPORTS_PER_SOL)
    );
    
    // Derive PDAs
    [configPDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("config")],
      program.programId
    );
    
    [treasuryPDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("treasury")],
      program.programId
    );
    
    [giftCardPDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("gift_card"), creator.publicKey.toBuffer(), PublicKey.default.toBuffer()],
      program.programId
    );
    
    [referralPDA] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("referral"), referrer.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Initializes the protocol", async () => {
    await program.methods
      .initialize(defaultCommissionRate, defaultReferralRate)
      .accounts({
        authority: authority.publicKey,
        config: configPDA,
        treasury: treasuryPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();
      
    // Fetch the config account to verify initialization
    const config = await program.account.config.fetch(configPDA);
    assert.strictEqual(config.authority.toString(), authority.publicKey.toString());
    assert.strictEqual(config.commissionRate.toNumber(), defaultCommissionRate);
    assert.strictEqual(config.referralRate.toNumber(), defaultReferralRate);
    assert.strictEqual(config.treasury.toString(), treasuryPDA.toString());
    
    console.log("Protocol initialized successfully");
  });
  
  it("Creates a referral code", async () => {
    await program.methods
      .createReferral()
      .accounts({
        owner: referrer.publicKey,
        referral: referralPDA,
        systemProgram: SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([referrer])
      .rpc();
      
    // Fetch the referral account to verify creation
    const referral = await program.account.referral.fetch(referralPDA);
    assert.strictEqual(referral.owner.toString(), referrer.publicKey.toString());
    assert.strictEqual(referral.totalEarned.toNumber(), 0);
    assert.strictEqual(referral.referralCount.toNumber(), 0);
    
    console.log("Referral created successfully");
  });
  
  it("Creates a gift card with referral", async () => {
    // Current Unix timestamp + 30 days
    const expiryTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    const message = "Happy birthday!";
    
    await program.methods
      .createGiftCard(
        new anchor.BN(giftCardAmount),
        recipient.publicKey,
        new anchor.BN(expiryTime),
        message,
        referrer.publicKey
      )
      .accounts({
        creator: creator.publicKey,
        giftCard: giftCardPDA,
        config: configPDA,
        treasury: treasuryPDA,
        referral: referralPDA,
        systemProgram: SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([creator])
      .rpc();
      
    // Fetch the gift card account to verify creation
    const giftCard = await program.account.giftCard.fetch(giftCardPDA);
    assert.strictEqual(giftCard.creator.toString(), creator.publicKey.toString());
    assert.strictEqual(giftCard.recipient.toString(), recipient.publicKey.toString());
    assert.strictEqual(giftCard.isRedeemed, false);
    assert.strictEqual(giftCard.message, message);
    
    // Calculate expected amounts
    const expectedCommission = giftCardAmount * defaultCommissionRate / 10000;
    const expectedReferralAmount = giftCardAmount * defaultReferralRate / 10000;
    const expectedTreasuryAmount = expectedCommission - expectedReferralAmount;
    const expectedGiftCardAmount = giftCardAmount - expectedCommission;
    
    // Verify the gift card has the correct amount
    assert.approximately(
      giftCard.amount.toNumber(), 
      expectedGiftCardAmount,
      1000000, // Allow for small rounding differences
      "Gift card amount should be reduced by commission"
    );
    
    // Fetch referral to verify earnings
    const referral = await program.account.referral.fetch(referralPDA);
    assert.approximately(
      referral.totalEarned.toNumber(),
      expectedReferralAmount,
      1000000,
      "Referral should have earned the correct amount"
    );
    assert.strictEqual(referral.referralCount.toNumber(), 1);
    
    // Fetch treasury to verify balance
    const treasury = await program.account.treasury.fetch(treasuryPDA);
    assert.approximately(
      treasury.balance.toNumber(),
      expectedTreasuryAmount,
      1000000,
      "Treasury should have the correct balance"
    );
    
    console.log("Gift card created successfully");
    console.log(`Commission: ${expectedCommission / LAMPORTS_PER_SOL} SOL`);
    console.log(`Referral payout: ${expectedReferralAmount / LAMPORTS_PER_SOL} SOL`);
    console.log(`Treasury amount: ${expectedTreasuryAmount / LAMPORTS_PER_SOL} SOL`);
  });
  
  it("Redeems a gift card", async () => {
    const recipientBalanceBefore = await provider.connection.getBalance(recipient.publicKey);
    
    await program.methods
      .redeemGiftCard()
      .accounts({
        recipient: recipient.publicKey,
        giftCard: giftCardPDA,
        config: configPDA,
        systemProgram: SystemProgram.programId,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
      })
      .signers([recipient])
      .rpc();
      
    // Fetch the gift card to verify redemption
    const giftCard = await program.account.giftCard.fetch(giftCardPDA);
    assert.strictEqual(giftCard.isRedeemed, true);
    
    // Check recipient balance increased
    const recipientBalanceAfter = await provider.connection.getBalance(recipient.publicKey);
    const balanceIncrease = recipientBalanceAfter - recipientBalanceBefore;
    
    // Expected amount (after commission)
    const expectedCommission = giftCardAmount * defaultCommissionRate / 10000;
    const expectedGiftCardAmount = giftCardAmount - expectedCommission;
    
    assert.approximately(
      balanceIncrease,
      expectedGiftCardAmount,
      1000000, // Allow for gas fees and rounding
      "Recipient should have received the gift card amount"
    );
    
    console.log("Gift card redeemed successfully");
    console.log(`Recipient received: ${balanceIncrease / LAMPORTS_PER_SOL} SOL`);
  });
});