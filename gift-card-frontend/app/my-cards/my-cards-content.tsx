'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useWalletContext, WalletContext } from '../context/wallet-context';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Navigation from '../components/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';
import { useContext } from 'react';
import SuccessModal from '../components/success-modal';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';

// Dynamically import the wallet button to avoid SSR issues
const WalletButton = dynamic(
  async () => (props: any) => <WalletMultiButton {...props} />,
  { ssr: false }
);

interface GiftCard {
  publicKey: string;
  creator: string;
  recipient: string;
  amount: number;
  isRedeemed: boolean;
  expiryTime: number;
  message: string;
  createdBy: string;
  creationDate: number;
  tokenSymbol?: string;
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <main className="min-h-screen pb-20">
      <Navigation />
      
      <section className="pt-32 pb-20">
        <div className="container">
          <h1 className="text-center mb-8">My Gift Cards</h1>
          
          <div className="max-w-md mx-auto border-l-4 border-red-500 p-4 bg-red-500/10 mb-8">
            <h2 className="text-xl text-red-400 mb-2">Component Error</h2>
            <p className="text-gray-300 mb-4">{error.message}</p>
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

// Card Detail Modal component for showing full card details including secret key
function CardDetailModal({ isOpen, onClose, card }: { isOpen: boolean; onClose: () => void; card: any }) {
  const [showSecretKey, setShowSecretKey] = useState(false);
  
  // Close on ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Function to download gift card data as JSON
  const downloadGiftCardData = () => {
    if (!card) return;
    
    const dataStr = JSON.stringify(card, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.giftCardId || card.publicKey || 'gift-card'}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  if (!isOpen || !card) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="z-50 w-full max-w-2xl border border-white bg-black" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-white p-4">
          <h2 className="text-center text-xl uppercase font-mono">GIFT CARD DETAILS</h2>
        </div>
        
        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Left Column - Card Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg uppercase font-mono mb-3">CARD INFORMATION</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Amount</p>
                  <p className="text-2xl font-bold">{card.amount} {card.tokenSymbol || 'SOL'}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-400 uppercase">Card ID</p>
                  <p className="text-sm break-all font-mono">{card.publicKey}</p>
                </div>
                
                {card.creationDate && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Created On</p>
                    <p className="font-mono">{new Date(card.creationDate).toLocaleDateString()}</p>
                  </div>
                )}
                
                {card.expiryTime > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Expires On</p>
                    <p className="font-mono">{new Date(card.expiryTime * 1000).toLocaleDateString()}</p>
                  </div>
                )}
                
                {card.themeName && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Theme</p>
                    <p className="font-mono">{card.themeName}</p>
                  </div>
                )}
              </div>
            </div>
            
            {card.message && (
              <div>
                <p className="text-xs text-gray-400 uppercase mb-1">Message</p>
                <div className="border border-white/30 p-3 bg-white/5 rounded">
                  <p className="font-mono text-sm whitespace-pre-wrap">{card.message}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Column - Redemption Info */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg uppercase font-mono mb-3">REDEMPTION INFO</h3>
              
              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase mb-1">Redemption URL</p>
                <div className="flex items-center border border-white/30 p-3 bg-white/5 rounded">
                  <p className="text-sm break-all text-blue-300 font-mono">{`${window.location.origin}/redeem/${card.publicKey}`}</p>
                  <button 
                    className="ml-2 text-xs border border-white px-2 py-1 hover:bg-white hover:text-black flex-shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/redeem/${card.publicKey}`);
                    }}
                  >
                    COPY
                  </button>
                </div>
              </div>
              
              {card.secretKey && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs text-gray-400 uppercase">Secret Key</p>
                    <button 
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      {showSecretKey ? 'Hide Key' : 'Show Key'}
                    </button>
                  </div>
                  <div className="border border-white/30 p-3 bg-red-900/10 rounded">
                    {showSecretKey ? (
                      <p className="font-mono text-xs break-all">{card.secretKey}</p>
                    ) : (
                      <p className="font-mono text-xs">
                        ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●● <span className="text-white/60">(hidden for security)</span>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-red-400 mt-1">
                    IMPORTANT: This secret key is needed for redemption. Keep it secure.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col space-y-3 mt-6">
                <button
                  onClick={downloadGiftCardData}
                  className="w-full border border-indigo-400 text-indigo-400 px-4 py-2 text-sm font-mono hover:bg-indigo-400 hover:text-black transition-colors"
                >
                  DOWNLOAD GIFT CARD DETAILS
                </button>
                <Link 
                  href={`/redeem/${card.publicKey}`}
                  className="w-full border border-white text-center px-4 py-2 text-sm font-mono hover:bg-white hover:text-black transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GO TO REDEMPTION PAGE
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white p-4 flex justify-end">
          <button
            onClick={onClose}
            className="border border-white px-6 py-2 font-mono hover:bg-white hover:text-black transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

// Actual component implementation
function MyCardsContentImpl() {
  const router = useRouter();
  
  // Use the context directly from React.useContext instead of the custom hook
  const walletContext = useContext(WalletContext);
  
  // Component state
  const [walletContextError, setWalletContextError] = useState<string | null>(null);
  const [connected, setConnected] = useState(walletContext?.connected || false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(walletContext?.publicKey || null);
  const [latestGiftCard, setLatestGiftCard] = useState<any>(null);
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showCardDetailModal, setShowCardDetailModal] = useState(false);
  
  // For cases where the wallet context isn't properly established yet
  useEffect(() => {
    // If there's no wallet context after 2 seconds, reload the page to get a fresh context
    let timeoutId: NodeJS.Timeout;
    
    if (!walletContext) {
      timeoutId = setTimeout(() => {
        // Try window reload to get a fresh context
        window.location.reload();
      }, 3000);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [walletContext]);
  
  // Update wallet connection state when it changes
  useEffect(() => {
    try {
      if (!walletContext) {
        setWalletContextError("Wallet context is not available. The page will reload momentarily.");
        return;
      }
      
      // Update state with current wallet data
      setConnected(walletContext.connected);
      setPublicKey(walletContext.publicKey);
      
      // Set up an interval to check for wallet status changes
      const intervalId = setInterval(() => {
        setConnected(walletContext.connected);
        setPublicKey(walletContext.publicKey);
      }, 1000);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    } catch (err) {
      
      setWalletContextError(err instanceof Error ? err.message : 'Unknown wallet context error');
    }
  }, [walletContext]);
  
  // Load gift card data when wallet connects
  useEffect(() => {
    if (!connected || !publicKey) {
      setLoading(false);
      return;
    }

    

    // Check if there's a latest gift card in localStorage
    try {
      const giftCardData = localStorage.getItem('latestGiftCard');
      if (giftCardData) {
        try {
          const parsedCard = JSON.parse(giftCardData);
          
          setLatestGiftCard(parsedCard);
          
          // Add the latest card to history if it's created by this wallet
          if (parsedCard.createdBy === publicKey.toString()) {
            // Get existing card history from localStorage
            const existingHistoryStr = localStorage.getItem('giftCardHistory') || '[]';
            let existingHistory = JSON.parse(existingHistoryStr);
            
            // Check if card already exists in history
            const exists = existingHistory.some((card: any) => card.publicKey === parsedCard.publicKey);
            
            if (!exists) {
              // Add to history and save back to localStorage
              existingHistory.push(parsedCard);
              localStorage.setItem('giftCardHistory', JSON.stringify(existingHistory));
              
            }
          }
        } catch (parseErr) {
          
        }
      } else {
        
      }

      // Load gift card history
      const historyStr = localStorage.getItem('giftCardHistory') || '[]';
      
      const history = JSON.parse(historyStr);
      
      // Filter cards created by the current wallet
      const myCards = history.filter((card: any) => card.createdBy === publicKey.toString());
      
      
      setCards(myCards);
    } catch (err) {
      
      
      // Clean up - removing debug code
      
    }

    setLoading(false);
  }, [connected, publicKey]);

  const handleDownload = useCallback(() => {
    if (!latestGiftCard) return;
    
    // Create a downloadable JSON file with gift card details
    const giftCardData = {
      ...latestGiftCard,
      redemptionUrl: `${window.location.origin}/redeem/${latestGiftCard.publicKey}`
    };
    
    const dataStr = JSON.stringify(giftCardData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataUri);
    downloadAnchorNode.setAttribute('download', `gift-card-${latestGiftCard.publicKey.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [latestGiftCard]);

  const clearLatestGiftCard = useCallback(() => {
    localStorage.removeItem('latestGiftCard');
    setLatestGiftCard(null);
  }, []);

  // Add function to clear card history
  const clearCardHistory = useCallback(() => {
    localStorage.removeItem('giftCardHistory');
    setCards([]);
    setShowClearModal(false);
    setShowSuccessModal(true);
  }, []);

  // Display error if wallet context fails
  if (walletContextError) {
    return (
      <main className="min-h-screen">
        <Navigation />
        
        <section className="pt-24">
          <div className="container">
            <div className="mb-8 border-b border-white pb-6">
              <h1 className="uppercase mb-4">MY GRANTNITE CARDS</h1>
              <div className="h-px bg-white w-24 my-4"></div>
            </div>
            
            <div className="border border-white p-8 mb-8">
              <h2 className="text-xl text-[rgb(var(--destructive))] mb-4 uppercase font-mono">WALLET ERROR</h2>
              <p className="text-white mb-6 font-mono">{walletContextError}</p>
              <div className="space-y-4">
                <p className="text-sm text-gray-300 font-mono">The page will automatically reload in a few seconds.</p>
                <button 
                  className="border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors font-mono uppercase"
                  onClick={() => window.location.reload()}
                >
                  RELOAD PAGE NOW
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navigation />
      
      {/* Custom Clear History Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-black border border-white max-w-md w-full">
            <div className="border-b border-white p-4">
              <h3 className="text-center text-xl uppercase font-mono">CONFIRMATION</h3>
            </div>
            <div className="p-6 font-mono">
              <p className="text-center mb-8">Are you sure you want to clear your card history? This action cannot be undone.</p>
              <div className="flex justify-center">
                <button 
                  onClick={clearCardHistory}
                  className="border border-white px-6 py-2 font-mono mx-2 hover:bg-white hover:text-black transition-colors"
                >
                  OK
                </button>
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="border border-white px-6 py-2 font-mono mx-2 hover:bg-white/10 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        message="Card history cleared successfully!"
      />
      
      {/* Card Detail Modal */}
      <CardDetailModal
        isOpen={showCardDetailModal}
        onClose={() => setShowCardDetailModal(false)}
        card={selectedCard}
      />
      
      <section className="pt-24">
        <div className="container">
          <div className="mb-8 border-b border-white pb-6">
            <h1 className="uppercase mb-4">MY GRANTNITE CARDS</h1>
            <div className="h-px bg-white w-24 my-4"></div>
            <p className="text-white max-w-2xl font-mono">
              View and manage your Grantnite cards. All your created cards are securely stored in your browser's local storage.
            </p>
          </div>
          
          {!connected ? (
            <div className="border border-white mb-12 p-8 text-center">
              <h2 className="text-xl mb-6 uppercase font-mono">CONNECT YOUR WALLET</h2>
              <p className="text-gray-300 mb-8 font-mono">
                You need to connect your wallet to view your gift cards.
              </p>
              <div className="flex justify-center">
                <div className="border border-white hover:bg-white hover:text-black transition-colors">
                  <WalletButton />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Tabs for organizing content */}
              <div className="grid grid-cols-2 mb-8 border border-white">
                <button 
                  className={`py-4 px-8 font-mono uppercase text-center ${activeTabIndex === 0 ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                  onClick={() => setActiveTabIndex(0)}
                >
                  Latest Grantnite Card
                </button>
                <button 
                  className={`py-4 px-8 font-mono uppercase text-center ${activeTabIndex === 1 ? 'bg-white text-black' : 'hover:bg-white/10'}`}
                  onClick={() => setActiveTabIndex(1)}
                >
                  Card History
                </button>
              </div>
            
              {activeTabIndex === 0 && (
                <>
                  {/* Display latest created gift card */}
                  {latestGiftCard ? (
                    <div className="mb-12 border border-white">
                      <div className="border-b border-white p-6">
                        <h2 className="text-2xl uppercase font-bold">LATEST GRANTNITE CARD</h2>
                      </div>
                      
                      <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-8">
                          {/* Card Preview */}
                          <div className="w-full aspect-video mb-4 overflow-hidden border border-white bg-black relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-blue-900/10 opacity-70"></div>
                            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20"></div>
                            
                            <div className="p-8 flex flex-col h-full justify-center items-center relative z-10">
                              <div className="text-center">
                                <div className="text-xs text-white/70 uppercase mb-3 tracking-wider font-mono">AMOUNT</div>
                                <div className="text-4xl font-bold text-white">
                                  {latestGiftCard.amount.toFixed(8).replace(/\.?0+$/, '')} {latestGiftCard.tokenSymbol || 'SOL'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[rgb(var(--primary))]/50 to-transparent"></div>
                          </div>
                          
                          {/* Card Summary */}
                          <div className="space-y-6 font-mono">
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                              <span className="text-[rgb(var(--primary))]">01</span>
                              <div>
                                <p className="text-xs uppercase text-gray-400">Card ID</p>
                                <p className="text-sm overflow-hidden overflow-ellipsis">{latestGiftCard.publicKey}</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                              <span className="text-[rgb(var(--primary))]">02</span>
                              <div>
                                <p className="text-xs uppercase text-gray-400">Created</p>
                                <p>{new Date(latestGiftCard.creationDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            
                            {latestGiftCard.expiryTime > 0 && (
                              <div className="grid grid-cols-[auto_1fr] gap-4 items-center">
                                <span className="text-[rgb(var(--primary))]">03</span>
                                <div>
                                  <p className="text-xs uppercase text-gray-400">Expires</p>
                                  <p>{new Date(latestGiftCard.expiryTime * 1000).toLocaleDateString()}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-4 mt-8">
                          <button
                            onClick={() => {
                              setSelectedCard(latestGiftCard);
                              setShowCardDetailModal(true);
                            }}
                            className="border border-white px-6 py-3 font-mono text-sm hover:bg-white hover:text-black transition-colors"
                          >
                            VIEW DETAILS
                          </button>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/redeem/${latestGiftCard.publicKey}`);
                            }}
                            className="border border-indigo-400 text-indigo-400 px-6 py-3 font-mono text-sm hover:bg-indigo-400 hover:text-black transition-colors"
                          >
                            COPY REDEMPTION LINK
                          </button>
                          
                          <button
                            onClick={clearLatestGiftCard}
                            className="border border-[rgb(var(--destructive))] text-[rgb(var(--destructive))] px-6 py-3 font-mono text-sm hover:bg-[rgb(var(--destructive))] hover:text-white transition-colors"
                          >
                            CLEAR
                          </button>
                        </div>
                      </div>
                      
                      <div className="border-t border-white p-4 text-center font-mono text-xs">
                        <p className="text-gray-400">
                          Use the "View Details" button to see the gift card secret key and all other information.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white p-8 text-center mb-12">
                      <h3 className="text-xl mb-4 font-mono">NO ACTIVE GRANTNITE CARD</h3>
                      <p className="text-gray-300 mb-6 font-mono text-sm">
                        You haven't created a Grantnite card yet or have cleared your latest card.
                      </p>
                      <Link 
                        href="/create" 
                        className="inline-block border border-white px-6 py-3 font-mono uppercase text-sm hover:bg-white hover:text-black transition-colors"
                      >
                        CREATE A GRANTNITE CARD
                      </Link>
                    </div>
                  )}
                </>
              )}

              {activeTabIndex === 1 && (
                <div className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold uppercase font-mono">CARD HISTORY</h2>
                    {cards.length > 0 && (
                      <button
                        onClick={() => setShowClearModal(true)}
                        className="border border-white px-4 py-2 font-mono text-sm hover:bg-[rgb(var(--destructive))] hover:border-[rgb(var(--destructive))] transition-colors"
                      >
                        CLEAR HISTORY
                      </button>
                    )}
                  </div>
                  
                  {loading ? (
                    <div className="border border-white p-8 text-center">
                      <div className="inline-block w-8 h-8 border-t-2 border-r-2 border-white rounded-full animate-spin mb-4"></div>
                      <p className="font-mono">Loading your gift cards...</p>
                    </div>
                  ) : cards.length > 0 ? (
                    <div className="grid gap-px border border-white">
                      {cards.map((card, index) => (
                        <div key={card.publicKey} className="p-6 border-b border-white last:border-b-0">
                          <div className="grid md:grid-cols-[1fr_auto] gap-4">
                            <div>
                              <div className="grid grid-cols-[auto_1fr] gap-4 items-center mb-4">
                                <span className="text-[rgb(var(--primary))] font-mono">{String(index+1).padStart(2, '0')}</span>
                                <h3 className="text-lg font-bold uppercase">
                                  {card.amount} {card.tokenSymbol || 'SOL'} GIFT CARD
                                </h3>
                              </div>
                              
                              <div className="space-y-2 font-mono">
                                <p className="text-sm overflow-hidden overflow-ellipsis">
                                  <span className="text-gray-400">ID:</span> {card.publicKey}
                                </p>
                                <p className="text-sm">
                                  <span className="text-gray-400">Created:</span> {new Date(card.creationDate).toLocaleDateString()}
                                </p>
                                {card.expiryTime > 0 && (
                                  <p className="text-sm">
                                    <span className="text-gray-400">Expires:</span> {new Date(card.expiryTime * 1000).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedCard(card);
                                  setShowCardDetailModal(true);
                                }}
                                className="border border-white px-4 py-2 font-mono text-sm hover:bg-white hover:text-black transition-colors"
                              >
                                VIEW DETAILS
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/redeem/${card.publicKey}`);
                                }}
                                className="border border-indigo-400 text-indigo-400 px-4 py-2 font-mono text-sm hover:bg-indigo-400 hover:text-black transition-colors"
                                title="Copy redemption link"
                              >
                                COPY LINK
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-white p-8 text-center">
                      <p className="text-gray-300 mb-6 font-mono">
                        You haven't created any gift cards yet.
                      </p>
                      <Link 
                        href="/create" 
                        className="inline-block border border-white px-6 py-3 font-mono uppercase text-sm hover:bg-white hover:text-black transition-colors"
                      >
                        CREATE YOUR FIRST GIFT CARD
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

// Export the component wrapped in an error boundary
export default function MyCardsContent() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyCardsContentImpl />
    </ErrorBoundary>
  );
} 