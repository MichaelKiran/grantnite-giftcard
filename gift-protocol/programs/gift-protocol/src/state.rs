use anchor_lang::prelude::*;
use std::collections::BTreeMap;

// Global configuration for the protocol
#[account]
pub struct Config {
    // Authority that can update protocol settings
    pub authority: Pubkey,
    
    // Commission rate in basis points (10000 = 100%)
    pub commission_rate: u64,
    
    // Referral rate in basis points (must be <= commission_rate)
    pub referral_rate: u64,
    
    // Protocol treasury PDA
    pub treasury: Pubkey,
    
    // Total amount of commission collected
    pub total_commission: u64,
    
    // Total referral payouts
    pub total_referral_payouts: u64,
    
    // Total number of gift cards created
    pub total_gift_cards: u64,
    
    // Total number of staked gift cards
    pub total_staked: u64,

    // Governance token mint
    pub governance_token_mint: Option<Pubkey>,

    // Bump seed for PDA derivation
    pub bump: u8,
}

// Gift card data account
#[account]
pub struct GiftCard {
    // Creator of the gift card
    pub creator: Pubkey,
    
    // Recipient wallet address
    pub recipient: Pubkey,
    
    // Amount in lamports
    pub amount: u64,
    
    // Whether the gift card has been redeemed
    pub is_redeemed: bool,
    
    // Expiry timestamp (Unix timestamp)
    pub expiry_time: i64,
    
    // Optional message
    pub message: String,
    
    // Referrer if provided
    pub referrer: Option<Pubkey>,
    
    // Bump seed for PDA derivation
    pub bump: u8,
}

// User's referral data
#[account]
pub struct Referral {
    // The user who owns this referral code
    pub owner: Pubkey,
    
    // Total amount earned from referrals
    pub total_earned: u64,
    
    // Number of successful referrals
    pub referral_count: u64,
    
    // Timestamp when created
    pub created_at: i64,
    
    // Bump seed for PDA derivation
    pub bump: u8,
}

// Protocol Treasury account
#[account]
pub struct Treasury {
    // Protocol configuration account
    pub config: Pubkey,
    
    // Current balance in lamports
    pub balance: u64,
    
    // Amount staked in external pools
    pub staked_amount: u64,
    
    // Bump seed for PDA derivation
    pub bump: u8,
}

// DAO Proposal
#[account]
pub struct Proposal {
    // Creator of the proposal
    pub creator: Pubkey,
    
    // Title of the proposal
    pub title: String,
    
    // Detailed description
    pub description: String,
    
    // Available voting choices
    pub choices: Vec<String>,
    
    // Vote counts for each choice
    pub vote_counts: Vec<u64>,
    
    // End timestamp for voting period
    pub voting_end_time: i64,
    
    // Whether the proposal has been finalized
    pub is_finalized: bool,
    
    // Index of the winning choice (if finalized)
    pub winning_choice: Option<u8>,
    
    // Total votes cast
    pub total_votes: u64,
    
    // Created timestamp
    pub created_at: i64,
    
    // Proposal number/ID
    pub proposal_id: u64,
    
    // Bump seed for PDA derivation
    pub bump: u8,
}

// Vote record to track user votes
#[account]
pub struct VoteRecord {
    // Voter's public key
    pub voter: Pubkey,
    
    // The proposal voted on
    pub proposal: Pubkey,
    
    // The chosen option index
    pub choice: u8,
    
    // Vote weight (based on token holdings)
    pub weight: u64,
    
    // Timestamp of the vote
    pub timestamp: i64,
    
    // Bump seed for PDA derivation
    pub bump: u8,
}