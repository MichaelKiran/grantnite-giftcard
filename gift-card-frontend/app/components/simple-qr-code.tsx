'use client';

import React from 'react';

interface SimpleQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function SimpleQRCode({
  value,
  size = 240,
  className = '',
  style = {}
}: SimpleQRCodeProps) {
  // Get Google Chart API URL for QR code generation
  const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(value)}&chs=${size}x${size}&choe=UTF-8&chld=H|0`;
  
  // Merge default style with provided style, ensuring provided styles take precedence
  const containerStyle = {
    backgroundColor: '#FFFFFF',
    padding: '10px',
    display: 'inline-block',
    ...style
  };

  return (
    <div className={className} style={containerStyle}>
      <img 
        src={qrCodeUrl} 
        alt="QR Code"
        width={size}
        height={size}
        style={{ display: 'block' }}
        loading="eager"
      />
    </div>
  );
} 