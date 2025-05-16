'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Navigation from '../components/navigation';

export default function CreateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    
  }, [error]);

  return (
    <main className="min-h-screen">
      <Navigation />
      
      <div className="container pt-32 pb-20">
        <div className="max-w-md mx-auto glow-card text-center p-8">
          <h1 className="text-2xl font-bold text-accent mb-4">Error Creating Gift Card</h1>
          <p className="text-gray-300 mb-6">
            {error.message || 'There was a problem loading the gift card creation page'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="btn btn-primary"
            >
              Try again
            </button>
            <Link href="/" className="btn btn-secondary">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 