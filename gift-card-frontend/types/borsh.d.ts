declare module 'borsh' {
  export function serialize(schema: any, object: any): Uint8Array;
  export function deserialize(schema: any, classType: any, buffer: Uint8Array): any;
} 