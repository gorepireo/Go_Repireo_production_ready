import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface PublicCertificateRecord {
  code: string;
  name: string;
  title: string;
  startDate: string;
  endDate: string;
  verified: boolean;
  status: 'verified' | 'revoked';
}

export type CertificateLookup =
  | { state: 'found'; certificate: PublicCertificateRecord }
  | { state: 'not-found' }
  | { state: 'unavailable' };

export function normalizeCertificateCode(input: string) {
  return decodeURIComponent(input).trim().toUpperCase();
}

export function isCertificateCode(input: string) {
  return /^GRC-\d{4}$/.test(normalizeCertificateCode(input));
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRecord(payload: unknown, requestedCode: string): PublicCertificateRecord | null {
  if (!payload || typeof payload !== 'object') return null;
  const envelope = payload as Record<string, unknown>;
  const raw = (envelope.certificate || envelope.data || payload) as Record<string, unknown>;
  if (!raw || typeof raw !== 'object') return null;

  const code = normalizeCertificateCode(text(raw.code || raw.certificate_code || raw.certificateNumber));
  const statusText = text(raw.status).toLowerCase();
  const revoked = raw.revoked === true || statusText === 'revoked';
  const explicitlyVerified = raw.verified === true || raw.valid === true || ['verified', 'valid'].includes(statusText);
  const name = text(raw.name || raw.full_name || raw.person_name || raw.recipient_name);
  const title = text(raw.title || raw.internship_title || raw.job_title || raw.designation || raw.program_title);
  const startDate = text(raw.startDate || raw.start_date || raw.valid_from || raw.from_date);
  const endDate = text(raw.endDate || raw.end_date || raw.valid_until || raw.to_date);

  if (code !== requestedCode || !name || !title || !startDate || !endDate) return null;
  return { code, name, title, startDate, endDate, verified: explicitlyVerified && !revoked, status: revoked ? 'revoked' : 'verified' };
}

async function lookupLocal(code: string) {
  try {
    const registryPath = path.join(process.cwd(), 'data', 'public-certificates.json');
    const records = JSON.parse(await readFile(registryPath, 'utf8')) as unknown[];
    return records.map((record) => normalizeRecord(record, code)).find(Boolean) || null;
  } catch {
    return null;
  }
}

export async function lookupCertificate(input: string): Promise<CertificateLookup> {
  const code = normalizeCertificateCode(input);
  if (!isCertificateCode(code)) return { state: 'not-found' };

  const local = await lookupLocal(code);
  if (local) return { state: 'found', certificate: local };

  const baseUrl = process.env.GO_REPIREO_PEOPLE_API_URL?.replace(/\/$/, '');
  if (!baseUrl) return { state: 'unavailable' };

  try {
    const response = await fetch(`${baseUrl}/api/public/certificates/${encodeURIComponent(code)}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404) return { state: 'not-found' };
    if (!response.ok) return { state: 'unavailable' };
    const certificate = normalizeRecord(await response.json(), code);
    return certificate ? { state: 'found', certificate } : { state: 'not-found' };
  } catch {
    return { state: 'unavailable' };
  }
}
