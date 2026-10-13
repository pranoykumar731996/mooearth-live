// ============================================================
// MooEarth Live — Secure Admin Authentication Layer
// ============================================================
// Constant-time timing-safe credential verification.
// Prevents secret leakage, timing attacks, and unauthenticated access.

import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * Validates candidate admin key against server environment.
 * Uses crypto.timingSafeEqual to prevent side-channel timing attacks.
 */
export function validateAdminKey(candidateKey?: string | null): boolean {
  if (!candidateKey || typeof candidateKey !== 'string') {
    return false;
  }

  const isProd = process.env.NODE_ENV === 'production';
  const expectedKey = process.env.ADMIN_KEY;

  // In production, an explicit ADMIN_KEY MUST be configured.
  // Never default to a fallback string in production.
  if (isProd && !expectedKey) {
    console.error('[SECURITY] ADMIN_KEY environment variable is not configured in production.');
    return false;
  }

  const activeExpected = expectedKey || (isProd ? '' : 'mooearth-admin-2026');
  if (!activeExpected) {
    return false;
  }

  const candidateBuf = Buffer.from(candidateKey.trim());
  const expectedBuf = Buffer.from(activeExpected.trim());

  if (candidateBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

/**
 * Inspects incoming request headers and parameters to verify admin authorization.
 */
export function isAuthorizedAdminRequest(request: NextRequest): boolean {
  const host = request.headers.get('host') || '';
  const isLocal =
    process.env.NODE_ENV !== 'production' &&
    (host.startsWith('localhost') || host.startsWith('127.0.0.1'));

  if (isLocal) {
    return true;
  }

  // 1. Check Bearer Token
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (validateAdminKey(token)) {
      return true;
    }
  }

  // 2. Check x-admin-key header
  const customHeader = request.headers.get('x-admin-key');
  if (customHeader && validateAdminKey(customHeader.trim())) {
    return true;
  }

  // 3. Check query param
  const queryKey = request.nextUrl.searchParams.get('key') || request.nextUrl.searchParams.get('adminKey');
  if (queryKey && validateAdminKey(queryKey.trim())) {
    return true;
  }

  return false;
}
