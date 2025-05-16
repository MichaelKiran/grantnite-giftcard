'use client';

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { getConnection } from '../utils/solana';

interface CardRedemptionCheckerProps {
  publicKey: string;
  onStatusChange?: (status: {
    exists: boolean;
    balance: number;
    error: string | null;
  }) => void;
}

/**
 * Component that checks card redemption status
 * This helps diagnose issues with card loading
 */
export default function CardRedemptionChecker({ publicKey, onStatusChange }: CardRedemptionCheckerProps) {
  const [status, setStatus] = useState({
    exists: false,
    balance: 0,
    error: null as string | null,
    checked: false
  });

  useEffect(() => {
    let isMounted = true;
    
    async function checkCardStatus() {
      if (!publicKey) return;
      
      try {
        // Create PublicKey object
        const pubKey = new PublicKey(publicKey);
        
        // Get connection
        const connection = getConnection();
        
        // Check balance
        const balance = await connection.getBalance(pubKey);
        
        if (isMounted) {
          const newStatus = {
            exists: true,
            balance,
            error: null,
            checked: true
          };
          
          setStatus(newStatus);
          if (onStatusChange) {
            onStatusChange({
              exists: newStatus.exists,
              balance: newStatus.balance,
              error: newStatus.error
            });
          }
        }
      } catch (err) {
        
        
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error checking card';
          const newStatus = {
            exists: false,
            balance: 0,
            error: errorMessage,
            checked: true
          };
          
          setStatus(newStatus);
          if (onStatusChange) {
            onStatusChange({
              exists: newStatus.exists,
              balance: newStatus.balance,
              error: newStatus.error
            });
          }
        }
      }
    }
    
    // Check card status immediately
    checkCardStatus();
    
    // Check again every 5 seconds
    const intervalId = setInterval(checkCardStatus, 5000);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [publicKey, onStatusChange]);

  // This component doesn't render anything visible
  // It only provides status information through onStatusChange
  return null;
} 