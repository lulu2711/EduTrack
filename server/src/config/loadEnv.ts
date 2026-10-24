/**
 * Environment loader.
 *
 * This module exists as a separate file for one reason: it must run BEFORE any
 * other module's top-level code reads process.env. In ESM, imports execute in
 * source order, so index.ts imports this module first.
 *
 * - NODE_ENV=production -> loads .env.production, falls back to .env
 * - otherwise           -> loads .env
 *
 * Variables already present in the real process environment (for example those
 * injected by a deployment platform) always win, because dotenv never
 * overrides values that are already set.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const file = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';

// Support being started from the repository root or from the server directory.
const candidates = [
  path.join(process.cwd(), file),
  path.join(process.cwd(), 'server', file),
];

const target = candidates.find(candidate => fs.existsSync(candidate));

if (target) {
  dotenv.config({ path: target });
} else {
  dotenv.config();
}
