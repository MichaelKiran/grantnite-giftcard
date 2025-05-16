use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};
use std::mem::size_of;

// Import program modules
mod errors;
mod instructions;
mod state;

// Re-exports
pub use errors::*;
pub use instructions::*;
pub use state::*;

declare_id!("GiFtpLZbmQcu4LPYoFg2ZX5he7qeXXdXiNVzQ5Lm24R1");

#[program]
pub mod gift_protocol {
    use super::*;

    // Initialize the protocol's global configuration
    pub fn initialize(
        ctx: Context<Initialize>, 
        commission_rate: u64, 
        referral_rate: u64
    ) -> Result<()> {
        instructions::initialize::handler(ctx, commission_rate, referral_rate)
    }

    // Create a gift card with funds
    pub fn create_gift_card(
        ctx: Context<CreateGiftCard>,
        amount: u64,
        recipient: Pubkey,
        expiry_time: i64,
        message: String,
        referrer: Option<Pubkey>,
    ) -> Result<()> {
        instructions::create_gift_card::handler(ctx, amount, recipient, expiry_time, message, referrer)
    }

    // Redeem a gift card
    pub fn redeem_gift_card(ctx: Context<RedeemGiftCard>) -> Result<()> {
        instructions::redeem_gift_card::handler(ctx)
    }

    // Create a referral code
    pub fn create_referral(ctx: Context<CreateReferral>) -> Result<()> {
        instructions::create_referral::handler(ctx)
    }

    // Generate a DAO governance token
    pub fn create_governance_token(
        ctx: Context<CreateGovernanceToken>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::create_governance_token::handler(ctx, name, symbol, uri)
    }

    // Create a governance proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        choices: Vec<String>,
        voting_end_time: i64,
    ) -> Result<()> {
        instructions::create_proposal::handler(ctx, title, description, choices, voting_end_time)
    }

    // Vote on a proposal
    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        choice_index: u8,
    ) -> Result<()> {
        instructions::vote_on_proposal::handler(ctx, choice_index)
    }

    // Finalize a proposal after voting period ends
    pub fn finalize_proposal(ctx: Context<FinalizeProposal>) -> Result<()> {
        instructions::finalize_proposal::handler(ctx)
    }

    // Admin function to stake treasury funds into a pool
    pub fn stake_treasury_funds(
        ctx: Context<StakeTreasuryFunds>,
        amount: u64,
    ) -> Result<()> {
        instructions::stake_treasury_funds::handler(ctx, amount)
    }
}