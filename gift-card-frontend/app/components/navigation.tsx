'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import CursorFollower from './cursor-follower';

// Use our updated safe wallet button that has its own providers
const SafeWalletButton = dynamic(
  () => import('./safe-wallet-button'),
  { 
    ssr: false,
    loading: () => <div className="border border-white px-4 py-2 font-mono">LOADING</div>
  }
);

export default function Navigation() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if the device is a touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Only add mouse move listener if not a touch device
    if (isTouchDevice) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isTouchDevice]);

  const navItems = [
    { href: '/', label: 'HOME' },
    { href: '/my-cards', label: 'MY CARDS' },
    { href: '/create', label: 'CREATE' },
    { href: '/redeem', label: 'REDEEM' },
    { href: '/protocol', label: 'PROTOCOL' },
  ];

  // We need to make sure wallet button is only rendered client-side
  const WalletButtonComponent = mounted ? SafeWalletButton : () => (
    <button className="border border-white px-4 py-2 font-mono opacity-50">
      CONNECT
    </button>
  );

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 border-b border-white"
      >
        <div className="grid grid-cols-[auto_1fr_auto] w-full">
          <Link 
            href="/" 
            className="font-mono font-bold text-lg p-4 border-r border-white
                      bg-black text-white hover:bg-white hover:text-black transition-colors"
          >
            <motion.span 
              className="inline-block"
              animate={{ 
                x: Math.sin(mousePosition.x * 0.01) * 1.5,
                y: Math.sin(mousePosition.y * 0.01) * 1.5
              }}
            >
              GRANT
            </motion.span>
            <motion.span
              className="inline-block ml-2"
              animate={{ 
                x: Math.sin(mousePosition.x * 0.01 + 1) * 1.5,
                y: Math.sin(mousePosition.y * 0.01 + 1) * 1.5
              }}
            >
              NITE
            </motion.span>
          </Link>

          <nav className="hidden md:grid grid-cols-5 border-0 w-full">
            {navItems.map((item, index) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`font-mono py-4 text-center hover:bg-white hover:text-black transition-colors text-sm font-bold
                           ${pathname === item.href ? 'bg-white text-black' : 'bg-black text-white'} 
                           ${index < navItems.length - 1 ? 'border-r border-white' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex border-l border-white">
            <div className="p-4 bg-black text-white">
              <WalletButtonComponent />
            </div>
          </div>

          <button 
            className="md:hidden text-white bg-black p-4 border-l border-white font-mono"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <span className="text-lg font-bold font-mono tracking-tight">CLOSE</span>
            ) : (
              <span className="text-lg font-bold font-mono tracking-tight">MENU</span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed inset-0 z-40 bg-black md:hidden pt-16"
        >
          <div className="flex flex-col h-full">
            {navItems.map((item, index) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`text-white py-8 px-4 hover:bg-white hover:text-black transition-colors text-2xl font-bold uppercase text-center font-mono ${
                  pathname === item.href ? 'bg-white text-black' : ''
                } ${index < navItems.length - 1 ? 'border-b border-white' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-auto border-t border-white p-4 flex justify-center">
              <WalletButtonComponent />
            </div>
          </div>
        </motion.div>
      )}

      {/* Cursor follower component */}
      <CursorFollower />
    </>
  );
} 