'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LocalStorageDebug() {
  const [redeemedCards, setRedeemedCards] = useState<any>(null);
  const [latestGiftCard, setLatestGiftCard] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [clearLocalStorage, setClearLocalStorage] = useState(false);
  const [clearKey, setClearKey] = useState('');
  const [localStorageCleaned, setLocalStorageCleaned] = useState(false);

  useEffect(() => {
    try {
      // Get all localStorage data
      const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards');
      const latestGiftCardJSON = localStorage.getItem('latestGiftCard');
      const historyJSON = localStorage.getItem('giftCardHistory');

      if (redeemedCardsJSON) {
        setRedeemedCards(JSON.parse(redeemedCardsJSON));
      }

      if (latestGiftCardJSON) {
        setLatestGiftCard(JSON.parse(latestGiftCardJSON));
      }

      if (historyJSON) {
        setHistory(JSON.parse(historyJSON));
      }
    } catch (error) {
      console.error('Error loading localStorage data:', error);
    }
  }, [clearLocalStorage]);

  const handleRemoveCard = (key: string) => {
    try {
      const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards');
      if (redeemedCardsJSON) {
        const redeemedCards = JSON.parse(redeemedCardsJSON);
        delete redeemedCards[key];
        localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
        setClearLocalStorage(!clearLocalStorage); // Trigger refresh
      }
    } catch (error) {
      console.error('Error removing card:', error);
    }
  };

  const handleClearSpecificKey = () => {
    if (clearKey.trim() === '') return;
    
    try {
      const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards');
      if (redeemedCardsJSON) {
        const redeemedCards = JSON.parse(redeemedCardsJSON);
        delete redeemedCards[clearKey];
        localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
        setClearLocalStorage(!clearLocalStorage); // Trigger refresh
        setClearKey('');
      }
    } catch (error) {
      console.error('Error clearing specific key:', error);
    }
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all redeemed gift cards data?')) {
      localStorage.removeItem('redeemedGiftCards');
      setClearLocalStorage(!clearLocalStorage); // Trigger refresh
    }
  };

  // Function to reset all localStorage data related to gift card redemption
  const resetAllCardData = () => {
    if (confirm('This will completely reset ALL gift card data. Are you sure?')) {
      localStorage.removeItem('redeemedGiftCards');
      localStorage.removeItem('latestGiftCard');
      localStorage.removeItem('giftCardHistory');
      setLocalStorageCleaned(true);
      setClearLocalStorage(!clearLocalStorage);
    }
  };
  
  // Function specifically for USDC testing
  const cleanupForUSDCTest = () => {
    try {
      const redeemedCardsJSON = localStorage.getItem('redeemedGiftCards') || '{}';
      const redeemedCards = JSON.parse(redeemedCardsJSON);
      
      // Find and remove any keys that might contain USDC-DEV token mint
      const usdcDevMint = "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr";
      let cleanedCount = 0;
      
      // Remove all entries that have this token mint
      Object.keys(redeemedCards).forEach(key => {
        const card = redeemedCards[key];
        if (
          (card.tokenMint && card.tokenMint === usdcDevMint) || 
          (key.includes(usdcDevMint)) ||
          (card.tokenSymbol && card.tokenSymbol === "USDC-DEV")
        ) {
          delete redeemedCards[key];
          cleanedCount++;
        }
      });
      
      localStorage.setItem('redeemedGiftCards', JSON.stringify(redeemedCards));
      alert(`Cleaned ${cleanedCount} USDC-DEV related entries from localStorage`);
      
      setClearLocalStorage(!clearLocalStorage);
    } catch (error) {
      console.error('Error cleaning USDC-DEV data:', error);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">LocalStorage Debug</h1>
      
      <div className="mb-8">
        <Link href="/redeem" className="text-blue-500 hover:underline">
          ← Back to Redeem Page
        </Link>
      </div>

      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">Redeemed Gift Cards</h2>
        <div className="space-x-2">
          <button 
            onClick={() => setShowRaw(!showRaw)}
            className="px-4 py-2 bg-gray-800 text-white rounded"
          >
            {showRaw ? 'Show Formatted' : 'Show Raw'}
          </button>
          <button 
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-800 text-white rounded"
          >
            Clear All
          </button>
          <button 
            onClick={resetAllCardData}
            className="px-4 py-2 bg-red-900 text-white rounded ml-2"
          >
            Reset All Data
          </button>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-end gap-2 mb-4">
          <div className="flex-grow">
            <label className="block text-sm font-medium mb-1">Clear Specific Gift Card Key</label>
            <input
              type="text"
              value={clearKey}
              onChange={(e) => setClearKey(e.target.value)}
              placeholder="Enter gift card public key to remove"
              className="w-full px-4 py-2 border border-gray-300 rounded text-black"
            />
          </div>
          <button
            onClick={handleClearSpecificKey}
            className="px-4 py-2 bg-red-800 text-white rounded"
            disabled={!clearKey.trim()}
          >
            Clear Key
          </button>
        </div>
        
        {/* USDC-DEV Testing Helper */}
        <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500 rounded">
          <h3 className="text-lg font-semibold mb-2">USDC-DEV Testing Helper</h3>
          <p className="text-sm mb-4">
            If you're having issues with USDC-DEV tokens showing as already redeemed, 
            click the button below to clean all USDC-DEV related entries from localStorage.
          </p>
          <button
            onClick={cleanupForUSDCTest}
            className="px-4 py-2 bg-blue-700 text-white rounded"
          >
            Clean USDC-DEV Entries
          </button>
        </div>
      </div>

      {redeemedCards ? (
        showRaw ? (
          <div className="mb-8">
            <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-[500px]">
              {JSON.stringify(redeemedCards, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="grid gap-4 mb-8">
            {Object.keys(redeemedCards).map((key) => (
              <div key={key} className="border border-gray-700 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-mono text-sm break-all font-bold">{key}</h3>
                  <button
                    onClick={() => handleRemoveCard(key)}
                    className="px-2 py-1 bg-red-700 text-white text-xs rounded"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-gray-400 text-sm">Amount:</span>{' '}
                    <span className="font-semibold">{redeemedCards[key].amount}</span>
                    {redeemedCards[key].tokenSymbol && (
                      <span> {redeemedCards[key].tokenSymbol}</span>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-400 text-sm">Redeemed:</span>{' '}
                    <span className="font-semibold">
                      {redeemedCards[key].redeemed || redeemedCards[key].isRedeemed ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {redeemedCards[key].tokenMint && (
                    <div className="md:col-span-2">
                      <span className="text-gray-400 text-sm">Token Mint:</span>{' '}
                      <span className="font-mono text-xs break-all">{redeemedCards[key].tokenMint}</span>
                    </div>
                  )}
                  
                  {redeemedCards[key].senderName && (
                    <div>
                      <span className="text-gray-400 text-sm">Sender:</span>{' '}
                      <span>{redeemedCards[key].senderName}</span>
                    </div>
                  )}
                  
                  {redeemedCards[key].redeemedAt && (
                    <div>
                      <span className="text-gray-400 text-sm">Redeemed At:</span>{' '}
                      <span>{new Date(redeemedCards[key].redeemedAt).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {redeemedCards[key].message && (
                    <div className="md:col-span-2">
                      <span className="text-gray-400 text-sm">Message:</span>{' '}
                      <span className="italic">{redeemedCards[key].message}</span>
                    </div>
                  )}
                </div>
                
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-400">Show all data</summary>
                  <pre className="mt-2 bg-gray-900 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(redeemedCards[key], null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )
      ) : (
        <p className="text-gray-400 mb-8">No redeemed gift cards found in localStorage</p>
      )}

      <h2 className="text-2xl font-bold mb-4">Latest Gift Card</h2>
      {latestGiftCard ? (
        <div className="mb-8">
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-[200px]">
            {JSON.stringify(latestGiftCard, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="text-gray-400 mb-8">No latest gift card found in localStorage</p>
      )}

      <h2 className="text-2xl font-bold mb-4">Gift Card History</h2>
      {history ? (
        <div>
          <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-[200px]">
            {JSON.stringify(history, null, 2)}
          </pre>
        </div>
      ) : (
        <p className="text-gray-400">No gift card history found in localStorage</p>
      )}
    </div>
  );
} 