use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct StakeTreasuryFunds<'info> {
    #[account(
        mut,
        constraint = authority.key() == config.authority @ GiftProtocolError::NotAuthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config".as_ref()],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"treasury".as_ref()],
        bump = treasury.bump,
        constraint = treasury.key() == config.treasury @ GiftProtocolError::TreasuryMismatch
    )]
    pub treasury: Account<'info, Treasury>,
    
    /// The staking pool account
    #[account(mut)]
    pub staking_pool: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<StakeTreasuryFunds>, amount: u64) -> Result<()> {
    // Validate the amount
    require!(amount > 0, GiftProtocolError::InvalidAmount);
    
    // Check if the treasury has enough funds
    let treasury = &mut ctx.accounts.treasury;
    require!(treasury.balance >= amount, GiftProtocolError::InsufficientFunds);
    
    // Transfer the amount from treasury to staking pool
    let treasury_signer_seeds = &[
        b"treasury".as_ref(),
        &[treasury.bump],
    ];
    let treasury_signer = &[&treasury_signer_seeds[..]];
    
    let cpi_accounts = system_program::Transfer {
        from: treasury.to_account_info(),
        to: ctx.accounts.staking_pool.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program, 
        cpi_accounts,
        treasury_signer,
    );
    system_program::transfer(cpi_ctx, amount)?;
    
    // Update treasury account
    treasury.balance = treasury.balance.checked_sub(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    treasury.staked_amount = treasury.staked_amount.checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    // Update config stats
    let config = &mut ctx.accounts.config;
    config.total_staked = config.total_staked.checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    msg!("Staked {} lamports from treasury to staking pool", amount);
    msg!("Treasury balance: {}, staked amount: {}", treasury.balance, treasury.staked_amount);
    
    Ok(())
}