use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(name: String, symbol: String, uri: String)]
pub struct CreateGovernanceToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config".as_ref()],
        bump = config.bump,
        constraint = config.authority == authority.key() @ GiftProtocolError::NotAuthorized,
        constraint = config.governance_token_mint.is_none() @ GiftProtocolError::InvalidTokenAuthority,
    )]
    pub config: Account<'info, Config>,

    /// The token mint for the governance token
    #[account(
        init, 
        payer = authority, 
        mint::decimals = 9,
        mint::authority = authority.key(),
    )]
    pub token_mint: Account<'info, Mint>,
    
    /// Token account for the protocol's treasury tokens
    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = treasury,
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    /// The treasury PDA which will hold tokens
    #[account(
        seeds = [b"treasury".as_ref()],
        bump = treasury.bump,
    )]
    pub treasury: Account<'info, Treasury>,
    
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateGovernanceToken>, 
    name: String, 
    symbol: String, 
    uri: String
) -> Result<()> {
    // Update config with the token mint
    let config = &mut ctx.accounts.config;
    config.governance_token_mint = Some(ctx.accounts.token_mint.key());
    
    // Create the token supply
    let initial_supply = 1_000_000_000_000_000; // 1 million tokens with 9 decimals
    
    // Mint tokens to the treasury
    let cpi_accounts = MintTo {
        mint: ctx.accounts.token_mint.to_account_info(),
        to: ctx.accounts.treasury_token_account.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::mint_to(cpi_ctx, initial_supply)?;
    
    msg!("Governance token created: {}, symbol: {}", name, symbol);
    msg!("Minted {} tokens to protocol treasury", initial_supply);
    
    Ok(())
}