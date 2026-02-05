// backend-example/src/utils/tokens.ts
// JWT token utilities for authentication
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/**
 * Sign a token for app access (expires in 7 days)
 */
export const signAppToken = (payload: object) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

/**
 * Sign a temporary token for registration (expires in 15 minutes)
 */
export const signTempToken = (payload: object) =>
    jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

/**
 * Verify and decode a token
 */
export const verifyToken = (token: string) =>
    jwt.verify(token, JWT_SECRET) as any;
