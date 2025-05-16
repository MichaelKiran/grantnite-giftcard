'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';
import Navigation from '../components/navigation';
import Link from 'next/link';

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

// Custom error fallback component
function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <main className="min-h-screen pb-20">
      <Navigation />
      
      <section className="pt-32 pb-20">
        <div className="container max-w-md mx-auto">
          <div className="glow-card border-t-4 border-red-500 bg-red-500/10">
            <h2 className="text-xl text-red-400 mb-4">Something went wrong</h2>
            <p className="text-gray-300 mb-6 font-mono text-sm bg-gray-900 p-3 rounded overflow-x-auto">
              {error.message}
            </p>
            <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
              <button 
                onClick={resetErrorBoundary}
                className="btn btn-primary"
              >
                Try again
              </button>
              <Link href="/" className="btn btn-secondary text-center">
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Simplify the dynamic import to avoid chunk loading errors
const MyCardsWithWallet = dynamic(() => import('./my-cards-with-wallet'), { 
  ssr: false,
  loading: () => (
    <main className="min-h-screen pb-20">
      <Navigation />
      <section className="pt-32 pb-20">
        <div className="container">
          <div className="max-w-md mx-auto text-center">
            <h2 className="text-2xl mb-6">Loading My Cards</h2>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </section>
    </main>
  )
});

// Main component that uses error boundary
export default function MyCardsWithErrorBoundary() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Reset the state when the user wants to try again
        window.location.reload();
      }}
    >
      <MyCardsWithWallet />
    </ErrorBoundary>
  );
} 