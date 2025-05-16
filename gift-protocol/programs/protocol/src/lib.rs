use anchor_lang::prelude::*;

declare_id!("GiFtpLZbmQcu4LPYoFg2ZX5he7qeXXdXiNVzQ5Lm24R1");

#[program]
pub mod protocol {
    use super::*;

    // Initialize the protocol with initial settings
    pub fn initialize(
        ctx: Context<Initialize>,
        commission_rate: u16,
        referral_rate: u16,
    ) -> Result<()> {
        let protocol_state = &mut ctx.accounts.protocol_state;
        let treasury = &mut ctx.accounts.treasury;

        // Set the authority
        protocol_state.authority = ctx.accounts.authority.key();
        protocol_state.treasury = treasury.key();
        protocol_state.commission_rate = commission_rate;
        protocol_state.referral_rate = referral_rate;
        protocol_state.total_gift_cards = 0;
        protocol_state.total_collected = 0;
        protocol_state.total_referrers = 0;
        protocol_state.total_referral_paid = 0;
        
        // Set the treasury authority
        treasury.authority = ctx.accounts.authority.key();
        
        msg!("Protocol initialized with commission rate: {}", commission_rate);
        msg!("Protocol referral rate: {}", referral_rate);
        
        Ok(())
    }

    // Update protocol parameters
    pub fn update_protocol_params(
        ctx: Context<UpdateProtocolParams>,
        commission_rate: Option<u16>,
        referral_rate: Option<u16>,
    ) -> Result<()> {
        let protocol_state = &mut ctx.accounts.protocol_state;

        // Update commission rate if provided
        if let Some(rate) = commission_rate {
            protocol_state.commission_rate = rate;
            msg!("Updated commission rate to: {}", rate);
        }

        // Update referral rate if provided
        if let Some(rate) = referral_rate {
            protocol_state.referral_rate = rate;
            msg!("Updated referral rate to: {}", rate);
        }

        Ok(())
    }

    // Record a new gift card purchase
    pub fn record_gift_card(
        ctx: Context<RecordGiftCard>,
        amount: u64,
        has_referrer: bool,
    ) -> Result<()> {
        let protocol_state = &mut ctx.accounts.protocol_state;
        
        // Update gift card count
        protocol_state.total_gift_cards = protocol_state.total_gift_cards.checked_add(1).unwrap();
        
        // Calculate commission
        let commission_bps = protocol_state.commission_rate as u64;
        let commission_amount = amount
            .checked_mul(commission_bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        
        // Update total collected
        protocol_state.total_collected = protocol_state
            .total_collected
            .checked_add(commission_amount)
            .unwrap();
        
        // If there's a referrer, update referrer stats
        if has_referrer {
            // In a real implementation, you'd handle referrer-specific logic here
            // Like crediting the referrer or updating their stats
            
            // For now we'll just increment the referrer count if it's new
            if ctx.accounts.referrer.key() != ctx.accounts.user.key() {
                protocol_state.total_referrers = protocol_state.total_referrers.checked_add(1).unwrap();
                
                // Calculate referral amount
                let referral_bps = protocol_state.referral_rate as u64;
                let referral_amount = amount
                    .checked_mul(referral_bps as u64)
                    .unwrap()
                    .checked_div(10000)
                    .unwrap();
                
                protocol_state.total_referral_paid = protocol_state
                    .total_referral_paid
                    .checked_add(referral_amount)
                    .unwrap();
            }
        }
        
        msg!("Recorded gift card purchase of {} lamports", amount);
        msg!("New total gift cards: {}", protocol_state.total_gift_cards);
        
        Ok(())
    }
}

// Account to store protocol state
#[account]
#[derive(Default)]
pub struct ProtocolState {
    pub authority: Pubkey,       // Admin authority for the protocol
    pub treasury: Pubkey,        // Treasury address
    pub commission_rate: u16,    // In basis points (e.g. 300 = 3%)
    pub referral_rate: u16,      // In basis points (e.g. 100 = 1%)
    pub total_gift_cards: u64,   // Count of gift cards created
    pub total_collected: u64,    // Total fees collected in lamports
    pub total_referrers: u64,    // Count of unique referrers
    pub total_referral_paid: u64, // Total referral fees paid in lamports
}

// Account to store treasury information
#[account]
#[derive(Default)]
pub struct Treasury {
    pub authority: Pubkey,       // Treasury authority
}

// Context for initializing the protocol
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 2 + 2 + 8 + 8 + 8 + 8,
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32,
    )]
    pub treasury: Account<'info, Treasury>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

// Context for updating protocol parameters
#[derive(Accounts)]
pub struct UpdateProtocolParams<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    
    pub authority: Signer<'info>,
}

// Context for recording a gift card
#[derive(Accounts)]
pub struct RecordGiftCard<'info> {
    #[account(mut)]
    pub protocol_state: Account<'info, ProtocolState>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: Just used for recording the referrer, not for auth
    pub referrer: UncheckedAccount<'info>,
} 