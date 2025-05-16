import './globals.css';
import type { Metadata } from "next";
import { JetBrains_Mono, Space_Mono } from "next/font/google";

// Load JetBrains Mono for primary code-like text
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-jetbrains',
  weight: ['400', '500', '700', '800']
});

// Load Space Mono for additional monospace styling
const spaceMono = Space_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-space',
  weight: ['400', '700']
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "GRANTNITE | Solana Web3",
  description: "Create and redeem gift cards on Solana blockchain with Grantnite. Web3-native gifting protocol.",
  keywords: ["Solana", "Gift Card", "Web3", "Blockchain", "Crypto", "Grantnite"],
  authors: [{ name: "Grantnite Protocol" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${jetBrainsMono.variable} ${spaceMono.variable} scroll-smooth`} 
      suppressHydrationWarning
    >
      <body 
        suppressHydrationWarning 
        className="antialiased selection:bg-[rgb(var(--primary))] selection:text-black"
      >
        <div>
          {children}
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white py-1 px-2 text-xs font-mono bg-black text-white overflow-hidden">
          <div className="marquee">
            <div className="marquee-content">
              GRANTNITE PROTOCOL • WEB3 NATIVE GIFTING • SEND SOL TO ANYONE • REDEEM INSTANTLY • GRANTNITE PROTOCOL • WEB3 NATIVE GIFTING • SEND SOL TO ANYONE • REDEEM INSTANTLY •
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
