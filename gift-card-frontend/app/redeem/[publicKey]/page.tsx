'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PublicKey, clusterApiUrl } from '@solana/web3.js';
import Navigation from '../../components/navigation';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';
import Link from 'next/link';
import { Suspense } from 'react';
import { getConnection } from '../../utils/solana';
import { getThemeById, allThemes } from '../../utils/theme-definitions';
import { motion } from 'framer-motion';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { registerWalletErrorHandlers, formatWalletError } from '../../utils/wallet-error-handler';
import { Commitment, ConnectionConfig } from '@solana/web3.js';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Define endpoint and wallets with safer retry configuration
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
const wallets = [new PhantomWalletAdapter()];

// Define connection config with higher commitment and retry
const connectionConfig: ConnectionConfig = {
  commitment: 'confirmed' as Commitment,
  confirmTransactionInitialTimeout: 60000, // 60 seconds
  disableRetryOnRateLimit: false
};

// Add a fallback component in case dynamic import fails
function FallbackRedemptionComponent() {
  const params = useParams();
  const [counter, setCounter] = useState(30);
  const [manuallyTriggered, setManuallyTriggered] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (counter === 0 && !manuallyTriggered) {
      window.location.reload();
    }
  }, [counter, manuallyTriggered]);

  return (
    <div className="border border-white p-8 text-center my-12">
      <div className="mb-6">
        <h2 className="text-xl mb-4 uppercase">LOADING GIFT CARD</h2>
        <div className="inline-block w-8 h-8 border-t-2 border-r-2 border-white rounded-full animate-spin mb-6"></div>
        
        <div className="font-mono text-sm mb-6">
          <p>Attempting to load gift card with ID:</p>
          <p className="text-blue-300 break-all mt-2">{params.publicKey}</p>
        </div>

        {counter > 0 ? (
          <p className="text-gray-400 text-sm">
            If loading takes too long, page will refresh in {counter} seconds
          </p>
        ) : (
          <button
            onClick={() => {
              setManuallyTriggered(true);
              window.location.reload();
            }}
            className="border border-white p-2 text-sm hover:bg-white hover:text-black transition-colors"
          >
            Reload Page Now
          </button>
        )}
      </div>
    </div>
  );
}

// Simplified dynamic import to avoid chunk loading errors
const RedeemGiftCardForm = dynamic(() => import('./redeem-by-key'), { 
  ssr: false,
  loading: () => <FallbackRedemptionComponent />
});

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <main className="min-h-screen pb-20">
      <Navigation />
      
      <section className="pt-32 pb-20">
        <div className="container">
          <h1 className="text-center mb-8">Gift Card Redemption</h1>
          
          <div className="max-w-md mx-auto border-l-4 border-red-500 p-4 bg-red-500/10 mb-8">
            <h2 className="text-xl text-red-400 mb-2">Redemption Error</h2>
            <p className="text-gray-300 mb-4">{error.message}</p>
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
              <button 
                onClick={resetErrorBoundary}
                className="btn btn-primary"
              >
                Try again
              </button>
              <Link href="/redeem" className="btn btn-secondary text-center">
                Go to Redeem Page
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function RedeemByPublicKey() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Register wallet error handlers
    registerWalletErrorHandlers();
    
    // Add a global error handler for uncaught wallet errors
    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      
      
      // Call original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError(message, source, lineno, colno, error);
      }
      
      return false;
    };
    
    return () => {
      window.onerror = originalOnError;
    };
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <ConnectionProvider endpoint={endpoint} config={connectionConfig}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <main className="min-h-screen">
              <Navigation />
            
              <section className="pt-24">
                <div className="container">
                  <div className="mb-8 border-b border-white pb-6">
                    <h1 className="uppercase mb-4">REDEEM GRANTNITE CARD</h1>
                    <div className="h-px bg-white w-24 my-4"></div>
                    <p className="text-white max-w-2xl font-mono">
                      Connect your wallet to redeem this Grantnite card and receive funds.
                    </p>
                  </div>
                  
                  <RedeemGiftCardForm />
                  
                </div>
              </section>
            </main>
          </ErrorBoundary>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 