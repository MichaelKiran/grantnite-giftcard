/**
 * Polyfill for wallet standard
 * 
 * This file adds necessary polyfills for wallet adapter compatibility
 * across different browsers and environments.
 */

type SolanaProvider = {
  isPhantom: boolean;
  isConnected: boolean;
  publicKey?: any;
  connect: () => Promise<any>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Navigator {
    wallets?: any[];
    registerProtocolHandler?: (...args: any[]) => any;
  }
  
  interface Window {
    phantom?: {
      solana?: SolanaProvider;
    };
    solana?: SolanaProvider;
    React?: any;
    _reactLoaded?: boolean;
    _walletsInitialized?: boolean;
  }
}

// Function to safely apply wallet polyfill with error handling
function applyWalletPolyfill() {
  if (typeof window === 'undefined' || !window.navigator) return;
  
  try {
    // Only apply the polyfill once to avoid "Cannot redefine property" errors
    if (window._walletsInitialized) return;
    
    // Check if wallets property already exists
    const hasWallets = 'wallets' in window.navigator;
    
    // Only create the property if it doesn't already exist
    if (!hasWallets) {
      try {
        // First attempt: Use Object.defineProperty with configurable: true
        Object.defineProperty(window.navigator, 'wallets', {
          value: [],
          writable: true,
          configurable: true
        });
      } catch (err) {
        // Second attempt: Use a proxy-based approach (more compatible)
        try {
          const originalNavigator = window.navigator;
          // Create a proxy that returns an empty array for wallets property
          const navigatorProxy = new Proxy(originalNavigator, {
            get(target, prop) {
              if (prop === 'wallets') {
                return [];
              }
              return target[prop as keyof Navigator];
            }
          });
          
          // Try to make this work in the global scope
          try {
            // @ts-ignore - intentional hack for compatibility
            window.navigator = navigatorProxy;
          } catch (proxyErr) {
            // Ignore proxy errors
          }
        } catch (proxyErr) {
          // Ignore proxy errors
        }
      }
    }
    
    // Try to create a minimal mock of Phantom for development if needed
    if (process.env.NODE_ENV === 'development' && !window.phantom?.solana && !window.solana) {
      try {
        // Create a mock implementation
        const mockSolana: SolanaProvider = {
          isPhantom: false,
          isConnected: false,
          publicKey: undefined,
          connect: async () => { 
            throw new Error('No wallet installed - mock for development only'); 
          },
          disconnect: async () => {},
          signTransaction: async () => { 
            throw new Error('No wallet installed - mock for development only'); 
          },
          signAllTransactions: async () => { 
            throw new Error('No wallet installed - mock for development only'); 
            return [];
          },
          signMessage: async () => { 
            throw new Error('No wallet installed - mock for development only'); 
            return { signature: new Uint8Array() };
          }
        };
        
        window.phantom = {
          solana: mockSolana
        };
      } catch (mockErr) {
        // Ignore mock errors
      }
    }
    
    // Make certain wallet adapter methods no-ops if they don't exist
    if (typeof window.navigator.registerProtocolHandler !== 'function') {
      try {
        Object.defineProperty(window.navigator, 'registerProtocolHandler', {
          value: () => {},
          writable: true,
          configurable: true
        });
      } catch (err) {
        // Ignore errors
      }
    }
    
    // Cache the React instance to help prevent multiple React instances error
    try {
      if (!window._reactLoaded && !window.React) {
        try {
          // Try to get React from any existing components
          window.React = window.React || (window as any).__NEXT_DATA__?.props?.pageProps?.React;
        } catch (e) {
          // Ignore React errors
        }
        window._reactLoaded = true;
      }
    } catch (e) {
      // Ignore React errors
    }
    
    // Mark as initialized to prevent multiple attempts
    window._walletsInitialized = true;
  } catch (e) {
    // Ignore global errors
  }
}

// Apply the polyfill safely with retries
try {
  // First attempt
  applyWalletPolyfill();
  
  // Backup: Also apply on DOM content loaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(applyWalletPolyfill, 0);
      });
    } else {
      // Document already loaded, try once more after a short delay
      setTimeout(applyWalletPolyfill, 100);
    }
    
    // Final attempt on window load
    window.addEventListener('load', () => {
      setTimeout(applyWalletPolyfill, 0);
    });
  }
} catch (err) {
  // Ignore global errors
}

export {}; 