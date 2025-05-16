'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import Navigation from '../components/navigation';
import Link from 'next/link';
import { 
  createGiftCard, 
  sendEmailNotification, 
  getConnection,
  generateKeypair,
  PROGRAM_ID
} from '../utils/solana';
import { BN } from 'bn.js';
import * as borsh from 'borsh';
import * as bs58Utils from '../utils/bs58-utils';
import { WalletContextProvider } from '../context/wallet-context';
import { cardTemplates, occasionThemes, GiftCardTheme, getThemeById } from '../utils/theme-definitions';
import SuccessModal from '../components/success-modal';
import { TOKENS, TokenInfo } from '../utils/tokens';
import { getAssociatedTokenAddress, getTokenBalance } from '../utils/token-utils';
import { connectPhantomDirect, getPhantomStatus } from '../utils/wallet-helper';
import { createGiftCardViaAPI } from '../utils/api';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Import wallet polyfill at the top of the file
import '../utils/wallet-polyfill';

// Main form component that needs wallet access
function GiftCardForm() {
  const router = useRouter();
  const { connected, publicKey, sendTransaction, wallet, disconnect } = useWallet();
  
  const [amount, setAmount] = useState('0.01');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<GiftCardTheme | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [sufficientAmount, setSufficientAmount] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [tokenBalances, setTokenBalances] = useState<{[key: string]: string}>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [isWalletVerified, setIsWalletVerified] = useState(false);
  const [createdGiftCardData, setCreatedGiftCardData] = useState<any>(null);
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  
  // Calculate remaining characters for message
  const MAX_MESSAGE_LENGTH = 256;
  const remainingChars = MAX_MESSAGE_LENGTH - message.length;
  
  // Configure Solana endpoint - move hooks before conditional
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  []);
  
  // Fetch token balances when wallet is connected
  useEffect(() => {
    async function fetchTokenBalances() {
      if (!connected || !publicKey) return;
      
      try {
        setIsLoadingBalances(true);
        const connection = new Connection(
          endpoint,
          'confirmed'
        );
        
        // First get SOL balance
        const solBalance = await connection.getBalance(publicKey);
        const balances: {[key: string]: string} = {
          "So11111111111111111111111111111111111111112": (solBalance / LAMPORTS_PER_SOL).toFixed(4)
        };
        
        // Then check each token
        for (const token of TOKENS) {
          if (token.symbol === 'SOL') continue; // Already handled above
          
          try {
            const tokenAccount = await getAssociatedTokenAddress(
              new PublicKey(token.mintAddress), 
              publicKey
            );
            
            const accountInfo = await connection.getAccountInfo(tokenAccount);
            if (accountInfo) {
              const tokenBalance = await getTokenBalance(connection, tokenAccount);
              balances[token.mintAddress] = (Number(tokenBalance) / Math.pow(10, token.decimals)).toFixed(token.decimals > 4 ? 4 : token.decimals);
            } else {
              balances[token.mintAddress] = '0';
            }
          } catch (e) {
            
            balances[token.mintAddress] = '0';
          }
        }
        
        setTokenBalances(balances);
      } catch (e) {
        
      } finally {
        setIsLoadingBalances(false);
      }
    }
    
    fetchTokenBalances();
  }, [connected, publicKey, endpoint]);
  
  // Add a use effect to verify wallet before allowing transactions
  useEffect(() => {
    let isMounted = true;
    
    const verifyWallet = async () => {
      if (!connected || !publicKey) {
        if (isMounted) setIsWalletVerified(false);
        return;
      }
      
      try {
        const connection = new Connection(
          endpoint,
          'confirmed'
        );
        
        // Check if the wallet is valid by fetching its balance
        const balance = await connection.getBalance(publicKey);
        
        
        if (isMounted) setIsWalletVerified(true);
      } catch (e) {
        
        if (isMounted) {
          setIsWalletVerified(false);
          
          // If we can't verify wallet, try disconnecting and reconnecting
          try {
            if (disconnect) await disconnect();
            setTimeout(async () => {
              if (wallet?.adapter?.connect) {
                await wallet.adapter.connect();
              }
            }, 1000);
          } catch (err) {
            
          }
        }
      }
    };
    
    verifyWallet();
    
    // Re-verify when connection state changes
    const interval = setInterval(verifyWallet, 10000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [connected, publicKey, wallet, disconnect, endpoint]);
  
  // Check if sufficient amount is entered
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    
    
    
    
    
    
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    if (!isWalletVerified) {
      setError('Wallet connection verification failed. Please disconnect and reconnect your wallet.');
      return;
    }
    
    if (!sufficientAmount) {
      setError('Minimum amount is 0.01');
      return;
    }
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      setError(`Message is too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`);
      return;
    }
    
    if (!message || message.trim() === '') {
      setError('Please enter a message for the gift card');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      try {
        
        
        // Create a connection to the Solana network
        const connection = new Connection(
          endpoint,
          'confirmed'
        );
        
        const amountNumber = parseFloat(amount);
        
        // Calculate the commission (1%)
        const commission = amountNumber * 0.01; // 1% commission
        const transferAmount = amountNumber - commission;
        
        
        
        
        
        
        
        // Calculate expiry time from date if provided
        let expiryTime = 0;
        if (expiryDate) {
          expiryTime = Math.floor(new Date(expiryDate).getTime() / 1000);
        }
        
        // Get theme ID from the selected theme or template
        const themeId = selectedTheme ? selectedTheme.id : selectedTemplate;
        
        // Get token mint if selected
        const tokenMint = selectedToken ? selectedToken.mintAddress : undefined;
        const tokenSymbol = selectedToken ? selectedToken.symbol : undefined;
        const tokenName = selectedToken ? selectedToken.name : undefined;
        
        // Prepare API request data
        const apiData = {
          amount: transferAmount,
          message,
          senderName: senderName || undefined,
          expiryTime: expiryTime || undefined,
          tokenMint,
          tokenSymbol,
          tokenName,
          themeId,
          senderPublicKey: publicKey.toString()
        };
        
        
        
        // Use the new backend API to create the gift card
        const response = await createGiftCardViaAPI(apiData);
        
        if (!response.success) {
          
          
          // Handle specific API error types
          if (response.errorDetails && response.errorDetails.code === 'API_UNREACHABLE') {
            throw new Error(`Unable to connect to the gift card service. Please check your internet connection and try again. (Server: ${response.errorDetails.apiUrl})`);
          } else if (response.errorDetails && response.errorDetails.code === 'NETWORK_ERROR') {
            throw new Error('Network connection error: Unable to reach the gift card service. Please check your internet connection or try again later.');
          } else if (response.errorDetails && response.errorDetails.code === 'TIMEOUT_ERROR') {
            throw new Error('The gift card service is taking too long to respond. Please try again later when the network is less congested.');
          }
          
          // General API error
          throw new Error(response.error || 'Failed to create gift card');
        }
        
        
        
        // Check if the response includes a transaction to sign
        if (response.data && response.data.transaction) {
          
          
          try {
            // Send the transaction using the wallet adapter
            const sendOptions = {
              skipPreflight: false,
              preflightCommitment: 'processed' as const
            };
            
            // Send the transaction - this will prompt the user to sign it
            const signature = await sendTransaction(response.data.transaction, connection, sendOptions);
            
            
            // Wait for confirmation with increased timeout and better handling
            try {
              // Use a longer timeout for confirmation (60 seconds instead of default 30)
              const latestBlockhash = await connection.getLatestBlockhash('finalized');
              const confirmationStatus = await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
              }, 'processed');
              
              if (confirmationStatus.value && confirmationStatus.value.err) {
                throw new Error(`Transaction failed: ${confirmationStatus.value.err}`);
              }
              
              
            } catch (confirmError: any) {
              
              
              // Special handling for timeout errors
              if (confirmError.message && confirmError.message.includes('was not confirmed')) {
                
                
                // Store the signature for later verification
                const transactionSignature = signature;
                
                // Check if the transaction was actually successful despite the timeout
                try {
                  const status = await connection.getSignatureStatus(transactionSignature);
                  
                  
                  if (status && status.value !== null) {
                    if (status.value.err) {
                      // Transaction failed
                      throw new Error(`Transaction failed after timeout: ${status.value.err}`);
                    } else if (status.value.confirmationStatus === 'processed' || 
                              status.value.confirmationStatus === 'confirmed' || 
                              status.value.confirmationStatus === 'finalized') {
                      // Transaction succeeded despite timeout
                      
                      // Continue with success path
                    } else {
                      // Unknown status
                      throw new Error(`Transaction has unknown status: ${status.value.confirmationStatus}`);
                    }
                  } else {
                    // Cannot determine status, but transaction might still be valid
                    // We'll assume it might still process and provide a link for checking
                    const explorerUrl = getExplorerUrl(transactionSignature);
                    throw new Error(
                      `Your transaction timed out, but may still be processing. ` +
                      `Check status using this signature: ${transactionSignature.slice(0, 8)}...${transactionSignature.slice(-8)} ` +
                      `or view it in the <a href="${explorerUrl}" target="_blank" class="underline">Solana Explorer</a>`
                    );
                  }
                } catch (statusError) {
                  // Failed to get status, but transaction might still be valid
                  const explorerUrl = getExplorerUrl(transactionSignature);
                  throw new Error(
                    `Your transaction timed out, but may still be processing. ` +
                    `Check status using this signature: ${transactionSignature.slice(0, 8)}...${transactionSignature.slice(-8)} ` +
                    `or view it in the <a href="${explorerUrl}" target="_blank" class="underline">Solana Explorer</a>`
                  );
                }
              } else {
                // Not a timeout error, rethrow
                throw confirmError;
              }
            }
            
            // Update the gift card data with the real signature
            response.data.signature = signature;
          } catch (signError: any) {
            
            throw new Error(`Failed to sign transaction: ${signError.message}`);
          }
        }
        
        
        
        // Check if response.data exists
        if (!response.data) {
          throw new Error('No data returned from API');
        }
        
        // Store gift card data temporarily for display
        const giftCardData = {
          publicKey: response.data.publicKey,
          message: message,
          amount: transferAmount,
          senderName: senderName || 'Anonymous',
          expiryTime: expiryTime,
          creationDate: Date.now(),
          createdBy: publicKey.toString(),
          themeId: themeId,
          themeName: selectedTheme ? selectedTheme.name : getThemeById(selectedTemplate).name,
          tokenMint: tokenMint || null,
          tokenSymbol: selectedToken?.symbol || 'SOL',
          tokenName: selectedToken?.name || 'Solana',
          signature: response.data.signature,
          giftCardId: response.data.giftCardId,
          secretKey: response.data.secretKey
        };
        
        // Store gift card data for success modal
        setCreatedGiftCardData(giftCardData);
        
        // Save to local storage for history
        try {
          const historyStr = localStorage.getItem('giftCardHistory') || '[]';
          const history = JSON.parse(historyStr);
          
          // Add to history if not already present
          const exists = history.some((card: any) => card.giftCardId === giftCardData.giftCardId);
          if (!exists) {
            history.push(giftCardData);
            localStorage.setItem('giftCardHistory', JSON.stringify(history));
          }
          
          // Also save as the latest gift card
          localStorage.setItem('latestGiftCard', JSON.stringify(giftCardData));
        } catch (err) {
          
          // Continue anyway
        }
        
        // Show success message immediately
        setShowSuccessModal(true);
        
        // Send email notification if provided (non-blocking)
        if (recipientEmail && recipientEmail.trim() !== '') {
          try {
            
            
            // Get the selected theme details
            const selectedThemeDetails = selectedTheme || getThemeById(selectedTemplate);
            
            // Send email in the background - don't block the UI
            sendEmailNotification(
              recipientEmail,
              response.data.publicKey,
              response.data.secretKey,
              message,
              transferAmount,
              {
                color: selectedThemeDetails.color,
                name: selectedThemeDetails.displayName,
                gradient: selectedThemeDetails.gradient,
                expiryDate: expiryTime > 0 ? expiryTime * 1000 : null,
                senderName: senderName || 'Anonymous',
                themeId: themeId,
                themeName: selectedThemeDetails.name,
                tokenMint: tokenMint,
                tokenSymbol: selectedToken?.symbol,
                tokenName: selectedToken?.name
              }
            ).catch(error => {
              // Just log any errors without affecting the gift card creation flow
              
            });
          } catch (emailErr) {
            // Just log any errors without affecting the gift card creation flow
            
          }
        }
        
        // Redirect to success page will happen in the modal's onClose handler
        
      } catch (txError: any) {
        
        
        // If the error is specifically about wallet disconnection, try a simpler approach
        if (txError.message && txError.message.includes('Wallet disconnected during transaction')) {
          try {
            
            setError("First attempt failed, trying alternative approach...");
            
            // Wait a moment before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to reconnect wallet if needed
            if (wallet && wallet.adapter && !connected && wallet.adapter.connect) {
              try {
                await wallet.adapter.connect();
                
              } catch (e) {
                
              }
            }
            
            // Try direct Phantom connection as a fallback
            const phantomConnected = await connectPhantomDirect();
            if (phantomConnected) {
              const phantomStatus = getPhantomStatus();
              
              
              if (phantomStatus.connected) {
                setError("Connected directly to Phantom wallet. Please try creating the gift card again.");
                // We'll let the user try again with the button
                return;
              }
            }
            
            throw new Error("Wallet connection could not be restored automatically. Please disconnect and reconnect your wallet, then try again.");
          } catch (retryError) {
            
            throw new Error("Wallet connection issue persists. Please refresh the page, reconnect your wallet, and try again.");
          }
        }
        
        // More detailed error message for debugging
        let errorMessage = `Gift card creation failed: ${txError.message || 'Unknown error'}`;
        
        // Check for wallet adapter errors
        if (txError.name === 'WalletSendTransactionError') {
          errorMessage = `Wallet error: ${txError.message || 'Unknown wallet error'}`;
          
          
          // Provide more specific information for common errors
          if (txError.message.includes('Unexpected error')) {
            errorMessage = 'Wallet disconnected or transaction rejected. Please check your wallet is connected and try again.';
          } else if (txError.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient SOL balance to complete this transaction. Please add more SOL to your wallet.';
          } else if (txError.message.includes('0x1')) {
            errorMessage = 'Transaction simulation failed. This could be due to network congestion or insufficient funds for fees.';
          }
        }
        
        // Check for Solana program errors
        if (txError.logs) {
          
          
          // Parse logs for specific errors
          const logs = txError.logs.join(' ');
          if (logs.includes('insufficient funds') || logs.includes('InsufficientFundsForTransaction')) {
            errorMessage = 'Insufficient SOL for transaction. Please add more SOL to your wallet.';
          } else if (logs.includes('TokenAccountNotFound')) {
            errorMessage = 'Token account not found. Please make sure you have a token account for the selected token.';
          } else if (logs.includes('Custom program error: 0x1')) {
            errorMessage = 'Gift card program error. The transaction could not be completed.';
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      
      
      // Store the signature if it's a timeout error with a signature
      if (err.message && err.message.includes('Check status using this signature')) {
        // Extract signature from the error message
        const signatureMatch = err.message.match(/signature: ([a-zA-Z0-9]{8})\.\.\.([a-zA-Z0-9]{8})/);
        if (signatureMatch) {
          // Keep the signature for display in the UI
          setPendingSignature(err.message.split('signature: ')[1].split(' ')[0]);
        }
      }
      
      // Special handling for Transaction Timeout Error
      if (err.name === 'TransactionExpiredTimeoutError' || 
          (err.message && err.message.includes('was not confirmed in'))) {
        
        // Extract signature if available
        const signatureMatch = err.message.match(/signature\s+([A-Za-z0-9]+)/i);
        if (signatureMatch && signatureMatch[1]) {
          const extractedSignature = signatureMatch[1];
          
          setPendingSignature(extractedSignature);
          
          // Create a helpful error message with the explorer link
          const explorerUrl = getExplorerUrl(extractedSignature);
          const displayError = `Transaction timed out after 30 seconds, but may still complete. ` +
            `You can check your transaction status in the <a href="${explorerUrl}" target="_blank" class="underline">Solana Explorer</a>. ` +
            `This usually happens during network congestion.`;
          
          setError(displayError);
          setIsCreating(false);
          return; // Exit early with custom message
        }
      }
      
      // Format error message for display
      let displayError = err instanceof Error ? err.message : 'Failed to create gift card';
      
      // Handle network connection issues with better messaging
      if (displayError.includes('Failed to fetch') || 
          displayError.includes('network') || 
          displayError.includes('connect')) {
        displayError = 'Connection error: Unable to reach the gift card service. Please check that:' +
          '\n1. You have a stable internet connection' +
          '\n2. Your browser allows connections to our API server' +
          '\n3. Any VPN or firewall is not blocking the connection';
      }
      
      // If this is a wallet error, provide more helpful information
      if (displayError.includes('Unexpected error') || displayError.includes('failed to send transaction')) {
        displayError = 'Transaction error: Please check your wallet connection and make sure you have enough SOL for transaction fees. You may need to try again.';
      }
      
      // If this is a transaction error, provide more specific guidance
      if (displayError.includes('Transaction failed') || displayError.includes('transaction failed')) {
        displayError = 'Transaction failed: The network might be congested or your wallet may have rejected the transaction. Please try again and be sure to confirm in your wallet.';
      }
      
      // If this is a signature verification error, provide a more specific message
      if (displayError.includes('Signature verification failed') || displayError.includes('Missing signature')) {
        displayError = 'Signature error: The transaction requires approval from your wallet. Please try again and approve the transaction promptly when your wallet prompts you.';
      }
      
      // Message length errors
      if (displayError.includes('Message is too long')) {
        displayError = 'Your message is too long, causing the transaction to exceed size limits. Please use a shorter message.';
      }
      
      // Balance errors
      if (displayError.includes('Insufficient')) {
        displayError = displayError; // Keep the detailed error message as is
      }
      
      setError(displayError);
    } finally {
      setIsCreating(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value);
    }
  };

  const handleCheckTransactionStatus = async (signature: string) => {
    try {
      setError("Checking transaction status...");
      setIsCreating(true);
      
      // Get connection and check status
      const connection = new Connection(
        endpoint,
        'confirmed'
      );
      const status = await connection.getSignatureStatus(signature);
      
      
      if (!status || !status.value) {
        setError("Transaction not found. It may have failed or not been submitted to the network.");
        return;
      }
      
      // Check for errors
      if (status.value.err) {
        setError(`Transaction failed: ${JSON.stringify(status.value.err)}`);
        return;
      }
      
      // Check confirmation status
      const confirmationStatus = status.value.confirmationStatus;
      
      if (confirmationStatus === 'finalized') {
        setError(null);
        // Success! The transaction was confirmed
        setShowSuccessModal(true);
        // Now we need to fetch the gift card data
        try {
          // Try to load from local storage if available
          const historyStr = localStorage.getItem('giftCardHistory') || '[]';
          const history = JSON.parse(historyStr);
          const giftCard = history.find((card: any) => card.signature === signature);
          
          if (giftCard) {
            setCreatedGiftCardData(giftCard);
          } else {
            // If not in history, show a generic success message
            setError("Transaction confirmed successfully! Your gift card was created.");
          }
        } catch (e) {
          
          setError("Transaction confirmed successfully! Your gift card was created.");
        }
      } else if (confirmationStatus === 'confirmed' || confirmationStatus === 'processed') {
        setError(`Transaction is in "${confirmationStatus}" state. It should be fully confirmed soon.`);
      } else {
        setError(`Transaction status: ${confirmationStatus}. Please check again in a few moments.`);
      }
    } catch (e) {
      
      setError(`Failed to check transaction status: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Navigation />
      
      <section className="pt-24">
        <div className="container">
          <div className="mb-8 border-b border-white pb-6">
            <h1 className="uppercase mb-4">Create Grantnite Card</h1>
            <div className="h-px bg-white w-24 my-4"></div>
            <p className="text-white max-w-2xl font-mono">
              Design a personalized Grantnite card, set the amount, and send it to anyone on Solana.
            </p>
          </div>
          
          {/* Show wallet connection prompt if not connected */}
          {!connected ? (
            <div className="border border-white mb-12 p-8 text-center">
              <h2 className="text-xl mb-6 uppercase font-mono">CONNECT YOUR WALLET</h2>
              <p className="text-gray-300 mb-8 font-mono">
                You need to connect your wallet to create a Grantnite card.
              </p>
              <div className="flex justify-center">
                <div className="btn btn-outline">
                  <WalletMultiButton />
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-24">
              {error && (
                <div className="mb-8 border-l-4 border-destructive pl-4 py-3 bg-destructive/10">
                  {error.includes('<a href') ? (
                    <div>
                      <p className="text-destructive font-mono mb-2">Transaction timeout:</p>
                      <p 
                        className="text-destructive font-mono"
                        dangerouslySetInnerHTML={{ __html: error }}
                      />
                      
                      {pendingSignature && (
                        <div className="mt-4 pt-4 border-t border-destructive/20">
                          <p className="text-gray-300 mb-2">Your transaction is still processing:</p>
                          <div className="flex flex-col space-y-2">
                            <p className="font-mono text-xs break-all text-gray-400">
                              Signature: {pendingSignature}
                            </p>
                            <div className="flex space-x-4">
                              <a 
                                href={getExplorerUrl(pendingSignature)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-indigo-400 hover:underline"
                              >
                                View on Solana Explorer
                              </a>
                              <button
                                type="button"
                                onClick={() => handleCheckTransactionStatus(pendingSignature)}
                                className="text-sm text-indigo-400 hover:underline"
                              >
                                Check Status
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-destructive font-mono mb-2">{error}</p>
                  )}
                  
                  {error.includes('wallet') && (
                    <div className="flex space-x-2 mt-3">
                      <button 
                        type="button" 
                        onClick={async () => {
                          if (wallet) {
                            try {
                              await disconnect();
                              setError("Wallet disconnected. Please reconnect.");
                            } catch (e) {
                              
                            }
                          }
                        }}
                        className="btn btn-sm btn-outline"
                      >
                        Disconnect
                      </button>
                      
                      <button 
                        type="button" 
                        onClick={async () => {
                          try {
                            // First disconnect
                            if (disconnect) {
                              await disconnect();
                              setError("Disconnected wallet. Reconnecting...");
                              
                              // Wait a moment before reconnecting
                              await new Promise(resolve => setTimeout(resolve, 1500));
                            }
                            
                            // Clear any cached wallet state
                            if (window.localStorage) {
                              // Remove wallet-specific localStorage items
                              const keysToRemove = [];
                              for (let i = 0; i < window.localStorage.length; i++) {
                                const key = window.localStorage.key(i);
                                if (key && (
                                  key.includes('walletName') || 
                                  key.includes('wallet-adapter') ||
                                  key.includes('solana') ||
                                  key.includes('phantom')
                                )) {
                                  keysToRemove.push(key);
                                }
                              }
                              
                              // Remove the items
                              keysToRemove.forEach(key => window.localStorage.removeItem(key));
                              
                            }
                            
                            // Try to reconnect after a short delay
                            setTimeout(async () => {
                              try {
                                // Try wallet adapter first
                                if (wallet && wallet.adapter && wallet.adapter.connect) {
                                  await wallet.adapter.connect();
                                  setIsWalletVerified(false); // Will retrigger verification
                                  setError("Attempting to reconnect wallet. Please wait...");
                                } else {
                                  // Fall back to direct Phantom connection
                                  const connected = await connectPhantomDirect();
                                  if (connected) {
                                    const status = getPhantomStatus();
                                    
                                    setError("Connected directly to Phantom. Please refresh the page to continue.");
                                  } else {
                                    setError("Failed to reconnect. Please refresh the page and try again.");
                                  }
                                }
                              } catch (e) {
                                
                                setError("Failed to reconnect. Please refresh the page and try again.");
                              }
                            }, 500);
                          } catch (e) {
                            
                            setError("Failed to reset wallet connection. Please refresh the page.");
                          }
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        Reset & Reconnect Wallet
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="grid gap-12 border border-foreground">
                {/* Card Design Selection */}
                <div className="border-b border-foreground p-8">
                  <h2 className="uppercase mb-6">Choose Design</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-foreground">
                    {cardTemplates.map((template, index) => (
                      <div 
                        key={index}
                        className={`aspect-video overflow-hidden cursor-pointer ${
                          selectedTemplate === template.id && !selectedTheme
                            ? 'border-4 border-primary' 
                            : 'border border-foreground hover:border-primary'
                        }`}
                        onClick={() => {
                          setSelectedTemplate(template.id);
                          setSelectedTheme(null);
                        }}
                      >
                        <div 
                          className="w-full h-full flex flex-col justify-between p-4"
                          style={{
                            background: template.gradient,
                          }}
                        >
                          <div className="rounded-full bg-white/10 w-6 h-6 flex items-center justify-center">
                            {template.icon}
                          </div>
                          <div className="text-white text-xs">{template.displayName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Theme Selection */}
                <div className="border-b border-foreground p-8">
                  <h2 className="uppercase mb-6">Choose Occasion Theme (Optional)</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-foreground">
                    {occasionThemes.map((theme) => (
                      <div 
                        key={theme.id}
                        className={`aspect-video overflow-hidden cursor-pointer ${
                          selectedTheme?.id === theme.id
                            ? 'border-4 border-primary' 
                            : 'border border-foreground hover:border-primary'
                        }`}
                        onClick={() => setSelectedTheme(theme)}
                      >
                        <div 
                          className="w-full h-full flex flex-col justify-between p-4"
                          style={{
                            background: theme.gradient,
                          }}
                        >
                          <div className="rounded-full bg-white/10 w-6 h-6 flex items-center justify-center text-lg">
                            {theme.icon}
                          </div>
                          <div className="text-white text-xs">{theme.displayName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Gift Details */}
                <div className="grid md:grid-cols-2 gap-px border-b border-foreground">
                  <div className="p-8 border-b md:border-b-0 md:border-r border-foreground">
                    <h2 className="uppercase mb-6">Gift Details</h2>
                    
                    <div className="space-y-6">
                      {/* Token Selection */}
                      <div>
                        <label className="block text-sm uppercase mb-2">
                          Select Token
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          <select
                            className="terminal-input"
                            value={selectedToken ? selectedToken.mintAddress : "So11111111111111111111111111111111111111112"}
                            onChange={(e) => {
                              const mintAddress = e.target.value;
                              const token = TOKENS.find(t => t.mintAddress === mintAddress) || null;
                              setSelectedToken(token);
                              // Also update the amount placeholder to match token
                              if (token && token.symbol !== "SOL") {
                                setAmount('0.01'); // Reset amount when changing tokens
                              }
                            }}
                          >
                            {TOKENS.map((token) => (
                              <option 
                                key={token.mintAddress} 
                                value={token.mintAddress}
                                disabled={isLoadingBalances || (tokenBalances[token.mintAddress] === '0')}
                              >
                                {token.symbol} - {token.name} {tokenBalances[token.mintAddress] && !isLoadingBalances ? `(Balance: ${tokenBalances[token.mintAddress]})` : ''}
                              </option>
                            ))}
                          </select>
                          {isLoadingBalances && (
                            <p className="text-xs text-foreground/70">Loading token balances...</p>
                          )}
                          {selectedToken && selectedToken.symbol !== "SOL" && (
                            <p className="text-xs text-foreground/70 mt-1">Using {selectedToken.symbol} token ({selectedToken.name})</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm uppercase mb-2">
                          Amount {selectedToken?.symbol || 'SOL'}
                        </label>
                        <input
                          type="number"
                          value={amount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                          min="0.01"
                          step="0.01"
                          required
                          className="terminal-input"
                          placeholder="0.1"
                        />
                        <p className="text-xs text-foreground/70 mt-1">Minimum amount: 0.01 {selectedToken?.symbol || 'SOL'}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm uppercase mb-2">
                          Sender Name (optional)
                        </label>
                        <input
                          type="text"
                          value={senderName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSenderName(e.target.value)}
                          className="terminal-input"
                          placeholder="Your Name"
                        />
                        <p className="text-xs text-foreground/70 mt-1">Leave empty to remain anonymous</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm uppercase mb-2">
                          Recipient Email (optional)
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipientEmail(e.target.value)}
                          className="terminal-input"
                          placeholder="email@example.com"
                        />
                        <p className="text-xs text-foreground/70 mt-1">For gift card delivery notification</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm uppercase mb-2">
                          Expiry Date (optional)
                        </label>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiryDate(e.target.value)}
                          className="terminal-input"
                        />
                        <p className="text-xs text-foreground/70 mt-1">
                          If set, unused funds will automatically return to your wallet after this date
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h2 className="uppercase mb-6">Personal Message</h2>
                    <div>
                      <textarea
                        value={message}
                        onChange={handleMessageChange}
                        rows={5}
                        className="terminal-input"
                        placeholder="Add your personal message here..."
                        maxLength={MAX_MESSAGE_LENGTH}
                        required
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-foreground/70">
                          {message.trim() === '' && <span className="text-destructive">Message is required</span>}
                        </span>
                        <span className={`text-xs ${remainingChars < 20 ? 'text-destructive' : 'text-foreground/70'}`}>
                          {remainingChars} characters remaining
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <div className="text-xs text-foreground/70">
                        <p>A 1% service fee will be applied to the gift amount.</p>
                        <p className="mt-1">Your wallet: {publicKey ? publicKey.toString().slice(0, 6) + '...' + publicKey.toString().slice(-4) : 'Not connected'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Preview */}
                <div className="p-8 border-b border-foreground">
                  <h2 className="uppercase mb-6">Preview</h2>
                  <div className="border border-foreground aspect-video max-w-lg mx-auto">
                    <div 
                      className="w-full h-full"
                      style={{
                        background: selectedTheme 
                          ? selectedTheme.gradient 
                          : getThemeById(selectedTemplate).gradient,
                      }}
                    >
                      <div className="p-8 flex flex-col h-full justify-between">
                        <div className="flex justify-between items-start">
                          <div className="rounded-full bg-white/10 w-10 h-10 flex items-center justify-center text-2xl">
                            {selectedTheme 
                              ? selectedTheme.icon 
                              : getThemeById(selectedTemplate).icon}
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-white/70 uppercase">AMOUNT</div>
                            <div className="text-2xl font-bold text-white">{amount || '0.00'} {selectedToken?.symbol || 'SOL'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-white/80 mb-2 line-clamp-4 overflow-hidden text-ellipsis max-h-24">
                            {message || 'Your message will appear here...'}
                          </div>
                          <div className="flex justify-between items-end">
                            {senderName && (
                              <div className="text-xs text-white/60 truncate max-w-[60%]">
                                From: {senderName}
                              </div>
                            )}
                            <div className="text-xs text-white/60 uppercase ml-auto">
                              {expiryDate ? `Expires: ${new Date(expiryDate).toLocaleDateString()}` : 'No expiration date'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Submission */}
                <div className="p-8 flex justify-end gap-4">
                  <Link href="/" className="btn btn-outline">
                    CANCEL
                  </Link>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isCreating || !connected || !sufficientAmount}
                  >
                    {isCreating ? 'CREATING...' : 'CREATE GRANTNITE CARD'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
      
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          if (createdGiftCardData) {
            router.push(`/my-cards`);
          }
        }}
        message="Gift card created successfully!"
        giftCardData={createdGiftCardData ? {
          publicKey: createdGiftCardData.publicKey,
          secretKey: createdGiftCardData.secretKey,
          giftCardId: createdGiftCardData.giftCardId,
          amount: createdGiftCardData.amount,
          tokenSymbol: createdGiftCardData.tokenSymbol,
          tokenName: createdGiftCardData.tokenName,
          message: createdGiftCardData.message,
          senderName: createdGiftCardData.senderName,
          themeName: createdGiftCardData.themeName
        } : undefined}
      />
    </main>
  );
}

// Wrapper component that provides wallet context
export default function CreateGiftCard() {
  const [mounted, setMounted] = useState(false);
  
  // Define the endpoint here as well to fix the reference error
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  []);
  
  // Configure wallet - move hooks before conditional
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl mb-4">Initializing Wallet...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        </div>
      </main>
    );
  }
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <WalletContextProvider>
            <GiftCardForm />
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

// Add a helper function to get the Solana Explorer URL
const getExplorerUrl = (signature: string) => {
  const cluster = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}; 