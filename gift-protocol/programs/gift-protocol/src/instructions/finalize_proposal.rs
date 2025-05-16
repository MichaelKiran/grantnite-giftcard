use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct FinalizeProposal<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"proposal".as_ref(), &proposal.proposal_id.to_le_bytes()],
        bump = proposal.bump,
        constraint = !proposal.is_finalized @ GiftProtocolError::ProposalActive,
        constraint = proposal.voting_end_time <= clock.unix_timestamp @ GiftProtocolError::ProposalVotingEnded,
    )]
    pub proposal: Account<'info, Proposal>,

    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<FinalizeProposal>) -> Result<()> {
    // Get the proposal account
    let proposal = &mut ctx.accounts.proposal;
    
    // Determine the winning choice (the one with the most votes)
    let vote_counts = &proposal.vote_counts;
    let mut winning_choice: Option<u8> = None;
    let mut max_votes: u64 = 0;
    
    for (i, &votes) in vote_counts.iter().enumerate() {
        if votes > max_votes {
            max_votes = votes;
            winning_choice = Some(i as u8);
        }
    }
    
    // Set the winner and mark the proposal as finalized
    proposal.winning_choice = winning_choice;
    proposal.is_finalized = true;
    
    msg!("Proposal {} finalized", proposal.proposal_id);
    
    if let Some(winner) = winning_choice {
        msg!("Winning choice: {} with {} votes", 
            proposal.choices[winner as usize],
            vote_counts[winner as usize]);
    } else {
        msg!("No votes were cast on this proposal");
    }
    
    Ok(())
}