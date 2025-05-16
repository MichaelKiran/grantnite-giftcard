import bs58 from 'bs58';

// Wrap the bs58 functions to avoid TypeScript issues
export function encode(data: Uint8Array): string {
  // @ts-ignore - TypeScript doesn't recognize the encode method, but it exists
  return bs58.encode(data);
}

export function decode(str: string): Uint8Array {
  if (!str || typeof str !== 'string') {
    throw new Error('Invalid input: Expected a non-empty string for bs58 decoding');
  }
  
  try {
    // @ts-ignore - TypeScript doesn't recognize the decode method, but it exists
    return bs58.decode(str);
  } catch (err) {
    
    throw new Error(`Failed to decode base58 string: ${err instanceof Error ? err.message : 'Invalid format'}`);
  }
}

// Function to validate if a string is valid base58
export function isValidBase58(str: string): boolean {
  try {
    bs58.decode(str);
    return true;
  } catch (err) {
    return false;
  }
} 