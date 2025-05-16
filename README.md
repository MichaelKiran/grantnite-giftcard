# Solana Gift Card & Staking Game Application

This is a full-stack Solana application that allows users to create and redeem gift cards, as well as participate in a staking game where they can win rewards.

## Features

### Gift Cards
- Create personalized Solana gift cards with custom messages
- Send gift cards to recipients via email
- Set optional expiry dates
- Redeem gift cards to claim funds
- View created and received gift cards



### Reliability Improvements
- Integration with Helius RPC for improved transaction reliability
- Connection retry mechanism and better error handling
- Configurable RPC endpoints for development and production

## Project Structure

- `/gift-card-program`: Solana on-chain program written in Rust
  - Contains smart contract logic for gift cards and staking
  
- `/gift-card-frontend`: Next.js frontend application
  - Provides user interface for interacting with the Solana program
  - Integrates with Solana wallet adapters
  - Uses SendGrid for email notifications

## Installation & Setup

### Prerequisites
- Node.js v16+
- Rust toolchain with Cargo
- Solana CLI tools
- Phantom wallet or another Solana wallet
- Helius API key (free tier available) - See HELIUS_SETUP.md for details

### Backend Setup (Solana Program)

1. Install Solana CLI tools:
```bash
sh -c "$(curl -sSfL https://release.solana.sh/stable/install)"
```

2. Set up Solana configuration:
```bash
solana config set --url devnet
```

3. Generate a new keypair (if you don't have one):
```bash
solana-keygen new
```

4. Build the Solana program:
```bash
cd gift-card-program
cargo build-bpf
```

5. Deploy to Solana devnet:
```bash
solana program deploy target/deploy/gift_card_program.so
```

6. Note the program ID for frontend configuration.

### Frontend Setup

1. Install dependencies:
```bash
cd gift-card-frontend
npm install
```

2. Set up Helius API (recommended for reliability):
   - Follow the instructions in `HELIUS_SETUP.md` to get your API key
   - Update the configuration in `env-config.txt`

3. Or create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=<your_deployed_program_id>
SENDGRID_API_KEY=<your_sendgrid_api_key>
SENDGRID_FROM_EMAIL=<your_sender_email>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

To test the application:

1. Make sure you have SOL in your devnet wallet.
2. Connect your wallet to the application.
3. Create a gift card by filling out the form.
4. Test redeeming the gift card with the provided secret key.
5. Test the staking functionality by depositing SOL into the pool.

## Deployment

### Deploy the Solana Program to Mainnet

1. Switch to mainnet:
```bash
solana config set --url mainnet-beta
```

2. Ensure you have enough SOL for deployment.

3. Deploy the program:
```bash
solana program deploy target/deploy/gift_card_program.so
```

### Deploy the Frontend

The frontend can be deployed to Vercel, Netlify, or any static site host:

```bash
cd gift-card-frontend
npm run build
```

### RPC Configuration for Production

For production deployments, it's strongly recommended to:
1. Use Helius or another reliable RPC provider instead of public endpoints
2. Set appropriate environment variables during the build process
3. Consider using a dedicated RPC node for high-traffic applications

## Security Considerations

- Never share your private keys or seed phrases
- Gift card secret keys should be kept secure
- Admin keys for the staking pool should be carefully managed
- Consider auditing the smart contract before mainnet deployment
- Keep your Helius API key secure and consider IP restrictions

## Troubleshooting RPC Issues

If you encounter RPC connection issues:
1. Check that your Helius API key is correctly configured
2. Verify you haven't exceeded your usage limits on the Helius dashboard
3. Try switching to a different RPC endpoint temporarily
4. See the detailed troubleshooting guide in HELIUS_SETUP.md

## Future Improvements

- USDC support for gift cards
- Multi-signature control for staking pool
- Enhanced randomness using Chainlink VRF
- Analytics dashboard for gift card usage
- Mobile app with QR code scanning

## License

MIT

## Author

Your Name 