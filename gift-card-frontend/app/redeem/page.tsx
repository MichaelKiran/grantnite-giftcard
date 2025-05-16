'use client';

import { useState, useRef } from 'react';
import { PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import * as bs58 from 'bs58';
import { useWalletContext } from '../context/wallet-context';
import Navigation from '../components/navigation';
import { getConnection, checkAndReturnExpiredFunds } from '../utils/solana';
import { motion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';
import Link from 'next/link';
import { Suspense } from 'react';

// Import AutoFix component dynamically
const AutoFix = dynamic(() => import('../components/auto-fix'), { ssr: false });

// Error fallback component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <main className="min-h-screen pb-20">
      <Navigation />
      
      <section className="pt-32 pb-20">
        <div className="container">
          <div className="max-w-md mx-auto glow-card text-center p-8">
            <h2 className="text-xl text-accent mb-6">Something went wrong</h2>
            <p className="text-gray-300 mb-8">
              {error.message || 'An error occurred while redeeming the gift card'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetErrorBoundary}
                className="btn btn-primary"
              >
                Try again
              </button>
              <Link href="/" className="btn btn-secondary">
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Dynamic import for the main RedeemGiftCard component with proper wallet provider
const RedeemGiftCardWithWallet = dynamic(
  () => import('./redeem-gift-card'),
  { 
    ssr: false, 
    loading: () => (
      <main className="min-h-screen pb-20">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <h2 className="text-2xl mb-6">Loading Redemption Page</h2>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        </section>
      </main>
    )
  }
);

// Main component that uses error boundary and loads the wallet-wrapped component
export default function RedeemGiftCardWithErrorBoundary() {
  return (
    <>
      <Suspense fallback={null}>
        <AutoFix />
      </Suspense>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <RedeemGiftCardWithWallet />
      </ErrorBoundary>
    </>
  );
} 