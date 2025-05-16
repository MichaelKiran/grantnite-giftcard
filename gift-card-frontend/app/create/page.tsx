"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PublicKey, Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { useWalletContext } from '../context/wallet-context';
import Navigation from '../components/navigation';
import Link from 'next/link';
import { createGiftCard, generateKeypair, sendEmailNotification, PROGRAM_ID } from '../utils/solana';
import { ErrorBoundary } from 'react-error-boundary';
import { BN } from 'bn.js';
import * as borsh from 'borsh';
import * as bs58 from 'bs58';
import { WalletButton } from '../context/wallet-context';
import dynamic from 'next/dynamic';

// Import React for JSX types
import * as React from 'react';

interface CardTemplate {
  name: string;
  color: string;
  gradient: string;
}

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
              {error.message || 'An error occurred while creating the gift card'}
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

// CreateGiftCard instruction data layout
class CreateGiftCardInstructionData {
  instruction: number;
  amount: any; // BN type
  recipientPubkey: Uint8Array;
  expiryTime: any; // BN type
  message: string;

  constructor(props: {
    amount: any; // BN type
    recipientPubkey: Uint8Array;
    expiryTime: any; // BN type
    message: string;
  }) {
    this.instruction = 0; // CreateGiftCard = 0
    this.amount = props.amount;
    this.recipientPubkey = props.recipientPubkey;
    this.expiryTime = props.expiryTime;
    this.message = props.message;
  }

  static schema = new Map([
    [
      CreateGiftCardInstructionData,
      {
        kind: 'struct',
        fields: [
          ['instruction', 'u8'],
          ['amount', 'u64'],
          ['recipientPubkey', [32]],
          ['expiryTime', 'u64'],
          ['message', 'string'],
        ],
      },
    ],
  ]);
}

// Dynamic import for the main CreateGiftCard component with proper wallet provider
const CreateGiftCardWithWallet = dynamic(
  () => import('./create-gift-card'),
  { 
    ssr: false, 
    loading: () => (
      <main className="min-h-screen pb-20">
        <Navigation />
        <section className="pt-32 pb-20">
          <div className="container">
            <div className="max-w-md mx-auto text-center">
              <h2 className="text-2xl mb-6">Loading Gift Card Creator</h2>
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
            </div>
          </div>
        </section>
      </main>
    )
  }
);

export default function CreateGiftCardWithErrorBoundary() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CreateGiftCardWithWallet />
    </ErrorBoundary>
  );
}

const cardTemplates: CardTemplate[] = [
  {
    name: 'Electric Blue',
    color: '#0070f3',
    gradient: 'linear-gradient(45deg, #0070f3, #00c2ff)'
  },
  {
    name: 'Cosmic Purple',
    color: '#8400ff',
    gradient: 'linear-gradient(45deg, #8400ff, #b14cff)'
  },
  {
    name: 'Digital Green',
    color: '#00b386',
    gradient: 'linear-gradient(45deg, #00b386, #00e673)'
  },
  {
    name: 'Minimal Dark',
    color: '#0f0f0f',
    gradient: 'linear-gradient(45deg, #0f0f0f, #2a2a2a)'
  },
  {
    name: 'Sunset',
    color: '#ff7e00',
    gradient: 'linear-gradient(45deg, #ff7e00, #ffb700)'
  },
  {
    name: 'Lava',
    color: '#ff0062',
    gradient: 'linear-gradient(45deg, #ff0062, #ff4c29)'
  },
  {
    name: 'Ocean',
    color: '#0087cc',
    gradient: 'linear-gradient(45deg, #0087cc, #00a2ff)'
  },
  {
    name: 'Forest',
    color: '#179443',
    gradient: 'linear-gradient(45deg, #179443, #00c176)'
  }
]; 