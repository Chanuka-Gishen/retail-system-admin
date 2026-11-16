import { NextResponse } from 'next/server';

/**
 * Silent handler for stray background requests targeting localhost:3000/socket.io
 * (e.g. NVIDIA GeForce Experience / CEF background helpers that probe port 3000 with X_LOCAL_SECURITY_COOKIE).
 * Returns 204 No Content to silence 404 console spam in development.
 */
export async function GET() {
  return new NextResponse(null, { status: 204 });
}

export async function POST() {
  return new NextResponse(null, { status: 204 });
}
