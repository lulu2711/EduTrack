#!/usr/bin/env node
/**
 * Generate fresh random secrets for the EduTrack production environment.
 *
 * This script only PRINTS values to your terminal - it never writes files,
 * never logs to disk, and never persists anything. You copy the values into
 * your deployment platform's environment variable panel or into
 * server/.env.production yourself.
 *
 * Usage:
 *   node scripts/generate-secrets.mjs
 *
 * IMPORTANT:
 *   Run this on YOUR machine. Do not paste the output into chats, tickets,
 *   screenshots, or commit messages. After rotating, revoke the old secrets
 *   in MongoDB Atlas / your LLM provider console - changing files is not enough.
 */

import crypto from 'node:crypto';

const randomToken = (bytes) => crypto.randomBytes(bytes).toString('base64url');

console.log('');
console.log('EduTrack production secrets');
console.log('===========================');
console.log('');
console.log('Copy each value below into server/.env.production (or your deployment');
console.log("platform's environment panel). Do not share these values.");
console.log('');

console.log(`JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`);
console.log(`ADMIN_PASSWORD=${randomToken(18)}`);
console.log(`STUDENT_DEMO_PASSWORD=${randomToken(18)}`);
console.log('');

console.log('Notes:');
console.log('- JWT_SECRET is 64 hex characters (code requires at least 32).');
console.log('- Both passwords are 24 characters (code requires at least 12).');
console.log('- Regenerating gives new values; the old ones stop working immediately,');
console.log('  which invalidates every existing login token.');
console.log('');
console.log('After filling everything in, verify with:');
console.log('  python scripts/env-readiness-check.py');
console.log('');
