'use client';

/**
 * Utility functions for handling wallet errors
 */

// Known error types that can be more user-friendly
const knownErrors = {
  'Failed to fetch': 'Network connection issue. Please check your internet connection.',
  'User rejected': 'Transaction was rejected. Please approve the transaction in your wallet.',
  'rejected the request': 'Transaction was rejected. Please approve the transaction in your wallet.',
  'canceled': 'Transaction was canceled. Please try again.',
  'Transaction simulation failed': 'Transaction simulation failed. Your wallet may have insufficient funds.',
  'Transaction was not confirmed': 'Transaction timed out. It may still complete, please check your wallet.',
  'Invalid blockhash': 'The network is experiencing high traffic. Please try again.',
  'Cannot redefine property': 'Wallet initialization conflict. Please refresh the page and try again.',
  'Error: WalletSendTransactionError': 'Error sending transaction. Please check your wallet connection.',
  'WalletContext': 'Wallet provider issue. Please try refreshing the page.',
  'read "publicKey" on a WalletContext': 'Wallet connection issue. Please refresh the page.',
  'read "wallet" on a WalletContext': 'Wallet context initialization error. Please refresh the page.',
  'Insufficient funds': 'On devnet, try clicking "Confirm anyway" if available. If on mainnet, add more SOL to your wallet.',
  'insufficient lamports': 'On devnet, try clicking "Confirm anyway" if available. If on mainnet, add more SOL to your wallet.',
  'Unexpected error': 'Unexpected wallet error. Please try again or switch wallets.',
  'WalletSendTransactionError': 'Error sending transaction through wallet. Please try again or use a different wallet.',
  'WalletSignTransactionError': 'Error signing transaction with wallet. Please try again or use a different wallet.',
  'WalletConnectionError': 'Could not connect to wallet. Please check your browser permissions and try again.',
  'WalletDisconnectedError': 'Wallet disconnected. Please reconnect your wallet and try again.',
  'WalletTimeoutError': 'Wallet operation timed out. Please try again when the network is less congested.',
  'RPC connection failed': 'Could not connect to Solana network. Please try again later.'
};

/**
 * Format wallet error messages to be more user-friendly
 */
export function formatWalletError(error: any): string {
  if (!error) return 'Unknown error';
  
  // Extract error message
  const errorMessage = typeof error === 'string' 
    ? error 
    : error.message || error.toString();
  
  // Check for known error patterns
  for (const [pattern, friendlyMessage] of Object.entries(knownErrors)) {
    if (errorMessage.includes(pattern)) {
      return friendlyMessage;
    }
  }
  
  // If we don't recognize the error, return a cleaned version of the original
  return errorMessage.replace(/Error: /g, '').trim();
}

/**
 * Get more details from wallet transaction errors
 */
function extractTransactionErrorDetails(error: any): Record<string, any> {
  const details: Record<string, any> = {};
  
  try {
    // Try to extract standard error properties
    if (error.name) details.errorType = error.name;
    if (error.code) details.errorCode = error.code;
    
    // Try to extract transaction-specific details
    if (error.error) details.innerError = error.error;
    if (error.cause) details.cause = error.cause;
    
    // Extract WalletSendTransactionError specific properties
    if (error.signature) details.signature = error.signature;
    if (error.logs) details.logs = error.logs;
    
    // Enhanced error extraction for wallet adapter errors
    if (error.name === 'WalletSendTransactionError') {
      // Try to get any nested error details
      if (typeof error.message === 'string') {
        details.walletErrorMessage = error.message;
      }
      
      // Check for nested error objects
      if (error.error) {
        details.nestedError = typeof error.error === 'object' 
          ? JSON.stringify(error.error) 
          : error.error.toString();
      }
    }
    
    // Add stack trace for deeper analysis
    if (error.stack) {
      details.stackSummary = error.stack.split('\n').slice(0, 3).join('\n');
    }
  } catch (e) {
    details.extractionError = 'Failed to extract error details';
  }
  
  return details;
}

/**
 * Log wallet errors with additional context
 */
export function logWalletError(error: any, context: string): void {
  // Additional logging for specific errors
  if (error?.name === 'WalletSendTransactionError' || 
      (error?.message && error.message.includes('transaction'))) {
    const txDetails = extractTransactionErrorDetails(error);
    
  }
}

/**
 * Register global handlers for wallet errors
 */
export function registerWalletErrorHandlers(): void {
  if (typeof window === 'undefined') return;
  
  // Store original handlers
  const originalWindowError = window.onerror;
  const originalUnhandledRejection = window.onunhandledrejection;
  
  // Set up global error handler
  window.onerror = function(message, source, lineno, colno, error) {
    // Check if this is a wallet-related error
    const errorString = error?.message || message?.toString() || '';
    if (errorString.includes('wallet') || 
        errorString.includes('transaction') || 
        errorString.includes('solana')) {
      logWalletError(error || message, 'global-error');
    }
    
    // Call original handler
    if (typeof originalWindowError === 'function') {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Set up unhandled promise rejection handler
  window.onunhandledrejection = function(event) {
    const error = event.reason;
    const errorString = error?.message || error?.toString() || '';
    
    if (errorString.includes('wallet') || 
        errorString.includes('transaction') || 
        errorString.includes('solana')) {
      logWalletError(error, 'unhandled-promise');
    }
    
    // Call original handler
    if (typeof originalUnhandledRejection === 'function') {
      return originalUnhandledRejection.call(window, event);
    }
  };
} 