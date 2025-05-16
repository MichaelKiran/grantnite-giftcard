# Solana Gift Card Protocol

A Solana-based gift card protocol with monetization, referrals, and DAO governance features.

## Features

### Protocol-Owned Liquidity (POL)
- 3% commission on all gift card purchases
- Split 50/50 between protocol treasury and operations
- Treasury funds are held in a PDA controlled by the smart contract
- Admin functionality to stake treasury funds for yield

### On-Chain Referral System
- Every user can generate a unique on-chain referral code
- Referrals earn 1% commission from gift cards they refer
- Payments are atomic and happen in the same transaction
- Immutable and verifiable on-chain

### DAO Governance
- GFT (Gift Protocol Token) for governance
- Proposal creation and voting system
- Token-weighted voting mechanism
- On-chain proposals and results

## Smart Contract Architecture

### Main Account Structures
- `Config`: Global protocol settings, stats, and parameters
- `GiftCard`: Individual gift card data
- `Referral`: User referral data and earnings
- `Treasury`: Protocol treasury accounting
- `Proposal`: DAO proposals
- `VoteRecord`: Voting records

### Key Instructions
- `initialize`: Set up the protocol with commission rates
- `createGiftCard`: Create a gift card with optional referral
- `redeemGiftCard`: Redeem a gift card
- `createReferral`: Create a referral code
- `createGovernanceToken`: Create the DAO governance token
- `createProposal`: Create a governance proposal
- `voteOnProposal`: Vote on a proposal
- `finalizeProposal`: Finalize a proposal after voting ends
- `stakeTreasuryFunds`: Stake treasury funds into a pool

## Getting Started

### Prerequisites
- Solana CLI
- Anchor Framework
- Node.js and npm/yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/gift-protocol.git
cd gift-protocol

# Install dependencies
yarn install

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Testing
```bash
# Run the test suite
anchor test
```

## Integration Examples

### Creating a Gift Card with Referral
```typescript
// Create a gift card with a referral
const tx = await program.methods
  .createGiftCard(
    new BN(amount * LAMPORTS_PER_SOL),
    recipientPublicKey,
    new BN(expiryTime),
    message,
    referrerPublicKey
  )
  .accounts({
    creator: wallet.publicKey,
    giftCard: giftCardPDA,
    config: configPDA,
    treasury: treasuryPDA,
    referral: referralPDA,
    systemProgram: SystemProgram.programId,
    clock: SYSVAR_CLOCK_PUBKEY,
  })
  .signers([wallet])
  .rpc();
```

### Redeeming a Gift Card
```typescript
// Redeem a gift card
const tx = await program.methods
  .redeemGiftCard()
  .accounts({
    recipient: wallet.publicKey,
    giftCard: giftCardPDA,
    config: configPDA,
    systemProgram: SystemProgram.programId,
    clock: SYSVAR_CLOCK_PUBKEY,
  })
  .signers([wallet])
  .rpc();
```

## License
MIT

## Contact
For any questions or feedback, please open an issue on the GitHub repository.