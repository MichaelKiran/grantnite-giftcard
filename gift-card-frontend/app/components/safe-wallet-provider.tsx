'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { WalletError, WalletNotReadyError } from '@solana/wallet-adapter-base';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Import the wallet polyfill
import '../utils/wallet-polyfill';

// Define props type
type SafeWalletProviderProps = {
  children: React.ReactNode;
};

export default function SafeWalletProvider({ children }: SafeWalletProviderProps) {
  // State to track environment compatibility
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletInitFailed, setWalletInitFailed] = useState(false);
  const [walletsReady, setWalletsReady] = useState(false);

  // Set network to 'devnet'
  const network = WalletAdapterNetwork.Devnet;

  // Configure endpoint for Solana RPC
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

  // Configure wallet adapters - use only the Phantom adapter
  // to avoid dependency issues with other adapters
  const wallets = useMemo(() => {
    try {
      if (walletInitFailed) {
        return [];
      }
      
      // Use only Phantom which is most stable and widely used
      const phantomWallet = new PhantomWalletAdapter();
      
      // Check if wallet is ready
      if (typeof window !== 'undefined') {
        // Set a timeout to check wallet readiness
        setTimeout(() => {
          try {
            const isPhantomInstalled = window.phantom || 
              (typeof window.solana !== 'undefined' && window.solana.isPhantom);
            
            setWalletsReady(!!isPhantomInstalled);
          } catch (err) {
            
            // Default to true to allow connection attempts
            setWalletsReady(true);
          }
        }, 500);
      }
      
      return [phantomWallet];
    } catch (error) {
      
      setError("Failed to initialize wallet adapters");
      setWalletInitFailed(true);
      return [];
    }
  }, [walletInitFailed]);

  // Handle wallet errors
  const onError = (error: WalletError) => {
    
    
    if (error instanceof WalletNotReadyError) {
      setError("Wallet not ready. Please ensure your Phantom wallet extension is installed and unlocked.");
    } else {
      setError(error.message);
    }
  };

  // Effect for ensuring wallet is only mounted client-side
  useEffect(() => {
    // Check if we're in a browser environment before accessing window
    if (typeof window !== 'undefined') {
      try {
        // Apply polyfill if needed
        if (!window.navigator.wallets) {
          try {
            // Use Object.defineProperty instead of direct assignment to avoid issues
            // with read-only properties in some browsers
            Object.defineProperty(window.navigator, 'wallets', {
              value: [],
              writable: true,
              configurable: true
            });
          } catch (polyfillErr) {
            // If defineProperty fails, try a different approach
            
            // Don't let this error block the app - wallet features might be limited but app should work
          }
        } else if (!Array.isArray(window.navigator.wallets)) {
          // If wallets exists but isn't an array, log but don't try to modify it
          
        }
        
        // Check if Phantom is installed
        const isPhantomInstalled = 
          typeof window.phantom !== 'undefined' || 
          (typeof window.solana !== 'undefined' && window.solana.isPhantom);
        
        if (!isPhantomInstalled) {
          
        }
        
        // Finally set mounted to true after all initializations
        setMounted(true);
      } catch (err) {
        
        setError("Browser environment doesn't fully support wallet features");
        // Still set mounted to true so we render the error message
        setMounted(true);
      }
    }
  }, []);

  // Return null during server-side rendering
  if (!mounted) return null;

  // If wallet initialization failed, render a fallback UI
  if (walletInitFailed) {
    return (
      <div className="wallet-fallback-wrapper">
        {error && (
          <div className="p-4 bg-yellow-900/20 border border-yellow-500 rounded mb-4 text-yellow-300">
            <p className="font-medium">Wallet Initialization Failed</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2">
              The app will continue in read-only mode. Some features requiring wallet connection will be limited.
            </p>
            <button 
              className="mt-2 px-3 py-1 bg-yellow-800 text-white text-xs rounded"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={false}>
        <WalletModalProvider>
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded mb-4 text-red-300">
              <p className="font-medium">Wallet Connection Error</p>
              <p className="text-sm">{error}</p>
              <button 
                className="mt-2 px-3 py-1 bg-red-800 text-white text-xs rounded"
                onClick={() => setError(null)}
              >
                Dismiss
              </button>
            </div>
          )}
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 