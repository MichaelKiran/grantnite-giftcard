/**
 * Direct Solana transaction functions (No backend required)
 */

import { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { createGiftCard, generateKeypair, PROGRAM_ID } from './solana';
import * as bs58Utils from './bs58-utils';
import { BN } from 'bn.js';

// Define types for API responses and requests
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorDetails?: any;
}

interface GiftCardCreateRequest {
  amount: number;
  message: string;
  senderName?: string;
  expiryTime?: number;
  tokenMint?: string;
  tokenSymbol?: string;
  tokenName?: string;
  themeId?: number;
  senderPublicKey: string;
}

interface GiftCardData {
  id: string;
  publicKey: string;
  secretKey: string;
  amount: number;
  message: string;
  senderName?: string;
  expiryTime?: number;
  tokenMint?: string;
  tokenSymbol?: string;
  tokenName?: string;
  themeId?: number;
  createdAt: number;
  redeemed?: boolean;
  redeemedAt?: number;
  url?: string;
  signature?: string;
  giftCardId?: string;
  transaction?: Transaction;
}

/**
 * Create a gift card directly using Solana on-chain transactions
 * @param data The data for creating the gift card
 * @returns A promise that resolves to the API response
 */
export async function createGiftCardViaAPI(data: GiftCardCreateRequest): Promise<ApiResponse<GiftCardData>> {
  try {
    
    
    
    // Connect to Solana network
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    // Generate a new keypair for the gift card
    const giftCardKeypair = generateKeypair();
    
    // Create a new gift card account directly on-chain
    try {
      // Convert data to the format expected by createGiftCard
      const amount = new BN(Math.floor(data.amount * 1e9)); // Convert to lamports
      const expiryTime = data.expiryTime ? new BN(data.expiryTime) : new BN(0);
      const message = data.message;
      const senderPublicKey = new PublicKey(data.senderPublicKey);
      
      // Create a transaction for the gift card creation
      // This will just return a mock signature since we can't sign transactions server-side
      const signature = await createGiftCard(
        connection,
        senderPublicKey,
        giftCardKeypair,
        amount,
        message,
        expiryTime,
        data.tokenMint ? new PublicKey(data.tokenMint) : undefined
      );

      // Create a unique ID for the gift card
      const giftCardId = `gift-${bs58Utils.encode(giftCardKeypair.publicKey.toBytes()).substring(0, 8)}`;
      
      // Format the result
      const result: GiftCardData = {
        id: giftCardId,
        publicKey: giftCardKeypair.publicKey.toString(),
        secretKey: bs58Utils.encode(giftCardKeypair.secretKey),
        amount: data.amount,
        message: data.message,
        senderName: data.senderName,
        expiryTime: data.expiryTime || 0,
        tokenMint: data.tokenMint,
        tokenSymbol: data.tokenSymbol || 'SOL',
        tokenName: data.tokenName || 'Solana',
        themeId: data.themeId,
        createdAt: Date.now(),
        redeemed: false,
        giftCardId: giftCardId,
        signature: signature
      };

      // Now create and send a real transaction to fund the gift card
      // This should be done using the user's wallet in the frontend
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPublicKey;
      
      // Add transfer instruction
      if (data.tokenMint) {
        // If tokenMint is provided, we're working with an SPL token, not SOL
        const tokenMintPubkey = new PublicKey(data.tokenMint);
        
        // Import TOKENS array to get token information and decimals
        const { TOKENS, getTokenByMint } = await import('./tokens');
        
        // Get token information including decimals
        const tokenInfo = getTokenByMint(data.tokenMint);
        
        // Get token decimals - default to 6 for most tokens if not specified
        const decimals = tokenInfo?.decimals || 6;
        const tokenAmount = Math.floor(data.amount * Math.pow(10, decimals));
        
        // First create an ATA (Associated Token Account) for the gift card account if it doesn't exist
        // We use the getAssociatedTokenAddress and createAssociatedTokenAccountInstruction functions
        // from the token-utils.ts file
        const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } = await import('./token-utils');
        
        // Get the sender's token account
        const senderTokenAccount = await getAssociatedTokenAddress(
          tokenMintPubkey,
          senderPublicKey
        );
        
        // Get the gift card's token account
        const giftCardTokenAccount = await getAssociatedTokenAddress(
          tokenMintPubkey,
          giftCardKeypair.publicKey
        );
        
        // Create the gift card token account if it doesn't exist
        transaction.add(
          createAssociatedTokenAccountInstruction(
            senderPublicKey, // payer
            giftCardTokenAccount, // associated token account
            giftCardKeypair.publicKey, // owner
            tokenMintPubkey // mint
          )
        );
        
        // Import createTransferInstruction function
        const { createTransferInstruction } = await import('./token-utils');
        
        // Add the transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount, // source
            giftCardTokenAccount, // destination
            senderPublicKey, // owner
            BigInt(tokenAmount) // amount as BigInt
          )
        );
        
        // Update the result to include token information
        result.tokenMint = data.tokenMint;
      } else {
        // Standard SOL transfer instruction
        const transferInstruction = SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: giftCardKeypair.publicKey,
          lamports: amount.toNumber(),
        });
        
        transaction.add(transferInstruction);
      }
      
      // Instead of trying to sign here, we return the transaction to be signed by the frontend
      result.transaction = transaction;

      return {
        success: true,
        data: result
      };
    } catch (error) {
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating gift card',
        errorDetails: {
          code: 'TRANSACTION_ERROR',
          originalError: error instanceof Error ? error.message : String(error)
        }
      };
    }
  } catch (error) {
    
    
    // Determine the specific error type and provide better messages
    let errorMessage = 'An unknown error occurred while creating the gift card.';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = 'TRANSACTION_ERROR';
      
      // Check for specific error types
      if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds in your wallet to create this gift card.';
        errorCode = 'INSUFFICIENT_FUNDS';
      } else if (error.message.includes('failed to send transaction')) {
        errorMessage = 'Failed to send transaction to the Solana network. Please check your wallet connection and try again.';
        errorCode = 'SEND_TRANSACTION_ERROR';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      errorDetails: { 
        code: errorCode, 
        originalError: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Get a gift card by its ID - As this is now a decentralized app, we get the data directly from the chain
 * @param id The ID of the gift card to retrieve (public key in string form)
 * @returns A promise that resolves to the API response
 */
export async function getGiftCardById(id: string): Promise<ApiResponse<GiftCardData>> {
  try {
    
    
    // Connect to Solana network
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    // The ID is actually the public key of the gift card account
    const publicKey = new PublicKey(id);
    
    // Fetch the account data from the blockchain
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      return {
        success: false,
        error: 'Gift card not found on the blockchain',
        errorDetails: {
          code: 'GIFT_CARD_NOT_FOUND'
        }
      };
    }
    
    // Deserialize the account data - this would need to match your actual program's data structure
    // For now, we'll just return a placeholder with the public key
    const giftCardData: GiftCardData = {
      id: id,
      publicKey: id,
      secretKey: '', // We don't return the secret key when reading
      amount: 0, // These would be properly deserialized from account data
      message: 'Gift card data would be deserialized from on-chain account',
      createdAt: Date.now(),
      redeemed: false
    };
    
    return {
      success: true,
      data: giftCardData
    };
  } catch (error) {
    
    
    return {
      success: false,
      error: error instanceof Error ? 
        error.message : 
        'Failed to fetch gift card data from the blockchain',
      errorDetails: {
        code: 'BLOCKCHAIN_READ_ERROR',
        originalError: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Redeem a gift card directly on the blockchain
 * @param id The public key of the gift card to redeem
 * @param recipientPublicKey The public key of the recipient
 * @returns A promise that resolves to the API response
 */
export async function redeemGiftCard(
  id: string, 
  recipientPublicKey: string
): Promise<ApiResponse<any>> {
  try {
    
    
    // Connect to Solana network
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );

    const giftCardPubkey = new PublicKey(id);
    const recipient = new PublicKey(recipientPublicKey);
    
    // This would call your Solana program's redeem instruction
    // For now, we'll just return a mock success response
    
    return {
      success: true,
      data: {
        id,
        redeemed: true,
        redeemedAt: Date.now(),
        recipientPublicKey,
        // This would be the actual transaction signature
        signature: 'mock-transaction-signature'
      }
    };
  } catch (error) {
    
    
    return {
      success: false,
      error: error instanceof Error ? 
        error.message : 
        'Failed to redeem gift card on the blockchain',
      errorDetails: {
        code: 'BLOCKCHAIN_TRANSACTION_ERROR',
        originalError: error instanceof Error ? error.message : String(error)
      }
    };
  }
} 