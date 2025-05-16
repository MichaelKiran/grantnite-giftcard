use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct CreateReferral<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + std::mem::size_of::<Referral>(),
        seeds = [b"referral".as_ref(), owner.key().as_ref()],
        bump
    )]
    pub referral: Account<'info, Referral>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<CreateReferral>) -> Result<()> {
    let referral = &mut ctx.accounts.referral;
    let bump = *ctx.bumps.get("referral").unwrap();
    
    // Initialize referral data
    referral.owner = ctx.accounts.owner.key();
    referral.total_earned = 0;
    referral.referral_count = 0;
    referral.created_at = ctx.accounts.clock.unix_timestamp;
    referral.bump = bump;
    
    msg!("Referral code created for {}", ctx.accounts.owner.key().to_string());
    
    Ok(())
}