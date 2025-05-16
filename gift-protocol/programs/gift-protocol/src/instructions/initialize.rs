use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<Config>(),
        seeds = [b"config".as_ref()],
        bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<Treasury>(),
        seeds = [b"treasury".as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<Initialize>, 
    commission_rate: u64, 
    referral_rate: u64
) -> Result<()> {
    // Validate commission rate (0-100% in basis points)
    require!(
        commission_rate <= 10000,
        GiftProtocolError::InvalidCommissionRate
    );

    // Validate referral rate (must be <= commission rate)
    require!(
        referral_rate <= commission_rate,
        GiftProtocolError::InvalidReferralRate
    );

    // Get the bump seeds
    let config_bump = *ctx.bumps.get("config").unwrap();
    let treasury_bump = *ctx.bumps.get("treasury").unwrap();

    // Initialize config account
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.commission_rate = commission_rate;
    config.referral_rate = referral_rate;
    config.treasury = ctx.accounts.treasury.key();
    config.total_commission = 0;
    config.total_referral_payouts = 0;
    config.total_gift_cards = 0;
    config.total_staked = 0;
    config.governance_token_mint = None;
    config.bump = config_bump;

    // Initialize treasury account
    let treasury = &mut ctx.accounts.treasury;
    treasury.config = config.key();
    treasury.balance = 0;
    treasury.staked_amount = 0;
    treasury.bump = treasury_bump;

    msg!("Protocol initialized with commission rate: {}bp, referral rate: {}bp", 
        commission_rate, referral_rate);

    Ok(())
}