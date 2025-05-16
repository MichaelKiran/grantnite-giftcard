declare module 'borsh' {
  export function serialize(schema: Map<any, any>, obj: any): Uint8Array;
  export function deserialize(schema: Map<any, any>, classType: any, buffer: Buffer | Uint8Array): any;
} 