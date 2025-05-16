import { Connection, PublicKey, Keypair, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@project-serum/anchor';
import { getConnection } from './solana';

// Replace with actual Program ID from the deployed Anchor program
const PROTOCOL_PROGRAM_ID = new PublicKey('GiFtpLZbmQcu4LPYoFg2ZX5he7qeXXdXiNVzQ5Lm24R1');

// Protocol Program IDL - This would typically be imported from a generated file
// This is a skeleton, a real IDL would be more extensive
const PROTOCOL_IDL: Idl = {
  version: "0.1.0",
  name: "gift_protocol",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "config", isMut: true, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "commissionRate", type: "u64" },
        { name: "referralRate", type: "u64" }
      ]
    },
    {
      name: "createGiftCard",
      accounts: [
        { name: "creator", isMut: true, isSigner: true },
        { name: "giftCard", isMut: true, isSigner: false },
        { name: "config", isMut: true, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "referral", isMut: true, isSigner: false, isOptional: true },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "clock", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "recipient", type: "publicKey" },
        { name: "expiryTime", type: "i64" },
        { name: "message", type: "string" },
        { name: "referrer", type: { option: "publicKey" } }
      ]
    },
    {
      name: "redeemGiftCard",
      accounts: [
        { name: "recipient", isMut: true, isSigner: true },
        { name: "giftCard", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "clock", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "createReferral",
      accounts: [
        { name: "owner", isMut: true, isSigner: true },
        { name: "referral", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "clock", isMut: false, isSigner: false }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "Config",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "commissionRate", type: "u64" },
          { name: "referralRate", type: "u64" },
          { name: "treasury", type: "publicKey" },
          { name: "totalCommission", type: "u64" },
          { name: "totalReferralPayouts", type: "u64" },
          { name: "totalGiftCards", type: "u64" },
          { name: "totalStaked", type: "u64" },
          { name: "governanceTokenMint", type: { option: "publicKey" } },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "GiftCard",
      type: {
        kind: "struct",
        fields: [
          { name: "creator", type: "publicKey" },
          { name: "recipient", type: "publicKey" },
          { name: "amount", type: "u64" },
          { name: "isRedeemed", type: "bool" },
          { name: "expiryTime", type: "i64" },
          { name: "message", type: "string" },
          { name: "referrer", type: { option: "publicKey" } },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "Referral",
      type: {
        kind: "struct",
        fields: [
          { name: "owner", type: "publicKey" },
          { name: "totalEarned", type: "u64" },
          { name: "referralCount", type: "u64" },
          { name: "createdAt", type: "i64" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "Treasury",
      type: {
        kind: "struct",
        fields: [
          { name: "config", type: "publicKey" },
          { name: "balance", type: "u64" },
          { name: "stakedAmount", type: "u64" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  events: [],
  errors: []
};

// Initialize the Anchor Program with wallet
function getProtocolProgram(wallet: any) {
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection, 
    wallet,
    { commitment: 'confirmed' }
  );
  
  return new Program(PROTOCOL_IDL, PROTOCOL_PROGRAM_ID, provider);
}

// Function to get protocol configuration
export async function getProtocolConfig(wallet: any) {
  try {
    const program = getProtocolProgram(wallet);
    
    // Derive the config PDA
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    
    const configAccount = await program.account.config.fetch(configPDA);
    return configAccount;
  } catch (error) {
    
    throw error;
  }
}

// Function to get treasury information
export async function getTreasuryInfo(wallet: any) {
  try {
    const program = getProtocolProgram(wallet);
    
    // Derive the treasury PDA
    const [treasuryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );
    
    const treasuryAccount = await program.account.treasury.fetch(treasuryPDA);
    return treasuryAccount;
  } catch (error) {
    
    throw error;
  }
}

// Function to create a gift card with referral
export async function createGiftCardWithReferral(
  wallet: any,
  amount: number,
  recipient: PublicKey,
  expiryTime: number,
  message: string,
  referrer?: PublicKey
) {
  try {
    const program = getProtocolProgram(wallet);
    
    // Derive the gift card PDA
    const [giftCardPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("gift_card"),
        wallet.publicKey.toBuffer(),
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]) // placeholder for a unique identifier
      ],
      program.programId
    );
    
    // Derive the config PDA
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
    
    // Derive the treasury PDA
    const [treasuryPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );
    
    // Create accounts object with optional referral account
    const accounts = {
      creator: wallet.publicKey,
      giftCard: giftCardPDA,
      config: configPDA,
      treasury: treasuryPDA,
      systemProgram: PublicKey.default,
      clock: PublicKey.default
    };
    
    // Add referral account if provided
    if (referrer) {
      const [referralPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("referral"), referrer.toBuffer()],
        program.programId
      );
      
      // @ts-ignore - dynamically adding the referral field
      accounts.referral = referralPDA;
    }
    
    // Execute the transaction
    const tx = await program.methods
      .createGiftCard(
        amount,
        recipient,
        expiryTime,
        message,
        referrer ? referrer : null
      )
      .accounts(accounts)
      .rpc();
      
    return {
      signature: tx,
      giftCardAddress: giftCardPDA.toString()
    };
  } catch (error) {
    
    throw error;
  }
}

// Function to create a user's referral code
export async function createReferral(wallet: any) {
  try {
    const program = getProtocolProgram(wallet);
    
    // Derive the referral PDA
    const [referralPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("referral"), wallet.publicKey.toBuffer()],
      program.programId
    );
    
    // Execute the transaction
    const tx = await program.methods
      .createReferral()
      .accounts({
        owner: wallet.publicKey,
        referral: referralPDA,
        systemProgram: PublicKey.default,
        clock: PublicKey.default
      })
      .rpc();
      
    return {
      signature: tx,
      referralAddress: referralPDA.toString()
    };
  } catch (error) {
    
    throw error;
  }
}

// Function to get user's referral info
export async function getUserReferralInfo(wallet: any, userPubkey: PublicKey) {
  try {
    const program = getProtocolProgram(wallet);
    
    // Derive the referral PDA
    const [referralPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("referral"), userPubkey.toBuffer()],
      program.programId
    );
    
    // Fetch the referral account
    try {
      const referralAccount = await program.account.referral.fetch(referralPDA);
      return referralAccount;
    } catch (e) {
      // Referral doesn't exist yet
      return null;
    }
  } catch (error) {
    
    throw error;
  }
} 