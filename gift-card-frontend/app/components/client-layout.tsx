'use client';

import React, { useState, useEffect } from 'react';
import { WalletContextProvider } from '../context/wallet-context';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return <div>Loading...</div>;
  }
  
  return (
    <WalletContextProvider>
      {children}
    </WalletContextProvider>
  );
} 