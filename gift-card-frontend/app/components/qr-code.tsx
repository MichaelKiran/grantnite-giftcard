'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Define a placeholder component since we can't install the package due to dependency conflicts
const QRCodePlaceholder = ({ value, size, bgColor, fgColor, level }: { 
  value: string;
  size: number; 
  bgColor: string;
  fgColor: string;
  level: string;
}) => {
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: fgColor,
        border: `2px solid ${fgColor}`,
        borderRadius: '8px',
        fontSize: '10px',
        padding: '8px',
        textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      QR Code Placeholder<br />
      (Install react-qr-code)
    </div>
  );
};

/**
 * QR Code Component
 * 
 * Displays a QR code for the provided value.
 */
export default function QRCode({ 
  value, 
  size = 200, 
  bgColor = "#ffffff", 
  fgColor = "#000000",
  level = "L"
}: {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  level?: "L" | "M" | "Q" | "H";
}) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return null;
  }

  return (
    <QRCodePlaceholder
          value={value}
          size={size}
          bgColor={bgColor}
          fgColor={fgColor}
      level={level}
        />
  );
} 