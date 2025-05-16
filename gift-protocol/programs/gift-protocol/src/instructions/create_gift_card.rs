use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(amount: u64, recipient: Pubkey, expiry_time: i64, message: String, referrer: Option<Pubkey>)]
pub struct CreateGiftCard<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<GiftCard>() + message.len(),
        seeds = [b"gift_card".as_ref(), creator.key().as_ref(), &Pubkey::default().to_bytes()],
        bump
    )]
    pub gift_card: Account<'info, GiftCard>,

    #[account(
        mut,
        seeds = [b"config".as_ref()],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [b"treasury".as_ref()],
        bump = treasury.bump,
        constraint = treasury.key() == config.treasury @ GiftProtocolError::TreasuryMismatch
    )]
    pub treasury: Account<'info, Treasury>,

    /// The referrer account is optional and only required if a referrer is provided
    #[account(
        mut,
        seeds = [b"referral".as_ref(), referrer.unwrap_or_default().as_ref()],
        bump,
        constraint = referrer.is_none() || referral.owner == referrer.unwrap() @ GiftProtocolError::InvalidReferrer
    )]
    pub referral: Option<Account<'info, Referral>>,

    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
    ctx: Context<CreateGiftCard>,
    amount: u64,
    recipient: Pubkey,
    expiry_time: i64,
    message: String,
    referrer: Option<Pubkey>,
) -> Result<()> {
    // Validate inputs
    require!(amount > 0, GiftProtocolError::InvalidAmount);
    require!(message.len() <= 280, GiftProtocolError::MessageTooLong); // 280 chars max
    
    // If expiry time is provided, ensure it's in the future
    if expiry_time > 0 {
        let current_time = ctx.accounts.clock.unix_timestamp;
        require!(expiry_time > current_time, GiftProtocolError::Expired);
    }

    // Calculate commission amount (commission_rate is in basis points, 10000 = 100%)
    let commission_rate = ctx.accounts.config.commission_rate;
    let commission_amount = (amount * commission_rate) / 10000;

    // Calculate the gift card amount after commission
    let gift_amount = amount.checked_sub(commission_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    // Calculate referral amount if a valid referrer is provided
    let (treasury_amount, referral_amount) = if referrer.is_some() && ctx.accounts.referral.is_some() {
        let referral_rate = ctx.accounts.config.referral_rate;
        let referral_amount = (amount * referral_rate) / 10000;
        
        // Remainder goes to treasury
        (commission_amount - referral_amount, referral_amount)
    } else {
        // All commission goes to treasury
        (commission_amount, 0)
    };

    // Create gift card data
    let gift_card = &mut ctx.accounts.gift_card;
    gift_card.creator = ctx.accounts.creator.key();
    gift_card.recipient = recipient;
    gift_card.amount = gift_amount;
    gift_card.is_redeemed = false;
    gift_card.expiry_time = expiry_time;
    gift_card.message = message;
    gift_card.referrer = referrer;
    gift_card.bump = *ctx.bumps.get("gift_card").unwrap();

    // Update config stats
    let config = &mut ctx.accounts.config;
    config.total_commission = config.total_commission.checked_add(commission_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    config.total_gift_cards = config.total_gift_cards.checked_add(1)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    if referral_amount > 0 {
        config.total_referral_payouts = config.total_referral_payouts.checked_add(referral_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    }

    // Update treasury
    let treasury = &mut ctx.accounts.treasury;
    treasury.balance = treasury.balance.checked_add(treasury_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;

    // Transfer the full amount from creator to the system program (temp account)
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.creator.to_account_info(),
        to: gift_card.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    system_program::transfer(cpi_ctx, gift_amount)?;

    // Transfer treasury portion
    if treasury_amount > 0 {
        let cpi_accounts = system_program::Transfer {
            from: ctx.accounts.creator.to_account_info(),
            to: treasury.to_account_info(),
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        system_program::transfer(cpi_ctx, treasury_amount)?;
    }

    // If referral is provided, transfer referral amount
    if referral_amount > 0 && ctx.accounts.referral.is_some() {
        let referral = ctx.accounts.referral.as_mut().unwrap();

        // Transfer to the referrer
        let cpi_accounts = system_program::Transfer {
            from: ctx.accounts.creator.to_account_info(),
            to: ctx.accounts.creator.to_account_info(), // This will be the referrer's account in production
        };
        let cpi_program = ctx.accounts.system_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        system_program::transfer(cpi_ctx, referral_amount)?;

        // Update referral stats
        referral.total_earned = referral.total_earned.checked_add(referral_amount)
            .ok_or(ProgramError::ArithmeticOverflow)?;
        referral.referral_count = referral.referral_count.checked_add(1)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    }

    msg!("Gift card created: {} lamports ({}% commission, {}% referral)",
        gift_amount, commission_rate as f64 / 100.0, ctx.accounts.config.referral_rate as f64 / 100.0);

    Ok(())
}