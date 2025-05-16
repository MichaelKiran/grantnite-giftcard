'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
// Import the required wallet components
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Fallback component to show while loading
const LoadingFallback = () => (
  <div className="min-h-screen p-4 flex items-center justify-center">
    <div className="animate-pulse">
      <p className="text-white">Loading application...</p>
    </div>
  </div>
);

// Error fallback component
const ErrorFallback = () => (
  <div className="min-h-screen p-4 flex items-center justify-center">
    <div className="border border-red-500 p-6 bg-red-900/20 max-w-md">
      <h2 className="text-xl text-red-400 mb-2">Error Loading Application</h2>
      <p className="text-white mb-2">
        There was a problem loading the application.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700"
      >
        Reload Page
      </button>
    </div>
  </div>
);

// Import Home component directly to avoid chunk loading issues
import Home from './components/home';

// Create a dynamic wallet components wrapper with no SSR
const WalletProviderWrapper = dynamic(
  () => Promise.resolve(({ children }: { children: React.ReactNode }) => {
    // Configure the wallet adapters
    const wallets = [new PhantomWalletAdapter()];
    // Get the RPC URL from environment variables or use the default
    const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    
    return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={true}>
          <WalletModalProvider>
            {children}
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    );
  }),
  { ssr: false }
);

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Add error handler for chunk load errors
    const handleError = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('ChunkLoadError') || 
        event.message.includes('Loading chunk')
      )) {
        
        setHasError(true);
        event.preventDefault();
        return true;
      }
      return false;
    };
    
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return <ErrorFallback />;
  }

  if (!mounted) {
    return <LoadingFallback />;
  }

  return (
    <WalletProviderWrapper>
      <Home />
    </WalletProviderWrapper>
  );
}
