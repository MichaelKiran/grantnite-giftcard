'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="max-w-md w-full p-8 border border-red-500 bg-red-900/20">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Something went wrong!</h1>
            <p className="mb-6">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 