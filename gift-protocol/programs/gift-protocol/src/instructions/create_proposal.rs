use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(title: String, description: String, choices: Vec<String>, voting_end_time: i64)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"config".as_ref()],
        bump = config.bump,
        constraint = config.governance_token_mint.is_some() @ GiftProtocolError::InvalidTokenAuthority,
    )]
    pub config: Account<'info, Config>,

    /// The token account of the proposal creator
    #[account(
        token::mint = config.governance_token_mint.unwrap(),
        token::authority = creator,
        constraint = creator_token_account.amount > 0 @ GiftProtocolError::NotAuthorized,
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<Proposal>() + 
                title.len() + description.len() + 
                choices.iter().map(|c| c.len()).sum::<usize>() + 
                (choices.len() * 4) + // Vec<String> overhead
                (choices.len() * 8),  // Vec<u64> for vote counts
        seeds = [
            b"proposal".as_ref(), 
            &(config.total_gift_cards).to_le_bytes()
        ],
        bump
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<CreateProposal>, 
    title: String, 
    description: String, 
    choices: Vec<String>,
    voting_end_time: i64
) -> Result<()> {
    // Validate inputs
    require!(!title.is_empty(), GiftProtocolError::InvalidInstruction);
    require!(!description.is_empty(), GiftProtocolError::InvalidInstruction);
    require!(choices.len() >= 2 && choices.len() <= 10, GiftProtocolError::TooManyChoices);
    
    // Ensure voting end time is in the future
    let current_time = ctx.accounts.clock.unix_timestamp;
    require!(voting_end_time > current_time, GiftProtocolError::InvalidInstruction);
    
    // Initialize proposal
    let proposal = &mut ctx.accounts.proposal;
    let bump = *ctx.bumps.get("proposal").unwrap();
    let config = &mut ctx.accounts.config;
    
    proposal.creator = ctx.accounts.creator.key();
    proposal.title = title;
    proposal.description = description;
    proposal.choices = choices.clone();
    
    // Initialize vote counts to 0 for each choice
    proposal.vote_counts = vec![0; choices.len()];
    
    proposal.voting_end_time = voting_end_time;
    proposal.is_finalized = false;
    proposal.winning_choice = None;
    proposal.total_votes = 0;
    proposal.created_at = current_time;
    proposal.proposal_id = config.total_gift_cards; // Use gift card count as a unique ID source
    proposal.bump = bump;
    
    // Increment protocol stats
    config.total_gift_cards = config.total_gift_cards.checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    msg!("Proposal created: {}", title);
    msg!("Voting ends at: {}", voting_end_time);
    msg!("Proposal ID: {}", proposal.proposal_id);
    
    Ok(())
}