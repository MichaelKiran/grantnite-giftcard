'use client';

import React, { useEffect, useState } from 'react';

interface ImageQRCodeProps {
  value: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ImageQRCode({
  value,
  size = 240,
  className = '',
  style = {}
}: ImageQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const generateQR = async () => {
      try {
        // Only import the QR code library on the client
        const QRCode = (await import('qrcode')).default;
        
        if (!isMounted) return;
        
        // Generate QR code as data URL
        const dataUrl = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        });
        
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsLoading(false);
        }
      } catch (err) {
        
        if (isMounted) {
          setError('Failed to generate QR code');
          setIsLoading(false);
        }
      }
    };

    generateQR();
    
    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const containerStyle = {
    ...style,
    backgroundColor: '#FFFFFF',
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

  if (isLoading || !qrDataUrl) {
    return (
      <div className={className} style={containerStyle}>
        <div style={{ 
          width: size, 
          height: size, 
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: 40, height: 40, border: '3px solid #f3f3f3', borderTop: '3px solid #333', borderRadius: '50%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <img 
        src={qrDataUrl} 
        alt="QR Code"
        width={size}
        height={size}
        style={{ display: 'block' }}
      />
    </div>
  );
} 