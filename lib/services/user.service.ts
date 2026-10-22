import { db } from '@/lib/firebase';
import { collections, type Customer } from '@/lib/types/firebase-contract';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

export type CustomerProfile = Customer & { id: string };
const clean = (data: Record<string, unknown>) => Object.fromEntries(
  ['name', 'email', 'avatarBase64', 'avatarUrl', 'avatarPublicId']
    .filter((key) => data[key] !== undefined).map((key) => [key, data[key]]),
);

export const UserService = {
  async getProfile(uid: string): Promise<CustomerProfile | null> {
    const snapshot = await getDoc(doc(db, collections.customers, uid));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as CustomerProfile) : null;
  },
  async createProfile(uid: string, data: { name: string; phone: string; email?: string | null }): Promise<void> {
    await setDoc(doc(db, collections.customers, uid), {
      uid, name: data.name.trim(), phone: data.phone,
      email: data.email?.trim().toLowerCase() || null,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
  },
  async updateProfile(uid: string, data: Record<string, unknown>): Promise<void> {
    await updateDoc(doc(db, collections.customers, uid), { ...clean(data), updatedAt: serverTimestamp() });
  },
};
