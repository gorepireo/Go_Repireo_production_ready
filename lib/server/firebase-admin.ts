import 'server-only';
import { applicationDefault, cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App | null = null;

function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  const hasApplicationDefault = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
  const hasExplicitServiceAccount = Boolean(projectId && clientEmail && privateKey);
  if (!hasExplicitServiceAccount && (!projectId || !hasApplicationDefault)) {
    throw new Error('Firebase Admin credentials are not configured.');
  }
  // Prefer deploy-safe environment values. GOOGLE_APPLICATION_CREDENTIALS may
  // point to a developer's local file, which is unavailable in Vercel.
  const credential = hasExplicitServiceAccount
    ? cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey: privateKey! })
    : applicationDefault();
  adminApp = initializeApp({ credential, projectId });
  return adminApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}
