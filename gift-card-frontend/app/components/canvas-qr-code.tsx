'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface CanvasQRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  foregroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CanvasQRCode({
  value,
  size = 240,
  backgroundColor = '#FFFFFF',
  foregroundColor = '#000000',
  errorCorrectionLevel = 'H',
  margin = 4,
  className = '',
  style = {}
}: CanvasQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const generateQR = async () => {
      try {
        if (!canvasRef.current) return;
        
        // Dynamically import QRCode to avoid SSR issues
        const QRCodeGenerator = (await import('qrcode')).default;
        
        // Continue only if component is still mounted
        if (!isMounted) return;
        
        const canvas = canvasRef.current;
        
        // Generate QR code
        await QRCodeGenerator.toCanvas(canvas, value, {
          width: size,
          margin: margin,
          color: {
            dark: foregroundColor,
            light: backgroundColor
          },
          errorCorrectionLevel: errorCorrectionLevel as any
        });
        
        setIsLoading(false);
      } catch (err) {
        
        setError('Failed to generate QR code');
        setIsLoading(false);
      }
    };

    generateQR();
    
    return () => {
      isMounted = false;
    };
  }, [value, size, backgroundColor, foregroundColor, errorCorrectionLevel, margin]);

  const containerStyle = {
    ...style,
    backgroundColor: backgroundColor,
    padding: '10px',
    display: 'inline-block'
  };

  if (error) {
    return (
      <div className={className} style={containerStyle}>
        <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'red' }}>Error loading QR code</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={className} style={containerStyle}>
        <div 
          style={{ 
            width: size, 
            height: size, 
            backgroundColor: backgroundColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ width: 40, height: 40, borderRadius: '50%', borderTop: '3px solid #ccc', animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <canvas 
        ref={canvasRef} 
        style={{ 
          display: 'block',
          backgroundColor: backgroundColor 
        }}
        width={size}
        height={size}
      />
    </div>
  );
} 