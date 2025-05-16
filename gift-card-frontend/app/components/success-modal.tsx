'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  giftCardData?: {
    publicKey?: string;
    secretKey?: string;
    giftCardId?: string;
    amount?: number;
    tokenSymbol?: string;
    tokenName?: string;
    message?: string;
    senderName?: string;
    themeName?: string;
  };
}

export default function SuccessModal({ isOpen, onClose, message, giftCardData }: SuccessModalProps) {
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
    if (!giftCardData) return;
    
    const dataStr = JSON.stringify(giftCardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${giftCardData.giftCardId || 'gift-card'}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="z-50 w-full max-w-md border border-white"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
            >
              <div className="w-full">
                {/* Header */}
                <div className="border-b border-white p-4">
                  <h2 className="text-center text-xl uppercase font-mono">SUCCESS</h2>
                </div>
                
                {/* Content */}
                <div className="p-6 bg-black text-white text-center">
                  <p className="font-mono mb-4">{message}</p>
                  
                  {giftCardData && giftCardData.amount && (
                    <div className="mb-6">
                      <div className="p-4 border border-white/30 bg-white/10 mb-4 flex flex-col items-center">
                        <p className="font-mono text-lg mb-1">Amount</p>
                        <p className="font-mono text-2xl">{giftCardData.amount} {giftCardData.tokenSymbol || 'SOL'}</p>
                        
                        {/* Card Details Section */}
                        <div className="w-full mt-4 text-left">
                          <div className="border-t border-white/20 pt-3 mb-2">
                            <p className="text-xs text-white/60 mb-1">Card ID:</p>
                            <p className="font-mono text-xs break-all">{giftCardData.publicKey}</p>
                          </div>
                          
                          {giftCardData.secretKey && (
                            <div className="mb-2">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-xs text-white/60">Secret Key:</p>
                                <button 
                                  onClick={() => setShowSecretKey(!showSecretKey)}
                                  className="text-xs text-indigo-400 hover:underline"
                                >
                                  {showSecretKey ? 'Hide Key' : 'Show Key'}
                                </button>
                              </div>
                              {showSecretKey ? (
                                <p className="font-mono text-xs break-all bg-black/50 p-2 border border-white/20">
                                  {giftCardData.secretKey}
                                </p>
                              ) : (
                                <p className="font-mono text-xs bg-black/50 p-2 border border-white/20">
                                  ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●● 
                                  <span className="text-white/60">(hidden for security)</span>
                                </p>
                              )}
                              <p className="text-xs text-white/60 mt-1">
                                <strong>IMPORTANT:</strong> Anyone with this secret key can redeem the gift card.
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="w-full flex flex-col mt-4 space-y-2">
                          <button
                            onClick={downloadGiftCardData}
                            className="w-full border border-indigo-400 text-indigo-400 px-4 py-2 text-sm font-mono hover:bg-indigo-400 hover:text-black transition-colors"
                          >
                            Download Gift Card Details
                          </button>
                          <p className="text-xs text-white/60">
                            Save this file to share or keep as a backup.
                          </p>
                        </div>
                      </div>
                      
                      <Link href="/my-cards" className="flex items-center justify-center text-indigo-400 hover:underline">
                        <span className="mr-1">View all your cards</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <button
                      onClick={onClose}
                      className="border border-white px-8 py-2 font-mono hover:bg-white hover:text-black transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}