'use client';

import { useState, useEffect } from 'react';
import { useWalletContext } from '../context/wallet-context';

export default function WalletInitializer({ 
  onInitialize 
}: { 
  onInitialize: (context: any) => void 
}) {
  const [initialized, setInitialized] = useState(false);

  // Safely access wallet context
  let walletContext;
  try {
    walletContext = useWalletContext();
  } catch (err) {
    
    return null;
  }

  // Initialize once
  useEffect(() => {
    if (!initialized && walletContext) {
      onInitialize(walletContext);
      setInitialized(true);
    }
  }, [initialized, walletContext, onInitialize]);

  // This component doesn't render anything visible
  return null;
} 