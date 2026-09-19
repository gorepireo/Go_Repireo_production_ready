import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where, updateDoc } from "firebase/firestore";

export const WorkerApplicationService = {
  /**
   * Submit a new worker application.
   */
  async submitApplication(uid: string, data: any): Promise<void> {
    const docRef = doc(db, "workerApplications", uid);
    await setDoc(docRef, {
      userId: uid,
      ...data,
      status: "pending",
      createdAt: serverTimestamp()
    });
  },

  async getAllPending(): Promise<any[]> {
    const q = query(collection(db, "workerApplications"), where("status", "==", "pending"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateStatus(applicationId: string, status: "approved" | "rejected"): Promise<void> {
    const docRef = doc(db, "workerApplications", applicationId);
    await updateDoc(docRef, {
      status,
      reviewedAt: serverTimestamp()
    });
  }
};
