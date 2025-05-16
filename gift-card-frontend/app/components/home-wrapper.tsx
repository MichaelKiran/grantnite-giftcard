'use client';

import { useState, useEffect } from 'react';
import ClientProvider from './client-provider';
import SafeWalletProvider from './safe-wallet-provider';
import Home from './home';

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen p-4 flex items-center justify-center">
    <div className="animate-pulse">
      <p className="text-white">Loading application...</p>
    </div>
  </div>
);

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <div className="border border-red-500 p-6 bg-red-900/20 max-w-md">
        <h2 className="text-xl text-red-400 mb-2">Error Loading Application</h2>
        <p className="text-white mb-2">
          There was a problem loading the application. 
        </p>
        <p className="text-gray-400 text-sm mb-4 overflow-hidden overflow-ellipsis">
          {error.message}
        </p>
        <div className="space-x-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
          <button 
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

// Simplified Error Boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Add global error handler for chunk load errors
    const originalOnError = window.onerror;
    
    window.onerror = (message, source, lineno, colno, error) => {
      // Check if this is a chunk load error
      if (message && (
        typeof message === 'string' && (
          message.includes('ChunkLoadError') || 
          message.includes('Loading chunk') ||
          message.includes('Loading CSS chunk')
        )
      )) {
        
        setError(error || new Error(String(message)));
        setHasError(true);
        return true; // Prevent default handling
      }
      
      // Call original handler for other errors
      return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };
    
    return () => {
      window.onerror = originalOnError;
    };
  }, []);

  if (hasError && error) {
    return <ErrorFallback error={error} resetErrorBoundary={() => setHasError(false)} />;
  }

  return <>{children}</>;
}

export default function HomeWrapper() {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Set loading to false after a short delay to ensure all resources are loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <ErrorBoundary>
      <ClientProvider>
        <SafeWalletProvider>
          <Home />
        </SafeWalletProvider>
      </ClientProvider>
    </ErrorBoundary>
  );
} 