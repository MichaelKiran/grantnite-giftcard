declare module 'bn.js' {
  export class BN {
    constructor(number: number | string | number[] | Uint8Array | Buffer | BN, base?: number | 'hex', endian?: string);
    
    toString(base?: number | 'hex'): string;
    toNumber(): number;
    toArray(endian?: string, length?: number): number[];
    toBuffer(endian?: string, length?: number): Buffer;
    
    // Add other BN methods as needed
    add(b: BN): BN;
    sub(b: BN): BN;
    mul(b: BN): BN;
    div(b: BN): BN;
    
    gt(b: BN): boolean;
    gte(b: BN): boolean;
    lt(b: BN): boolean;
    lte(b: BN): boolean;
    eq(b: BN): boolean;
  }
}

interface Buffer {
  // Buffer definitions if needed
} 