'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CursorFollower() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isMounted) return null;
  
  // Check if the device is touch-capable
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    return null;
  }

  return (
    <motion.div
      className="fixed w-6 h-6 rounded-full bg-transparent border border-[rgb(var(--primary))] z-[9999] pointer-events-none hidden md:block"
      animate={{
        x: mousePosition.x - 12,
        y: mousePosition.y - 12,
        opacity: 0.6
      }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        boxShadow: '0 0 10px rgba(var(--primary), 0.5)'
      }}
    />
  );
} 