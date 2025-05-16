'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PublicKey, Keypair, Transaction, SystemProgram, Message, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import * as bs58Utils from '../utils/bs58-utils';
import Navigation from '../components/navigation';
import { getConnection, checkAndReturnExpiredFunds, redeemGiftCard } from '../utils/solana';
import { motion, useScroll, useTransform } from 'framer-motion';
import { WalletContextProvider } from '../context/wallet-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fixGiftCardData, fixLocalStorageGiftCards, markRedemptionStart } from '../utils/fix-gift-card-redeem';
import { getThemeById, getThemeByName, allThemes } from '../utils/theme-definitions';
import { getTokenByMint } from '../utils/tokens';
import Image from 'next/image';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Define wallet and endpoint
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta');
const wallets = [new PhantomWalletAdapter()];

// The main form component that needs wallet access
function RedeemGiftCardForm() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  
  const [secretKey, setSecretKey] = useState<string>('');
  const [inputLabel, setInputLabel] = useState<string>('Enter Grantnite Card Secret Key');
  const [inputPlaceholder, setInputPlaceholder] = useState<string>('Paste your Grantnite card SECRET KEY here');
  const [loading, setLoading] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [giftCardData, setGiftCardData] = useState<{
    creator: string;
    recipient: string;
    amount: number;
    isRedeemed: boolean;
    expiryTime: number;
    message: string;
    themeId?: number;
    themeName?: string;
    tokenMint?: string;
    tokenSymbol?: string;
    tokenName?: string;
    creationDate?: number;
    senderName?: string;
  } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionError, setRedemptionError] = useState<string | null>(null);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  const [giftCardPublicKey, setGiftCardPublicKey] = useState<string>('');

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const redeemRef = useRef<HTMLDivElement>(null);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  // Get current theme for display
  const currentTheme = useMemo(() => {
    if (!giftCardData) return null;
    
    // First try exact match by ID
    if (giftCardData.themeId !== undefined) {
      const exactTheme = allThemes.find(theme => theme.id === giftCardData.themeId);
      if (exactTheme) {
        
        return exactTheme;
      }
    }
    
    // Then try exact match by name
    if (giftCardData.themeName) {
      const exactTheme = allThemes.find(theme => theme.name === giftCardData.themeName);
      if (exactTheme) {
        
        return exactTheme;
      }
    }
    
    // Try fuzzy match by name (case insensitive)
    if (giftCardData.themeName) {
      const fuzzyTheme = allThemes.find(
        theme => theme.name.toLowerCase() === giftCardData.themeName?.toLowerCase()
      );
      if (fuzzyTheme) {
        
        return fuzzyTheme;
      }
    }
    
    // Default to theme 0 if nothing matches
    
    return allThemes[0];
  }, [giftCardData]);

  // Add a function to extract token information from parsed JSON data
  const extractTokenInfo = (data: any) => {
    console.log('[DEBUG] Extracting token info from:', data);
    
    try {
      // Get token mint if available
      let tokenMint = data?.tokenMint;
      
      // If it's in JSON format with publicKey and tokenMint
      if (data && typeof data === 'object') {
        if (data.tokenMint) {
          tokenMint = data.tokenMint;
          console.log('[DEBUG] Found tokenMint:', tokenMint);
        }
      }
      
      // If it's a string, try to parse it as JSON
      if (typeof data === 'string') {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData && parsedData.tokenMint) {
            tokenMint = parsedData.tokenMint;
            console.log('[DEBUG] Found tokenMint in parsed string:', tokenMint);
          }
        } catch (e) {
          console.log('[DEBUG] Failed to parse string as JSON:', e);
        }
      }
      
      return { tokenMint };
    } catch (error) {
      console.error('[DEBUG] Error extracting token info:', error);
      return { tokenMint: undefined };
    }
  };

  // Add a function to redirect to the redemption page with proper token info
  const redirectToRedemptionPage = (publicKey: string, tokenMint?: string) => {
    console.log('[DEBUG] Redirecting to redemption page:');
    console.log('[DEBUG] Public Key:', publicKey);
    console.log('[DEBUG] Token Mint:', tokenMint);
    
    let url = `/redeem/${publicKey}`;
    
    // Add token mint as query parameter if available
    if (tokenMint) {
      url += `?tokenMint=${encodeURIComponent(tokenMint)}`;
    }
    
    router.push(url);
  };

  const handleVerifyGiftCard = async () => {
    if (!secretKey) {
      setError('Please enter a gift card key (public key or secret key).');
      return;
    }
    
    setVerifying(true);
    setError(null);
    
    try {
      // Preprocess input - clean up whitespace, quotes, etc.
      const cleanedKey = secretKey.trim()
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes if present
        .replace(/\\"/g, '"')        // Replace escaped quotes with regular quotes
        .replace(/\\n/g, '');        // Remove newline characters
      
      
      
      
      // Add more detailed input validation
      if (cleanedKey.length < 10) {
        setError('The gift card key is too short. Please check and try again.');
        setGiftCardData(null);
        setVerifying(false);
        return;
      }
      
      // Track if we successfully set a public key
      let pubKeySet = false;
      
      // Parse the gift card data from the secret key string
      // The input could be either a public key or a secret key/JSON with gift card data
      let parsedData = null;
      let publicKeyStr = '';
      
      // First, try to parse as a public key directly
      try {
        
        const pubKey = new PublicKey(cleanedKey);
        publicKeyStr = pubKey.toString();
        setGiftCardPublicKey(publicKeyStr);
        pubKeySet = true;
        
        
        // Add this block to validate and process public key directly when it's valid
        // Check if the public key exists and has a balance
        const connection = getConnection();
        const balance = await connection.getBalance(pubKey);
        
        // Check localStorage for previously redeemed cards
        let isRedeemed = false;
        try {
          if (typeof window !== 'undefined') {
            const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards') || '{}';
            const redeemedCards = JSON.parse(redeemedCardsJSON);
            
            if (redeemedCards[publicKeyStr]) {
              
              // Get token mint from params if available
              const tokenInfo = extractTokenInfo(cleanedKey);
              const tokenMint = tokenInfo.tokenMint;
              
              // Only consider it redeemed if there's no token info or the token info matches
              if (tokenMint && redeemedCards[publicKeyStr].tokenMint && 
                  tokenMint !== redeemedCards[publicKeyStr].tokenMint) {
                // Different token type, so don't consider it redeemed
                isRedeemed = false;
                
                // Check if we have a token-specific entry
                const tokenSuffixKey = `${publicKeyStr}_${tokenMint}`;
                if (redeemedCards[tokenSuffixKey]) {
                  isRedeemed = true;
                  setGiftCardData({
                    creator: redeemedCards[tokenSuffixKey].creator || 'Unknown sender',
                    recipient: 'Any wallet',
                    amount: redeemedCards[tokenSuffixKey].amount || (balance / LAMPORTS_PER_SOL),
                    isRedeemed: true,
                    expiryTime: 0,
                    message: redeemedCards[tokenSuffixKey].message || 'Enjoy your gift card!',
                    themeId: redeemedCards[tokenSuffixKey].themeId,
                    themeName: redeemedCards[tokenSuffixKey].themeName,
                    tokenMint: tokenMint,
                    tokenSymbol: redeemedCards[tokenSuffixKey].tokenSymbol,
                    tokenName: redeemedCards[tokenSuffixKey].tokenName,
                    creationDate: redeemedCards[tokenSuffixKey].creationDate,
                    senderName: redeemedCards[tokenSuffixKey].senderName || redeemedCards[tokenSuffixKey].creator || 'Unknown'
                  });
                  setVerifying(false);
                  setError('This gift card has already been redeemed for this token type.');
                  return;
                } else {
                  // Different token, not redeemed - redirect
                  redirectToRedemptionPage(publicKeyStr, tokenMint);
                  return;
                }
              } else {
                isRedeemed = true;
                setGiftCardData({
                  creator: redeemedCards[publicKeyStr].creator || 'Unknown sender',
                  recipient: 'Any wallet',
                  amount: redeemedCards[publicKeyStr].amount || (balance / LAMPORTS_PER_SOL),
                  isRedeemed: true,
                  expiryTime: 0,
                  message: redeemedCards[publicKeyStr].message || 'Enjoy your gift card!',
                  themeId: redeemedCards[publicKeyStr].themeId,
                  themeName: redeemedCards[publicKeyStr].themeName,
                  tokenMint: redeemedCards[publicKeyStr].tokenMint,
                  tokenSymbol: redeemedCards[publicKeyStr].tokenSymbol,
                  tokenName: redeemedCards[publicKeyStr].tokenName,
                  creationDate: redeemedCards[publicKeyStr].creationDate,
                  senderName: redeemedCards[publicKeyStr].senderName || redeemedCards[publicKeyStr].creator || 'Unknown'
                });
                setVerifying(false);
                setError('This gift card has already been redeemed.');
                return;
              }
            }
          }
        } catch (e) {
          
        }
        
        // If not in localStorage, check if balance is below dust threshold
        if (!isRedeemed) {
          const MIN_DUST_THRESHOLD = 10000; // 0.00001 SOL
          isRedeemed = balance <= MIN_DUST_THRESHOLD;
        }
        
        // Make a basic gift card data object from the public key
        let message = 'Enjoy your gift card!';
        let creatorAddress = 'Unknown sender';
        
        try {
          // Try to get creator from transaction history
          const txHistory = await connection.getSignaturesForAddress(pubKey, { limit: 5 });
          if (txHistory && txHistory.length > 0) {
            const firstTx = await connection.getTransaction(txHistory[txHistory.length - 1].signature);
            if (firstTx && firstTx.meta && firstTx.meta.preBalances) {
              for (let i = 0; i < firstTx.transaction.message.accountKeys.length; i++) {
                if (firstTx.meta.preBalances[i] > 0 && 
                    !firstTx.transaction.message.accountKeys[i].equals(pubKey)) {
                  creatorAddress = firstTx.transaction.message.accountKeys[i].toString();
                  break;
                }
              }
            }
          }
        } catch (e) {
          
        }
        
        setGiftCardData({
          creator: creatorAddress,
          recipient: 'Any wallet',
          amount: balance / LAMPORTS_PER_SOL,
          isRedeemed: isRedeemed,
          expiryTime: 0,
          message: message,
          senderName: creatorAddress
        });
        
        if (isRedeemed) {
          setError('This gift card has already been redeemed.');
        }
        
        setVerifying(false);
        return;
      } catch (err) {
        
        // Continue to other formats
      }
      
      // Then try as JSON format
      try {
        
        parsedData = JSON.parse(cleanedKey);
        // Log the parsed data to inspect its content
        
        
        // Fix the gift card data to ensure correct message and senderName
        parsedData = fixGiftCardData(parsedData);
        
        // IMPORTANT: Check if we're using the correct property for sender name 
        if (parsedData.senderName) {
          
        } else if (parsedData.creator) {
          
          // Ensure the senderName is set
          parsedData.senderName = parsedData.creator;
        }
        
        // If this is our gift card format with publicKey/secretKey
        if (parsedData.publicKey && parsedData.secretKey) {
          publicKeyStr = parsedData.publicKey;
          setGiftCardPublicKey(publicKeyStr);
          pubKeySet = true;
          
          // Check if the gift card is expired and handle return of funds
          const expiryResult = await checkAndReturnExpiredFunds(parsedData);
            
          interface ExpiryResult {
            expired: boolean;
            returned?: boolean;
            amount?: number;
            reason?: string;
            error?: string;
          }
          
          // Type cast the result
          if (expiryResult && typeof expiryResult === 'object') {
            const typedResult = expiryResult as unknown as ExpiryResult;
            if (typedResult.expired) {
              if (typedResult.returned) {
                setError(`This gift card has expired and ${typedResult.amount} SOL has been returned to the sender.`);
              } else {
                setError(`This gift card has expired: ${typedResult.reason || typedResult.error || 'Unknown reason'}`);
              }
              setGiftCardData(null);
              setVerifying(false);
              return;
            }
          }
          
          // Check if the gift card has already been redeemed
          const connection = getConnection();
          const balance = await connection.getBalance(new PublicKey(parsedData.publicKey));
          
          // Check localStorage first for previously redeemed cards
          let isRedeemed = false;
          try {
            if (typeof window !== 'undefined') {
              const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards') || '{}';
              const redeemedCards = JSON.parse(redeemedCardsJSON);
              
              // If this card is in our redeemed list, mark it as redeemed regardless of balance
              if (redeemedCards[parsedData.publicKey]) {
                
                isRedeemed = true;
                
                // Get creator/sender name from localStorage if available
                if (redeemedCards[parsedData.publicKey].senderName) {
                  parsedData.senderName = redeemedCards[parsedData.publicKey].senderName;
                }
                
                // Get the message if available
                if (redeemedCards[parsedData.publicKey].message) {
                  parsedData.message = redeemedCards[parsedData.publicKey].message;
                }
                
                // Get theme info if available
                if (redeemedCards[parsedData.publicKey].themeId) {
                  parsedData.themeId = redeemedCards[parsedData.publicKey].themeId;
                }
                
                if (redeemedCards[parsedData.publicKey].themeName) {
                  parsedData.themeName = redeemedCards[parsedData.publicKey].themeName;
                }
              }
            }
          } catch (e) {
            
          }
          
          // If not in localStorage, then check if balance is below dust threshold
          if (!isRedeemed) {
            // If balance is zero or very small (dust), consider the card redeemed
            const MIN_DUST_THRESHOLD = 10000; // 0.00001 SOL
            isRedeemed = balance <= MIN_DUST_THRESHOLD;
          }
          
          if (isRedeemed) {
            setError('This gift card has already been redeemed.');
            setGiftCardData({
              creator: parsedData.senderName || parsedData.createdBy || 'Unknown',
              recipient: 'Any',
              amount: parsedData.amount || 0,
              isRedeemed: true,
              expiryTime: parsedData.expiryTime || 0,
              message: parsedData.message || 'Enjoy your gift card!',
              themeId: parsedData.themeId,
              themeName: parsedData.themeName,
              tokenMint: parsedData.tokenMint,
              tokenSymbol: parsedData.tokenSymbol,
              tokenName: parsedData.tokenName,
              creationDate: parsedData.creationDate,
              senderName: parsedData.senderName || parsedData.createdBy || 'Unknown'
            });
            setVerifying(false);
            return;
          }
          
          // Set gift card data directly if we have it
          if (parsedData.amount) {
            // Determine the creator info with priority to senderName over wallet address
            // We prioritize the senderName field for display
            const creatorInfo = parsedData.senderName || parsedData.createdBy || 'Unknown';
            
            // Ensure the message is preserved exactly as it is in the JSON file
            const message = parsedData.message || 'Enjoy your gift card!';
            
            // Preserve original theme information
            const themeId = parsedData.themeId !== undefined ? parsedData.themeId : 
                           (parsedData.selectedTemplate !== undefined ? parsedData.selectedTemplate : 0);
            const themeName = parsedData.themeName || 
                             (parsedData.selectedTheme ? parsedData.selectedTheme.name : null);
            
            // Redirect to the redemption page with token info
            const tokenInfo = extractTokenInfo(parsedData);
            if (tokenInfo.tokenMint) {
              redirectToRedemptionPage(parsedData.publicKey, tokenInfo.tokenMint);
            } else {
              redirectToRedemptionPage(parsedData.publicKey);
            }
            
            setGiftCardData({
              creator: creatorInfo,
              recipient: 'Any',
              amount: parsedData.amount,
              isRedeemed: false,
              expiryTime: parsedData.expiryTime || 0,
              message: message,
              themeId: themeId,
              themeName: themeName,
              tokenMint: parsedData.tokenMint,
              tokenSymbol: parsedData.tokenSymbol,
              tokenName: parsedData.tokenName,
              creationDate: parsedData.creationDate,
              senderName: parsedData.senderName || parsedData.createdBy || 'Unknown'
            });
            
            // Show warning if expiry date is approaching
            if (parsedData.expiryTime) {
              const now = Math.floor(Date.now() / 1000);
              const daysUntilExpiry = Math.floor((parsedData.expiryTime - now) / 86400); // 86400 seconds in a day
              
              if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                setError(`Warning: This gift card will expire in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.`);
              }
            }
            
            setVerifying(false);
            return;
          }
        } else if (parsedData.publicKey) {
          // Just a public key in JSON format
          publicKeyStr = parsedData.publicKey;
          setGiftCardPublicKey(publicKeyStr);
          pubKeySet = true;
        }
      } catch (e) {
        // Not a JSON format, try as a base58 secret key
        
        try {
          
          // Not a valid public key, see if it's a base58 encoded secret key
          try {
            // This might be a Keypair secret key
            
            
            // First check if the input contains any non-base58 characters
            if (!/^[A-HJ-NP-Za-km-z1-9]+$/.test(cleanedKey)) {
              
              setError('Invalid characters in gift card key. The key should only contain base58 characters (letters and numbers, excluding 0, O, I, and l).');
              setGiftCardData(null);
              setVerifying(false);
              return;
            }
            
            const decodedSecretKey = bs58Utils.decode(cleanedKey);
            
            
            // Check if the decoded data is the right length for a keypair
            if (decodedSecretKey.length !== 64) {
              
              setError(`The gift card key has an invalid format (decoded length: ${decodedSecretKey.length}, expected: 64).`);
              setGiftCardData(null);
              setVerifying(false);
              return;
            }
            
            // Create a keypair from the secret key
            try {
              const keypair = Keypair.fromSecretKey(decodedSecretKey);
              const giftCardPubKey = keypair.publicKey;
              publicKeyStr = giftCardPubKey.toString();
              setGiftCardPublicKey(publicKeyStr);
              pubKeySet = true;
              
              // Redirect to the redemption page which has more sophisticated handling
              // This lets us handle token-aware redemption better
              const tokenInfo = extractTokenInfo(parsedData);
              if (tokenInfo.tokenMint) {
                redirectToRedemptionPage(publicKeyStr, tokenInfo.tokenMint);
              } else {
                redirectToRedemptionPage(publicKeyStr);
              }
              return;
            } catch (keypairError) {
              
              setError('The provided secret key is invalid. Please check that you are using the correct gift card key.');
              setGiftCardData(null);
              setVerifying(false);
              return;
            }
          } catch (err2) {
            
            // Instead of throwing, just log the error and set it in state
            setError('Invalid gift card format. Please check your key and try again.');
            setGiftCardData(null);
            setVerifying(false);
            return;
          }
        } catch (err) {
          
          setError('Unable to recognize the gift card key format. Please check and try again.');
          setGiftCardData(null);
          setVerifying(false);
          return;
        }
      }
      
      // If we couldn't get a public key by any method, fail
      if (!pubKeySet && !publicKeyStr) {
        
        setError('Could not determine gift card public key. Please check your key format.');
        setGiftCardData(null);
        setVerifying(false);
        return;
      }
      
      
      
      // For our newer gift card implementation, we don't need to call getGiftCardData
      // since it's a direct balance transfer. Just check the balance.
      if (!parsedData || !parsedData.amount) {
        // Check the balance to see if it's been redeemed
        const connection = getConnection();
        const balance = await connection.getBalance(new PublicKey(publicKeyStr));
        
        // Check localStorage first for previously redeemed cards
        let isRedeemed = false;
        try {
          if (typeof window !== 'undefined') {
            const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards') || '{}';
            const redeemedCards = JSON.parse(redeemedCardsJSON);
            
            // If this card is in our redeemed list, mark it as redeemed regardless of balance
            if (redeemedCards[publicKeyStr]) {
              
              isRedeemed = true;
              setGiftCardData({
                creator: redeemedCards[publicKeyStr].creator || 'Unknown sender',
                recipient: 'Any wallet',
                amount: redeemedCards[publicKeyStr].amount || (balance / LAMPORTS_PER_SOL),
                isRedeemed: true,
                expiryTime: 0,
                message: redeemedCards[publicKeyStr].message || 'Enjoy your gift card!',
                themeId: redeemedCards[publicKeyStr].themeId,
                themeName: redeemedCards[publicKeyStr].themeName,
                tokenMint: redeemedCards[publicKeyStr].tokenMint,
                tokenSymbol: redeemedCards[publicKeyStr].tokenSymbol,
                tokenName: redeemedCards[publicKeyStr].tokenName,
                creationDate: redeemedCards[publicKeyStr].creationDate,
                senderName: redeemedCards[publicKeyStr].senderName || redeemedCards[publicKeyStr].creator || 'Unknown'
              });
              setError('This gift card has already been redeemed.');
              setVerifying(false);
              return;
            }
          }
        } catch (e) {
          
        }
        
        // If not in localStorage, then check if balance is below dust threshold
        if (!isRedeemed) {
          // Consider the card redeemed if balance is below dust threshold
          const MIN_DUST_THRESHOLD = 10000; // 0.00001 SOL
          isRedeemed = balance <= MIN_DUST_THRESHOLD;
        }
        
        // Extract potential message and creator from tx history if not in parsedData
        let message = parsedData?.message || 'Enjoy your gift card!';
        let creatorAddress = 'Unknown sender';
        
        try {
          // Check for any existing gift card data or recent transactions
          const txHistory = await connection.getSignaturesForAddress(new PublicKey(publicKeyStr), { limit: 5 });
          if (txHistory && txHistory.length > 0) {
            // Use the first transaction's signature to identify the creator
            const firstTx = await connection.getTransaction(txHistory[txHistory.length - 1].signature);
            if (firstTx && firstTx.meta && firstTx.meta.preBalances) {
              // The first account that had a balance before the transaction is likely the creator
              for (let i = 0; i < firstTx.transaction.message.accountKeys.length; i++) {
                if (firstTx.meta.preBalances[i] > 0 && 
                    !firstTx.transaction.message.accountKeys[i].equals(new PublicKey(publicKeyStr))) {
                  creatorAddress = firstTx.transaction.message.accountKeys[i].toString();
                  break;
                }
              }
            }
          }
        } catch (e) {
          
        }
        
        // Make best attempt to use actual data instead of hardcoded values
        setGiftCardData({
          creator: parsedData?.createdBy || parsedData?.senderName || creatorAddress,
          recipient: 'Any wallet',
          amount: balance / LAMPORTS_PER_SOL,
          isRedeemed: isRedeemed,
          expiryTime: 0,
          message: parsedData?.message || message,
          themeId: parsedData?.themeId,
          themeName: parsedData?.themeName,
          tokenMint: parsedData?.tokenMint,
          tokenSymbol: parsedData?.tokenSymbol,
          tokenName: parsedData?.tokenName,
          creationDate: parsedData?.creationDate,
          senderName: parsedData?.senderName || parsedData?.createdBy || creatorAddress
        });
        
        if (isRedeemed) {
          setError('This gift card has already been redeemed.');
        }
      }
    } catch (err) {
      
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Invalid gift card format. Please check your key and try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          errorMessage = 'The gift card key format is invalid. Please use either the PUBLIC KEY or the SECRET KEY.';
        } else if (err.message.includes('base58')) {
          errorMessage = 'The gift card key format is invalid. It does not appear to be in a valid Solana key format.';
        } else if (err.message.includes('public key')) {
          errorMessage = 'The gift card key could not be recognized as a valid Solana public key.';
        } else if (err.message.includes('decode')) {
          errorMessage = 'Unable to decode the gift card key. Please make sure you are using the correct key.';
        } else if (err.message.includes('Invalid input')) {
          errorMessage = 'The gift card key input appears to be invalid or empty.';
        }
      }
      
      setError(errorMessage);
      setGiftCardData(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleRedeem = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first.');
      return;
    }
    
    if (!giftCardData) {
      setError('Please verify a gift card first.');
      return;
    }
    
    // Prevent trying to redeem an already redeemed gift card
    if (giftCardData.isRedeemed) {
      setError('This gift card has already been redeemed.');
      return;
    }
    
    // Check if giftCardPublicKey is set
    if (!giftCardPublicKey) {
      setError('Gift card public key is missing. Please verify the card again.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setIsRedeeming(true);
      setRedemptionError(null);
      
      
      
      try {
        // Mark redemption attempt in local storage
        markRedemptionStart(giftCardPublicKey);

        // Create a clean wallet object with just the essential properties
        const walletAdapter = {
          publicKey,
          sendTransaction
        };
        
        // Call our redemption function (which now just does a simple transaction)
        const signature = await redeemGiftCard(
          walletAdapter, 
          new PublicKey(giftCardPublicKey),
          giftCardData
        );
        
        
        
        // Update UI state to show redemption as successful
        setGiftCardData({
          ...giftCardData,
          isRedeemed: true
        });
        
        // Show success message
        setSuccess(true);
        setRedemptionSuccess(true);
        
        // Mark as redeemed in local storage
        try {
          // Update history if we have any
          const historyStr = localStorage.getItem('giftCardHistory') || '[]';
          const history = JSON.parse(historyStr);
          
          const updatedHistory = history.map((card: any) => {
            if (card.publicKey === giftCardPublicKey) {
              return { ...card, isRedeemed: true };
            }
            return card;
          });
          
          localStorage.setItem('giftCardHistory', JSON.stringify(updatedHistory));
          
          // Update redeemedGiftCards record
          const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards') || '{}';
          const redeemedCards = JSON.parse(redeemedCardsJSON);
          
          // Check if we need to create a token-specific entry
          const tokenMint = giftCardData.tokenMint;
          const giftCardKey = giftCardPublicKey;
          
          if (tokenMint && redeemedCards[giftCardKey] && 
              redeemedCards[giftCardKey].tokenMint && 
              tokenMint !== redeemedCards[giftCardKey].tokenMint) {
            // This is a different token type, so store with the token mint as a suffix
            const tokenKey = `${giftCardKey}_${tokenMint}`;
            redeemedCards[tokenKey] = {
              redeemed: true,
              timestamp: Date.now(),
              amount: giftCardData.amount,
              creator: giftCardData.creator,
              message: giftCardData.message,
              themeId: giftCardData.themeId,
              themeName: giftCardData.themeName,
              senderName: giftCardData.senderName || giftCardData.creator,
              tokenMint: giftCardData.tokenMint,
              tokenSymbol: giftCardData.tokenSymbol,
              tokenName: giftCardData.tokenName,
              creationDate: giftCardData.creationDate,
              signature: signature
            };
          } else {
            // Normal entry
            redeemedCards[giftCardPublicKey] = {
              redeemed: true,
              timestamp: Date.now(),
              amount: giftCardData.amount,
              creator: giftCardData.creator,
              message: giftCardData.message,
              themeId: giftCardData.themeId,
              themeName: giftCardData.themeName,
              senderName: giftCardData.senderName || giftCardData.creator,
              tokenMint: giftCardData.tokenMint,
              tokenSymbol: giftCardData.tokenSymbol,
              tokenName: giftCardData.tokenName,
              creationDate: giftCardData.creationDate,
              signature: signature
            };
          }
          
          localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
          
        } catch (storageError) {
          
          // Continue anyway since the redemption was successful
        }
        
        // Scroll to success message
        if (redeemRef.current) {
          redeemRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (txError: any) {
        
        
        let errorMessage = 'Could not complete the redemption.';
        
        // Try to provide a helpful error message
        if (txError instanceof Error) {
          errorMessage = txError.message;
          
          // Special handling for wallet connection issues
          if (errorMessage.includes('Wallet error') || 
              errorMessage.includes('Unexpected error') ||
              errorMessage.includes('WalletSendTransactionError')) {
            
            errorMessage = 'There was an issue with your wallet connection. Try disconnecting and reconnecting your wallet.';
          }
          // Handle other specific error types
          else if (errorMessage.includes('insufficient funds')) {
            errorMessage = 'Your wallet does not have enough SOL to complete this transaction.';
          }
          else if (errorMessage.includes('rejected')) {
            errorMessage = 'You rejected the transaction. Please try again if you want to redeem this gift card.';
          }
          else if (errorMessage.includes('timeout')) {
            errorMessage = 'The transaction timed out. The Solana network might be congested, please try again.';
          }
        }
        
        setRedemptionError(errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred during redemption';
      
      setRedemptionError(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsRedeeming(false);
    }
  };

  // Load gift card data when connected and verified
  useEffect(() => {
    // When component mounts, run a fix for any existing gift card data
    try {
      const giftCardData = localStorage.getItem('latestGiftCard');
      if (giftCardData) {
        const parsedCard = JSON.parse(giftCardData);
        
        // Fix missing sender name
        if (!parsedCard.senderName && parsedCard.createdBy) {
          parsedCard.senderName = parsedCard.createdBy;
          localStorage.setItem('latestGiftCard', JSON.stringify(parsedCard));
          
        }
      }
      
      // Fix redeemed cards
      const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards') || '{}';
      const redeemedCards = JSON.parse(redeemedCardsJSON);
      let changed = false;
      
      Object.keys(redeemedCards).forEach(key => {
        // Fix missing senderName
        if (!redeemedCards[key].senderName && redeemedCards[key].creator) {
          redeemedCards[key].senderName = redeemedCards[key].creator;
          changed = true;
        }
        
        // Fix creator field if it's a wallet address
        if (redeemedCards[key].senderName && 
            redeemedCards[key].creator && 
            redeemedCards[key].creator.startsWith('A') && 
            redeemedCards[key].creator.length > 30) {
          redeemedCards[key].creator = redeemedCards[key].senderName;
          changed = true;
        }
      });
      
      if (changed) {
        localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
        
      }
    } catch (err) {
      
    }
  }, []);

  // Add useEffect to fix localStorage data on component mount
  useEffect(() => {
    // Fix any existing gift card data in localStorage
    fixLocalStorageGiftCards();
  }, []);

  // Add useEffect to debug theme information when gift card data changes
  useEffect(() => {
    if (giftCardData) {
      // Clean any overflowing HTML or scripts from message content
      if (giftCardData.message && (
          giftCardData.message.includes('<') || 
          giftCardData.message.includes('>') || 
          giftCardData.message.includes('&lt;') || 
          giftCardData.message.includes('&gt;')
      )) {
        // Simple sanitization - just remove potential HTML/script tags
        const cleanedMessage = giftCardData.message
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&lt;[^&]*&gt;/g, '') // Remove encoded HTML tags
          .replace(/javascript:/gi, '') // Remove javascript: URLs
          .replace(/on\w+=/gi, ''); // Remove event handlers
        
        if (cleanedMessage !== giftCardData.message) {
          
          setGiftCardData({
            ...giftCardData,
            message: cleanedMessage
          });
        }
      }
    }
  }, [giftCardData, currentTheme]);

  // Function to force theme refresh for debugging
  const forceThemeRefresh = () => {
    if (!giftCardData) return;
    
    // Try each theme to see which one looks right
    const themeToTry = allThemes.find(t => t.id === 0); // Classic theme
    
    
    
    // Force update with the theme ID
    setGiftCardData({
      ...giftCardData,
      themeId: themeToTry?.id,
      themeName: themeToTry?.name
    });
  };
  
  // Call once for automatic fixing if theme is default but shouldn't be
  useEffect(() => {
    if (giftCardData && currentTheme && currentTheme.id === 0 && 
        (giftCardData.themeId !== 0 || (giftCardData.themeName && giftCardData.themeName !== 'classic'))) {
      
      
      // Try to find a better theme to use
      for (const theme of allThemes) {
        // If any property matches, try using that theme instead
        if (theme.id === giftCardData.themeId || 
            theme.name === giftCardData.themeName || 
            theme.name.toLowerCase() === giftCardData.themeName?.toLowerCase()) {
          
          
          // Immediately update with this theme
          setGiftCardData({
            ...giftCardData,
            themeId: theme.id,
            themeName: theme.name
          });
          return;
        }
      }
    }
  }, [giftCardData, currentTheme, allThemes]);

  const displayGiftCardDetails = (giftCardData: any) => {
    if (!giftCardData) return null;
    
    const tokenInfo = giftCardData.tokenMint 
      ? getTokenByMint(giftCardData.tokenMint) 
      : null;
    
    const tokenSymbol = giftCardData.tokenSymbol || tokenInfo?.symbol || 'SOL';
    const tokenName = giftCardData.tokenName || tokenInfo?.name || 'Solana';
    
    return (
      <div className="space-y-4 bg-gray-800/50 p-4 rounded-md border border-foreground/30">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold">Gift Card Details</h3>
          <div className="text-right">
            <div className="text-sm text-foreground/70">Amount</div>
            <div className="text-lg font-bold">{giftCardData.amount} {tokenSymbol}</div>
          </div>
        </div>
        
        <div className="text-sm text-foreground/70">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-span-1">Status:</div>
            <div className="col-span-2">
              {giftCardData.isRedeemed ? (
                <span className="text-destructive">Redeemed</span>
              ) : (
                <span className="text-green-500">Available</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="col-span-1">Token:</div>
            <div className="col-span-2">
              {tokenSymbol} ({tokenName})
            </div>
          </div>
          
          {giftCardData.senderName && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="col-span-1">From:</div>
              <div className="col-span-2">{giftCardData.senderName}</div>
            </div>
          )}
          
          {giftCardData.expiryTime > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="col-span-1">Expires:</div>
              <div className="col-span-2">
                {new Date(giftCardData.expiryTime * 1000).toLocaleDateString()}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">Created:</div>
            <div className="col-span-2">
              {giftCardData.creationDate 
                ? new Date(giftCardData.creationDate).toLocaleDateString() 
                : 'Unknown'}
            </div>
          </div>
        </div>
        
        {giftCardData.message && (
          <div className="border-t border-foreground/30 pt-3 mt-3">
            <div className="text-sm text-foreground/70 mb-1">Message:</div>
            <div className="text-sm italic">{giftCardData.message}</div>
          </div>
        )}
      </div>
    );
  };

  // Add TokenDetails component
  const TokenDetails = ({ giftCardData }: { giftCardData: any }) => {
    if (!giftCardData) return null;

    const tokenInfo = giftCardData.tokenMint 
      ? getTokenByMint(giftCardData.tokenMint) 
      : null;
    
    const tokenSymbol = giftCardData.tokenSymbol || tokenInfo?.symbol || 'SOL';
    const tokenName = giftCardData.tokenName || tokenInfo?.name || 'Solana';
    const logoURI = tokenInfo?.logoURI || 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';

    return (
      <div className="w-full rounded-lg bg-black p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
              <Image 
                src={logoURI} 
                alt={tokenSymbol} 
                width={32} 
                height={32} 
              />
            </div>
            <div>
              <div className="text-white font-medium">{tokenSymbol}</div>
              <div className="text-white/60 text-sm">{tokenName}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/70 text-xs uppercase mb-1">AMOUNT</div>
            <div className="text-white text-2xl font-bold">
              {typeof giftCardData.amount === 'number' 
                ? giftCardData.amount.toFixed(6).replace(/\.?0+$/, '')
                : '0'} {tokenSymbol}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <section 
        ref={heroRef}
        className="min-h-[70vh] flex flex-col justify-center items-center pt-32 pb-20 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.1),transparent_50%)]"></div>
        <motion.div 
          className="container text-center relative z-10"
          style={{ opacity: heroOpacity, y: heroY }}
        >
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="mb-8"
          >
            Redeem Your <span className="text-accent">Grantnite</span> Card
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-xl max-w-xl mx-auto text-gray-300 leading-relaxed"
          >
            Enter your Grantnite card secret key to redeem your funds securely.
          </motion.p>
        </motion.div>
      </section>
      
      <section className="section-spacing" ref={redeemRef}>
        <div className="container max-w-3xl">
          {!connected && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glow-card mb-12 text-center"
            >
              <p className="mb-8 text-lg text-gray-300">
                Please connect your wallet to redeem a gift card.
              </p>
              <div className="btn btn-primary">
                <WalletMultiButton />
              </div>
            </motion.div>
          )}
          
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-l-4 border-destructive pl-4 py-3 mb-12 bg-destructive/10"
            >
              <p className="text-destructive">{error}</p>
              {error.includes('balance') && error.includes('low') && (
                <div className="mt-4 text-sm text-gray-300">
                  <p className="font-semibold mb-2">Why this happens:</p>
                  <p className="mb-2">
                    Solana requires a small amount of SOL to be left in accounts as "rent exemption." 
                    When redeeming low-value gift cards, there might not be enough SOL to cover both the 
                    rent exemption and transaction fees.
                  </p>
                  <p>
                    <strong>Solution:</strong> Add a small amount of SOL (0.01 SOL is enough) to your 
                    wallet to cover transaction fees, then try again.
                  </p>
                </div>
              )}
            </motion.div>
          )}
          
          {success ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-background"
            >
              <div className="text-center mb-16">
                <h2 className="text-2xl text-[rgb(var(--primary))] font-bold mb-6">
                  Grantnite Card Redeemed
                </h2>
                <div className="w-20 h-px bg-accent mx-auto mb-8"></div>
                <p className="text-lg max-w-md mx-auto text-gray-300">
                  The funds have been successfully transferred to your wallet.
                </p>
              </div>
              
              {giftCardData && (
                <div className="mb-16 glow-card">
                  <TokenDetails giftCardData={giftCardData} />
                  {displayGiftCardDetails(giftCardData)}
                </div>
              )}
              
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 justify-center">
                <button
                  onClick={() => {
                    setSuccess(false);
                    setGiftCardData(null);
                    setSecretKey('');
                  }}
                  className="btn btn-primary"
                >
                  Redeem Another Grantnite Card
                </button>
                
                <Link href="/my-cards" className="btn btn-secondary text-center">
                  Go to My Cards
                </Link>
              </div>
            </motion.div>
          ) : (
            <div>
              {giftCardData && !giftCardData.isRedeemed ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-12"
                >
                  <div className="mb-16 glow-card">
                    <TokenDetails giftCardData={giftCardData} />
                    {displayGiftCardDetails(giftCardData)}
                  </div>
                  
                  <button
                    onClick={handleRedeem}
                    disabled={loading || !connected}
                    className="btn btn-primary w-full"
                  >
                    {loading ? "Redeeming..." : "Redeem Grantnite Card"}
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="mb-16"
                >
                  <h2 className="text-3xl mb-12">{inputLabel}</h2>
                  
                  <div className="mb-8 w-full">
                    <textarea
                      className="w-full bg-black text-white border border-white p-4 resize-none h-32 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder={inputPlaceholder}
                    />
                    
                    <div className="mt-4 text-sm text-gray-400">
                      <p className="mb-2"><strong>Please enter your SECRET KEY:</strong></p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>This is a long string of characters provided in your gift card email</li>
                        <li>It might be a Base58 string or a JSON object containing gift card details</li>
                      </ul>
                      <p className="mt-3 text-xs border-t border-gray-700 pt-3">
                        <strong>Security Note:</strong> Your gift card is protected by this secret key. Only someone with the secret key can redeem the funds to their wallet. Keep this key confidential.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleVerifyGiftCard}
                    disabled={verifying || !secretKey}
                    className="btn btn-primary w-full"
                  >
                    {verifying ? "Verifying..." : "Verify Grantnite Card"}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function RedeemGiftCard() {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <WalletContextProvider>
            <RedeemGiftCardForm />
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 