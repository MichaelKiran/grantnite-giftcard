import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simplest middleware that just passes requests through
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Limit middleware scope
export const config = {
  matcher: [
    // Only match pages, not assets
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 