'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { clusterApiUrl } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

// Dynamically import the wallet button
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

// Import needed styles
import '@solana/wallet-adapter-react-ui/styles.css';

/**
 * A safe wallet button that includes its own providers
 * This component can be used anywhere without requiring parent providers
 */
export default function SafeWalletButton() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Define the connection endpoint
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet'),
  []);

  // Define wallet adapters
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  useEffect(() => {
    try {
      // Apply minimal required setup without redefining properties
      if (typeof window !== 'undefined' && window.navigator) {
        // Don't try to modify the wallets property at all in this component
        // The main polyfill in wallet-polyfill.ts will handle this safely
        // Just check if we're in a working environment
        const hasWalletSupport = 'wallets' in window.navigator || window._walletsInitialized;
        
        if (!hasWalletSupport) {
          
        }
      }
      
      setMounted(true);
    } catch (err) {
      
      setError(err instanceof Error ? err.message : 'Unknown wallet button error');
    }
  }, []);

  if (error) {
    return (
      <button className="border border-red-500 px-4 py-2 font-mono text-red-500">
        WALLET ERROR
      </button>
    );
  }

  if (!mounted) {
    return (
      <button className="border border-white px-4 py-2 font-mono animate-pulse">
        LOADING WALLET...
      </button>
    );
  }

  // The button is wrapped in its own providers to avoid context errors
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletMultiButton />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 