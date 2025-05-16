use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(choice_index: u8)]
pub struct VoteOnProposal<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(
        seeds = [b"config".as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// The token account of the voter
    #[account(
        token::mint = config.governance_token_mint.unwrap(),
        token::authority = voter,
        constraint = voter_token_account.amount > 0 @ GiftProtocolError::NotAuthorized,
    )]
    pub voter_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"proposal".as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
        constraint = !proposal.is_finalized @ GiftProtocolError::ProposalActive,
        constraint = proposal.voting_end_time > clock.unix_timestamp @ GiftProtocolError::ProposalVotingEnded,
        constraint = choice_index < proposal.choices.len() as u8 @ GiftProtocolError::InvalidChoiceIndex,
    )]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + std::mem::size_of::<VoteRecord>(),
        seeds = [
            b"vote".as_ref(), 
            voter.key().as_ref(),
            proposal.key().as_ref()
        ],
        bump
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<VoteOnProposal>,
    choice_index: u8,
) -> Result<()> {
    // Get the voter's token balance for vote weight
    let vote_weight = ctx.accounts.voter_token_account.amount;
    require!(vote_weight > 0, GiftProtocolError::InvalidAmount);

    // Check if the user already voted
    let vote_record = &mut ctx.accounts.vote_record;
    let bump = *ctx.bumps.get("vote_record").unwrap();
    let proposal = &mut ctx.accounts.proposal;
    
    // If the vote record is new, initialize it
    if vote_record.voter == Pubkey::default() {
        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal = proposal.key();
        vote_record.choice = choice_index;
        vote_record.weight = vote_weight;
        vote_record.timestamp = ctx.accounts.clock.unix_timestamp;
        vote_record.bump = bump;
        
        // Update the proposal vote counts
        proposal.vote_counts[choice_index as usize] = proposal.vote_counts[choice_index as usize]
            .checked_add(vote_weight)
            .ok_or(ProgramError::ArithmeticOverflow)?;
            
        proposal.total_votes = proposal.total_votes
            .checked_add(vote_weight)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    } else {
        // User already voted, check they're not double voting
        require!(vote_record.voter == ctx.accounts.voter.key(), GiftProtocolError::NotAuthorized);
        
        // If they're changing their vote, update the counts
        if vote_record.choice != choice_index {
            // Subtract weight from the old choice
            proposal.vote_counts[vote_record.choice as usize] = proposal.vote_counts[vote_record.choice as usize]
                .checked_sub(vote_record.weight)
                .ok_or(ProgramError::ArithmeticOverflow)?;
                
            // Add weight to the new choice
            proposal.vote_counts[choice_index as usize] = proposal.vote_counts[choice_index as usize]
                .checked_add(vote_weight)
                .ok_or(ProgramError::ArithmeticOverflow)?;
                
            // Update the vote record
            vote_record.choice = choice_index;
            vote_record.weight = vote_weight;
            vote_record.timestamp = ctx.accounts.clock.unix_timestamp;
        }
    }
    
    msg!("Voted on proposal: {}. Choice: {}", proposal.proposal_id, choice_index);
    
    Ok(())
}