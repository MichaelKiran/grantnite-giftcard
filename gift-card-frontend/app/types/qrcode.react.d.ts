declare module 'qrcode.react' {
  import * as React from 'react';

  interface QRCodeProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    bgColor?: string;
    fgColor?: string;
    style?: React.CSSProperties;
    includeMargin?: boolean;
    renderAs?: 'canvas' | 'svg';
    imageSettings?: {
      src: string;
      height?: number;
      width?: number;
      excavate?: boolean;
      x?: number;
      y?: number;
    };
  }

  const QRCode: React.FC<QRCodeProps>;
  
  export default QRCode;
} 