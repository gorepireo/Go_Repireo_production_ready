import 'server-only';

import { getTurso } from './turso';
import { createSession } from './session';

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

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function secureSixDigitOtp() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(100000 + (values[0] % 900000));
}

async function otpHash(challengeId: string, phone: string, otp: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(otpSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${challengeId}:${phone}:${otp}`));
  return bytesToHex(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
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
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[DEV OTP] Mobile: ${phone}, OTP: ${otp}`);
      return;
    }
    throw new Error('RENFLAIR_API_KEY is not configured.');
  }
  const query = new URLSearchParams({ API: apiKey, PHONE: phone.replace(/^\+91/, ''), OTP: otp });
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

  const challengeId = crypto.randomUUID();
  const otp = secureSixDigitOtp();
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_MS).toISOString();
  await sendRenflairOtp(phone, otp);
  await getTurso().execute({
    sql: 'INSERT INTO auth_otps (id, phone, purpose, otp_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
    args: [challengeId, phone, purpose, await otpHash(challengeId, phone, otp), expiresAt],
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

  const expected = String(row.otp_hash);
  const actual = await otpHash(challengeId, phone, code);
  if (!constantTimeEqual(expected, actual)) {
    await getTurso().execute({ sql: 'UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?', args: [challengeId] });
    throw new Error('The verification code is incorrect.');
  }
  const consumed = await getTurso().execute({
    sql: 'UPDATE auth_otps SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL',
    args: [new Date().toISOString(), challengeId],
  });
  if (consumed.rowsAffected !== 1) throw new Error('The verification code was already used.');

  let userId: string | null = null;
  let user: { id: string; phone: string; email: string | null; displayName: string; role: string; accountStatus: string } | null = null;
  if (purpose === 'login') {
    const account = await getTurso().execute({
      sql: 'SELECT id, phone, email, display_name, role, account_status FROM users WHERE phone = ? LIMIT 1',
      args: [phone],
    });
    const accountRow = account.rows[0];
    if (!accountRow) throw new Error('No registered account was found for this mobile number.');
    const status = String(accountRow.account_status);
    if (status === 'suspended' || status === 'disabled') throw new Error('This account is not permitted to sign in.');
    const storedRole = String(accountRow.role);
    if (!['customer', 'worker', 'admin'].includes(storedRole)) throw new Error('This account has an invalid role.');
    userId = String(accountRow.id);
    user = {
      id: userId,
      phone: String(accountRow.phone || phone),
      email: accountRow.email ? String(accountRow.email) : null,
      displayName: String(accountRow.display_name || ''),
      role: storedRole,
      accountStatus: status,
    };
    await getTurso().execute({ sql: 'UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?', args: [new Date().toISOString(), new Date().toISOString(), userId] });
  } else {
    const existing = await getTurso().execute({ sql: 'SELECT id FROM users WHERE phone = ? LIMIT 1', args: [phone] });
    if (existing.rows[0]) throw new Error('An account already exists for this mobile number. Sign in instead.');
  }

  const session = await createSession(phone, purpose, userId);
  return { verified: true, user, sessionCookie: session.cookie };
}
