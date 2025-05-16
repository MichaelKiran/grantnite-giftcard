'use client';

import React, { useContext, useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Create a dynamic wallet component wrapper with no SSR
const WalletComponentsWrapper = dynamic(
  () => import('./wallet-wrapper').then(mod => mod.WalletComponentsWrapper),
  { ssr: false }
);

// Import the WalletContext from wallet-wrapper
import { WalletContext } from './wallet-wrapper';

// Create a provider component for the wallet context
export function WalletContextProvider({ children }: { children: React.ReactNode }) {
  // This is crucial for avoiding hydration mismatches
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Save a timestamp in sessionStorage to track when the wallet context was last mounted
    // This helps with state persistence between page navigations
    sessionStorage.setItem('walletContextMounted', Date.now().toString());
    
    // Create a beforeunload handler to ensure wallet state is preserved during navigation
    const handleBeforeUnload = () => {
      sessionStorage.setItem('walletContextNavigating', 'true');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // When unmounting, note that the context is being destroyed but not due to page unload
      sessionStorage.setItem('walletContextUnmounted', Date.now().toString());
    };
  }, []);

  if (!mounted) {
    // Return empty div with same structure to avoid layout shifts
    return <div style={{ minHeight: '100vh' }}>{children}</div>;
  }

  return <WalletComponentsWrapper>{children}</WalletComponentsWrapper>;
}

// Create a hook for using the wallet context
export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletContextProvider');
  }
  return context;
}

// Export the wallet button component with no SSR to prevent hydration mismatches
export const WalletButton = dynamic(
  async () => (props) => <WalletMultiButton {...props} />,
  { ssr: false }
);

// Export the context for other components to use
export { WalletContext }; 