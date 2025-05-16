'use client';

import { ReactNode, useState, useEffect } from 'react';

interface ClientProviderProps {
  children: ReactNode;
}

// This component ensures that content only renders on the client side
// It helps prevent hydration errors and "Cannot read properties of undefined" errors
export default function ClientProvider({ children }: ClientProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder with similar dimensions to minimize layout shift
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="h-4 w-48 bg-white/20 rounded mb-4"></div>
        <div className="h-12 w-40 bg-white/10 rounded mx-auto"></div>
      </div>
    </div>;
  }

  return <>{children}</>;
} 