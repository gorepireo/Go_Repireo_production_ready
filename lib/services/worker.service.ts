import { db, functions } from '@/lib/firebase';
import { collections, type Worker } from '@/lib/types/firebase-contract';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

export type WorkerProfile = Worker & { id: string };
export const WorkerService = {
  async getProfile(uid: string): Promise<WorkerProfile | null> {
    const snapshot = await getDoc(doc(db, collections.workers, uid));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as WorkerProfile) : null;
  },
  async updateAvailability(online: boolean, acceptingJobs = online): Promise<void> {
    await httpsCallable(functions, 'updateWorkerAvailability')({ online, acceptingJobs });
  },
  async updateLocation(latitude: number, longitude: number, bookingId: string): Promise<void> {
    await httpsCallable(functions, 'updateWorkerLocation')({ latitude, longitude, bookingId });
  },
  async updateSettings(fullName: string, upiId: string, bankDetails: string): Promise<void> {
    await httpsCallable(functions, 'updateWorkerSettings')({ fullName, upiId, bankDetails });
  },
};
