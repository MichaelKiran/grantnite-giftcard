'use client';

import { useEffect } from 'react';

export default function Document() {
  useEffect(() => {
    // Apply critical styles directly to DOM
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      html, body { 
        background-color: #000 !important; 
        color: #fff !important; 
        font-family: 'JetBrains Mono', monospace !important;
      }
      h1, h2, h3, h4, h5, h6, p, span, a, button {
        color: #fff !important;
      }
      .border, .border-foreground, .border-t, .border-b {
        border-color: #fff !important;
      }
      .bg-foreground {
        background-color: #fff !important;
      }
      .text-foreground {
        color: #fff !important;
      }
      .text-background {
        color: #000 !important;
      }
      .bg-background {
        background-color: #000 !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    // Update document title to include Grantnite
    document.title = document.title.replace("GIFT CARD", "GRANTNITE");
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  return null;
} 