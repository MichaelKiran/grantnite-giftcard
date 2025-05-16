'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, useScroll, useTransform } from 'framer-motion';

// Custom button component to handle wallet connection safely
function SafeWalletConnectButton() {
  const { publicKey, connecting, connected, wallet } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isPhantomDetected, setIsPhantomDetected] = useState(false);

  // Check if Phantom is installed
  useEffect(() => {
    const checkPhantomWallet = () => {
      const isPhantomInstalled = 
        typeof window !== 'undefined' && 
        (window.phantom?.solana || (window.solana && window.solana.isPhantom));
      
      setIsPhantomDetected(!!isPhantomInstalled);
    };
    
    checkPhantomWallet();
    
    // Also check after a short delay to allow browser extensions to initialize
    const timer = setTimeout(checkPhantomWallet, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="wallet-button-wrapper">
        <div className="wallet-error text-sm text-red-400 mb-2">{error}</div>
        <WalletMultiButton className="!bg-black !border !border-white !text-white hover:!bg-white hover:!text-black" />
      </div>
    );
  }

  if (!isPhantomDetected) {
    return (
      <div className="wallet-button-wrapper">
        <a 
          href="https://phantom.app/download" 
          target="_blank"
          rel="noopener noreferrer"
          className="block border border-white bg-white text-black px-8 py-4 font-mono tracking-wide hover:bg-black hover:text-white transition-colors text-center mb-2"
        >
          INSTALL WALLET
        </a>
        <div className="text-xs text-center text-gray-400">Phantom wallet required</div>
      </div>
    );
  }

  return (
    <WalletMultiButton className="!bg-black !border !border-white !text-white hover:!bg-white hover:!text-black" />
  );
}

export default function HomeClient() {
  const { publicKey } = useWallet();
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check for touch device and set up mouse tracking
  useEffect(() => {
    // Check if the device is a touch device
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    
    // Only add mouse move listener if not a touch device
    if (isTouch) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.5]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Generate a glitch effect
  const glitchText = (text: string) => {
    return (
      <div className="inline-block text-glitch" data-text={text}>
        {text}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="snap-container">
      {/* Hero Section */}
      <section className="snap-section bg-black border-b border-white">
        <div className="h-full flex flex-col">
          <div className="flex-grow grid grid-cols-1 md:grid-cols-12 border-b border-white">
            <motion.div 
              className="md:col-span-8 p-6 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white"
              style={{ opacity, scale }}
            >
              <h1 className="text-5xl md:text-8xl font-bold mb-4 tracking-tighter leading-none">
                <span className="inline-block">SEND</span> <br/>
                <span className="inline-block ml-12 md:ml-24">SOL</span> <br/>
                {isTouchDevice ? (
                  <span className="inline-block text-[rgb(var(--primary))]">INSTANTLY</span>
                ) : (
                  <motion.span 
                    className="inline-block"
                    animate={{ 
                      x: Math.sin(mousePosition.x * 0.01) * 5,
                      color: ["#FFFFFF", "rgb(var(--primary))", "#FFFFFF"],
                    }}
                    transition={{ 
                      color: { duration: 2, repeat: Infinity },
                      x: { duration: 0.5 }
                    }}
                  >INSTANTLY</motion.span>
                )}
              </h1>
              
              <p className="text-lg md:text-xl mb-6 max-w-xl font-mono">
                Create programmable Grantnite cards on Solana. Send SOL to anyone with custom messages and expiration dates. Secure, fast, and built for Web3.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4">
                <Link 
                  href="/create" 
                  className="border border-white px-8 py-4 font-mono tracking-wide hover:bg-white hover:text-black transition-colors text-center"
                >
                  CREATE CARD
                </Link>
                
                <Link 
                  href="/redeem" 
                  className="border border-white bg-white text-black px-8 py-4 font-mono tracking-wide hover:bg-black hover:text-white transition-colors text-center"
                >
                  REDEEM CARD
                </Link>
              </div>
            </motion.div>
            
            <div className="md:col-span-4 border-white flex flex-col">
              <div className="flex-grow p-6 md:p-12 flex flex-col justify-center items-center text-center">
                <div className="mb-6">
                  <div className="inline-block border border-white p-1">
                    <div className="w-32 h-32 border border-white flex items-center justify-center bg-black">
                      <div className="text-3xl font-bold">$</div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <SafeWalletConnectButton />
                </div>
                
                {publicKey && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-mono"
                  >
                    <div className="mb-1">CONNECTED WALLET:</div>
                    <div className="truncate max-w-full">
                      {publicKey.toString()}
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div className="border-t border-white p-4 text-center font-mono text-xs">
                SOLANA MAINNET
              </div>
            </div>
          </div>
          
          <div className="h-12 grid grid-cols-3 text-xs font-mono">
            <div className="border-r border-white flex items-center justify-center">
              <span className="blink">●</span>
              <span className="ml-2">LIVE</span>
            </div>
            <div className="border-r border-white flex items-center justify-center">
              V1.0.0
            </div>
            <div className="flex items-center justify-center">
              <span>GRANTNITE.PROTOCOL</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section ref={featuresRef} className="snap-section bg-black">
        <div className="h-full flex flex-col">
          <div className="border-b border-white p-6 md:p-12">
            <h2 className="text-3xl md:text-5xl font-bold">{glitchText("FEATURES")}</h2>
          </div>
          
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2">
            <div className="border-b md:border-b-0 md:border-r border-white p-6 md:p-12 flex flex-col justify-center">
              <div className="space-y-8">
                <motion.div 
                  className="feature-item"
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="text-[rgb(var(--primary))] font-mono mb-2">01</div>
                  <h3 className="text-2xl font-bold mb-2">TIME-LOCKED TRANSFERS</h3>
                  <p className="font-mono text-sm">Set an expiration date for your cards. Unused funds automatically return to you when the card expires, ensuring no SOL is lost.</p>
                </motion.div>
                
                <motion.div 
                  className="feature-item"
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <div className="text-[rgb(var(--primary))] font-mono mb-2">02</div>
                  <h3 className="text-2xl font-bold mb-2">CUSTOM MESSAGES</h3>
                  <p className="font-mono text-sm">Add personal messages and choose from themed designs for birthdays, celebrations, or just to say thanks. Make each card uniquely yours.</p>
                </motion.div>
                
                <motion.div 
                  className="feature-item"
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <div className="text-[rgb(var(--primary))] font-mono mb-2">03</div>
                  <h3 className="text-2xl font-bold mb-2">INSTANT TRANSFERS</h3>
                  <p className="font-mono text-sm">Recipients can claim funds instantly. No delays, no hassle. Transactions are processed on the Solana blockchain for speed and security.</p>
                </motion.div>
              </div>
            </div>
            
            <div className="p-6 md:p-12 flex flex-col justify-center">
              <div className="space-y-8">
                <motion.div 
                  className="feature-item"
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="text-[rgb(var(--primary))] font-mono mb-2">04</div>
                  <h3 className="text-2xl font-bold mb-2">BEAUTIFUL THEMES</h3>
                  <p className="font-mono text-sm">Choose from multiple designs for every occasion. Our brutalist-inspired designs make your Grantnite cards stand out with high contrast layouts and bold visuals.</p>
                </motion.div>
                
                <motion.div 
                  className="feature-item"
                  initial={{ x: 20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <div className="text-[rgb(var(--primary))] font-mono mb-2">05</div>
                  <h3 className="text-2xl font-bold mb-2">EMAIL DELIVERY</h3>
                  <p className="font-mono text-sm">Send cards directly via email with a secure redemption link. No need for recipients to have a crypto wallet beforehand - they can create one when claiming.</p>
                </motion.div>
                
                <div className="pt-8">
                  <Link 
                    href="/create" 
                    className="inline-block border border-white px-8 py-4 font-mono tracking-wide hover:bg-white hover:text-black transition-colors"
                  >
                    CREATE CARD
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer Section */}
      <section className="bg-black border-t border-white">
        <div className="grid grid-cols-1 md:grid-cols-12">
          <div className="md:col-span-4 p-6 md:p-12 border-b md:border-b-0 md:border-r border-white">
            <h2 className="text-3xl font-bold mb-6">GRANTNITE</h2>
            <p className="font-mono text-sm mb-6">
              A web3-native gifting protocol on Solana. Send SOL to anyone, anywhere, anytime with security built into every transaction.
            </p>
            <div className="text-xs font-mono">
              © {new Date().getFullYear()} GRANTNITE PROTOCOL
            </div>
          </div>
          
          <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 md:p-12 border-b md:border-b-0 md:border-r border-white">
              <h3 className="text-xl font-bold mb-4">NAVIGATION</h3>
              <ul className="space-y-4 font-mono">
                <li>
                  <Link href="/" className="hover:text-[rgb(var(--primary))] transition-colors">
                    HOME
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="hover:text-[rgb(var(--primary))] transition-colors">
                    CREATE A GRANTNITE CARD
                  </Link>
                </li>
                <li>
                  <Link href="/redeem" className="hover:text-[rgb(var(--primary))] transition-colors">
                    REDEEM A GRANTNITE CARD
                  </Link>
                </li>
                <li>
                  <Link href="/my-cards" className="hover:text-[rgb(var(--primary))] transition-colors">
                    MY CARDS
                  </Link>
                </li>
                <li>
                  <Link href="/protocol" className="hover:text-[rgb(var(--primary))] transition-colors">
                    PROTOCOL
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="p-6 md:p-12">
              <h3 className="text-xl font-bold mb-4">LINKS</h3>
              <ul className="space-y-4 font-mono">
                <li>
                  <a 
                    href="https://github.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[rgb(var(--primary))] transition-colors flex items-center"
                  >
                    GITHUB
                    <span className="ml-2 text-xs">↗</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://twitter.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[rgb(var(--primary))] transition-colors flex items-center"
                  >
                    TWITTER
                    <span className="ml-2 text-xs">↗</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="https://solana.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[rgb(var(--primary))] transition-colors flex items-center"
                  >
                    SOLANA
                    <span className="ml-2 text-xs">↗</span>
                  </a>
                </li>
              </ul>
              
              <div className="mt-8 pt-8 border-t border-white text-xs font-mono">
                <div className="mb-1">CONTRACT:</div>
                <div className="break-all">giftzKxJsqSu5QCSFpVjkBiZUgbdVpitHWDHiTZ3pMM</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 