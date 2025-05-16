import { PublicKey } from "@solana/web3.js";

export interface TokenInfo {
  symbol: string;
  name: string;
  logoURI: string;
  mintAddress: string;
  decimals: number;
}

// Simplify to only have SOL
export const TOKENS: TokenInfo[] = [
  {
    symbol: "SOL",
    name: "Solana",
    logoURI: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png",
    mintAddress: "So11111111111111111111111111111111111111112", // Native SOL mint address
    decimals: 9
  }
];

// Function to convert token amount from its decimal representation to raw amount
export function toRawAmount(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

// Function to convert token amount from raw to decimal representation
export function toDecimalAmount(rawAmount: bigint, decimals: number): number {
  return Number(rawAmount) / Math.pow(10, decimals);
}

// Find a token by its mint address - will now always return SOL
export function getTokenByMint(mintAddress: string): TokenInfo | undefined {
  return TOKENS[0]; // Always return SOL
}

// Find a token by its symbol - will now always return SOL
export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  return TOKENS[0]; // Always return SOL
} 