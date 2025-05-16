'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SafeWalletProvider from '../components/safe-wallet-provider';
import { WalletContextProvider } from '../context/wallet-context';
import ClientProvider from '../components/client-provider';
import { ErrorBoundary } from 'react-error-boundary';

// Simplify the dynamic import to avoid chunk loading errors
const MyCardsContent = dynamic(() => import('./my-cards-content'), { 
  ssr: false,
  loading: () => (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
      <p>Loading wallet content...</p>
    </div>
  )
});

export default function MyCardsWithWallet() {
  // Add a mounting state to ensure client-side rendering is complete
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    setMounted(true);
    
    // Add window error handler to catch React errors
    const originalErrorHandler = window.onerror;
    
    window.onerror = (message, source, lineno, colno, error) => {
      if (error && error.message && error.message.includes('Invalid hook call')) {
        
        setError(error);
        return true; // Prevent default error handling
      }
      
      // Call original handler
      if (originalErrorHandler) {
        return originalErrorHandler(message, source, lineno, colno, error);
      }
      return false;
    };
    
    // Cleanup
    return () => {
      window.onerror = originalErrorHandler;
    };
  }, []);
  
  // Don't render anything during SSR or before mounting
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl mb-4">Loading...</h2>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }
  
  // Show error if we caught a React hook error
  if (error) {
    return (
      <ClientProvider>
        <div className="min-h-screen pt-32 pb-20">
          <div className="container max-w-md mx-auto">
            <div className="glow-card border-t-4 border-red-500 p-4 bg-red-500/10">
              <h2 className="text-xl text-red-400 mb-2">React Hook Error</h2>
              <p className="text-gray-300 mb-4">
                Invalid hook call detected. This is likely due to a React configuration issue.
              </p>
              <pre className="text-sm bg-gray-900 p-3 rounded overflow-x-auto mb-4">
                {error.message}
              </pre>
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-primary"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </ClientProvider>
    );
  }
  
  // The correct order is: ClientProvider -> SafeWalletProvider -> WalletContextProvider
  // WalletContextProvider must wrap MyCardsContent directly
  return (
    <ClientProvider>
      <SafeWalletProvider>
        <ErrorBoundary 
          FallbackComponent={({ error }) => (
            <div className="p-8 border-l-4 border-red-500 bg-red-500/10 m-8">
              <h2 className="text-xl text-red-400 mb-2">Wallet Provider Error</h2>
              <p className="text-gray-300 mb-4">{error.message}</p>
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-primary"
              >
                Return to Home
              </button>
            </div>
          )}
        >
          <WalletContextProvider>
            <MyCardsContent />
          </WalletContextProvider>
        </ErrorBoundary>
      </SafeWalletProvider>
    </ClientProvider>
  );
} 