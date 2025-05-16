'use client';

import { useEffect } from 'react';
import { forceFixGiftCardData } from '../utils/force-fix';

export default function AutoFix() {
  useEffect(() => {
    // Run the force fix on component mount
    try {
      forceFixGiftCardData();
      
    } catch (error) {
      
    }
  }, []);
  
  // This component doesn't render anything
  return null;
} 