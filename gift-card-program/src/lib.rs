use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    program::{invoke, invoke_signed},
    system_instruction,
    sysvar::{rent::Rent, Sysvar},
    clock::Clock,
};
use thiserror::Error;
use spl_token::{instruction as token_instruction, id as token_program_id};

/// Error types for the Gift Card program
#[derive(Error, Debug, Copy, Clone)]
pub enum GiftCardError {
    #[error("Invalid instruction")]
    InvalidInstruction,
    
    #[error("Gift card already redeemed")]
    AlreadyRedeemed,
    
    #[error("Gift card expired")]
    Expired,
    
    #[error("Not enough funds")]
    InsufficientFunds,
    
    #[error("Not authorized")]
    NotAuthorized,
    
    #[error("Invalid stake amount")]
    InvalidStakeAmount,
    
    #[error("Invalid token account")]
    InvalidTokenAccount,
}

impl From<GiftCardError> for ProgramError {
    fn from(e: GiftCardError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

/// Instructions for the Gift Card program
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub enum GiftCardInstruction {
    /// Create a new gift card with a specified amount
    /// 
    /// Accounts expected:
    /// 0. `[signer]` The account funding the gift card
    /// 1. `[writable]` The gift card account (PDA)
    /// 2. `[]` System program
    /// 3. `[]` Token program (optional, for SPL tokens)
    /// 4. `[writable]` Source token account (optional, for SPL tokens)
    /// 5. `[writable]` Destination token account (optional, for SPL tokens)
    CreateGiftCard {
        amount: u64,
        recipient_pubkey: Pubkey,
        expiry_time: u64,  // Unix timestamp
        message: String,
        token_mint: Option<Pubkey>, // New field for token mint
        theme_id: u8,
    },
    
    /// Redeem a gift card
    /// 
    /// Accounts expected:
    /// 0. `[signer]` The gift card recipient
    /// 1. `[writable]` The gift card account (PDA)
    /// 2. `[]` Token program (optional, for SPL tokens)
    /// 3. `[writable]` Recipient's token account (optional, for SPL tokens)
    RedeemGiftCard {},
    
    /// Add funds to the staking pool
    /// 
    /// Accounts expected:
    /// 0. `[signer]` The staker
    /// 1. `[writable]` The staking pool account (PDA)
    /// 2. `[]` System program
    Stake {
        amount: u64,
    },
    
    /// Distribute rewards from the staking pool
    /// 
    /// Accounts expected:
    /// 0. `[signer]` The program admin
    /// 1. `[writable]` The staking pool account (PDA)
    /// 2+ `[writable]` Variable number of staker accounts to receive rewards
    DistributeRewards {},
}

/// Gift card state stored in account data
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct GiftCard {
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub is_redeemed: bool,
    pub expiry_time: u64,  // Unix timestamp
    pub message: String,
    pub token_mint: Option<Pubkey>, // New field for token mint
    pub theme_id: u8,
}

/// Staking pool state stored in account data
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq)]
pub struct StakingPool {
    pub admin: Pubkey,
    pub total_staked: u64,
    pub stakers: Vec<(Pubkey, u64)>,  // (staker, amount)
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint implementation
pub fn process_instruction(
    program_id: &Pubkey, 
    accounts: &[AccountInfo], 
    instruction_data: &[u8]
) -> ProgramResult {
    let instruction = GiftCardInstruction::try_from_slice(instruction_data)
        .map_err(|_| GiftCardError::InvalidInstruction)?;
    
    match instruction {
        GiftCardInstruction::CreateGiftCard { 
            amount, 
            recipient_pubkey, 
            expiry_time, 
            message, 
            token_mint,
            theme_id 
        } => {
            process_create_gift_card(program_id, accounts, amount, recipient_pubkey, expiry_time, message, token_mint, theme_id)
        },
        GiftCardInstruction::RedeemGiftCard {} => {
            process_redeem_gift_card(program_id, accounts)
        },
        GiftCardInstruction::Stake { amount } => {
            process_stake(program_id, accounts, amount)
        },
        GiftCardInstruction::DistributeRewards {} => {
            process_distribute_rewards(program_id, accounts)
        },
    }
}

/// Process CreateGiftCard instruction
pub fn process_create_gift_card(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    recipient_pubkey: Pubkey,
    expiry_time: u64,
    message: String,
    token_mint: Option<Pubkey>,
    theme_id: u8,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    
    let creator = next_account_info(accounts_iter)?;
    let gift_card_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;
    
    // Verify the creator signed the transaction
    if !creator.is_signer {
        return Err(GiftCardError::NotAuthorized.into());
    }
    
    // Verify the gift card account is owned by the program
    if gift_card_account.owner != program_id {
        // If the account doesn't exist yet, create it
        let space = 32 + 32 + 8 + 1 + 8 + message.len() as usize + 4 + 1 + 32 + 1;  // Size of GiftCard struct with token_mint
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);
        
        // Create the gift card account (PDA)
        invoke(
            &system_instruction::create_account(
                creator.key,
                gift_card_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[creator.clone(), gift_card_account.clone(), system_program.clone()],
        )?;
    }
    
    // Handle token transfers if this is an SPL token gift card
    if let Some(mint) = token_mint {
        // Get token program and token accounts
        let token_program = next_account_info(accounts_iter)?;
        let source_token_account = next_account_info(accounts_iter)?;
        let destination_token_account = next_account_info(accounts_iter)?;
        
        // Verify token program ID
        if token_program.key != &token_program_id::ID {
            return Err(GiftCardError::InvalidTokenAccount.into());
        }
        
        // Transfer tokens from source to destination
        invoke(
            &token_instruction::transfer(
                token_program.key,
                source_token_account.key,
                destination_token_account.key,
                creator.key,
                &[creator.key],
                amount,
            )?,
            &[
                source_token_account.clone(),
                destination_token_account.clone(),
                creator.clone(),
                token_program.clone(),
            ],
        )?;
        
        msg!("SPL token transferred to gift card token account");
    } else {
        // This is a SOL gift card - transfer native SOL
        invoke(
            &system_instruction::transfer(
                creator.key,
                gift_card_account.key,
                amount,
            ),
            &[creator.clone(), gift_card_account.clone(), system_program.clone()],
        )?;
        
        msg!("SOL transferred to gift card account");
    }
    
    // Initialize gift card data
    let gift_card = GiftCard {
        creator: *creator.key,
        recipient: recipient_pubkey,
        amount,
        is_redeemed: false,
        expiry_time,
        message,
        token_mint,
        theme_id,
    };
    
    gift_card.serialize(&mut *gift_card_account.data.borrow_mut())?;
    
    msg!("Gift card created successfully!");
    
    Ok(())
}

/// Process RedeemGiftCard instruction
pub fn process_redeem_gift_card(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    
    let recipient = next_account_info(accounts_iter)?;
    let gift_card_account = next_account_info(accounts_iter)?;
    
    // Verify the recipient signed the transaction
    if !recipient.is_signer {
        return Err(GiftCardError::NotAuthorized.into());
    }
    
    // Verify the gift card account is owned by the program
    if gift_card_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Deserialize the gift card data
    let mut gift_card = GiftCard::try_from_slice(&gift_card_account.data.borrow())?;
    
    // Verify the gift card belongs to the recipient
    if gift_card.recipient != *recipient.key {
        return Err(GiftCardError::NotAuthorized.into());
    }
    
    // Check if the gift card is already redeemed
    if gift_card.is_redeemed {
        return Err(GiftCardError::AlreadyRedeemed.into());
    }
    
    // Check if the gift card is expired
    let clock = Clock::get()?;
    if gift_card.expiry_time > 0 && clock.unix_timestamp as u64 > gift_card.expiry_time {
        return Err(GiftCardError::Expired.into());
    }
    
    // Mark the gift card as redeemed
    gift_card.is_redeemed = true;
    gift_card.serialize(&mut *gift_card_account.data.borrow_mut())?;
    
    // Handle different redemption logic based on token type
    if let Some(mint) = gift_card.token_mint {
        // This is an SPL token gift card - transfer tokens to recipient's token account
        let token_program = next_account_info(accounts_iter)?;
        let recipient_token_account = next_account_info(accounts_iter)?;
        
        // Verify token program ID
        if token_program.key != &token_program_id::ID {
            return Err(GiftCardError::InvalidTokenAccount.into());
        }
        
        // Get PDA signer
        let (pda, bump_seed) = Pubkey::find_program_address(&[b"gift_card", gift_card_account.key.as_ref()], program_id);
        let seeds = &[b"gift_card".as_ref(), gift_card_account.key.as_ref(), &[bump_seed]];
        
        // Transfer tokens from gift card account to recipient
        invoke_signed(
            &token_instruction::transfer(
                token_program.key,
                gift_card_account.key,
                recipient_token_account.key,
                &pda,
                &[&pda],
                gift_card.amount,
            )?,
            &[
                gift_card_account.clone(),
                recipient_token_account.clone(),
                token_program.clone(),
            ],
            &[seeds],
        )?;
        
        msg!("SPL tokens redeemed successfully!");
    } else {
        // This is a SOL gift card - transfer native SOL
        **recipient.lamports.borrow_mut() = recipient.lamports().checked_add(gift_card_account.lamports()).ok_or(ProgramError::ArithmeticOverflow)?;
        **gift_card_account.lamports.borrow_mut() = 0;
        
        msg!("SOL redeemed successfully!");
    }
    
    Ok(())
}

/// Process Stake instruction
pub fn process_stake(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    
    let staker = next_account_info(accounts_iter)?;
    let staking_pool_account = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;
    
    // Verify the staker signed the transaction
    if !staker.is_signer {
        return Err(GiftCardError::NotAuthorized.into());
    }
    
    // Verify the staking pool account is owned by the program
    if staking_pool_account.owner != program_id {
        // If the account doesn't exist yet, create it
        let space = 32 + 8 + 4 + (32 + 8) * 100;  // Size of StakingPool struct, allowing for up to 100 stakers
        let rent = Rent::get()?;
        let lamports = rent.minimum_balance(space);
        
        // Create the staking pool account (PDA)
        invoke(
            &system_instruction::create_account(
                staker.key,
                staking_pool_account.key,
                lamports,
                space as u64,
                program_id,
            ),
            &[staker.clone(), staking_pool_account.clone(), system_program.clone()],
        )?;
        
        // Initialize staking pool data
        let staking_pool = StakingPool {
            admin: *staker.key,
            total_staked: 0,
            stakers: Vec::new(),
        };
        
        staking_pool.serialize(&mut *staking_pool_account.data.borrow_mut())?;
    }
    
    // Transfer the stake amount from staker to staking pool account
    invoke(
        &system_instruction::transfer(
            staker.key,
            staking_pool_account.key,
            amount,
        ),
        &[staker.clone(), staking_pool_account.clone(), system_program.clone()],
    )?;
    
    // Update staking pool data
    let mut staking_pool = StakingPool::try_from_slice(&staking_pool_account.data.borrow())?;
    staking_pool.total_staked = staking_pool.total_staked.checked_add(amount).ok_or(ProgramError::ArithmeticOverflow)?;
    
    // Add staker to the list or update existing stake
    let staker_key = *staker.key;
    if let Some(idx) = staking_pool.stakers.iter().position(|(pubkey, _)| *pubkey == staker_key) {
        let (_, staked_amount) = &mut staking_pool.stakers[idx];
        *staked_amount = staked_amount.checked_add(amount).ok_or(ProgramError::ArithmeticOverflow)?;
    } else {
        staking_pool.stakers.push((staker_key, amount));
    }
    
    staking_pool.serialize(&mut *staking_pool_account.data.borrow_mut())?;
    
    msg!("Stake added successfully!");
    
    Ok(())
}

/// Process DistributeRewards instruction
pub fn process_distribute_rewards(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    
    let admin = next_account_info(accounts_iter)?;
    let staking_pool_account = next_account_info(accounts_iter)?;
    
    // Verify the admin signed the transaction
    if !admin.is_signer {
        return Err(GiftCardError::NotAuthorized.into());
    }
    
    // Verify the staking pool account is owned by the program
    if staking_pool_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Deserialize the staking pool data
    let staking_pool = StakingPool::try_from_slice(&staking_pool_account.data.borrow())?;
    
    // Verify the signer is the admin
    if staking_pool.admin != *admin.key {
        return Err(GiftCardError::NotAuthorized.into());
    }
    
    // Get the current timestamp for randomness
    let clock = Clock::get()?;
    let timestamp = clock.unix_timestamp as u64;
    
    // Simple random number generation using timestamp (for demonstration only)
    // In production, this should use a proper random source like Chainlink VRF
    let mut recipients = Vec::new();
    let num_recipients = std::cmp::min(accounts.len() - 2, staking_pool.stakers.len());
    
    // Collect the recipient accounts
    for _ in 0..num_recipients {
        let recipient = next_account_info(accounts_iter)?;
        recipients.push(recipient);
    }
    
    // Calculate reward per recipient
    let total_reward = staking_pool_account.lamports();
    let reward_per_recipient = total_reward / recipients.len() as u64;
    
    // Distribute rewards
    for recipient in recipients {
        **recipient.lamports.borrow_mut() = recipient.lamports()
            .checked_add(reward_per_recipient)
            .ok_or(ProgramError::ArithmeticOverflow)?;
    }
    
    // Reduce the staking pool's lamports
    **staking_pool_account.lamports.borrow_mut() = staking_pool_account.lamports()
        .checked_sub(reward_per_recipient * recipients.len() as u64)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    msg!("Rewards distributed successfully!");
    
    Ok(())
} 