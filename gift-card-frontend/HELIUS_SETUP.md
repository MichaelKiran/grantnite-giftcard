# Setting Up Helius RPC for the Gift Card Application

This gift card application now uses Helius RPC for more reliable Solana blockchain connections. Follow these steps to set up your Helius API key:

## Why Helius RPC?

Helius provides enterprise-grade Solana RPC nodes that are more reliable than the public Solana endpoints. By using Helius:

- Your transactions are more likely to go through consistently
- The app will experience fewer RPC-related failures
- Better performance and reliability
- Free tier available for development and low-traffic applications

## Getting a Helius API Key

1. **Sign up for Helius**:
   - Go to [https://www.helius.dev/](https://www.helius.dev/) 
   - Click "Start for Free" or "Start Building"
   - Sign up with email, Google, GitHub, or your Solana wallet

2. **Get Your API Key**:
   - Once logged in, you'll be taken to the dashboard
   - Your API key will be displayed on the dashboard
   - The free plan includes 1 million credits per month (1 credit = 1 RPC request)

3. **Configure Your Application**:
   - Open the `env-config.txt` file in the project root
   - Replace `YOUR_API_KEY` in the `NEXT_PUBLIC_SOLANA_RPC_URL` value with your actual Helius API key
   - Save the file and restart your application

```
# Example env-config.txt
NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_ACTUAL_API_KEY_HERE
```

## Using Different Networks

By default, this application is configured to use Helius for mainnet. If you need to use devnet:

- For mainnet: `https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY`
- For devnet: `https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY`

Remember to update the `NEXT_PUBLIC_NETWORK` value in `env-config.txt` to match the network you're using.

## Security Notes

Always keep your API key private:
- Don't commit your actual API key to version control
- Consider using environment variables when deploying
- For production, set up IP restrictions on your Helius dashboard

## Troubleshooting

If you experience RPC issues:
1. Verify your API key is correct
2. Check your Helius dashboard for usage limits
3. Ensure you're using the correct network endpoint
4. For local development, you can always fall back to public endpoints 