// Password hashing with Node's built-in scrypt — no plain text, no extra deps.
const crypto = require('node:crypto');

const KEYLEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64');
  const hash = crypto.scryptSync(String(password), salt, KEYLEN).toString('base64');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expected] = parts;
  const actual = crypto.scryptSync(String(password), salt, KEYLEN);
  const expectedBuf = Buffer.from(expected, 'base64');
  if (expectedBuf.length !== actual.length) return false;
  return crypto.timingSafeEqual(actual, expectedBuf);
}

module.exports = { hashPassword, verifyPassword };
