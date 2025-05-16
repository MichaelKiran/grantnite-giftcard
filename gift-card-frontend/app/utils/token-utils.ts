import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Keypair,
  TransactionInstruction,
} from '@solana/web3.js';
import { TokenInfo } from './tokens';

/**
 * SPL Token program ID
 */
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

/**
 * SPL Associated Token Account program ID
 */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

/**
 * Get the associated token account address for a given mint and owner
 */
export async function getAssociatedTokenAddress(
  mint: PublicKey,
  owner: PublicKey,
): Promise<PublicKey> {
  return PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

/**
 * Create an associated token account instruction
 */
export function createAssociatedTokenAccountInstruction(
  payer: PublicKey,
  associatedToken: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
) {
  return {
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedToken, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([]),
  };
}

/**
 * Create a transfer token instruction
 */
export function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
) {
  return {
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([3, ...serializeUint64(amount)]), // TokenInstruction::Transfer = 3
  };
}

/**
 * Serialize a bigint into a byte array
 */
function serializeUint64(value: bigint): Uint8Array {
  const buffer = Buffer.alloc(8);
  
  for (let i = 0; i < 8; i++) {
    buffer[i] = Number((value >> BigInt(8 * i)) & BigInt(0xff));
  }
  
  return buffer;
}

/**
 * Create an instruction to check if an account exists and create it if it doesn't
 */
export async function createAssociatedTokenAccountIfNotExist(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  transaction: Transaction,
): Promise<PublicKey> {
  const associatedAddress = await getAssociatedTokenAddress(mint, owner);
  
  // Check if the account already exists
  const account = await connection.getAccountInfo(associatedAddress);
  
  if (!account) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        payer,
        associatedAddress,
        owner,
        mint,
      ),
    );
  }
  
  return associatedAddress;
}

/**
 * Transfer tokens from one account to another
 */
export async function transferToken(
  connection: Connection,
  payer: Keypair | { publicKey: PublicKey, signTransaction: (tx: Transaction) => Promise<Transaction> },
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  createDestinationIfNotExist = false,
  mint?: PublicKey,
): Promise<string> {
  const transaction = new Transaction();
  
  if (createDestinationIfNotExist && mint) {
    await createAssociatedTokenAccountIfNotExist(
      connection,
      payer.publicKey,
      mint,
      owner,
      transaction,
    );
  }
  
  transaction.add(
    createTransferInstruction(
      source,
      destination,
      owner,
      amount,
    ),
  );
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = payer.publicKey;
  
  let signed: Transaction;
  
  if ('signTransaction' in payer) {
    // Wallet adapter signing
    signed = await payer.signTransaction(transaction);
  } else {
    // Keypair signing
    transaction.sign(payer);
    signed = transaction;
  }
  
  const signature = await connection.sendRawTransaction(signed.serialize());
  await connection.confirmTransaction(signature);
  
  return signature;
}

/**
 * Check if a token account exists
 */
export async function tokenAccountExists(
  connection: Connection,
  tokenAccount: PublicKey,
): Promise<boolean> {
  const account = await connection.getAccountInfo(tokenAccount);
  return account !== null;
}

/**
 * Get token balance for an account
 */
export async function getTokenBalance(
  connection: Connection,
  tokenAccount: PublicKey,
): Promise<bigint> {
  try {
    const account = await connection.getTokenAccountBalance(tokenAccount);
    return BigInt(account.value.amount);
  } catch (e: any) {
    
    
    // Check if this is a token account not found error
    if (e.message && (
      e.message.includes('not found') || 
      e.message.includes('Invalid account owner') ||
      e.message.includes('TokenAccountNotFound')
    )) {
      throw new Error('Token account not found. You may need to create this token account first.');
    }
    
    // Check for RPC errors
    if (e.message && e.message.includes('failed to get info about account')) {
      throw new Error('Failed to get token account information. The RPC endpoint may be experiencing issues.');
    }
    
    return BigInt(0);
  }
}

/**
 * Validate a token account exists and belongs to the owner
 */
export async function validateTokenAccount(
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey
): Promise<boolean> {
  try {
    const tokenAccount = await getAssociatedTokenAddress(mint, owner);
    const accountInfo = await connection.getAccountInfo(tokenAccount);
    
    if (!accountInfo) {
      return false;
    }
    
    // Attempt to get balance to verify it's a valid token account
    await connection.getTokenAccountBalance(tokenAccount);
    return true;
  } catch (e) {
    
    return false;
  }
} 