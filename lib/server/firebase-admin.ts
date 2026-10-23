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
  if (!projectId || (!hasApplicationDefault && (!clientEmail || !privateKey))) {
    throw new Error('Firebase Admin credentials are not configured.');
  }
  const credential = hasApplicationDefault
    ? applicationDefault()
    : cert({ projectId, clientEmail: clientEmail!, privateKey: privateKey! });
  adminApp = initializeApp({ credential, projectId });
  return adminApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getAdminApp());
}
