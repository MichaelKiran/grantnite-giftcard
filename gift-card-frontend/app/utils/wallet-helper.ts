'use client';

// Helper functions for wallet interaction

/**
 * Attempts to directly connect to Phantom wallet via window.solana
 * This is a fallback method when the standard adapter isn't working
 */
export async function connectPhantomDirect(): Promise<boolean> {
  try {
    // Check if Phantom is available via window.solana
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      
      
      // Try connecting directly
      try {
        await window.solana.connect();
        
        return true;
      } catch (e) {
        
        return false;
      }
    } else {
      
      return false;
    }
  } catch (e) {
    
    return false;
  }
}

/**
 * Get the current Phantom wallet status and details
 */
export function getPhantomStatus(): { 
  available: boolean; 
  connected: boolean;
  publicKey?: string;
} {
  try {
    if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
      return {
        available: true,
        connected: window.solana.isConnected,
        publicKey: window.solana.publicKey?.toString(),
      };
    }
    
    return { available: false, connected: false };
  } catch (e) {
    
    return { available: false, connected: false };
  }
}

/**
 * Add Phantom wallet typings
 */
declare global {
  interface Window {
    solana?: {
      isPhantom: boolean;
      isConnected: boolean;
      publicKey?: any;
      connect: () => Promise<any>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: any) => Promise<any>;
      signAllTransactions: (transactions: any[]) => Promise<any[]>;
      signMessage: (message: Uint8Array) => Promise<any>;
    };
  }
} 