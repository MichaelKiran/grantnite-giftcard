'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { 
  ConnectionProvider, 
  WalletProvider, 
  useWallet
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PublicKey, Connection } from '@solana/web3.js';

// Create the wallet context type
interface WalletContextType {
  wallet: any;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  disconnect: () => Promise<void>;
  connect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction: (transaction: any) => Promise<any>;
  sendTransaction: (transaction: any, connection: Connection, options?: any) => Promise<string>;
}

// Create the wallet context (export it so others can access it)
export const WalletContext = React.createContext<WalletContextType | null>(null);

// Import wallet polyfill
import '../utils/wallet-polyfill';

// Create a component to provide the wallet context content
function WalletContextContent({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();
  
  const {
    publicKey,
    connected,
    connecting,
    disconnect,
    signMessage,
    signTransaction,
    sendTransaction,
  } = wallet;
  
  // Safe connect function that shows the wallet modal
  const connect = async () => {
    try {
      setError(null);
      if (wallet.wallet) {
        await wallet.connect();
      } else {
        // If no wallet is selected, set an error
        setError("Please select a wallet first");
      }
    } catch (err) {
      
      // Handle error without using WalletError type
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to wallet");
      }
    }
  };

  // Safe disconnect function
  const safeDisconnect = async () => {
    try {
      setError(null);
      await disconnect();
    } catch (err) {
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to disconnect wallet");
      }
    }
  };

  // Safe sign message function
  const safeSignMessage = async (message: Uint8Array) => {
    try {
      setError(null);
      if (!signMessage) {
        throw new Error("Wallet does not support message signing");
      }
      return await signMessage(message);
    } catch (err) {
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign message");
      }
      throw err; // Re-throw to let the caller handle it
    }
  };

  // Safe sign transaction function
  const safeSignTransaction = async (transaction: any) => {
    try {
      setError(null);
      if (!signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }
      return await signTransaction(transaction);
    } catch (err) {
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign transaction");
      }
      throw err; // Re-throw to let the caller handle it
    }
  };

  // Safe send transaction function
  const safeSendTransaction = async (transaction: any, connection: Connection, options?: any) => {
    try {
      setError(null);
      return await sendTransaction(transaction, connection, options);
    } catch (err) {
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send transaction");
      }
      throw err; // Re-throw to let the caller handle it
    }
  };
  
  // Clear errors when wallet changes
  useEffect(() => {
    setError(null);
  }, [wallet.wallet]);

  return (
    <WalletContext.Provider
      value={{
        wallet: wallet.wallet,
        publicKey,
        connected,
        connecting,
        error,
        disconnect: safeDisconnect,
        connect,
        signMessage: safeSignMessage,
        signTransaction: safeSignTransaction,
        sendTransaction: safeSendTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function WalletComponentsWrapper({ children }: { children: React.ReactNode }) {
  // Configure the connection to the Solana network using useMemo for consistency
  const endpoint = useMemo(() => 
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  []);

  // Configure the wallet adapters
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <WalletContextContent>
            {children}
          </WalletContextContent>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
} 