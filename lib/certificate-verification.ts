import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface PublicCertificateRecord {
  code: string;
  name: string;
  title: string;
  department?: string;
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
  try {
    return decodeURIComponent(input).trim().toUpperCase();
  } catch {
    return input.trim().toUpperCase();
  }
}

export function isCertificateCode(input: string) {
  return /^(GRC-\d{4}-\d+|GR\/INT\/\d{4}\/\d+|GR[IE]-[A-Z0-9]+)$/i.test(normalizeCertificateCode(input));
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeRecord(payload: unknown, requestedCode: string): PublicCertificateRecord | null {
  if (!payload || typeof payload !== 'object') return null;
  const envelope = payload as Record<string, unknown>;
  if (envelope.found === false || envelope.success === false) return null;
  const data = envelope.data && typeof envelope.data === 'object' ? envelope.data as Record<string, unknown> : envelope;
  const raw = (envelope.certificate || data.certificate || data) as Record<string, unknown>;
  const person = (envelope.person || data.person || raw.person || {}) as Record<string, unknown>;
  if (!raw || typeof raw !== 'object') return null;

  const code = normalizeCertificateCode(text(raw.code || raw.certificateId || raw.certificate_id || raw.certificate_code || raw.certificateNumber || raw.certificate_number || requestedCode));
  const statusText = text(raw.verificationStatus || raw.verification_status || raw.status).toLowerCase();
  const revoked = raw.revoked === true || statusText === 'revoked';
  const explicitlyVerified = envelope.found === true || raw.verified === true || raw.valid === true || ['verified', 'valid', 'active', 'issued'].includes(statusText);
  const name = text(raw.name || raw.personName || raw.full_name || raw.person_name || raw.recipient_name || person.full_name || person.name);
  const title = text(raw.title || raw.positionTitle || raw.internship_title || raw.job_title || raw.designation || raw.program_title || person.designation);
  const department = text(raw.department || raw.departmentName || raw.department_name || person.department);
  const startDate = text(raw.startDate || raw.start_date || raw.valid_from || raw.from_date || raw.internship_start_date || raw.employment_start_date);
  const endDate = text(raw.endDate || raw.end_date || raw.valid_until || raw.to_date || raw.internship_end_date || raw.employment_end_date);

  if (!code || !name || !title || !startDate || !endDate) return null;
  return { code, name, title, department: department || undefined, startDate, endDate, verified: explicitlyVerified && !revoked, status: revoked ? 'revoked' : 'verified' };
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

  const baseUrl = (process.env.GO_REPIREO_PEOPLE_API_URL || 'https://go-repireo-employee-management.vercel.app').replace(/\/$/, '');

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
