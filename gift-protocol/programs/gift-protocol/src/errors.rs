use anchor_lang::prelude::*;

#[error_code]
pub enum GiftProtocolError {
    #[msg("Invalid commission rate. Must be between 0 and 10000 (0-100%)")]
    InvalidCommissionRate,

    #[msg("Invalid referral rate. Must be less than or equal to commission rate")]
    InvalidReferralRate,

    #[msg("Gift card already redeemed")]
    AlreadyRedeemed,

    #[msg("Gift card expired")]
    Expired,

    #[msg("Not authorized")]
    NotAuthorized,

    #[msg("Invalid amount")]
    InvalidAmount,

    #[msg("Message too long")]
    MessageTooLong,

    #[msg("Invalid instruction")]
    InvalidInstruction,

    #[msg("Invalid referrer")]
    InvalidReferrer,

    #[msg("Treasury account mismatch")]
    TreasuryMismatch,

    #[msg("Treasury operation unauthorized")]
    TreasuryUnauthorized,

    #[msg("Proposal is still active")]
    ProposalActive,

    #[msg("Proposal voting period ended")]
    ProposalVotingEnded,

    #[msg("Invalid choice index")]
    InvalidChoiceIndex,

    #[msg("Already voted on this proposal")]
    AlreadyVoted,

    #[msg("Invalid token authority")]
    InvalidTokenAuthority,

    #[msg("Too many choices for proposal")]
    TooManyChoices,

    #[msg("Maximum number of votes exceeded")]
    MaxVotesExceeded,
}