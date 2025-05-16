use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct RedeemGiftCard<'info> {
    #[account(mut)]
    pub recipient: Signer<'info>,

    #[account(
        mut,
        seeds = [b"gift_card".as_ref(), gift_card.creator.as_ref(), &Pubkey::default().to_bytes()],
        bump = gift_card.bump,
        constraint = gift_card.recipient == recipient.key() @ GiftProtocolError::NotAuthorized,
        constraint = !gift_card.is_redeemed @ GiftProtocolError::AlreadyRedeemed
    )]
    pub gift_card: Account<'info, GiftCard>,

    #[account(mut)]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<RedeemGiftCard>) -> Result<()> {
    // Check if the gift card is expired
    let gift_card = &mut ctx.accounts.gift_card;
    let current_time = ctx.accounts.clock.unix_timestamp;
    
    if gift_card.expiry_time > 0 && current_time > gift_card.expiry_time {
        return Err(GiftProtocolError::Expired.into());
    }

    // Check if there are sufficient funds in the gift card account
    let gift_card_lamports = gift_card.to_account_info().lamports();
    require!(gift_card_lamports > 0, GiftProtocolError::InvalidAmount);

    // Mark the gift card as redeemed
    gift_card.is_redeemed = true;

    // Calculate the amount to transfer to the recipient
    // We need to keep some lamports in the gift card account to maintain rent exemption
    let recipient_info = ctx.accounts.recipient.to_account_info();

    // Transfer funds from gift card account to recipient
    **recipient_info.lamports.borrow_mut() = recipient_info.lamports()
        .checked_add(gift_card_lamports)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    **gift_card.to_account_info().lamports.borrow_mut() = 0;

    msg!("Gift card redeemed: {} lamports", gift_card_lamports);

    Ok(())
}