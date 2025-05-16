'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Custom button to handle wallet connection
function SafeWalletConnectButton() {
  const { publicKey, connecting, connected, connect, disconnect } = useWallet();
  const [isPhantomDetected, setIsPhantomDetected] = useState(false);

  useEffect(() => {
    const checkPhantomWallet = () => {
      const isPhantomInstalled = 
        typeof window !== 'undefined' && 
        (window.phantom?.solana || (window.solana && window.solana.isPhantom));
      
      setIsPhantomDetected(!!isPhantomInstalled);
    };
    
    checkPhantomWallet();
    const timer = setTimeout(checkPhantomWallet, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isPhantomDetected) {
    return (
      <div className="wallet-button-wrapper">
        <a 
          href="https://phantom.app/download" 
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-white bg-white text-black px-8 py-4 font-mono tracking-wide hover:bg-black hover:text-white transition-colors text-center mb-2"
        >
          INSTALL WALLET
        </a>
        <div className="text-xs text-center text-gray-400">Phantom wallet required</div>
      </div>
    );
  }

  return (
    <WalletMultiButton className="!bg-black !border !border-white !text-white hover:!bg-white hover:!text-black" />
  );
}

export default function Home() {
  const { publicKey } = useWallet();

  return (
    <main className="min-h-screen p-4">
      <div className="snap-container">
        {/* Hero Section */}
        <section className="snap-section bg-black border-b border-white">
          <div className="h-full flex flex-col">
            <div className="flex-grow grid grid-cols-1 md:grid-cols-12 border-b border-white">
              <div className="md:col-span-8 p-6 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white">
                <h1 className="text-5xl md:text-8xl font-bold mb-4 tracking-tighter leading-none">
                  <span className="inline-block">SEND</span> <br/>
                  <span className="inline-block ml-12 md:ml-24">SOL</span> <br/>
                  <span className="inline-block text-[rgb(var(--primary))]">INSTANTLY</span>
                </h1>
                
                <p className="text-lg md:text-xl mb-6 max-w-xl font-mono">
                  Create programmable Grantnite cards on Solana. Send SOL to anyone with custom messages and expiration dates. Secure, fast, and built for Web3.
                </p>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <Link 
                    href="/create" 
                    className="border border-white px-8 py-4 font-mono tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                  >
                    CREATE CARD
                  </Link>
                  
                  <Link 
                    href="/redeem" 
                    className="border border-white bg-white text-black px-8 py-4 font-mono tracking-wide hover:bg-black hover:text-white transition-colors text-center"
                  >
                    REDEEM CARD
                  </Link>
                </div>
              </div>
              
              <div className="md:col-span-4 border-white flex flex-col">
                <div className="flex-grow p-6 md:p-12 flex flex-col justify-center items-center text-center">
                  <div className="mb-6">
                    <div className="inline-block border border-white p-1">
                      <div className="w-32 h-32 border border-white flex items-center justify-center bg-black">
                        <div className="text-3xl font-bold">$</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <SafeWalletConnectButton />
                  </div>
                  
                  {publicKey && (
                    <div className="text-xs font-mono">
                      <div className="mb-1">CONNECTED WALLET:</div>
                      <div className="truncate max-w-full">
                        {publicKey.toString()}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t border-white p-4 text-center font-mono text-xs">
                  SOLANA MAINNET
                </div>
              </div>
            </div>
            
            <div className="h-12 grid grid-cols-3 text-xs font-mono">
              <div className="border-r border-white flex items-center justify-center">
                <span className="blink">●</span>
                <span className="ml-2">LIVE</span>
              </div>
              <div className="border-r border-white flex items-center justify-center">
                V1.0.0
              </div>
              <div className="flex items-center justify-center">
                <span>GRANTNITE.PROTOCOL</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
} 