import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <h1 className="text-3xl font-bold text-accent">404</h1>
        <h2 className="text-2xl">Page Not Found</h2>
        <p className="text-gray-300">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <Link href="/" className="btn btn-primary">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
} 