import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { WorkerProfile } from "@/lib/types/worker";

export const WorkerService = {
  /**
   * Fetches a worker profile from the `workers` collection.
   */
  async getProfile(uid: string): Promise<WorkerProfile | null> {
    const docRef = doc(db, "workers", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as WorkerProfile;
    }
    return null;
  },

  /**
   * Updates an existing worker profile (client-safe fields only, enforced by rules ideally).
   */
  async updateAvailability(uid: string, online: boolean): Promise<void> {
    const docRef = doc(db, "workers", uid);
    await updateDoc(docRef, {
      "availability.online": online,
      updatedAt: serverTimestamp()
    });
  },
  
  async updateLocation(uid: string, latitude: number, longitude: number): Promise<void> {
    const docRef = doc(db, "workers", uid);
    await updateDoc(docRef, {
      location: {
        latitude,
        longitude,
        updatedAt: serverTimestamp()
      }
    });
  }
};
