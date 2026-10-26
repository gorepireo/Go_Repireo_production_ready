import 'server-only';

import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import { getFirebaseAdminAuth } from './firebase-admin';
import { getTurso } from './turso';

export type OtpPurpose = 'login' | 'register';

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;

function otpSecret() {
  const value = process.env.OTP_HASH_SECRET?.trim() || process.env.RENFLAIR_API_KEY?.trim();
  if (!value) throw new Error('OTP_HASH_SECRET or RENFLAIR_API_KEY is not configured.');
  return value;
}

export function normalizeIndianPhone(value: unknown) {
  const digits = typeof value === 'string' ? value.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '') : '';
  if (!/^\d{10}$/.test(digits)) throw new Error('Enter a valid 10-digit Indian mobile number.');
  return `+91${digits}`;
}

function otpHash(challengeId: string, phone: string, otp: string) {
  return createHmac('sha256', otpSecret()).update(`${challengeId}:${phone}:${otp}`).digest('hex');
}

async function ensureOtpTable() {
  await getTurso().execute(`CREATE TABLE IF NOT EXISTS auth_otps (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('login', 'register')),
    otp_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    consumed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )`);
  await getTurso().execute('CREATE INDEX IF NOT EXISTS idx_auth_otps_phone_created ON auth_otps(phone, purpose, created_at DESC)');
}

async function sendRenflairOtp(phone: string, otp: string) {
  const apiKey = process.env.RENFLAIR_API_KEY?.trim();
  if (!apiKey) throw new Error('RENFLAIR_API_KEY is not configured.');
  const query = new URLSearchParams({ API: apiKey, PHONE: phone.replace(/^\+/, ''), OTP: otp });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`https://sms.renflair.in/V1.php?${query.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    const providerBody = await response.text();
    if (!response.ok || /invalid|error|failed/i.test(providerBody)) {
      throw new Error('The SMS provider rejected the verification request.');
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function issuePhoneOtp(phoneInput: unknown, purpose: OtpPurpose) {
  const phone = normalizeIndianPhone(phoneInput);
  await ensureOtpTable();
  const windowStart = new Date(Date.now() - OTP_LIFETIME_MS).toISOString();
  const recent = await getTurso().execute({
    sql: 'SELECT COUNT(*) AS count FROM auth_otps WHERE phone = ? AND purpose = ? AND created_at >= ?',
    args: [phone, purpose, windowStart],
  });
  if (Number(recent.rows[0]?.count || 0) >= MAX_SENDS_PER_WINDOW) {
    throw new Error('Too many verification codes requested. Please wait ten minutes.');
  }

  const challengeId = randomUUID();
  const otp = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_MS).toISOString();
  await sendRenflairOtp(phone, otp);
  await getTurso().execute({
    sql: 'INSERT INTO auth_otps (id, phone, purpose, otp_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
    args: [challengeId, phone, purpose, otpHash(challengeId, phone, otp), expiresAt],
  });
  return { challengeId, phone, expiresAt };
}

export async function verifyPhoneOtp(challengeId: unknown, phoneInput: unknown, code: unknown, purpose: OtpPurpose) {
  if (typeof challengeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(challengeId)) throw new Error('The verification request is invalid.');
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) throw new Error('Enter the six-digit verification code.');
  const phone = normalizeIndianPhone(phoneInput);
  await ensureOtpTable();
  const result = await getTurso().execute({
    sql: 'SELECT phone, purpose, otp_hash, attempts, expires_at, consumed_at FROM auth_otps WHERE id = ? LIMIT 1',
    args: [challengeId],
  });
  const row = result.rows[0];
  if (!row || String(row.phone) !== phone || String(row.purpose) !== purpose || row.consumed_at) throw new Error('The verification request is invalid or already used.');
  if (Number(row.attempts) >= MAX_ATTEMPTS) throw new Error('Too many incorrect attempts. Request a new code.');
  if (Date.parse(String(row.expires_at)) < Date.now()) throw new Error('The verification code has expired. Request a new code.');

  const expected = Buffer.from(String(row.otp_hash), 'hex');
  const actual = Buffer.from(otpHash(challengeId, phone, code), 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await getTurso().execute({ sql: 'UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?', args: [challengeId] });
    throw new Error('The verification code is incorrect.');
  }
  const consumed = await getTurso().execute({
    sql: 'UPDATE auth_otps SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL',
    args: [new Date().toISOString(), challengeId],
  });
  if (consumed.rowsAffected !== 1) throw new Error('The verification code was already used.');

  const adminAuth = getFirebaseAdminAuth();
  let firebaseUser;
  try {
    firebaseUser = await adminAuth.getUserByPhoneNumber(phone);
  } catch (error: unknown) {
    const codeValue = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
    if (codeValue !== 'auth/user-not-found' || purpose === 'login') throw new Error(purpose === 'login' ? 'No registered account was found for this mobile number.' : 'Unable to prepare this account.');
    firebaseUser = await adminAuth.createUser({ phoneNumber: phone });
  }

  let role: 'customer' | 'worker' | 'admin' | null = null;
  if (purpose === 'login') {
    const account = await getTurso().execute({
      sql: 'SELECT role, account_status FROM users WHERE id = ? OR phone = ? LIMIT 1',
      args: [firebaseUser.uid, phone],
    });
    const accountRow = account.rows[0];
    if (!accountRow) throw new Error('No registered account was found for this mobile number.');
    const status = String(accountRow.account_status);
    if (status === 'suspended' || status === 'disabled') throw new Error('This account is not permitted to sign in.');
    const storedRole = String(accountRow.role);
    if (!['customer', 'worker', 'admin'].includes(storedRole)) throw new Error('This account has an invalid role.');
    role = storedRole as 'customer' | 'worker' | 'admin';
    await adminAuth.setCustomUserClaims(firebaseUser.uid, { role, admin: role === 'admin' });
  }

  return { customToken: await adminAuth.createCustomToken(firebaseUser.uid, role ? { role, admin: role === 'admin' } : undefined) };
}
